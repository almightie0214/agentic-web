---
description: 피어 참조를 부른 쪽 base로 한 번 풀어 정식 주소 하나로 정책·동의·순환·캐시·예산·읽기를 모두 처리하는 runtime 규칙과 게시 파일의 같은 출처·redirect 금지, 도구 별칭 충돌 방지
---

# 피어 목적지 규칙 (정식 주소 하나)

피어 길은 예전에 접촉 대상을 여러 번 따로 정했다. 그래서 방문자가 동의한 곳과 실제로 접촉하는 곳이 어긋날 수 있었다. 설계가 확인한 세 어긋남은 이렇다: ① 호출 쪽(`runner.js`)은 동의·순환·예산을 부른 쪽 base(`ctx.baseOrigin`)로 판단하는데 읽기는 최상위 사이트 base로 풀었다, ② manifest 항목의 `hocon`이 절대 주소면 그대로 읽어 동의받은 피어의 manifest가 제3자 주소를 적으면 동의 없이 접촉됐다, ③ manifest·정의·links의 fetch가 redirect를 따라갔다(명세 §5는 다른 출처로 가는 redirect를 새 목적지로 보라고 한다). 이 페이지는 현재 `site-a/runtime/`·`site-b/runtime/` 두 사본이 지키는 규칙을 적는다. 두 사본은 같은 변경을 받는다([[vendored-runtime]]). 피어 배선 자체는 [[peer-connection]], 시험 실행이 이 길을 재사용하는 방식은 [[editor-test-run]]에 있다.

## 규칙

**피어 참조는 부른 쪽 base로 한 번 풀어 정식 주소 하나를 만들고, 모든 판단과 읽기가 그 주소를 쓴다.**

- **한 번 풀기**: `kernel.js`의 `parseExternalAgent(ref, baseOrigin)`이 `/`로 시작하는 상대 참조를 부른 쪽 publication base(경로 접두사 포함) 아래의 이웃 네트워크로 풀고 `{ origin, agentName, url, toolPath }`를 낸다. base가 없으면 상대 참조는 `Relative peer reference requires a publication base.`로 거부된다. 현재 페이지 위치로 대신 푸는 길은 없다. 하위 경로에 올린 사이트에서도 같은 주소가 나오도록 문자열 이어 붙이기가 아니라 `URL` 해석을 쓴다.
- **그 주소를 쓰는 곳**: `runner.js`의 remote 분기는 `parsed.url`로 순환 키(`<origin>::<agentName>`), 제3자 판정(`requiresThirdPartyApproval`), 동의 카드 대상, 호출 예산 키를 만들고 같은 `targetUrl`을 `ctx.resolveRemote`에 넘긴다. `Engine.resolveRemote`(`engine.js`)는 이미 풀린 절대 주소만 받아 정책(`_assertAllowedPeer` → `manifestAllowsPeer`)·`RemoteRegistry.checkCycle`·캐시 조회·`fetchManifest`를 모두 같은 `origin`·`agentName`으로 한다. 최상위 base로 다시 해석하지 않는다. 정책은 직속 caller의 manifest로 판단한다(`_makeCtx`의 `resolveRemote`가 caller manifest를 넘긴다).
- **게시 파일은 그 출처에서만, redirect 없이**: `remote.js`의 `fetchPublished(url, { base, … })`가 대상 URL의 프로토콜·origin이 base와 다르면 `PUBLISHED_FETCH_POLICY`로 요청 전에 거부하고, `fetch`를 `redirect: "error"`로 부르며 `redirected`·`opaqueredirect`·3xx 응답도 `PUBLISHED_REDIRECT`로 거부한다. `fetchManifest`·`fetchText`·`Engine._loadPublishedLinks`가 모두 이 함수를 지난다. 그래서 manifest의 `hocon`이 다른 출처 절대 주소이면 그 출처로 요청이 가기 전에 실패한다. 선택 파일인 `links.json`도 정책·redirect 오류(`error.code`가 `PUBLISHED_`로 시작)는 삼키지 않고(`_loadPublishedLinks`), 404 같은 단순 부재만 빈 링크로 처리한다. 최상위 사이트 자신의 파일도 같은 함수로 읽으므로 같은 규칙을 받는다.
- **실패는 부른 네트워크에 알린다**: 거부는 호출 쪽 오류로 던져지고 `executeToolCalls`가 오류 tool 결과로 caller에 전한다([[runtime-execution-contract]]의 실패 경계). 정적 검사 규칙([[validator-rules]], [[url-audit]])은 바꾸지 않았다. 명세가 정의의 위치를 manifest에 맡기므로 다른 출처 `hocon`은 실행 때 오류로 알린다.

바뀌지 않은 것: 정책의 내용(`open`·`allowed_peers`·방문자가 입력한 링크 주소의 허용), 주소를 입력하면 그 사이트 manifest를 곧바로 읽는 동작(`resolveLink`의 `_normalizeLinkTarget`; 주소 입력이 요청이다), 같은 출처의 상대 `hocon`과 redirect 없는 게시. 두 번째 허용 목록이나 승인 장치는 없다. 다른 출처의 `hocon`을 다시 동의받아 읽는 일도 하지 않고 거부한다.

## 도구 별칭은 목적지와 별개다

경로가 다른 두 게시물(`/team1/helper`, `/team2/helper`)이 같은 마지막 이름을 가져도 모델이 보는 도구 이름이 충돌하면 안 된다. `parseExternalAgent`는 게시 네트워크 이름 `agentName`과 별개로 `toolPath`를 낸다(상대 참조는 쿼리·해시를 뗀 원문, 절대 참조는 pathname). `runner.js`의 `buildToolTable`은 `safeName(parsed.toolPath)`를 선호 이름으로 쓰되 `addTool`이 정화·절단 뒤 이미 쓰인 이름이거나 native 도구 이름(`render_cruse`, 최상위의 `website_*`)이면 `_2`, `_3` 접미사를 붙여 대상을 덮어쓰지 않는다.

이 분리는 리뷰에서 나왔다. 처음 수정은 도구 이름 자리에 게시 네트워크 이름만 반환하도록 바꿨고, 정화된 이름이 유일하다는 가정 때문에 서로 다른 경로의 피어 도구가 앞 대상을 덮어썼다. 지금은 대상 주소와 모델 별칭의 책임이 분리돼 있다.

## 검증과 한계

`tests/peer.test.mjs`의 A/B 공통 테스트가 규칙을 실제 `Engine`으로 확인한다: "runtime binds nested relative peers to the immediate publisher"(최상위 → B → B 상대 참조에서 동의 대상·정책·순환 키·읽는 주소가 B 아래 같은 주소), "runtime keeps peer tool aliases distinct from published network names", "runtime rejects foreign definition origins before contact", "runtime rejects publication redirects without following HTTP locations". 이 위키 작성 중 테스트를 실행하지는 않았다. 공개 배포에서는 Spec Scout 질문 흐름(Allow → B 정의 fetch → 최종 답)이 기존 그대로 끝까지 가는지를 원장 §9가 한 번 기록한다([[browser-evidence-ledger]]). 이는 정상 경로의 확인이며 거부 경로의 공개 실측은 아니다.
