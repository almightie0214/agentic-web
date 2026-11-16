---
description: Site A coordinator가 links.json의 심볼릭 spec_scout 참조를 해석해 동의 후 Site B 네트워크를 A의 런타임에서 실행하는 피어 연결의 배선·정책·공개 주소·공개 실측 결과와 한계
---

# 피어 연결 (Site A → Site B)

Site A의 `review_coordinator`는 스펙 질문을 받으면 `spec_scout`를 호출한다. 호출은 방문자 동의 뒤 Site B의 네트워크를 **A의 브라우저 런타임 안에서** 불러와 실행한다. B 쪽 서버 실행이나 B의 site action은 쓰지 않으며 B는 정보만 제공한다([[site-b-spec-scout]]).

## 선언이 맞물리는 곳

| 선언 | 파일 | 내용 |
| --- | --- | --- |
| 링크 바인딩 | `site-a/links.json` | `{"version":1,"networks":{"review_desk":{"spec_scout":"https://spec-scout.pages.dev/spec_scout"}}}` |
| 허용 출처 | `site-a/agent-manifest.json` | `allowed_peers: ["https://spec-scout.pages.dev"]`, `peer_policy.mode: closed` |
| 링크 슬롯과 도구 참조 | `site-a/review_desk.network.json` | 최상위 `link_slots: { spec_scout: {} }`, `review_coordinator.tools: ["conformance_reviewer", "spec_scout"]` |
| 피어 네트워크 이름 | `site-b/agent-manifest.json` | `networks[0].name: spec_scout` |

- **심볼릭 이름**: coordinator의 `tools`에 URL이 아니라 `spec_scout`라는 이름만 둔다. `Engine`(`site-a/runtime/engine.js`)이 `/links.json`을 사이트 base에서 읽어 `links.networks[<네트워크 이름>]`을 `config.links`에 합치고, `buildToolTable`이 이를 `{ kind: 'link', reference: 'spec_scout' }`로 만든다. 도구를 광고하는 것만으로는 B에 접속하지 않는다. 스펙상 발행자는 `links.json`으로 기본 바인딩을 소유하고, 런타임에서 방문자가 넣은 바인딩은 호출자 소유이며 발행자 파일을 바꾸지 않는다.
- **URL 규칙**: 피어 URL의 마지막 segment가 네트워크 이름이고 그 앞 경로가 manifest가 놓인 site base다. B는 root에 배포하므로 `https://spec-scout.pages.dev/agent-manifest.json`이다. 프로토콜이 모든 사이트에 origin root를 강제하는 것은 아니며 경로 prefix가 있는 base도 가능하다(테스트가 `agents/spec_scout`도 같은 origin이면 허용됨을 확인한다).
- **공개 주소**: 현재 소스 설정은 공개 B `https://spec-scout.pages.dev/spec_scout`와 짝이 되는 허용 출처다(예약 `.invalid` 주소는 교체됐다). 공개 A·B의 응답과 브라우저 피어 흐름은 사용자·운영자가 실측해 원장에 기록했다(아래 "공개 배포에서 관찰된 것"). 기록은 범위가 한정돼 있다.
- **허용 출처와 링크는 한 쌍이다.** `manifestAllowsPeer`는 닫힌 정책에서 `allowed_peers`의 origin(스킴·호스트·포트)과 정확히 일치할 때만 허용한다. 실제 URL을 확정·변경하면 `site-a/links.json`과 `allowed_peers`를 함께 고쳐야 한다. 한쪽만 바꾸면 테스트가 실패한다. `links.json`만 바꾸라는 안내는 틀린 설명이다.

## 호출 순서

`tests/peer.test.mjs`가 실제 `Engine`·`buildToolTable`·`dispatchToolCall`로 확인하는 순서:

1. coordinator의 도구 표에서 `spec_scout`는 `link` 종류이고 `network.getLink('spec_scout')`가 `<B root>/spec_scout`로 해석된다.
2. 호출 시 **정책 검사 → 동의 → 접촉** 순서다. `ctx.requestConsent`가 직속 caller manifest로 `_assertAllowedPeer`를 먼저 돌려 닫힌 정책 밖 URL은 동의 질문 없이 `Policy:` 오류로 끝난다. 허용 대상이면 `engine.onConsent`가 호출되기 전에 B로 가는 fetch는 없고, 동의 정보의 `peerOrigin`은 링크 목적지의 host(테스트는 `peer.host`와 비교), `requestText`는 질문 그대로다. 사이트 코드가 동의를 주장하지 않고 런타임이 방문자에게 묻는다(coordinator instructions도 이를 명시). 결정(이번 허용·이번에 항상 허용·저장된 항상 허용·거절·화면 훅 없음 기본 허용)마다 `consent` trace 이벤트가 하나 남는다([[runtime-execution-contract]]).
3. 허용되면 `agent-manifest.json` → `spec_scout.network.json` → `links.json` 순으로 가져온다. B에는 `links.json`이 없어 404다. 피어 세션의 `base`는 B root이고 라우터(`llm.baseUrl`)는 호출자 것을 상속한다(테스트가 단언). 사용자 키가 B에 가지 않는다는 것은 스펙 §4의 요구이며, 이 테스트는 키 격리를 검사하지 않는다.
4. 거절하면 B로 가는 요청이 없고 "user declined to contact …" 결과를 돌려준다(방문자 거절은 실패가 아니라 거절 결과다). manifest에 정확히 일치하는 이름이 없으면(`other`로 바꾼 시나리오) `No published network named 'spec_scout'`로 실패하며 다른 네트워크를 고르지 않는다.
5. 피어의 agent는 도구가 없다(`tools` 빈 배열). 테스트는 모델 호출만 스크립트로 대체하고 로딩·검증·실행 경로는 실제 산출물과 런타임을 쓴다. 첫 system 메시지는 B 네트워크 instructions와 같다.

coordinator instructions는 피어 결과를 요약할 때 출처 절·판본·근거 한계를 보존하고 그 설명을 적합성 보고서로 취급하지 않으며, 거절·불가 시 피어 답을 지어내지 않도록 한다. 적합성 질문은 여전히 `conformance_reviewer`와 `validate_network` 리포트가 담당한다([[validator-action]], [[network-publication]]).

## 공개 배포에서 관찰된 것

근거는 `docs/demo-checklist.md` §4([[browser-evidence-ledger]])이며, 위키 작성자가 라이브 세션을 본 것이 아니라 그 원장의 정제된 기록을 읽은 것이다.

- **HTTP 실측(자격 없는 GET)**: 공개 A의 `links.json`·`agent-manifest.json`이 저장소 판본과 바이트 단위로 같고, A·B 응답 모두 ACAO `*`·리다이렉트 없음이다. B의 `agent-manifest.json`·`spec_scout.network.json`은 200이다. 없는 경로(`links.json`, `review_desk.network.json`, 임의로 만든 없는 경로)는 `site-b/404.html` 덕분에 홈 페이지 200이 아니라 404다. Cloudflare Pages는 최상위 404.html이 없으면 없는 경로에 `index.html`을 200으로 돌려주므로, 이 파일이 정의·links 요청의 실패를 404로 드러나게 하는 이유다. 측정은 리비전 `298ce2bee1001e7186e7f5325975c063729881d5` 기준이다.
- **브라우저 흐름(수정 전 공개 run 2)**: Allow 전 B 요청 0건, Allow 뒤 B manifest·정의 200과 `links.json` 404, `remote_call spec_scout`, 호출자 Otari 라우터에서 도는 피어 모델, §3.2 인용이 있는 완성된 답이 관찰됐다. 캡처된 B GET 세 건에는 Cookie·Authorization·본문·`otk_`가 없다. 이는 그 세 요청에 한정된 관찰이며 범용 키 비노출 보장이 아니다.
- **옛 한계와 현재 코드**: 첫 공개 run 1은 피어가 도구 호출 마크업을 돌려줘 그 결과가 caller의 정상 tool 결과가 됐다. 현재 코드는 미실행 호출 표기만 남은 피어 답을 실패로 던지고 caller에게 오류 tool 결과로 보인다. 공개 run 1·2는 Allow 이벤트가 0건이었으나, 이제 결정마다 `consent` 이벤트가 남는다. 이 옛 관찰은 새 코드의 증거가 아니다.
- **수정 뒤 공개 관찰(원장 §6)**: `deadline-config` 착륙 뒤 공개 Edge(CDP)와 Firefox(BiDi) 각각에서 Allow → B 정의 fetch → 피어 답 → caller 최종 답이 끝까지 진행됐고 consent 이벤트와 trust 표시 `Allow once` 수가 1이었다고 기록돼 있다. 관찰된 B 요청에는 sentinel 키·Cookie·Authorization이 없었다. 개발용 loopback router와 임시 프로필의 loopback 접근 예외를 쓴 실행이며 기본 심사자 설정이 아니다. 두 피어 답 모두 모델 텍스트가 일부 깨져 있어 실행 완료와 답 품질은 별개이고 품질은 PASS가 아니다. 이전의 고정 90초 시간 초과는 실패 기록으로 남아 있다(그 한도 값이 원인이어서 네트워크 선언으로 바뀌었다).
- **미확인**: 인용 정확성, provider 헤더·본문, 독립 심사자 접근·영상·최종 제출. `lc.getunicorn.org` 요청은 두 브라우저에서 재현됐고 사용자 제공 환경 진단은 로컬 HTTPS 필터 탓이라 하지만 저장소 코드에는 없다.

