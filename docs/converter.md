# AW5 converter mapping contract

This is the normative mapping for the deterministic Theora / generic Markdown
converter planned in AW5. It specifies behavior for the subsequent fixtures,
parser, emitters, CLI, and web tab; the presence of this document does **not** mean
those components or browser verification have been completed.

The target is the [pinned Worldwide Agentic Web MVP Profile 0.2](worldwide_agentic_web_mvp_spec.md),
especially §§2.1–2.2, 3.3, 5, and the framework-converter opportunity in §7.
JSON is a valid HOCON serialization: the converter emits resolved JSON, not HOCON
source that requires includes, environment expansion, or local files.

## Contract and rule IDs

**CVT-CONTRACT-001 — Stable references.** The bold `CVT-*` identifiers below are
stable references for fixtures and tests, not AW2 validator rule IDs. Tests should
cite the relevant identifier in their name or nearby comment and assert behavior,
not document wording. Do not renumber or reuse an ID for a different promise.
An intentional mapping change must update this contract and its affected fixtures
and tests together; there is no old-format reader or compatibility mode.

**CVT-CORE-001 — Pure shared core.** Parsing and emission live in
`site-a/converter/parse-roles.mjs`, `emit-network.mjs`, and `emit-manifest.mjs`.
두 emitter는 `describe-layout.mjs`의 공용 입력 형식 설명 규칙을 사용한다.
They consume in-memory values and return data without DOM, storage, network,
filesystem, `node:*` imports, environment variables, clock, randomness, or LLMs.
The Node adapter at `tools/theora2hocon/theora2hocon.mjs` imports them from
`../../site-a/converter/`. The web tab imports the same modules from the Pages
artifact, which contains only `site-a/`. Adapters own file acquisition, display,
validation, download, and writing. Source arrays and options must not be mutated.

## Input acquisition and layout

**CVT-IN-001 — Virtual files.** The parser accepts a `{path, content}[]` array.
Both fields are strings. Paths are case-sensitive POSIX relative paths from the
selected input directory: no leading slash, backslash, drive prefix, empty
component, `.` component, `..` component, or NUL. Duplicate paths are errors, even
with identical content. Reject malformed records rather than coercing them.
Ignore unrelated files after validating record structure and paths. Normalize one
leading UTF-8 BOM and CRLF / bare CR to LF in content; reject NUL in selected
role/config content. File enumeration order never affects the result.

Adapters must supply UTF-8 text and these root-relative paths, not absolute host
paths. The CLI reads only selected role files and the optional config described
below, without following symlink files or directories. Neither adapter follows
Markdown links, includes, imports, or referenced local files.

**CVT-IN-002 — Layout selection.** `layout` may be `theora` or `markdown`; omission
means automatic selection. Auto chooses Theora if any path exactly matches
`.theora/roles/<role>/agent.md` (one directory component for `<role>`), otherwise
Markdown. Explicit selection never falls back to the other layout on an error.
Mixed input is not merged. No selected roles is an error.

**CVT-IN-003 — Theora files and config.** Each exact
`.theora/roles/<role>/agent.md` contributes one role; nested files, other filenames,
and other Theora state are not roles. The directory component is the role name,
not a body heading or frontmatter field. The entire normalized `agent.md` body is
instructions, subject to the removal rules below; YAML metadata extraction is
only for the Markdown layout.

If present, `.theora/config/theora.json` must parse as a JSON object, not an array
or null. The converter reads only its own top-level `front_man` candidate. An
absent field means no candidate; a present field must be a nonempty string naming
an emitted role exactly. Invalid JSON, an invalid field, or an unknown candidate
is an error even if an explicit front option is supplied. Other config fields
are ignored and never copied. This is a deliberately narrow converter input
contract, not a promise to interpret every Theora configuration dialect; there
are no alternate-key guesses. Config is ignored in Markdown layout.

