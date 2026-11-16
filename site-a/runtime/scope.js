// One invocation owns its deadline; shared sessions never retain a caller's scope.
const originals = new WeakMap();
const clocks = new WeakMap();

function deadlineError(deadline) {
  const error = new Error(`Agent execution deadline exceeded (${new Date(deadline).toISOString()}).`);
  error.name = "ExecutionDeadlineError";
  error.code = "EXECUTION_DEADLINE";
  return error;
}

export function assertActive(signal) {
  const clock = signal && clocks.get(signal);
  if (clock && Date.now() >= clock.deadline && !signal.aborted) clock.expire();
  if (signal?.aborted) throw signal.reason || new Error("Agent execution aborted.");
}

export async function scoped(signal, operation) {
  assertActive(signal);
  if (!signal) return operation();
  let rejectAbort;
  const aborted = new Promise((_, reject) => { rejectAbort = reject; });
  const onAbort = () => rejectAbort(signal.reason || new Error("Agent execution aborted."));
  signal.addEventListener("abort", onAbort, { once: true });
  try {
    // Check again in the queued continuation: expired work must never start.
    const value = await Promise.race([Promise.resolve().then(() => {
      assertActive(signal);
      return operation();
    }), aborted]);
    assertActive(signal);
    return value;
  } finally {
    signal.removeEventListener("abort", onAbort);
  }
}

export function createCallScope(ctx, spec) {
  assertActive(ctx.signal);
  const seconds = Number(spec?.max_execution_seconds);
  const ownDeadline = Number.isFinite(seconds) && seconds >= 0 ? Date.now() + seconds * 1000 : Infinity;
  const deadline = Math.min(ctx.deadline ?? Infinity, ctx.composition?.deadline ?? Infinity, ownDeadline);
  const controller = new AbortController();
  const inherit = () => controller.abort(ctx.signal.reason);
  ctx.signal?.addEventListener("abort", inherit, { once: true });
  const expire = () => controller.abort(deadlineError(deadline));
  clocks.set(controller.signal, { deadline, expire });
  const timer = Number.isFinite(deadline) ? setTimeout(expire, Math.max(0, deadline - Date.now())) : null;
  if (deadline <= Date.now()) expire();
  return {
    signal: controller.signal, deadline,
    dispose() {
      clearTimeout(timer);
      ctx.signal?.removeEventListener("abort", inherit);
    },
  };
}

export function bindContext(ctx, signal, deadline) {
  const bound = { ...ctx, signal, deadline };
  for (const [key, value] of Object.entries(ctx)) {
    if (typeof value !== "function") continue;
    const original = originals.get(value) || value;
    const wrapped = (...args) => scoped(signal, () => {
      // The final internal scope parameter must not slide into an omitted optional
      // caller argument (for example resolveRemote(ref) without a span or chain).
      while (args.length < original.length - 1) args.push(undefined);
      return original(...args, { signal, deadline });
    });
    originals.set(wrapped, original);
    bound[key] = wrapped;
  }
  return bound;
}
