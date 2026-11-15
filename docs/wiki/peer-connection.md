---
description: Site A coordinator가 links.json의 심볼릭 spec_scout 참조를 해석해 동의 후 Site B 네트워크를 A의 런타임에서 실행하는 피어 연결의 배선·정책·예약 주소·남은 미확인 사항
---

# 피어 연결 (Site A → Site B)

Site A의 `review_coordinator`는 스펙 질문을 받으면 `spec_scout`를 호출한다. 호출은 방문자 동의 뒤 Site B의 네트워크를 **A의 브라우저 런타임 안에서** 불러와 실행한다. B 쪽 서버 실행이나 B의 site action은 쓰지 않으며 B는 정보만 제공한다([[site-b-spec-scout]]).

## 선언이 맞물리는 곳

| 선언 | 파일 | 내용 |
| --- | --- | --- |
| 링크 바인딩 | `site-a/links.json` | `{"version":1,"networks":{"review_desk":{"spec_scout":"https://spec-scout.invalid/spec_scout"}}}` |
| 허용 출처 | `site-a/agent-manifest.json` | `allowed_peers: ["https://spec-scout.invalid"]`, `peer_policy.mode: closed` |
| 링크 슬롯과 도구 참조 | `site-a/review_desk.network.json` | 최상위 `link_slots: { spec_scout: {} }`, `review_coordinator.tools: ["conformance_reviewer", "spec_scout"]` |
| 피어 네트워크 이름 | `site-b/agent-manifest.json` | `networks[0].name: spec_scout` |

- **심볼릭 이름**: coordinator의 `tools`에 URL이 아니라 `spec_scout`라는 이름만 둔다. `Engine`(`site-a/runtime/engine.js`)이 `/links.json`을 사이트 base에서 읽어 `links.networks[<네트워크 이름>]`을 `config.links`에 합치고, `buildToolTable`이 이를 `{ kind: 'link', reference: 'spec_scout' }`로 만든다. 도구를 광고하는 것만으로는 B에 접속하지 않는다. 스펙상 발행자는 `links.json`으로 기본 바인딩을 소유하고, 런타임에서 방문자가 넣은 바인딩은 호출자 소유이며 발행자 파일을 바꾸지 않는다.
- **URL 규칙**: 피어 URL의 마지막 segment가 네트워크 이름이고 그 앞 경로가 manifest가 놓인 site base다. B는 root에 배포하므로 `https://spec-scout.invalid/agent-manifest.json`이다. 프로토콜이 모든 사이트에 origin root를 강제하는 것은 아니며 경로 prefix가 있는 base도 가능하다(테스트가 `agents/spec_scout`도 같은 origin이면 허용됨을 확인한다).
- **예약 주소**: `.invalid`는 예약된 최상위 도메인이라 실제 서비스와 겹치지 않는다. 아직 확정되지 않은 단계에서 문서용 표기를 그대로 두지 않으려고 유효한 URL 형식의 예약 주소를 쓴다. 따라서 이 배선은 구현되어 있지만 실제 접속 가능한 대상은 아직 없다.
- **허용 출처와 링크는 한 쌍이다.** `manifestAllowsPeer`는 닫힌 정책에서 `allowed_peers`의 origin(스킴·호스트·포트)과 정확히 일치할 때만 허용한다. 실제 URL을 확정·변경하면 `site-a/links.json`과 `allowed_peers`를 함께 고쳐야 한다. 한쪽만 바꾸면 테스트가 실패한다. `links.json`만 바꾸라는 안내는 틀린 설명이다.

## 호출 순서

`tests/peer.test.mjs`가 실제 `Engine`·`buildToolTable`·`dispatchToolCall`로 확인하는 순서:

1. coordinator의 도구 표에서 `spec_scout`는 `link` 종류이고 `network.getLink('spec_scout')`가 `<B root>/spec_scout`로 해석된다.
2. 호출 시 **동의가 먼저**다. `engine.onConsent`가 호출되기 전에 B로 가는 fetch는 없고, 동의 정보의 `peerOrigin`은 `spec-scout.invalid`, `requestText`는 질문 그대로다. 사이트 코드가 동의를 주장하지 않고 런타임이 방문자에게 묻는다(coordinator instructions도 이를 명시).
3. 허용되면 `agent-manifest.json` → `spec_scout.network.json` → `links.json` 순으로 가져온다. B에는 `links.json`이 없어 404다. 피어 세션의 `base`는 B root이고 라우터(`llm.baseUrl`)는 호출자 것을 상속한다(테스트가 단언). 사용자 키가 B에 가지 않는다는 것은 스펙 §4의 요구이며, 이 테스트는 키 격리를 검사하지 않는다.
4. 거절하면 B로 가는 요청이 없고 "user declined to contact …" 결과를 돌려준다. manifest에 정확히 일치하는 이름이 없으면(`other`로 바꾼 시나리오) `No published network named 'spec_scout'`로 실패하며 다른 네트워크를 고르지 않는다.
5. 피어의 agent는 도구가 없다(`tools` 빈 배열). 테스트는 모델 호출만 스크립트로 대체하고 로딩·검증·실행 경로는 실제 산출물과 런타임을 쓴다. 첫 system 메시지는 B 네트워크 instructions와 같다.

coordinator instructions는 피어 결과를 요약할 때 출처 절·판본·근거 한계를 보존하고 그 설명을 적합성 보고서로 취급하지 않으며, 거절·불가 시 피어 답을 지어내지 않도록 한다. 적합성 질문은 여전히 `conformance_reviewer`와 `validate_network` 리포트가 담당한다([[validator-action]], [[network-publication]]).

## 아직 확인하지 못한 것

- 실제 B 배포 URL, Cloudflare Pages `_headers`의 CORS, 라이브 동의 UI, 실제 provider로의 상호운용은 확인되지 않았다. `README.md`도 이를 미확인으로 구분한다. 실제 URL 확정과 두 선언의 동시 갱신은 후속 단계(AW4)의 몫이다.
- Site A 페이지의 "Audit Linked Peer" 프리셋과 "Ask Spec Scout" 초안 버튼은 `.invalid` 호스트를 placeholder로 보고 비활성이다(`site-a/site.js`의 `peerTargets`; [[site-a-review-desk]]). 실제 주소로 바꾸면 활성 조건이 달라진다.
- 방문자가 런타임에서 링크를 직접 입력하는 경로(`onLinkRequired`)는 런타임 기능이며 이 배선의 테스트 대상이 아니다.

## 검증

`tests/peer.test.mjs`:

- `links.json`의 정확한 내용, 키가 A manifest의 네트워크 이름과 같음, `allowed_peers`가 링크 목적지 origin 집합과 같음, `peer_policy`가 `{ mode: 'closed' }`, 링크 마지막 segment가 B 네트워크 이름과 같음.
- 허용 origin 판정: 같은 origin의 다른 경로는 허용, 다른 호스트·접미사 위장 호스트·`http`·다른 포트는 거부.
- 동의 전 fetch 없음, 허용·거절·이름 불일치 세 시나리오(위 호출 순서).

`tests/smoke.test.mjs`는 A의 `allowed_peers`와 coordinator의 `tools`(`['conformance_reviewer', 'spec_scout']`)를 단언하고, `tests/validator.test.mjs`는 실제 A manifest·네트워크·`links.json`이 Review Desk 자체 규칙([[validator-rules]])을 통과하는지 확인한다. 실제 네트워크 접속은 검증하지 않는다. [[testing-and-gate]].