**CVT-IN-004 — Markdown files.** A selected agents directory contributes its
immediate `*.md` files (lowercase extension only), not recursive descendants.
For project-root input, if any `.claude/agents/*.md` files are present, that is
the selected agents directory; otherwise use immediate root `*.md` files. Passing
an agents directory itself works through the latter rule. Do not merge both sets
or implicitly read a project README when `.claude/agents` is selected.

**CVT-MD-001 — Frontmatter boundary and supported values.** Only a document whose
first normalized line is exactly `---` has frontmatter. Its next line exactly
`---` closes the block; a missing closing delimiter is an error. Remove the whole
block from instructions, including ignored metadata. There is no frontmatter
elsewhere in a document.

Read top-level `name` and `description` as optional strings. Supported syntax is a
single-line plain string, YAML single-quoted string (doubled single quotes decode
to one), JSON-compatible double-quoted string, or a block scalar `|` / `>` with an
optional `-` chomping suffix. A block's nonblank lines must have at least two
leading spaces; remove two spaces, keep LF for `|`, and replace single line breaks
between nonblank lines with spaces for `>` while retaining blank-line paragraph
breaks. Final outer whitespace is trimmed for both fields, so chomping does not
change the resulting value. Plain strings are trimmed and are literal except an
inline comment beginning with space followed by `#` is removed. Empty values,
YAML null/boolean/number values, collections, tags, aliases, anchors, duplicate
recognized keys, and unsupported syntax for a recognized field are errors, not
fallbacks. This is a bounded YAML subset, not a general YAML interpreter.

Other fields (for example `tools`, `model`, `permissionMode`, `color`, and their
indented continuations) are ignored, not evaluated or emitted. Blank and comment
lines are allowed. Unrecognized metadata cannot introduce tools or permissions.
A frontmatter-free file uses the filename/title rules below.

## Roles and public text

**CVT-ROLE-001 — Names.** Theora names are the unchanged directory names.
Markdown names use explicit frontmatter `name` when present; otherwise derive a
slug from the file stem (basename without `.md`): ASCII lowercase, replace each
maximal run outside `[a-z0-9_]` with `_`, then trim leading/trailing `_`. If that
is empty, apply the same slug rule to the first body heading; if still empty,
fail. Thus `Research Lead.md` becomes `research_lead`; `coordinator.md` stays
`coordinator` regardless of its heading. A title supplies the description, not a
second competing identity, when the filename already supplies a usable name.

Every final name must match `[A-Za-z][A-Za-z0-9_]{0,59}`. Explicit names and Theora
names are validated, not silently slugged or truncated. Names must be unique,
including case-insensitive comparison, across the selected roles. Reject
collisions rather than overwriting or appending numeric suffixes. This subset
avoids reference-runtime `safeName` rewriting and truncation collisions.

**CVT-ROLE-002 — Instructions and description.** After frontmatter extraction
where applicable, sanitize the body using `CVT-SEC-*`, then trim its outer
whitespace. Retain Markdown, headings, code fences, and internal whitespace as
text; do not render HTML, execute code, expand templates, or rewrite the role's
meaning. An empty body, or a body containing only removal markers/whitespace, is
an error; do not create a generic substitute agent.

For Markdown, use a sanitized frontmatter description if provided and still
contains text other than removal markers. Otherwise use the first surviving ATX
heading (`#` through `######` followed by space, at column zero) in the sanitized
body, stripping the prefix and optional space-separated trailing `#` sequence.
If there is no heading, use the first nonempty body line other than a removal
marker or a code-fence delimiter. For Theora, use this heading/line rule directly.
Collapse description whitespace to single spaces and trim; if no description
remains, use `Role <name>.` exactly. Do not synthesize a summary with a model.
For heading extraction, fenced code blocks opened by three or more backticks or
tildes at column zero are excluded until a matching character fence of at least
the opening length; headings in code are not titles. Setext headings and inline
Markdown formatting are not interpreted. Filename fallback to a heading uses this
same heading recognition after sanitation.

**CVT-SEC-001 — Secret-pattern removal.** Instructions and descriptions are public.
Apply these rules before extracting descriptions or publishing any source text:

