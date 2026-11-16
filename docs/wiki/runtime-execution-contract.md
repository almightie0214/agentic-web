---
description: 두 runtime 사본의 실행 계약. 실패를 답 문자열로 바꾸지 않는 경계 두 곳, 호출 범위 시간 한도(실측으로 정한 상한)와 composition deadline, temperature 전달·검사, 정책 뒤 동의 기록, 은퇴한 기능의 컴파일 거부, 부팅 오류 표시
---

# 런타임 실행 계약 (fail closed·시간 한도·동의)

`site-a/runtime/`과 `site-b/runtime/`은 같은 변경을 받은 두 사본이다([[vendored-runtime]]). 이 페이지는 두 사본이 지금 지키는 실행 규칙과 그 이유를 적는다. 이전에는 여러 층이 오류를 답 텍스트로 바꿔 성공 경로로 흘려보냈고, 시간 한도는 호출 진입 때만 검사됐다. 그 결과 공개 실행에서 피어(`spec_scout`)의 미실행 도구 호출 표기가 caller의 정상 tool 결과가 됐고 질의가 시간 한도를 넘기고도 끝까지 완료됐다. 아래 규칙은 그 원인(실패 결과가 따로 없음, 호출 범위의 취소가 없음)을 경계 계약으로 막는다. 코드 사실 근거는 `site-a/runtime/runner.js`, `site-a/runtime/scope.js`, `site-a/runtime/engine.js`, `site-a/runtime/cruse.js`, `site-a/runtime/actions.js`이며, 결정적 검사는 `tests/peer.test.mjs`의 `runtime …` 테스트(A/B 같은 조건)와 `tests/smoke.test.mjs`에 있다.

## 실행 루프는 하나다

`runner.js`의 `runAgent` → `runAgentManual`이 유일한 에이전트 실행 루프다. 선택형 LangChain API(langchain-runner.mjs와 generated 폴더의 번들 파일, `Engine.enableLangChain`, `ctx.externalRunner`, `index.js`의 runner 선택)는 은퇴해 파일째 지웠다. 두 사이트 manifest는 `deployment.mode: static`이라 그 루프가 공개 사이트에서 켜지지 않았는데도 다른 완료 규칙을 들고 있었고, 바꾸려면 저장소에 없는 의존성으로 번들을 다시 빌드해야 했기 때문이다. `tests/smoke.test.mjs`의 "boot has one execution loop without runner selection"이 `runner` 옵션·URL 값이 있어도 선택이 일어나지 않음을 확인한다.

## 쓰지 않는 기능은 컴파일에서 거부한다

두 사이트 네트워크는 MCP 도구, toolbox·REST 도구, coded tool(sandbox worker), 다른 출처 site action 발견·bridge를 쓰지 않는다. 각 경로가 캐시된 client·큐·저장 상태를 따로 가져 실패·취소 규칙을 그만큼 넓혀야 했으므로 기능 단위로 지웠다.

- 지운 것(파일 이름만 적는다): mcp.js, sandbox.js, sandbox-worker.js, discovered-actions.js, form-actions.js, action-bridge.js, langchain-runner.mjs, generated 폴더의 agent-runner 번들, 그리고 `web-crypto.js`의 SHA-256 구현(마지막 소비자 discovered-actions.js가 사라져 함께 제거; `randomUuid`만 남음).
- 남긴 것: 로컬 site action 경로. `action-transport.js`의 `loadActionModule`·`reviewActions`(같은 출처 module 로딩과 확인), `actions.js`의 `ActionRegistry`·검증·실행·receipt, `website_*` 도구, 확인 UI. `site-a/runtime/generated/graph.gen.mjs`·`site-a/runtime/generated/validation.gen.mjs`와 `kernel.js`의 분류도 남아 Site A validator가 MCP 참조를 정적으로 판정한다([[validator-rules]]). 정적 validator 규칙은 바뀌지 않았다.
- fail closed: `Engine._compile`(`engine.js`)이 `coded_tools`, 원격 action 필드(`catalog`·`pages`·`hostPage`·`bridge`·`callerOrigins`), `class`·`toolbox` 도구, `mcp`·`coded`·`toolbox`로 분류되는 참조를 모으고 `This runtime does not support …`로 실행 전에 거부한다. 조용히 무시하지 않는다. 명세 §6의 grounded capability는 MCP 또는 로컬 site action이면 되고 두 사이트는 후자(`validate_network`, [[validator-action]])를 쓴다.

## 실패는 경계 두 곳에서 던진다

