---
description: Review Desk의 시험 실행. 검사를 통과한 편집기 정의를 게시 출처 없는 피어로 같은 탭에서 한 메시지만 실행하는 규칙, Engine.runEditor 경로, 화면 제어, 다섯 단계 nav와 내려받기
---

# 시험 실행 (Test run)과 다섯 단계 흐름

제품의 중심은 "이미 가진 에이전트 팀을 가져온다 → 네트워크 파일로 바꾼다 → 검사한다 → 명세를 묻는다 → 그 자리에서 돌려 본다 → 내려받는다"이다. 변환 결과([[converter-mapping-contract]])가 정적 검사에서 멈추던 것을, Review Desk(`site-a/index.html`)의 한 구역에서 방문자가 직접 눌렀을 때만 같은 탭의 런타임으로 돌릴 수 있게 했다. 브라우저 안 모델, 운영자가 비용을 대는 추론, 프록시 서버는 넣지 않았다. 추론은 방문자의 Review Desk 설정(router·키·모델)으로 간다. 화면은 두 페이지(`converter.html`, `index.html`) 그대로이고 시험 실행은 Review Desk 안에 있다.

## 핵심 규칙: 가져온 네트워크는 게시 출처가 없는 피어다

시험 실행은 편집기의 JSON에서 정의를 받아 피어 세션을 만들고, 방문자 메시지를 그 네트워크의 front에게 보내는 일이다. 이 선택에서 다음이 따라 나온다. 구현은 두 사본(`site-a/runtime/engine.js`, `site-b/runtime/engine.js`) 같은 내용이다.

피어여서 생기는 것:

- **router와 키**: Review Desk가 정한 router만 쓴다(`_compileDefinition`의 피어 분기가 `selectPeerRouter(this.userRouter)`를 쓴다). 붙여넣은 manifest의 `llm_router`는 쓰이지 않는다. 이유: 최상위 경로의 `selectTopRouter`는 저장된 router가 없으면 최상위 manifest의 `byok_router`로 방문자 키를 보내므로, 붙여넣은 manifest가 최상위가 되면 그 manifest가 키의 목적지를 정한다.
- **모델과 예산**: 모델은 방문자가 고른 것, 없으면 Review Desk front의 것이다(`_makeCtx`의 `modelOverride`·`callerModel()`). 단계 한도는 Review Desk front 것(`callerMaxSteps()`)이고 턴 예산(시간·원격 호출 수·에이전트 호출 수)은 채팅 턴과 같은 `_turnBudget()`이다. 가져온 네트워크가 더 큰 한도를 선언해도 늘지 않는다. temperature는 그 네트워크 자신의 값이다([[runtime-execution-contract]]).
- **코드와 사이트 능력**: `website_*` 도구는 최상위에만 주어지고(`ctx.isTop`) manifest의 actions 모듈은 `loadTop`에서만 불러온다. coded tools·MCP·toolbox 선언과 runtime 검증 오류는 주소에서 온 피어와 같은 오류로 실행을 거부한다.

게시 출처가 없어서 생기는 것:

- **base를 주지 않는다**: 액션 목록·허용 액션 제안은 `{base, 네트워크 이름}`으로, 저장 링크는 `{base, 이름, 참조}`로 찾는다. 가져온 정의에 이 페이지의 base를 주면 이름이 `review_desk`인 정의가 이 사이트의 액션 제안과 저장된 링크를 물려받는다. 그래서 `runEditor`는 base 없이 `Session`을 만든다. 이름을 검사해서 막지 않는다. 액션 목록은 비고 링크는 그 실행 안에서만 유지되며(`_storedLink`·`_persistLink`가 base 없으면 저장소를 읽지도 쓰지도 않는다) 방문자가 입력한 링크는 `runtimeAllowedPeers`에 더해지는 기존 경로를 쓴다.
- **다른 사이트 호출은 모두 제3자 접촉**: 절대 주소 참조는 그 manifest의 정책 검사와 동의 카드를 거친다. 이 사이트 자신의 네트워크를 부를 때도 같다(`requiresThirdPartyApproval(ref, undefined)`는 true). 상대 참조는 풀 base가 없어 거부된다([[peer-destination-rule]]). "Publication base URL" 입력은 시험 실행에 쓰이지 않는다. 그 값을 base로 쓰면 그 출처가 동의 없이 접촉되기 때문이다.
- **표시**: 실행 그래프에는 host 대신 고정 표지 `editor`가 나온다(`engine.js`의 `hostOf`가 url이 없으면 `"editor"`, run span의 `origin`도 `editor`).

그 밖의 규칙: 메시지 하나에 답 하나이고 이전 턴 기록은 넘기지 않으며 채팅 history에도 더하지 않는다. 정의를 만드는 길은 하나다. `Engine._compile`은 주소에서 읽기만 하고(manifest의 정의와 links 가져오기) 지원 밖 기능 거부·`validateNetwork`·router 선택은 `_compileDefinition`이 한다. 주소에서 온 정의와 편집기에서 온 정의가 이 뒤쪽을 같이 쓰므로 한쪽만 느슨해지지 않는다. 턴 예산도 `_turnBudget()` 한 곳이고, `_executeRun`이 채팅(`runTurn`)과 시험 실행(`runEditor`)의 진입 가드(`running`)·run span·취소 신호를 공유한다. 이미 채팅이 돌고 있으면 `Another run is already active…`로 거부한다.

## 화면과 제어 (`site-a/site.js`, `site-a/index.html`)

