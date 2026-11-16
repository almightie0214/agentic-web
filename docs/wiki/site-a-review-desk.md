---
description: Site A(Agent Review Desk)의 페이지 구성, 키 없이 쓰는 검사·샘플·URL 감사 UI, 런타임 boot 채팅 연결, 실행 그래프와 신뢰 배지의 경계
---

# Site A — Agent Review Desk

## 구성

- `site-a/index.html`: 헤더, 검사 패널(`#review-tools`: 샘플 버튼 4개, 붙여넣기 폼 `#validate-form`, URL 감사 폼 `#audit-form`과 프리셋), 규칙 리포트 `#rule-report`와 구성 그래프 `#review-graph`, 실행 그래프 섹션, 채팅 영역. 런타임이 채우는 슬롯 `data-ns-slot="header" | "settings" | "chat" | "agents"`를 가진 `section#agent-app`은 처음에 `hidden`이다. 모든 참조는 `./styles.css`, `./site.js`처럼 상대경로다. 콘텐츠는 영어.
- `site-a/converter.html`·`site-a/converter.js`: 키 없이 쓰는 역할 변환 탭. `index.html` 헤더에서 링크하고 `styles.css`를 공유한다. [[converter-code-structure]]. `index.html`·`converter.html` 모두 restrictive CSP meta를 선언한다([[page-csp-and-browser-check]]).
- `site-a/styles.css`: 사이트 스타일(`.site-shell`, `.desk-workspace`, `.desk-panel`, `.desk-check`의 `data-state`별 색, `.desk-graph`, `.desk-trust` 등).
- `site-a/site.js`: 검사 UI와 부트 셸. 규칙은 [[validator-rules]], URL 감사는 [[url-audit]]에서 가져다 쓴다. 새 설정 UI나 키 저장 로직은 없다.

## 키 없는 검사

검사 흐름은 런타임 boot와 독립적이다. 채팅 boot가 대기 중이거나 실패해도 아래 경로는 동작한다(`tests/desk-ui.test.mjs`).

- **붙여넣기**: `parseInput()`이 manifest·network·links·activePeerChain을 JSON으로 파싱하고, 실패하면 `input.json` 오류 행(JSON 문법 오류 메시지와 수정 힌트)을 보이며 규칙 판정은 만들지 않는다. 성공하면 `validateNetwork(input)` 결과를 `renderChecks`로 표시한다. 각 행은 상태·`ruleId`·JSON Pointer 위치·메시지·최소 수정 힌트를 텍스트로 보인다.
- **샘플**: 버튼이 `./samples/<id>.network.json`을 읽어 입력란을 채우고 바로 검사한다([[fixtures-and-samples]]).
- **URL 감사**: `auditUrl` 결과의 획득 오류는 `acquisition.<kind>` 행으로, 규칙 check와 분리해 보인다. 상태 문구는 `readiness.summary`다.
- **프리셋**은 URL 입력란만 채우며 가져오기는 사용자가 **Audit URL**을 눌러야 시작된다. Audit This Site는 자기 base URL, Audit Linked Peer는 채팅 런타임의 유효 링크(발행 바인딩+런타임 오버라이드)에서 찾은 비-placeholder 피어일 때만 활성화된다(`peerTargets`, `updatePeerPreset`; example/test/placeholder 호스트는 실행 가능으로 표시하지 않음), Non-CORS 예시는 example.com을 예시 목적지로 채울 뿐 CORS 실패를 보장하지 않는다.
- **오래된 결과 무효화**: 입력 편집·새 샘플·새 감사는 `clearReview`가 `generation`을 올리고 진행 중 fetch를 abort해서, 늦게 도착한 결과가 현재 리포트를 덮지 못한다.
- 구성 그래프(`configurationGraph`)는 "기대 구성, 실행 아님"으로 표시한다. 검토 대상의 이름·바인딩·정책 등이 문자열이 아닐 수 있으므로 모든 값을 `jsonText` 경계를 거쳐 표시하고, 링크 조회는 `linkBindings`로 문자열 이름만 키로 쓴다(그래프와 피어 후보가 공유). 불량 타입 입력이 표시 계층에서 `TypeError`를 내 리포트가 끊긴 지적에서 도입됐다.

## 채팅 연결

실패/오류 행에는 "Explain in Review Desk"와 "Ask Spec Scout about the clause" 버튼이 붙는다(`draftExplanation`). 둘 다 채팅 입력창에 **초안만** 채우고(기존 초안은 `window.confirm` 확인 후 교체) 전송은 사용자가 한다. 초안에는 해당 발견과 공개 아티팩트가 "신뢰할 수 없는 데이터"로 담긴다. Spec Scout 버튼은 유효 링크에 `spec_scout`라는 이름의 실제 피어가 설정되어 있을 때만 활성이다. `peerTargets`는 `test`·`invalid`·`example` 호스트 같은 placeholder를 걸러내는데, 현재 발행된 바인딩(`https://spec-scout.pages.dev/spec_scout`)은 걸러지지 않아 boot 뒤 활성 조건을 충족한다. 이 판정은 호스트 이름 규칙이라 예약 주소를 공개 주소로 바꿀 때 코드 변경 없이 켜졌고, 접근 가능하다는 증거는 따로 공개 실측에 있다([[peer-connection]]). 활성 상태에서도 초안은 피어 접촉을 허가하지 않고 런타임의 평소 동의 흐름을 우회하지 않는다. 채팅을 쓸 수 없으면 안내만 보이고 리포트는 유지된다.

