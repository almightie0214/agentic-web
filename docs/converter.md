# Converter mapping contract

This is the current normative mapping for the deterministic Theora, generic
Markdown / Claude agents, and Google ADK Agent Config converter. The browser tab
and Node CLI share parsing and emission modules. Conversion produces reviewable
network data; it does not establish that the source team's execution semantics,
capabilities, or model behavior have been preserved.

The target is the [pinned Worldwide Agentic Web MVP Profile 0.2](worldwide_agentic_web_mvp_spec.md),
especially §§2.1–2.2, 3.3, 5, and the framework-converter opportunity in §7.
JSON is a valid HOCON serialization: the converter emits resolved JSON, not HOCON
source requiring includes, environment expansion, or local files.

## Contract and rule IDs

**CVT-CONTRACT-001 — Stable references.** The `CVT-*` identifiers below are stable
references for fixtures and tests, not AW2 validator rule IDs. Tests assert
behavior, not document wording. Do not renumber or reuse an ID for a different
promise. Mapping changes update this contract and affected fixtures and tests
together; there is no old-format reader or compatibility mode.

**CVT-CORE-001 — Pure shared core.** Parsing and emission live in
`site-a/converter/parse-roles.mjs`, `emit-network.mjs`, and `emit-manifest.mjs`.
Both emitters use the shared format-description rule in `describe-layout.mjs`.
They consume in-memory values and return data without DOM, storage, network,
filesystem, `node:*` imports, environment variables, clock, randomness, or LLMs.
The Node adapter at `tools/theora2hocon/theora2hocon.mjs` and the web tab import
these same modules. The Pages artifact contains only `site-a/`. Adapters own file
acquisition, display, validation, downloads, and writing. Source arrays and
options must not be mutated.

## Input acquisition and layout

**CVT-IN-001 — Virtual files.** The parser accepts a `{path, content}[]` array.
Both fields are strings. Paths are case-sensitive POSIX relative paths from the
selected input directory: no leading slash, backslash, drive prefix, empty
component, `.` component, `..` component, or NUL. Duplicate paths are errors, even
with identical content. Reject malformed records rather than coercing them.
Ignore unrelated files after validating record structure and paths. Normalize one
leading UTF-8 BOM and CRLF / bare CR to LF in content; reject NUL in selected
role/config content. File enumeration order never affects the result.

Adapters supply UTF-8 text and root-relative paths, not absolute host paths. They
read only selected roles and config, without following symlink files or
directories. Decode selected files without stripping a BOM: normalization belongs
to the shared parser. Neither adapter follows Markdown links or includes. For
ADK, the only followed references are the `sub_agents` config paths below. The
shared parser's reference-reading function also supplies the adapter's dependency
list; adapters must not implement a second YAML parser. Unreachable files need
not be decoded: an unreadable or non-UTF-8 unrelated YAML file must not prevent
conversion, whereas a selected or referenced unreadable file is an error.

**CVT-IN-002 — Layout selection.** `layout` may be `theora`, `adk`, or `markdown`;
omission means automatic selection. Auto chooses Theora if any path exactly
matches `.theora/roles/<role>/agent.md` (one directory component for `<role>`),
otherwise ADK if the input root contains exactly `root_agent.yaml`, otherwise
Markdown. Explicit selection never falls back to another layout on an error.
Mixed input is not merged. No selected roles is an error.

**CVT-IN-003 — Theora files and config.** Each exact
`.theora/roles/<role>/agent.md` contributes one role; nested files, other filenames,
and other Theora state are not roles. The directory component is the role name,
not a body heading or frontmatter field. The entire normalized `agent.md` body is
instructions, subject to the removal rules below; no YAML metadata is extracted
and no unmapped-key notice is produced for Theora.

If present, `.theora/config/theora.json` must parse as a JSON object, not an array
or null. Read only its top-level `front_man` candidate. An absent field means no
candidate; a present field must be a nonempty string naming an emitted role
exactly. Invalid JSON, an invalid field, or an unknown candidate is an error even
if an explicit front option is supplied. Other config fields are ignored and
never copied. There are no alternate-key guesses. Config is ignored in other
layouts.

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