- **경계 1 `runAgent`**: 받아들여진 답을 돌려주거나 오류를 던진다.
- **경계 2 `dispatchToolCall`**: local agent·remote·link·website action·presentation(`render_cruse`)·unknown 종류 모두 결과를 돌려주거나 오류를 던진다. 호출 수 한도(`consumeRemoteBudget`·`consumeAgentBudget`), 순환(`COMPOSITION_CYCLE`), 알 수 없는 tool(`Unsupported tool kind …`), `max_steps` 소진, 잘못된 presentation, 피어 실행 오류는 문자열이 아니라 예외다. 거절 문구는 실제 한도 값으로 만든다.
- **모델이 보는 텍스트로 바꾸는 곳은 `executeToolCalls` 하나**다. 여기서 오류를 `status: "error"` 결과와 `Error from tool '<name>': …` 내용으로 바꿔 parent 에이전트가 계속할 수 있게 하고 tool span을 실패로 끝낸다. 최상위의 오류는 기존 화면 오류로 보인다. 하위 trace의 실패 기록은 그대로 둔다.
- **방문자 거절은 실패가 아니다.** 동의 카드 거절은 `The user declined to contact …` 결과 문자열, 링크 입력 취소는 `The user did not link …` 문자열로 돌아가 caller가 계속한다.
- **website action**: `ActionRegistry.execute`를 거치는 분기는 receipt를 오류에 붙여 던지고(`error.receipt`), `executeToolCalls`가 receipt와 진단을 JSON으로 남긴다. handler가 시작된 뒤 실패·시간 초과는 `dispatchToolCall`이 `status: "unknown"` receipt를 붙인다. 불확실한 쓰기를 확정 실패로 바꾸거나 재시도하지 않는다.

### 답 수용 검사

`parseAgentResponse`(`cruse.js`)와 `ActionRegistry.validatePresentation`(`actions.js`)은 검증 진단을 `presentationIssues`에만 남기고 답 text를 만들지 않는다. 대체 문구는 UI가 issues에서 만든다(`ui.js`의 "I couldn’t display part of that response"). `runAgent`는 presentation을 붙이고 `validatePresentation`을 거친 뒤 다음이면 실패시킨다.

- 모델이 낸 실제 text도, 남은 유효 presentation도 없다.
- 남은 text가 `<function=…>` 호출 형태로만 이루어졌다(`functionCallOnly`). 설명이나 코드 예시 속 표기, tool 오류를 다룬 정상 prose, 거부된 선택적 presentation과 함께 온 prose는 답이다.

실패한 에이전트의 agent span은 실패로 끝난다. AAOSA `Response`가 문자열이든 객체든 같은 `unwrap` 경로를 거쳐 presentation이 정규화·검증되게 한 것은 리뷰에서 나온 교훈이다([[no-compat-code-lessons]]). 문자열 Response에 든 잘못된 presentation이 정상 답으로 통과했었다.

## 시간 한도는 호출 범위로 강제한다

- `createCallScope`(`scope.js`)가 `runAgent` 시작 때 절대 한도를 한 번 계산한다: `min(부모 deadline, composition.deadline, 시작 시각 + 자기 max_execution_seconds)`. 자기 한도는 `MAX_EXECUTION_SECONDS`(현재 180초, 두 사본 같은 값, 아래 "시간 상한은 실측에서 나온다")로 상한을 둔다. 그 시각이나 부모 signal abort에 abort되는 signal을 만들어 `bindContext`로 하위 ctx에 넘기고, `runAgent` 본문 전체(도구 표 구성 포함)를 `scoped`로 이 signal과 경주시킨다. 공유 client·`Session`은 한도를 저장하지 않는다. 호출마다 scope를 받는다.
- `bindContext`는 `_makeCtx`(`engine.js`)가 만드는 ctx의 모든 함수형 속성(동의, 링크 해석, 피어 해석, action 확인 등)을 `scoped` 감싸개로 바꾼다. 감싸개는 이미 abort면 즉시 오류를 던지고, 대기를 abort와 경주시키고, abort 뒤 도착한 결과를 버린다. 마지막 인자로 `{ signal, deadline }`을 넘겨 실제 I/O(`llm.chat`, `remote.js`의 `fetchManifest`·`fetchText`, links·정의 fetch)가 signal을 받는다. 선택적 fetch의 catch는 abort를 삼키지 않는다(`_loadPublishedLinks`가 catch 안에서 `assertActive`).
- 대기에서 깨어난 코드는 `assertActive`로 scope를 확인한 뒤에야 다음 작업을 시작하거나 공유 상태(동의 기억, 런타임 허용 피어, 링크 저장, 세션 캐시)를 바꾼다. 사람 입력 UI(동의 카드·링크 입력·action 확인)는 abort 시 닫히고 대기 중이던 입력은 무효가 된다(`ui.js`의 `pendingInput`). `ActionRegistry.execute`는 handler 시작 전마다 scope를 확인한다.
- 모델 호출 signal은 한도 signal과 steering signal을 합친다(`runAgentManual`의 `AbortSignal.any`). 한도 abort 사유는 `ExecutionDeadlineError`(`code: EXECUTION_DEADLINE`)라 steering의 `AbortError`와 구별된다(`tests/smoke.test.mjs`의 "model deadline abort remains an error rather than steering").
- 자식이 자기 한도로 끝나면 그 자식의 실패이고 부모의 `executeToolCalls`가 오류 tool 결과로 받는다. 부모 signal이 abort되면 부모가 실패한다. 형제의 한도는 줄지 않는다.