1. Replace a PEM block from a line containing `-----BEGIN ...PRIVATE KEY-----`
   through its matching END line with one `[REDACTED_SECRET]` line. If no matching
   END exists, remove through end of text. The label between BEGIN/END must match.
2. Replace an entire line with `[REDACTED_SECRET]` when it matches any of these
   JavaScript regular expressions (case flags as shown):
   - `/\b(?:api[_-]?key|access[_-]?token|auth[_-]?token|secret|password|passwd)\b\s*["']?\s*[:=]/i`
   - `/\bauthorization\s*[:=]|\bbearer\s+\S+/i`
   - `/\b(?:sk-[A-Za-z0-9_-]{8,}|gh[pousr]_[A-Za-z0-9_]{8,}|github_pat_[A-Za-z0-9_]{8,}|AKIA[A-Z0-9]{16})\b/`

These patterns intentionally remove whole lines, including code examples, not
just captured values. They are pattern removal, not a complete secret detector.
Never interpolate removed text into markers, warnings, or errors.

**CVT-SEC-002 — Local-path removal.** After secret removal, replace an entire line
with `[REDACTED_LOCAL_PATH]` if it contains a local-path token. Token boundaries
are start/end of line or whitespace, backtick, single/double quote, `(`, `)`,
`[`, `]`, `<`, or `>`; punctuation inside a token is not decoded. A token is
local when it starts with any of:

- `/` (including UNC-like `//`), `~/`, `./`, or `../`;
- an ASCII drive letter followed by `:\` or `:/`, or Windows UNC `\\`;
- `.theora/`, `.claude/`, `.ssh/`, `.codex/`, or `.env` (the last must be the
  whole token or followed by `.`).

For example, a line mentioning `/home/example/work`, `C:\work\notes`,
`.theora/roles/reader/agent.md`, or `[notes](../private.md)` is removed. Ordinary
relative prose references such as `docs/guide.md` and complete `https://...` URLs
are retained as literal text, never resolved or fetched. This deliberately
bounded lexical rule does not promise to detect every filesystem reference,
percent-encoded path, or confidential URL. Sanitation is not a publication approval.

**CVT-SEC-003 — No sensitive metadata passthrough.** Names and front candidates
must pass the name grammar and must not trigger secret/path removal; otherwise
fail without echoing their value. Publish neither source filenames nor host
paths, raw config/frontmatter, credentials, environment, project state, timestamps,
or diagnostic excerpts. Diagnostics may identify a rule ID and input record index,
never raw source lines or JSON-parser excerpts. Keep conversion diagnostics
separate from the three artifacts. Authors must review all artifacts before
publication; unknown secrets and prompt injection remain possible. There is no
translation: authors supply English roles for the English examples and demo.

## Front selection and intermediate representation

**CVT-IR-001 — Minimal role data.** The parser supplies roles containing `name`,
`description`, and `instructions` as sanitized nonempty strings, sorted by name
using ascending JavaScript string comparison (`a < b`), not locale-dependent
sorting. It also supplies the validated config front candidate or no candidate.
선택된 입력 형식도 `layout: theora | markdown`으로 전달한다. 자동 선택과 명시 선택
모두 실제 선택된 형식을 전달하며, emitter는 원문이나 역할 이름에서 형식을 추측하지 않는다.
This is sufficient emitter input; source capabilities are not executable fields.
No persistent intermediate store is needed. Exact exported function signatures
belong to the implementation tasks; these data semantics are fixed here.

**CVT-FRONT-001 — Explicit precedence, no guessing.** Choose the front from:

1. Explicit `--front <role>` (the equivalent in-memory option for the web).
2. Theora config's `front_man` candidate, if present.
3. The first role in the name-sorted list.

An explicit option must name one final role exactly; empty, whitespace-padded,
case-mismatched, or unknown values fail, not fall back. Do not infer authority
from `coordinator`, a heading, directory iteration order, or a framework tool list.
Config validation still follows `CVT-IN-003`. One-role input is valid.

## Network emission