주소를 바꿀 때 두 선언을 동시에 갱신하는 절차는 [[deployment-and-release]]에 있다. 로컬 브라우저 관찰(정확한 이름 로딩·거부된 origin·잘못된 이름 거부·caller router 유지·키 비전달)은 [[browser-evidence-ledger]]에 별도로 있다.

## 아직 확인하지 못한 것

- 실제 provider 요청 헤더·본문은 공개 실행에서도 직접 관찰되지 않았다.
- Site A 페이지의 "Audit Linked Peer" 프리셋과 "Ask Spec Scout" 초안 버튼은 `peerTargets`(`site-a/site.js`)가 `test`·`invalid`·`example` 호스트와 placeholder 문자열을 걸러내는 일반 규칙으로 켜진다. 예약 주소를 공개 주소로 바꾸는 데 코드 변경은 필요 없었고 `pages.dev` 주소는 걸러지지 않아 boot 뒤 활성 조건을 충족한다([[site-a-review-desk]]).
- 방문자가 런타임에서 링크를 직접 입력하는 경로(`onLinkRequired`)는 런타임 기능이며 이 배선의 테스트 대상이 아니다.

## 검증

`tests/peer.test.mjs`:

- production binding 테스트(첫 테스트)가 `links.json`의 정확한 내용을 단언한다. **공개 B 주소 문자열은 저장소 테스트에서 이 한 곳(`tests/peer.test.mjs`)에만** 있다. 같은 테스트가 키가 A manifest의 네트워크 이름과 같음, `allowed_peers`가 링크 목적지 origin 집합과 같음, `peer_policy`가 `{ mode: 'closed' }`, 링크 마지막 segment가 B 네트워크 이름과 같음도 확인한다.
- 나머지 production 설정 테스트는 주소를 `links.json`에서 읽어 쓴다. 허용 origin 판정(같은 origin의 다른 경로는 허용, 다른 호스트·접미사 위장 호스트·`http`·다른 포트는 거부)과 심볼릭 도구 테스트(동의·fetch URL을 링크 목적지에서 계산)가 그렇다. 주소를 바꾸면 이 한 곳과 두 JSON만 고치면 된다. 주소를 문자열로 박지 않는 합성 입력은 production 설정을 읽지 않는 `.invalid` 호스트를 쓴다(예: `https://review-desk.invalid/desk`).
- 동의 전 fetch 없음, 허용·거절·이름 불일치 세 시나리오(위 호출 순서).

`tests/smoke.test.mjs`는 A의 `allowed_peers`가 `links.json` 피어 URL의 origin과 같은지와 coordinator의 `tools`(`['conformance_reviewer', 'spec_scout']`)를 단언하고, `tests/validator.test.mjs`는 실제 A manifest·네트워크·`links.json`이 Review Desk 자체 규칙([[validator-rules]])을 통과하는지 확인한다. 실제 네트워크 접속은 검증하지 않는다. 저장소 수준의 로컬 배선·이름 일치는 [[conformance-cli]]가 `publication.links.*`로 따로 확인한다. [[testing-and-gate]].