Read top-level `name` and `description` as optional strings using the shared YAML
subset below. A collection is not a valid value for either field. Other fields
(for example `tools`, `model`, `permissionMode`, and `color`) and their indented
contents are not evaluated or emitted. Report their top-level keys through the
unmapped-key notices below. Unknown metadata cannot introduce tools or permissions.
A frontmatter-free file uses the filename/title rules.

### Google ADK Agent Config

The reference grammar is google/adk-python main `c6586f19ab` (2026-11-16),
`AgentConfig.json` (`LlmAgentConfig`, `AgentRefConfig`) and
`config_agent_utils.resolve_agent_reference`. This converter deliberately supports
only the bounded subset below, not every ADK configuration or workflow agent.

**CVT-ADK-001 — Reachable LlmAgent config tree.** The input root's
`root_agent.yaml` is the root agent and the front. Map:

| ADK key | Converted role data |
| --- | --- |
| `name` | Name, validated unchanged with `CVT-ROLE-001` |
| `description` | Description; when absent, use `CVT-ROLE-002` body fallback |
| `instruction` | Instructions, sanitized with `CVT-SEC-*`; empty or removal-only text is an error |
| `sub_agents` | Outgoing local agent tools in the original sequence order |

`name` and `instruction` are required strings. `description`, when present, must
be a string. A missing `sub_agents` means no outgoing calls. Each `sub_agents`
item must be a mapping containing exactly one `config_path` string. `code`
references and all other item shapes are errors: their definitions are not in the
input, and a partial conversion would hide missing behavior.

Resolve each `config_path` relative to the directory of its referring config and
supply the resulting canonical root-relative path to the parser. Reject absolute
paths and any `..` component; references always stay under the referring config's
directory. Unlike ADK, even `..` that would remain within that directory is
rejected. Missing files, cycles, and files referenced more than once are errors.
Read only the tree reachable from `root_agent.yaml`; do not read neighboring YAML
as possible agents. An invalid reachable agent fails the whole conversion.

An absent `agent_class`, or any of these seven string values, denotes a supported
LlmAgent:

- `LlmAgent`
- `Agent`
- `google.adk.agents.LlmAgent`
- `google.adk.agents.llm_agent.LlmAgent`
- `google.adk.agents.Agent`
- `google.adk.agents.llm_agent.Agent`
- the empty string (`''` or `""`)

Other classes, including `SequentialAgent`, `ParallelAgent`, `LoopAgent`, and
user classes, are errors. Their execution order cannot be represented by this
data mapping. An explicit front different from the root agent is an error.

### Shared bounded YAML reader

Markdown frontmatter and ADK use the same reader. It supports block mappings,
string scalars (plain, single-quoted, double-quoted, literal `|` and folded `>`),
block sequences of mappings, and comments. Each input format decides which value
shapes its fields accept. Unread keys' indented contents are skipped, not parsed
as executable metadata or interpreted as supported fields.

Single-quoted strings decode doubled single quotes. Double-quoted strings decode
YAML escapes. Plain strings are trimmed; an inline comment beginning with a
space followed by `#` is removed. Read string fields do not coerce YAML
null, booleans, or numbers. Empty required strings are errors. The empty quoted
`agent_class` is the supported exception listed above.

For block scalars, an optional `-` chomping suffix is accepted. The first nonblank
content line sets the indentation removed from every content line, not a fixed
two spaces. One-space and four-space blocks are valid. A later nonblank content
line indented less than the first content line is an error. Preserve further
indentation as content, keep LF for `|`, and fold single line breaks between
nonblank lines to spaces for `>` while retaining blank-line paragraph breaks
and line breaks around more-indented content. Final outer whitespace is trimmed
for public fields; `instruction` retains its internal layout after sanitation.