**CVT-NET-001 — Identity and resolved envelope.** The output network name is
`converted_team`, independent of the input directory's basename, host path,
layout, and chosen front. Its filename is `converted_team.network.json`.
설명은 `CVT-META-001`에 따라 선택된 입력 형식에서 만든다.
Emit exactly these top-level fields in this order (Markdown example):

```json
{
  "metadata": { "description": "Converted Markdown role conversation network." },
  "llm_config": { "model_name": "alibaba/qwen3.8-flash" },
  "max_steps": 12,
  "max_execution_seconds": 90,
  "tools": []
}
```

Replace `tools` as below. Identity/front are supplied by the manifest; do not add
conflicting network-level identity. No `include`, `$include`, `$env`, substitutions,
`commondefs`, executable `class`/`toolbox`, MCP, site action, private-context allow
rules, or external URLs are synthesized. Literal `${...}` inside instructions
is text, not a request to resolve environment variables. The finite declarations
are not evidence of runtime enforcement; the caller's policy remains authoritative.

**CVT-NET-002 — Agent mapping and order.** Emit the selected front first, then
remaining roles in ascending name order. This is required even when the front is
not alphabetically first: the vendored `find_front_man` selects the first agent
with instructions, not a network-level `front_man` field. Each agent has exactly
`name`, `function`, `instructions`, `tools`, in that order. Map `name` unchanged,
`function.description` from the parsed description, and `instructions` from the
sanitized body followed by the converter-owned output rule (`CVT-NET-005`).
Within `function`, emit `description` then `parameters`.

**CVT-NET-003 — Common inquiry schema.** Every agent's `function.parameters` is
exactly:

```json
{
  "type": "object",
  "properties": {
    "inquiry": { "type": "string", "description": "The request to handle." }
  },
  "required": ["inquiry"],
  "additionalProperties": false
}
```

No typed source task, framework input/output schema, or structured result is
inferred. In the current reference runtime, `argsToText` serializes an object
with only `inquiry` as JSON text; the receiving role can read that text. The
converter does not add a runtime adapter to change this behavior.

**CVT-NET-004 — Default star wiring.** The front's `tools` is the list of all
other role names in ascending order. Every other agent has `tools: []`. A single
role has no outgoing calls. No self-edge, reverse edge, peer, or inferred workflow
is added. Source Markdown `tools` metadata and prose mentioning tools do not alter
this graph. Availability of a callable role is not proof that an LLM will choose
it; real delegation must be observed separately. Do not append delegation prose
to source instructions to manufacture semantic equivalence.

**CVT-NET-005 — 변환기 소유 출력 규칙.** 각 역할의 정화된 원문 뒤에 LF 두 개,
`## Converter-owned output rule`, LF 하나, 다음 규칙을 붙인다. 원문의 내부 서식과
순서는 바꾸지 않는다. 규칙은 역할 이름이 아니라 최종 선택된 front에 따라 정한다.
단일 역할도 front 규칙을 받으며, front를 바꾸면 이전 front는 specialist 규칙을 받는다.

front는 방문자에게 최종 답만 내고 초안·계획·과정 메모·다른 역할에게 하는 말을
내지 않도록 다음 문장을 붙인다:

```text
Return only the final answer intended for the visitor. Do not include drafts, plans, process notes, or messages addressed to other roles.
```

specialist는 front가 보낸 inquiry에 대한 답만 내도록 다음 문장을 붙인다:

```text
Return only the answer to the inquiry sent by the front agent. Do not include drafts, plans, process notes, or messages addressed to other roles.
```

이는 새 도구·권한·위임 간선을 만들거나 모델의 실제 준수를 증명하지 않는다.

**CVT-META-001 — 입력 형식별 설명.** `parseRoles`가 선택한 `layout`으로 network의
`metadata.description`과 manifest의 `networks[0].description`을 동일하게 만든다.
`theora`는 `Converted Theora role conversation network.`, `markdown`은
`Converted Markdown role conversation network.`를 쓴다. emitter는 형식 누락이나
잘못된 값을 오류로 거부한다. CLI와 웹은 동일한 파서 결과의 형식을 전달한다.
원본 config나 frontmatter의 설명으로 이 네트워크 설명을 덮어쓰지 않는다.

