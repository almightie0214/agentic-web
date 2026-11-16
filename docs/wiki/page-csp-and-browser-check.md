---
description: 두 사이트 페이지의 Content-Security-Policy meta 정책과 이유, tools/browser-check.mjs(Edge CDP·loopback 두 출처·모의 router)가 확인하는 흐름과 위반 집계 방식
---

# 페이지 CSP와 브라우저 확인 도구

스크립트가 있는 세 페이지는 restrictive Content-Security-Policy를 meta로 선언한다. 스펙 §4 Threat boundary가 restrictive CSP를 SHOULD로 권하기 때문이다. `site-a/`에는 헤더 설정 파일이 없고 `site-b/_headers`는 CORS 한 줄뿐이라 정책을 meta에 둔다. 근거 파일: `site-a/index.html`, `site-a/converter.html`, `site-b/index.html`, `tools/browser-check.mjs`.

## 정책

세 페이지가 같은 값을 쓴다.

| 지시어 | 값 | 이유 |
| --- | --- | --- |
| `default-src` | `'self'` | 기본은 같은 출처만 |
| `script-src` | `'self'` | 인라인 script·eval 없음 |
| `style-src` | `'self' 'unsafe-inline'` | 런타임 `ui.js`가 `style` 요소를 만든다(`site-b/index.html`의 인라인 스타일도 같은 지시어에 의존) |
| `img-src` | `'self' data: blob:` | 같은 출처 이미지와 `data:`·`blob:` 이미지만 |
| `worker-src` | `'none'` | worker를 쓰는 coded tool이 은퇴했고 다른 worker는 없다([[runtime-execution-contract]]) |
| `connect-src` | `'self' https: http://127.0.0.1:* http://localhost:*` | 피어 HTTPS 산출물 fetch와 방문자가 넣는 BYOK router(loopback 포함) |
| `object-src`·`base-uri`·`form-action` | `'none'`·`'self'`·`'self'` | |

`connect-src`의 `https:`는 피어 정의 fetch와 모델 router 때문에 넓어 연결 대상을 제한하는 효과는 약하다. 이 정책이 확실히 막는 것은 인라인 스크립트 실행과 eval이다. 로컬 HTTPS 필터가 브라우저 정책 적용 전에 스크립트를 주입하는 경우까지 막는다는 주장은 근거가 없다(원장 서술도 같은 한계를 둔다).

## `tools/browser-check.mjs`

의존성 없이 Node 24와 로컬 Edge(headless, CDP)로 돈다(`EDGE_PATH`로 실행 파일 지정 가능). 후보 트리의 `site-a/`·`site-b/`를 서로 다른 두 loopback 출처로 서빙하고, OpenAI 호환 모의 router(`/v1/models`, `/v1/chat/completions`)를 띄워 BYOK 설정으로 쓴다. 키나 외부 네트워크는 쓰지 않는다. `Fetch.requestPaused`로 세 로컬 출처 밖 요청은 `blockedExternal`에 기록하고 차단한다. 서빙할 때 manifest의 router와 `allowed_peers`, A의 `links.json`만 loopback 값으로 바꾼다. HTML·스크립트·네트워크 정의는 후보 파일 그대로다.

수행하는 흐름:

- Site A: 부팅·채팅 렌더(모델 요청 0건) → 키 없는 정상 샘플 검사 → 자기 URL 감사 → ⚙ 설정 컨트롤로 BYOK 적용·재로드 → 질문 한 번 → 동의 카드(그 시점까지 B로 가는 fetch 0건) → Allow → B의 manifest·정의 fetch → 피어 답과 최종 답 렌더. 모의 router는 `website_validate_network` 로컬 action 영수증도 만들게 한다.
- 변환 탭: 두 샘플(claude·theora) 변환·정적 검사, 세 산출물 다운로드가 화면 값과 바이트 단위로 같은지 확인.
- Site B: 부팅·렌더.
- 각 페이지에 같은 출처의 탐침 스크립트(도구가 자기 서버에서 내보내는 가상 경로)를 일반 script로 넣어 인라인 script와 `eval` 탐침을 실행한다. CDP `Runtime.evaluate`의 CSP 우회 기본값은 `allowUnsafeEvalBlockedByCSP: false`로 끈다.

위반 집계: 페이지의 `securitypolicyviolation` 이벤트, CDP `Log`(security)·`Audits`(`ContentSecurityPolicyIssue`)·`Runtime.exceptionThrown`을 모은다. 탐침이 만든 기대 위반(inline·eval, 페이지당 2건, `enforce`)과 그 밖의 위반을 따로 세어 `unexpectedViolations`가 0이 아니거나 흐름·탐침 단언이 실패하면 FAIL로 끝난다. Edge는 잡힌 `EvalError`에 Log 항목을 내지 않아 eval은 Audits와 위반 이벤트로 확인한다.

이 도구는 병합 gate가 아니라 이 Goal의 Task 확인용이다([[testing-and-gate]]). 소스 정책이 있다는 것이나 모의 router 통과는 공개 배포 브라우저의 위반 수를 말해 주지 않는다. 배포본에서 같은 도구를 landed 트리에 돌린 결과와 공개 Edge·Firefox 관측은 [[browser-evidence-ledger]]의 judge-ready 절이 기록한다.