### composition deadline은 네트워크가 선언한다

`Engine.runTurn`이 질의 `composition.deadline`을 최상위 네트워크의 `max_execution_seconds`로 정한다. 선언이 없을 때만 90초이고 선언값은 `MAX_EXECUTION_SECONDS`로 줄인다(`engine.js`의 `Math.min(선언 ?? 90, MAX_EXECUTION_SECONDS)`). 피어 네트워크의 선언은 caller의 composition을 바꾸지 못한다. 피어는 자기 에이전트 한도로만 더 짧게 할 수 있다. 명세 §3.1이 한도를 네트워크 단위로 설정할 수 있어야 한다고 하기 때문이다. 이전의 고정 90초에서 Spec Scout 질문이 피어 모델 호출 약 71초 뒤 coordinator 최종 호출에서 잘렸다. 공개 선언은 `site-a/review_desk.network.json`이 180, `site-b/spec_scout.network.json`이 120이고 변환기는 90을 내보낸다([[converter-mapping-contract]]).

선언 형식은 `kernel.js`의 `validateNetwork`가 `Engine._compile`에서 강제한다. 네트워크·에이전트 수준 `max_execution_seconds`가 유한한 양수 number가 아니거나(null·문자열·0·음수·NaN·Infinity), `max_steps`가 양의 정수가 아니면 실행 전에 거부한다. 소수 값은 허용한다. 정적 validator의 `execution.limit` 규칙만 이를 보던 때는 잘못된 값이 NaN deadline이 되어 타이머가 걸리지 않았다.

### 시간 상한은 실측에서 나온다

원본 runtime에서 온 한도(질의 기본 90초, 에이전트 호출 24회, 원격 호출 4회, 피어당 1회, 동시 tool 4개, 피어 깊이 5, `max_steps` 기본 12, action `timeoutMs` 100~300000)는 그대로 두고, 이 프로젝트가 정한 값 네 개(runtime 상한과 세 네트워크 선언)만 공개 실측에서 계산한다.

- 네트워크 선언 = `30 * ceil(2 * max(durationMs) / 30000)`초. `durationMs`는 그 네트워크가 맨 위인 성공 실행의 trace 최상위 `kind:"run"` span이 끝날 때 기록한 값이다. 입력은 `docs/demo-checklist.md` §7의 여덟 실행(review_desk 4회 최장 78037ms → 180, spec_scout 직접 2회 최장 47318ms → 120, 변환 샘플 2회 최장 43568ms → 90)이고 계산 근거는 §8에 있다([[browser-evidence-ledger]]).
- runtime 상한 = `max(90, 세 선언)` = 180(`site-a/runtime/scope.js`·`site-b/runtime/scope.js`의 `MAX_EXECUTION_SECONDS`). 90 아래로 내려가면 선언 없는 질의의 원본 기본 90초가 바뀌므로 하한 90을 둔다. 이전 상한은 300이었다.
- 새 상한보다 큰 네트워크 선언도, 단독 에이전트 선언도 상한으로 줄어든다(`createCallScope`·`runTurn`). 이 값은 고정된 질문과 조건의 실측이지 임의 질문이 그 안에 끝난다는 보장이 아니다. 새 한도를 공개 배포에서 다시 재지는 않았다.
- 결정적 검사: `tests/smoke.test.mjs`의 "measured query limits match the approved longest run budgets"가 위 원자료에서 공식을 다시 계산해 세 선언과 두 `MAX_EXECUTION_SECONDS`가 같은지 단언하고, `tests/peer.test.mjs`의 "runtime uses the top network query deadline with default and maximum"(A/B)가 기본 90초와 상한 줄임을 mock 시계로 확인한다.

## 샘플링 temperature는 실행되는 에이전트가 정한다

이전에는 네트워크 `llm_config.temperature`가 선언돼도 모델 요청에 실리지 않았다(`LLMClient.chat`은 `model`·`messages`·`stream: true`·`tools`만 body에 넣었다). 지금은 다음 경로를 따른다.