## Manifest, links, and serialization

**CVT-MAN-001 — Public manifest.** Emit exactly (Markdown example):

```json
{
  "brand": "Converted Role Team",
  "networks": [
    {
      "name": "converted_team",
      "front_man": "<selected role name>",
      "hocon": "./converted_team.network.json",
      "description": "Converted Markdown role conversation network."
    }
  ],
  "llm_router": {
    "base_url": "https://api.otari.ai/api/v1",
    "mock": false,
    "byok_router": "https://api.otari.ai/api/v1"
  },
  "allowed_peers": [],
  "peer_policy": { "mode": "closed" },
  "deployment": { "mode": "static" }
}
```

`<selected role name>`은 선택된 front이며, `description`은 위 Markdown 예시와 달리
`CVT-META-001`에 따라 입력 형식별로 정한다. The router and model hint reuse the
site defaults, not config credentials. Inference requires the visitor's setup in
the existing runtime settings; there is no new credential/settings UI. These are
public recommendations, never a peer's authority to replace the caller's router.
References stay relative to support subpath hosting.

**CVT-LINK-001 — Empty link stub.** `links.json` is exactly:

```json
{
  "version": 1,
  "networks": { "converted_team": {} }
}
```

Do not create placeholder peer URLs, link slots, or consent grants. Local role
calls need no peer link. Adding real peers is a separate, explicitly reviewed
publication change with matching origin policy and runtime consent.

**CVT-OUT-001 — Deterministic artifacts.** Output consists of only
`converted_team.network.json`, `agent-manifest.json`, and `links.json`. Serialize
with `JSON.stringify(value, null, 2) + '\n'`, UTF-8, using the field orders above.
Identical virtual input and options produce byte-identical artifacts in CLI and
web, regardless of enumeration order or absolute input/output directory. Do not
copy runtime code, source Markdown, keys, or executable bundles into the result.

## Adapters and failure boundary

**CVT-CLI-001 — CLI contract.** The planned command is:

```sh
node tools/theora2hocon/theora2hocon.mjs <input-dir> <out-dir> [--front <role>] [--layout theora|markdown]
```

Without `--layout`, apply `CVT-IN-002`. Require two positional directories and
reject unknown flags, repeated options, missing values, invalid layout values,
and unreadable selected input. Build all three artifacts in memory before
writing; parse/mapping failures must not leave a newly generated partial bundle.
Report write failures as failures, not successful conversion. Exit 0 means the
bundle was written, not that it was deployed or browser-verified. Errors use
nonzero exit and sanitized diagnostics; no source content is executed.

**CVT-WEB-001 — Same mapping, no implicit execution.** The web tab acquires files
and options into the same virtual-file contract, converts with the same modules,
passes all three parsed artifacts to AW2 `validateNetwork`, displays the report,
and offers downloads. Validation failure must not be presented as successful
conformance. Loading either two-role sample uses the same pipeline. Downloads
and inspection require no inference key.

A one-time same-origin sessionStorage handoff may open the artifacts in the main
Review Desk. Validate its structure as untrusted input and remove it on receipt,
including invalid payloads. Importing or reviewing a result never automatically
runs its network, contacts peers, supplies credentials, or bypasses consent.
The existing reference runtime and settings remain the only execution path.

**CVT-ERR-001 — Fail closed.** A selected malformed role, invalid config,
duplicate/invalid name, empty instruction body, or invalid front is a conversion
error for the whole input, not a reason to silently drop a role. No best-effort
successful subset, alternate framework loader, compatibility mode, or LLM repair
is provided. Ignoring unselected files/metadata is only as specified above.

## Fixtures and verification obligations