For read fields, reject flow collections, anchors, aliases, tags, `|+` / `>+`,
explicit indentation digits, quoted keys, duplicate keys, multiline plain values,
and multiple YAML documents. Unsupported syntax is an error, not a fallback or
an excuse to silently drop an agent. This is not a general YAML interpreter.

## Roles, public text, and unmapped keys

**CVT-ROLE-001 — Names.** Theora names are unchanged directory names. ADK names
are unchanged `name` values. Markdown uses explicit frontmatter `name` when
present; otherwise derive a slug from the file stem (basename without `.md`):
ASCII lowercase, replace each maximal run outside `[a-z0-9_]` with `_`, then trim
leading/trailing `_`. If empty, apply the same rule to the first body heading;
if still empty, fail. `Research Lead.md` becomes `research_lead`;
`coordinator.md` stays `coordinator` regardless of its heading.

Every final name must match `[A-Za-z][A-Za-z0-9_]{0,59}`. Explicit names and Theora
names are validated, not silently slugged or truncated. Names must be unique,
including case-insensitive comparison, across selected roles. Reject collisions
rather than overwriting or appending suffixes. This subset avoids runtime
`safeName` rewriting and truncation collisions.

**CVT-ROLE-002 — Instructions and description.** After frontmatter extraction
where applicable, sanitize the body (ADK: `instruction`) with `CVT-SEC-*`, then trim
outer whitespace. Retain Markdown, headings, code fences, and internal whitespace
as text; do not render HTML, execute code, expand templates, or rewrite meaning.
An empty body, or one containing only removal markers/whitespace, is an error;
do not create a generic substitute agent.

For Markdown and ADK, use a sanitized explicit description if provided and still
containing text other than removal markers. Otherwise use the first surviving ATX
heading (`#` through `######` followed by space, at column zero) in the sanitized
body, stripping the prefix and optional space-separated trailing `#` sequence.
If none, use the first nonempty body line other than a removal marker or
code-fence delimiter. Theora uses this heading/line rule directly. Collapse
description whitespace to single spaces and trim; if none remains, use
`Role <name>.` exactly. Do not synthesize a summary with a model.

For heading extraction, fenced code blocks opened by three or more backticks or
tildes at column zero are excluded until a matching character fence of at least
the opening length. Setext headings and inline Markdown formatting are not
interpreted. Filename fallback uses the same heading recognition after sanitation.

**CVT-SEC-001 — Secret-pattern removal.** Instructions and descriptions are public.
Apply these rules before extracting descriptions or publishing source text:

1. Replace a PEM block from a line containing `-----BEGIN ...PRIVATE KEY-----`
   through its matching END line with one `[REDACTED_SECRET]` line. If no matching
   END exists, remove through end of text. BEGIN/END labels must match.
2. Replace an entire line with `[REDACTED_SECRET]` when it matches any of these
   JavaScript regular expressions (case flags as shown):
   - `/\b(?:api[_-]?key|access[_-]?token|auth[_-]?token|secret|password|passwd)\b\s*["']?\s*[:=]/i`
   - `/\bauthorization\s*[:=]|\bbearer\s+\S+/i`
   - `/\b(?:sk-[A-Za-z0-9_-]{8,}|gh[pousr]_[A-Za-z0-9_]{8,}|github_pat_[A-Za-z0-9_]{8,}|AKIA[A-Z0-9]{16})\b/`

These rules remove whole lines, including code examples, not just captured values.
They are not a complete secret detector. Never interpolate removed text into
markers, notices, warnings, or errors.

**CVT-SEC-002 — Local-path removal.** After secret removal, replace an entire line
with `[REDACTED_LOCAL_PATH]` if it contains a local-path token. Token boundaries
are start/end of line or whitespace, backtick, single/double quote, `(`, `)`,
`[`, `]`, `<`, or `>`; punctuation inside a token is not decoded. A token is local
when it starts with:

- `/` (including UNC-like `//`), `~/`, `./`, or `../`;
- an ASCII drive letter followed by `:\` or `:/`, or Windows UNC `\\`;
- `.theora/`, `.claude/`, `.ssh/`, `.codex/`, or `.env` (the last must be the whole
  token or followed by `.`).

A line mentioning `/home/example/work`, `C:\work\notes`,
`.theora/roles/reader/agent.md`, or `[notes](../private.md)` is removed. Ordinary
relative prose references such as `docs/guide.md` and complete `https://...` URLs
are retained as literal text, never resolved or fetched. This bounded lexical
rule does not detect every filesystem reference, encoded path, or confidential
URL. Sanitation is not publication approval.

**CVT-SEC-003 — No sensitive metadata passthrough.** Names and front candidates
must pass the name grammar and must not trigger secret/path removal; otherwise
fail without echoing their value. Publish neither source filenames nor host paths,
raw config/frontmatter, credentials, environment, project state, timestamps, or
diagnostic excerpts. Diagnostics may identify a rule ID and input record index,
never raw source lines or parser excerpts. Keep diagnostics outside the artifacts.

Sanitized key-name-only notices are permitted outside the three artifacts. For
each role, report unmapped original top-level keys, not their values. ADK keys
outside the four mapped fields above (such as `tools`, `model`, schemas, and
callbacks) are not copied. Markdown frontmatter keys outside `name` and
`description` use the same notices. A key name is displayed only if it matches
`[A-Za-z_][A-Za-z0-9_]*` and passes the existing secret/path rules; otherwise
report only the number of hidden keys. Never reveal their names, values, or raw parsing errors.
The browser displays notices and the CLI prints them; no notice is embedded in
network, manifest, or links. Theora produces no such notices because its whole
`agent.md` is instruction text.

Authors must review all artifacts before publication; unknown secrets and prompt
injection remain possible. There is no translation: authors supply English roles
for the English examples and demo.

## Front selection and intermediate representation

**CVT-IR-001 — Minimal role data.** The parser supplies roles with sanitized
nonempty `name`, `description`, and `instructions`, sorted by ascending JavaScript
string comparison (`a < b`), not locale-dependent sorting. It supplies the selected
`layout: theora | adk | markdown`, the validated `configFront` candidate when
present, and `notices: [{role, keys, hiddenKeyCount}]`. Notice `role` identifies
the validated role; `keys` contains only safe unmapped key names. It contains no
source values or paths. For ADK, each role's `tools` contains the child names in
source order and `configFront` is the root agent's name. No persistent intermediate
store is needed; source capabilities are not executable fields.

**CVT-FRONT-001 — Explicit precedence, no guessing.** For Theora and Markdown:

1. Explicit `--front <role>` (the equivalent in-memory web option).
2. Theora config's `front_man` candidate, if present.
3. First role in the name-sorted list.

An explicit option must name a final role exactly; empty, padded, case-mismatched,
or unknown values fail. Do not infer authority from `coordinator`, a heading,
directory order, or a framework tool list. Config validation still follows
`CVT-IN-003`. For ADK, the root is always front; an explicit option may confirm it
but cannot choose another role. One-role input is valid.

## Network emission

**CVT-NET-001 — Identity and resolved envelope.** The network name is always
`converted_team`, independent of input directory, host path, layout, and front.
Its filename is `converted_team.network.json`. Description follows
`CVT-META-001`. Emit these top-level fields in this order (Markdown example):

```json
{
  "metadata": { "description": "Converted Markdown role conversation network." },
  "llm_config": { "model_name": "alibaba/qwen3.8-flash", "temperature": 0.2 },
  "max_steps": 12,
  "max_execution_seconds": 90,
  "tools": []
}
```