- **값 고르기**: `runner.js`의 `runAgentManual`이 한 곳에서 `spec.llm_config.temperature`(그 에이전트) → 없으면 `network.config.llm_config.temperature`(그 에이전트가 속한 네트워크)를 고른다. 피어도 자기 정의의 값을 쓴다. 모델 선택(`agentModel`, caller·설정 화면 override 우선)과 규칙이 별개이고 caller의 temperature 정책은 없다. 그래서 caller 네트워크 0.7·피어 0.2이면 피어 요청은 0.2, caller 요청은 0.7이다(router·키는 여전히 caller 것). 설정 화면의 모델 선택은 모델만 바꾸고 temperature를 지우지 않는다.
- **body 반영**: `llm.js`의 `chat({ model, temperature, … })`은 `temperature !== undefined`일 때만 body에 넣는다. 없으면 키 자체가 없고 0은 0으로 간다.
- **컴파일 검사**: `kernel.js`의 `validateNetwork`가 네트워크와 각 에이전트의 `llm_config.temperature`가 유한한 number이고 0 이상 2 이하인지 `max_execution_seconds`·`max_steps`와 같은 반복문에서 확인한다. 네트워크와 에이전트를 따로 보므로 유효한 에이전트 값이 잘못된 네트워크 값을 가리지 못한다. 0~2는 OpenAI Chat Completions의 범위이고 공급자별 예외나 자동 재시도는 두지 않는다. 정적 쪽은 [[validator-rules]]의 `llm.temperature`다.
- **이유와 한계**: 진단에서 Spec Scout 지시문과 같은 질문을 runtime 밖에서 Otari(`alibaba/qwen3.8-flash`)에 보냈을 때, `stream: true`에 temperature 없이 보낸 2회는 문장 중간부터 무너졌고 temperature 0.2를 준 1회는 깨끗했다. Otari의 실제 기본 temperature는 모르고 공급자 쪽 결함의 정체는 단정하지 않는다. 세 네트워크가 0.2를 선언한 것은 이 진단에서 나온 완화책이며, 공개 실측 8회에서 읽은 답에 깨진 문장이 관찰되지 않았다는 범위가 한정된 관찰이다([[browser-evidence-ledger]]).
- 결정적 검사(A/B 같은 조건): `tests/peer.test.mjs`의 "runtime sends agent temperature independently of model override"(에이전트 우선·네트워크 대체·둘 다 없음·0·상한 2), "runtime peer uses its own temperature with caller routing and model"(요청 temperature `[0.7, 0.2, 0.7]`), "runtime compiles only valid temperature declarations", `tests/smoke.test.mjs`의 "settings model selection preserves declared temperature after reload".

## 동의는 정책 뒤에 묻고 결정마다 기록한다

`_makeCtx`의 `ctx.requestConsent`가 동의를 소유한다. 호출 지점(`runner.js` remote 분기)은 대상 URL(`targetUrl`), 표시 host, parent span, 종류를 넘긴다. 순서는 다음과 같다.

1. 직속 caller manifest로 `Engine._assertAllowedPeer`를 먼저 돌린다. 거부면 묻지 않고 fetch도 없이 `Policy:` 오류를 던진다. 닫힌 정책의 직접 URL에도 동의 카드가 먼저 뜨던 결함을 막는다.
2. `Engine.requestConsent`가 결정과 출처를 `{ decision, source }`로 돌려준다. source는 `prompt_allow`, `prompt_always`, `remembered_always`, `decline`, `headless_default`다. 모달 결정은 `consentTail`로 직렬화한다.
3. `ctx.requestConsent`가 결정마다 `consent` trace 이벤트를 정확히 하나 남긴다(호출 지점의 decline 기록은 없앴다). Site A의 trust 표시(`site-a/site.js`의 `observe`)는 이 source별로 센다([[site-a-review-desk]]).

## 부팅 오류

`site-a/site.js`와 `site-b/site.js`의 부팅 실패 처리는 고정 안내 뒤에 `Loader error: …`로 로더의 구체적 오류(예: `Duplicate agent name 'worker'.`)를 붙인다. `bootError`가 URL 쿼리의 비밀 값, URL 경로 뒤 부분, Authorization·Cookie 줄, key·token류 값을 가린다. `tests/smoke.test.mjs`의 boot 테스트가 `url-secret` 등 자격 정보가 상태 문구에 없음을 단언한다.

## 아직 확인하지 못한 것

위 계약은 코드와 모의 fetch·모델·UI·가상 시계를 쓴 결정적 테스트로 읽었다. 이 위키 작성 중 테스트를 실행하지는 않았다. 공개 배포에서의 관측은 [[browser-evidence-ledger]]에 있고 범위가 한정돼 있다.