**CVT-TEST-001 — Reusable fixtures and assertions.** Store the two-role Theora
fixture as `tests/converter/fixtures/mini-theora/layout.json`, an array of virtual
files; its config content must itself be valid JSON. Do not create real repository
`.theora` state. Store at least two Markdown roles, including coordinator and
specialist, under `tests/converter/fixtures/sample-agents/`. Snapshot expectations
may live under fixtures or as explicit test values. Both layouts must demonstrate
front-to-specialist wiring, not just successful parsing.

Subsequent tests must cover these distinct promises:

| Area | Rule references | Observable assertions |
| --- | --- | --- |
| Fixture integrity | `CVT-IN-001`, `CVT-IN-003`, `CVT-TEST-001` | Virtual file structure, parseable virtual config, at least two Markdown files |
| Parsing | `CVT-IN-*`, `CVT-MD-001`, `CVT-ROLE-*`, `CVT-IR-001` | Both layouts and selected format; source instruction expectations derived from input, not emitted snapshots; no-frontmatter filename/title fallback, quoted/block descriptions, ignored metadata, malformed frontmatter/config, name collision, empty/no roles |
| Public text | `CVT-SEC-*` | Synthetic secret/PEM/path removal, description sanitation, literal public URLs retained, no raw-value diagnostics |
| Selection | `CVT-FRONT-001` | Explicit over config over sorted default, unknown front refusal, invalid config refusal even with override |
| Network | `CVT-NET-*`, `CVT-META-001` | Exact common schema, star edges, selected non-first front emitted first, single-role case, output-rule suffix for the selected front and specialists, format-specific description, no executable/peer capability passthrough |
| Publication | `CVT-MAN-001`, `CVT-META-001`, `CVT-LINK-001`, `CVT-OUT-001` | Manifest front/reference/format-specific description and empty bindings match network; byte snapshots and shuffled-input determinism |
| Adapters | `CVT-CLI-001`, `CVT-WEB-001`, `CVT-ERR-001` | CLI fixture-to-files snapshots and invalid-input failures; shared web pipeline, validated consume-once handoff without execution |

**CVT-VERIFY-001 — Static versus browser evidence.** The later AW5 validation task
must check generated bundles with AW2 `site-a/validator-rules.mjs` and AW4
`tools/check-conformance.mjs`. The current AW4 checker audits two publication
roots plus a Review Desk sample and Site B `_headers`; it is not an arbitrary
output-directory CLI. Validation tests must place generated artifacts in a
disposable checker-compatible tree or explicitly extend its input interface in
that task. Do not rewrite operational site artifacts to run a converter test.

No forced vendor-loader execution in Node is required. Static reports and
snapshots do not prove browser loading, model behavior, delegation, consent,
CORS, credential isolation, or limit enforcement. At least one generated bundle
must be loaded in a real browser using the vendored reference runtime and show
the expected agent conversation/delegation. Record revision, environment,
procedure, observed result, and sanitized evidence in
[the demo checklist](demo-checklist.md). If accounts or environment are unavailable,
record **unverified** and the required user input; a checklist alone is not proof.
Public-site acceptance is tracked separately with AW4 deployment/judge access.

## Explicit non-goals and loss of semantics

**CVT-LIMIT-001 — Instructions, not the source harness.** This is a deterministic
role-text export with a new default conversation graph, not an executable Theora
or Claude environment and not a claim of full framework semantic equivalence.
Shell, git, gates, tests, filesystem access, scheduling, lifecycle hooks, task
ownership, permissions, budgets, state, MCP servers, source tool lists, skills,
subagent policies, and source input/output types are **not converted**. Prose
requesting those abilities may remain as text but grants none of them. Authors
must revise unsuitable role instructions before publication and must not claim
that a converted agent actually performed unavailable operations.

No backend, database, authentication, payment system, hosted execution service,
new runtime, or runtime adapter is generated. The three data files are not a
complete hosted web app; serving them and the reference browser runtime requires
a separate static publication setup. Public hosting, HTTPS/CORS, inference cost
and credentials, licensing of source instructions, publication review, and actual
browser verification remain explicit owner responsibilities. Later README and
submission updates must preserve these limits rather than market a harness port.