Temperature is fixed at 0.2 for all layouts. Runtime model requests use the
executing agent's temperature when declared, otherwise its network's temperature,
independently of visitor model selection. This declaration does not prove answer
quality. The 90-second limit is fixed across layouts, derived from the approved
converted-sample maximum `durationMs` 43567.69999998808 using
`30 * ceil(2 * max(durationMs) / 30000)`; see
[demo checklist §8](demo-checklist.md#8-measured-execution-limits). It declares a
top-level query limit and cannot extend a peer caller's shorter deadline.

Identity/front are supplied by the manifest; do not add conflicting network-level
identity. No `include`, `$include`, `$env`, substitutions, `commondefs`, executable
`class`/`toolbox`, MCP, site action, private-context allow rules, or external URLs
are synthesized. Literal `${...}` in instructions is text, not an environment
request. The caller's policy remains authoritative.

**CVT-NET-002 — Agent mapping and order.** Emit the selected front first, then
remaining roles in ascending name order. The vendored `find_front_man` selects the
first agent with instructions, not a network-level `front_man` field. Each agent
has exactly `name`, `function`, `instructions`, `tools`, in that order. Map name
unchanged, description to `function.description`, and sanitized instructions plus
`CVT-NET-005` to `instructions`. Within `function`, emit `description` then
`parameters`.

**CVT-NET-003 — Common inquiry schema.** Every agent's `function.parameters` is:

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

No source input/output schema or structured result is inferred. In the current
reference runtime, `argsToText` serializes an object with only `inquiry` as JSON
text; the receiving role can read it. No runtime adapter changes that behavior.

**CVT-NET-004 — Source or default wiring.** Theora and Markdown keep the default
star: the front's `tools` lists all other roles in ascending name order; other
agents have `tools: []`. A single role has no calls. Markdown `tools` metadata and
prose do not alter this graph. ADK instead uses each agent's `sub_agents` edges in
source order, preserving multiple levels, including a child with no children.
Do not flatten these edges into a star or infer additional calls. Output agent
order remains front first and then name order, independently of edge order.
Availability is not proof an LLM will delegate. Do not append delegation prose to
manufacture semantic equivalence.

**CVT-NET-005 — Converter-owned output rule.** Append two LF characters, then
`## Converter-owned output rule`, one LF, and the applicable sentence to each
sanitized source. Preserve its internal layout and order. The final selected
front, not the role's name, decides which rule applies. A single role receives
the front rule. In layouts where front can change, the previous front then
receives the specialist rule.

Front:

```text
Return only the final answer intended for the visitor. Do not include drafts, plans, process notes, or messages addressed to other roles.
```

Every specialist, regardless of its caller or input format:

```text
Return only the answer to the inquiry you received. Do not include drafts, plans, process notes, or messages addressed to other roles.
```

These instructions create no tools, permissions, or edges and do not prove model
compliance.

**CVT-META-001 — Format-specific description.** Network `metadata.description` and
manifest `networks[0].description` use the same selected parser layout:

| Layout | Description |
| --- | --- |
| `theora` | `Converted Theora role conversation network.` |
| `markdown` | `Converted Markdown role conversation network.` |
| `adk` | `Converted Google ADK agent network.` |

Emitters reject a missing or invalid format. CLI and web pass the same parser
result; source metadata cannot override this description.

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

`<selected role name>` is the selected front; description follows `CVT-META-001`.
Router and model hint reuse site defaults, not source credentials. Inference
requires visitor setup in existing runtime settings; no new credential/settings
UI is generated. These are public recommendations, not a peer's authority to
replace the caller's router. References remain relative for subpath hosting.

**CVT-LINK-001 — Empty link stub.** `links.json` is exactly:

```json
{
  "version": 1,
  "networks": { "converted_team": {} }
}
```

Do not create placeholder peer URLs, link slots, or consent grants. Local role
calls need no peer link. Adding real peers is a separate reviewed publication
change with matching origin policy and runtime consent.

**CVT-OUT-001 — Deterministic artifacts.** Emit only
`converted_team.network.json`, `agent-manifest.json`, and `links.json`, serialized
with `JSON.stringify(value, null, 2) + '\n'`, UTF-8, in the field orders above.
Identical virtual input and options produce byte-identical artifacts in CLI and
web regardless of file enumeration or absolute input/output directory. Do not
copy runtime code, source files, keys, executable bundles, or notices into them.

## Adapters and failure boundary

**CVT-CLI-001 — CLI contract.** Run:

```sh
node tools/theora2hocon/theora2hocon.mjs <input-dir> <out-dir> [--front <role>] [--layout theora|adk|markdown]
```

Without `--layout`, use `CVT-IN-002`. Require two positional directories and reject
unknown flags, repeated options, missing values, invalid layouts, and unreadable
selected input. Build all artifacts in memory before writing; parse/mapping
failures must not leave a newly generated partial bundle. Report write failures
as failures. Exit 0 means written, not deployed or browser-verified. Errors use
nonzero exit and sanitized diagnostics; no source content is executed. Print
unmapped-key notices separately from the artifacts, without source values.

**CVT-WEB-001 — Same mapping, no implicit execution.** The web tab acquires files
and options into the same virtual-file contract, uses the same modules, passes
all artifacts to AW2 `validateNetwork`, displays the report and unmapped-key
notices, and offers downloads. Validation failure is not successful conformance.
Samples use this same pipeline; buttons appear in this order: Claude agents team,
Google ADK team, Theora role team. Inspection and downloads need no inference key.

The one-time same-origin sessionStorage handoff opens artifacts in Review Desk
for static inspection. Validate it as untrusted input and remove it on receipt,
including invalid payloads. Importing or reviewing never automatically executes
a network, contacts peers, supplies credentials, or bypasses consent.

After a current report has no failures or acquisition/input errors, the visitor
may explicitly select **Run** in Review Desk's **Test run** section. Editing the
inputs invalidates that eligibility until they are checked again. Each run sends
one message, without previous conversation history, to the imported network's
front as an unpublished peer. It has no publication base, site actions, or stored
links; the review-only Publication base URL is not an execution origin. Its
manifest cannot choose the inference router or increase Review Desk's model,
step, or shared turn budgets. The existing Review Desk settings provide the
visitor's router, key and model; the imported network retains its temperature.
Unsupported executable features and runtime validation errors refuse execution.
Absolute peer references require the imported manifest's policy and normal
visitor consent, including references to Review Desk's own site. Relative peer
references are refused because there is no publication base. Published manifest,
definition and links reads stay on the resolved peer's origin without redirects.
Run and chat cannot overlap; **Stop** cancels the active test run. Its full answer
or error and the latest execution graph remain visible. Static inspection and
artifact downloads still need no inference key, and no backend is added.

Both pages show Import → Check → Ask the spec → Test run → Download. Review Desk
also downloads the current checked manifest, network and optional links through
the same artifact-download module used by the converter.

**CVT-ERR-001 — Fail closed.** A malformed selected/reachable role, invalid config,
reference or class, duplicate/invalid name, empty instruction, unsupported read
YAML value, or invalid front fails the whole conversion. Do not silently drop a
role or produce a successful subset. No alternate framework loader, compatibility
mode, or LLM repair is provided. Ignore only unselected files and unmapped
metadata as specified above; never include source values or parser excerpts in
errors.

## Fixtures and verification obligations

**CVT-TEST-001 — Reusable fixtures and assertions.** The two-role Theora fixture
is `tests/converter/fixtures/mini-theora/layout.json`, an array of virtual files
with valid JSON config content, not operational repository state. Markdown roles,
including coordinator and specialist, live under
`tests/converter/fixtures/sample-agents/`. ADK fixtures and the repository-authored
web sample contain a three-level tree: coordinator → specialist → researcher.
At least one ADK agent has `tools` and `model` keys to demonstrate notices, not
capability passthrough. Snapshot expectations assert exact artifact bytes. All
layouts demonstrate edges, not only successful parsing.

Tests cover these distinct promises:

| Area | Rule references | Observable assertions |
| --- | --- | --- |
| Fixture integrity | `CVT-IN-*`, `CVT-TEST-001` | Valid virtual files/config, multi-role Markdown, three-level ADK tree |
| Parsing | `CVT-IN-*`, `CVT-MD-001`, `CVT-ROLE-*`, `CVT-IR-001` | Auto precedence, explicit no-fallback, name/title fallback, quoted/block strings, one-/four-space indentation and dedent refusal, invalid YAML/config, name collisions and empty bodies |
| ADK | `CVT-ADK-001` | Minimal name/instruction input, seven LlmAgent values, root front, source edge order, rejection of unsupported classes, code, missing/cyclic/duplicate references, absolute paths and `..` |
| Acquisition | `CVT-IN-001`, `CVT-ERR-001` | Reachable-only reads, unrelated unreadable/non-UTF-8 files ignored, selected unreadable/non-UTF-8 files refused, no symlink traversal |
| Public text | `CVT-SEC-*` | Secret/PEM/path removal, sanitized descriptions, literal public URLs retained, safe key notices or hidden counts, no values in artifacts/notices/errors |
| Selection | `CVT-FRONT-001` | Explicit over config over sorted default for text layouts; ADK root only; invalid candidate refusal even with override |
| Network | `CVT-NET-*`, `CVT-META-001` | Fixed temperature/limits/schema, star or original edges, front-first order, single-role case, caller-neutral specialist rule for every layout, correct descriptions, no executable capabilities |
| Publication | `CVT-MAN-001`, `CVT-META-001`, `CVT-LINK-001`, `CVT-OUT-001` | Matching front/reference/description, empty links, exact bytes and shuffled-input determinism |
| Adapters | `CVT-CLI-001`, `CVT-WEB-001`, `CVT-ERR-001` | CLI/web byte equality, notices separate from artifacts, invalid-input failures, consume-once handoff without execution |

**CVT-VERIFY-001 — Static versus browser evidence.** Generated bundles are checked
with `site-a/validator-rules.mjs` and the existing bundle/conformance tests. The
repository checker `tools/check-conformance.mjs` audits two publication roots,
a Review Desk sample, and Site B `_headers`; it is not an arbitrary output-directory
CLI. Tests use a disposable checker-compatible tree rather than overwriting
operational artifacts. The engine runs the full tests and conformance gate.

No forced vendor-loader execution in Node is required. Static reports and
snapshots do not prove browser loading, model behavior, delegation, consent,
CORS, credential isolation, or limits. At least one generated bundle must be
loaded in a real browser using the reference runtime and demonstrate the expected
conversation/delegation. Browser observations, including prior converted-team
runs, belong in the [demo checklist](demo-checklist.md) with revision, environment,
procedure, results, and sanitized evidence. Prior runs are not proof of the new
ADK path. ADK public model/delegation verification remains a separate post-landing
check; this contract does not claim it has run. If required accounts or environment
are unavailable, report **unverified** and the required user input, not success.
A checklist alone is not proof; public availability and independent judge access
also require their own evidence.

## Explicit non-goals and loss of semantics

**CVT-LIMIT-001 — Instructions and edges, not the source harness.** Theora and
Markdown exports add a default conversation graph; ADK exports instructions and
its `sub_agents` graph. ADK transfers control to sub-agents, whereas the target
calls an agent and receives an answer. These are not equivalent execution models.
No executable Theora, Claude, or ADK environment is generated.

Shell, git, gates, tests, filesystem access, scheduling, lifecycle hooks, task
ownership, permissions, budgets, state, MCP servers, original tool lists (including
ADK AgentTool), model choices, schemas, callbacks, skills, subagent policies, and
source input/output types are not converted. Prose requesting them may remain
but grants none. Workflow agents are rejected, not approximated. Authors must
revise unsuitable instructions and must not claim unavailable operations occurred.

No backend, database, authentication, payment system, hosted execution service,
new runtime, or runtime adapter is generated. The three data files are not a
complete hosted web app. Separate static publication, HTTPS/CORS, inference cost
and credentials, source licensing, publication review, and actual browser
verification remain owner responsibilities. README and submission text must
preserve these limits rather than market a harness port.