- **구역**: `index.html`의 `section#test-run`(메시지 `#test-run-message`, Run `#test-run-start`, Stop `#test-run-stop`, 상태 `#test-run-status`, 답 `#test-run-answer`)과 `section#download`(`#review-downloads`).
- **언제 시작할 수 있나**: `updateRunControls()`가 런타임이 부팅됐고, `canTestRun()`(검토된 입력이 있고 현재 검사에 `fail`·`error`가 없음)이며, 시험 실행·채팅 run이 돌고 있지 않고, 메시지가 비어 있지 않을 때만 Run을 연다. 입력을 고치면 `clearReview`가 `reviewed`를 비워 다시 검사해야 한다. 변환기에서 넘겨받기, 붙여넣기, 샘플, URL 감사는 정적 검사까지만 한다(자동 실행 없음).
- **겹치지 않음**: 시험 실행 중에는 채팅 입력·전송·새 대화 컨트롤(`#ns-input` 등)이 비활성화되고, 채팅 turn이 도는 동안(`observe`가 run start·end 이벤트로 `observedRunActive` 갱신, 그리고 `runtime.engine.running`)에는 Run이 닫힌다. 실행 그래프 패널이 최신 실행 하나만 보여 주기 때문이다.
- **멈춤**: Stop은 `testController.abort()`로 그 실행의 `AbortController`를 취소한다. 페이지를 떠날 때도 취소한다(`pagehide`).
- **보이는 것**: 정상 결과는 `result.text`와 구조화된 `result.presentation`(읽기 전용 JSON 텍스트, 폼·액션은 실행하지 않음)을 모두 보인다. `presentationIssues`가 있으면 오류 진단으로 함께 보이고 상태는 오류가 된다. 표시할 답이 하나도 없으면 정상 완료처럼 두지 않고 오류로 처리한다. 오류는 `bootError`로 비밀·URL 일부를 가린 문장으로 보인다. 키가 없으면 모델 요청 없이 런타임의 기존 설정 오류가 보인다.
- **실행 그래프**: 기존 `observe`와 `#runtime-events`가 채팅 턴과 같은 방식으로 최신 run 하나의 span을 보이고, 각 줄에 출처 표지를 `[origin → peerOrigin]`로 붙인다. 가져온 정의의 run·agent 행은 `[editor]`, 피어 호출 행은 `[호출 출처 → editor]`로 나온다.

## 다섯 단계 nav와 내려받기

두 페이지 머리의 `nav[aria-label="Team workflow"]`가 같은 다섯 단계 Import → Check → Ask the spec → Test run → Download를 가진다. Import는 `converter.html`, 나머지 넷은 `index.html`의 구역(`#review-tools`, `#chat-heading`, `#test-run`, `#download`)이다. `index.html` 안의 네 링크는 `#review-tools`처럼 fragment만 쓴다. 공개 기본 URL(디렉터리 주소)에서 같은 페이지 안의 링크를 파일 이름이 붙은 상대 주소로 쓰면 다른 document로 간주돼 페이지가 다시 로드되고 검사한 입력을 잃는다는 지적이 리뷰에서 나와 fragment로 고쳤다. `converter.html`의 Check 이하 링크는 문서 간 이동을 의도한 것이라 `index.html`을 가리킨다. `site.js`의 `updateWorkflow()`가 현재 hash의 단계에 `aria-current="location"`을 단다.

Review Desk의 Download는 현재 검사한 manifest·network·(있으면) links를 파일로 받는다. 변환기와 같은 함수 `artifactDownloads`(`site-a/artifact-download.js`)를 두 페이지가 쓴다. Review Desk는 입력란의 원문 텍스트(`sources`)를 그대로 내려받아 검사한 바이트와 같게 하고, 입력이 바뀌면 `clearReview`가 객체 URL을 해제한다.

## CSP는 그대로

시험 실행은 새 worker나 `blob:` 연결을 쓰지 않는다. 실행 길이 메모리 객체(`AgentNetwork`, `Session`, `runAgent`)만 쓰므로 `worker-src 'none'` 같은 정책은 바뀌지 않았다([[page-csp-and-browser-check]]).

## 검증

- 결정적 테스트: `tests/editor-runtime.test.mjs`(A/B 같은 조건) — router가 Review Desk로만 가고 이전 history가 안 보임, 가져온 정의가 이름만으로 액션·링크를 물려받지 않음, 지원 밖 능력·검증 오류를 접촉 전 거부, 절대 주소 피어가 정책·동의를 거침(이 사이트 자신 포함), 데스크 시간 한도와 취소, 채팅과 취소·run 소유 공유, 데스크 step·호출 예산과 키 없는 추론 거부. `tests/desk-ui.test.mjs` — 검사 통과 + 클릭에서만 실행, 전체 답·구조화 답·표시 오류, Stop·채팅 배제, 내려받기 바이트와 이전 객체 URL 해제, 다섯 단계 목적지.
- 브라우저: `tools/browser-check.mjs`가 ADK 샘플 변환 → 같은 탭 Review Desk로 열기 → 정적 검사만으로 모델 요청이 없음 → 내려받기 바이트 → 단계 이동 → 시험 실행 → 답 렌더와 위임 span·tool 결과, `editor` 표지, CSP 위반 0을 모의 router로 확인한다([[page-csp-and-browser-check]]). 공개 사이트에서 실제 모델로 한 확인은 [[browser-evidence-ledger]] §9 요약에 있다.
- 한계: 이 위키 작성 중 위 테스트나 `browser-check`를 실행하지는 않았다. 여러 턴 대화, 가져온 네트워크를 최상위로 실행하는 일, 상한 만료·Stop·동시 실행 거부의 공개 실측은 하지 않았다. 변환 결과의 실행은 ADK 실행과 같은 동작이라는 뜻이 아니다([[converter-mapping-contract]]의 한계).

화면 쪽 설명은 [[site-a-review-desk]], 런타임 사본의 위치는 [[vendored-runtime]]에 있다.