## 실행 그래프와 신뢰 배지

`#runtime-config`는 이 페이지의 채팅 런타임(검토 대상 네트워크가 아님)의 manifest와 유효 링크에서 만든 구성이며 "설정상 기대"로만 표시한다. `#trust-state`와 `#runtime-events`는 `runtime.trace`의 실제 이벤트(`observe`)를 최신 채팅 run(`latestRun`)의 span·부모 관계로 모은다. 에이전트·모델 호출(router host/model/mock 여부)·피어 fetch/call span과 consent·`composition_limit` 결정 이벤트를 센다. consent는 결정 출처(`source`: `prompt_allow`·`prompt_always`·`remembered_always`·`decline`·`headless_default`)별로 표시하는 수를 따로 세고, 런타임이 결정마다 이벤트를 하나 남기므로 "동의 이벤트 없는 동의" 미확인 문구는 더 이상 쓰지 않는다(`site-a/site.js`의 `observe`; [[runtime-execution-contract]]). 채팅 전에는 "Not run"이다. 요청 요약이나 선언된 정책, 성공한 호출만으로 보안을 입증했다고 주장하지 않으며 CORS, 순환 중단, 상한 집행, 자격·비공개 맥락 격리는 런타임 보고일 뿐 증명이 아니다. 별도 Probe 토글·상시 sentinel·런타임 어댑터·감사 증거 JSON 다운로드는 만들지 않았다.

## 변환 탭에서 온 입력 받기

페이지 로드 때 `site.js`의 `receiveConvertedInput()`이 변환 탭이 `sessionStorage`에 둔 한 번용 payload(`agent-review-desk:converter`)를 읽는 즉시 지우고 구조를 검사해 입력란을 채운 뒤 같은 `validateNetwork` 리포트를 보인다. 잘못된 payload는 오류 문구만 보이고 아무것도 실행하지 않는다. 이 경로는 채팅 런타임에 변환 네트워크를 올리거나 피어 동의를 건너뛰지 않는다. 변환기 쪽 설명은 [[converter-code-structure]].

## 부팅 흐름

`site-a/site.js`의 `mountDesk()`:

1. `./runtime/index.js`를 동적 import해 `boot(root, { originUrl })`를 호출한다. URL은 `import.meta.url` 기준 상대 해석이라 하위 경로 배포에서도 맞다(coded tool sandbox worker가 은퇴해 worker URL 옵션은 없다).
2. `boot`(`site-a/runtime/index.js`)가 `Engine`을 만들고 `engine.loadTop()`으로 `agent-manifest.json`과 네트워크 JSON을 읽어 검증한 뒤 `mountApp`으로 공식 설정 패널·채팅·에이전트 UI를 마운트한다. 데이터는 [[network-publication]], 런타임 동작은 [[vendored-runtime]].
3. 성공하면 `#agent-app`을 보이게 하고 준비 문구(채팅에는 provider 키가 필요하지만 정적 검사와 URL 감사에는 필요 없다)를 쓴다. 런타임 구성 그래프와 피어 프리셋을 갱신하고 `runtime.trace`를 구독한다.
4. 실패하면 앱을 숨기고 `role="alert"`, `data-state="error"`로 "could not be loaded" 고정 안내를 보이되 키 없는 검사와 URL 감사는 계속 쓸 수 있다고 알린다. 이어서 `Loader error: <로더 오류>`를 붙여 중복 agent 이름 같은 구체적 원인을 화면에서 볼 수 있게 한다(이전에는 DevTools에서만 보였다). `bootError`가 URL 쿼리의 비밀 값·URL 자격·Authorization·Cookie·key/token 값을 가린다([[runtime-execution-contract]]).

## 설정과 키

설정 패널(Provider URL, 모델, BYOK, 프로필 저장)은 런타임 내장이다. 키·라우터·모델은 URL이 아니라 호스트 옵션, 탭 설정, 저장된 프로필에서만 온다. URL의 `key`는 주소창에서 제거된다(`site-a/runtime/index.js`). 사이트 코드가 키 정책을 따로 두지 않는다.

## 검증

`tests/smoke.test.mjs`(boot 가시성, 아티팩트 로드)와 `tests/desk-ui.test.mjs`(최소 DOM 위에서 실제 `site.js`, 실제 trace bus·검사기·URL 감사). 실제 브라우저 레이아웃·피어 동의·배포 CORS·실제 provider는 검증하지 않는다. [[testing-and-gate]] 참고.
