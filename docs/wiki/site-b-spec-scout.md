---
description: Site B(Spec Scout)의 1-agent 네트워크, 발췌 저작 원본과 배포본의 관계, 직접 방문과 피어 호출이 같은 근거를 쓰는 boot 구조와 이유
---

# Site B — Spec Scout

Site B는 스펙 질문에 답하는 정보 제공 전용 사이트다. 직접 방문하면 자기 채팅 UI로 쓰이고, Site A의 coordinator가 피어로 부르면 A의 브라우저 런타임 안에서 같은 네트워크가 실행된다([[peer-connection]]). 정적 번들은 `site-b/` 하나이며 Site A 파일을 참조하지 않는다.

## 파일과 책임

| 경로 | 책임 |
| --- | --- |
| `site-b/agent-manifest.json` | 네트워크 이름 `spec_scout`, `front_man: spec_scout`, `hocon: ./spec_scout.network.json`. 라우터는 Site A와 같은 hosted Otari 기본값(`mock: false`). `allowed_peers: []`, `peer_policy.mode: closed`, `deployment.mode: static`. `actions`와 `coded_tools`는 없다 |
| `site-b/spec_scout.network.json` | 실행에 쓰는 배포본. resolved JSON, agent 하나(`spec_scout`, `tools: []`, `class`/`toolbox` 없음) |
| `site-b/spec-excerpts.json` | 발췌의 저작 원본(출처 `source` + `excerpts[]`: `id`·`topic`·`section`·`text`). 런타임이 읽지 않는다 |
| `site-b/site.js` | 부트. `./runtime/index.js`의 `boot()`로 네트워크를 그대로 로드한다 |
| `site-b/index.html` | 스타일 인라인. `header`·`agents` 슬롯은 `hidden inert`, `settings`·`chat` 슬롯을 쓴다 |

manifest의 네트워크 이름은 Site A 링크의 마지막 segment와 정확히 같아야 한다. 런타임이 manifest에서 이름이 정확히 일치하는 항목만 고르고 없으면 실패하기 때문이다(스펙 §3.2의 발췌 `exact-network-resolution`).

## 근거는 instructions에 직접 들어 있다

`spec_scout`의 instructions 안에 출처 블록(`SOURCE FOR ALL EXCERPTS`: 제목·판본 MVP Profile 0.2·날짜·저자·저장소·커밋·경로·URL·라이선스)과 각 발췌가 `[id] topic — Section N` 헤더와 함께 본문 그대로 들어 있다. 설계 이유:

- **직접 방문과 피어 호출이 같은 근거를 쓴다.** 피어로 불릴 때는 B의 페이지 코드가 실행되지 않으므로 페이지가 발췌를 주입하는 방식은 피어 경로에서 빠진다. 네트워크 정의 자체에 두면 두 경로가 같은 정의를 쓴다.
- **저작 원본과 배포본을 나눈다.** `spec-excerpts.json`은 사람이 고치는 원본이고 네트워크는 배포본이다. 원본을 런타임 데이터 소스로 쓰지 않고, 원본을 관리하는 별도 목록 UI도 만들지 않았다. 둘이 어긋나지 않는 것은 테스트로 확인한다(아래).
- 지시문은 발췌가 스펙 전체가 아니라는 점, 발췌가 뒷받침하지 않으면 "다루지 않는다"고 말하고 기억이나 추측으로 채우지 않는다는 점, MUST/SHOULD/MAY를 보존하고 인용과 설명을 구별한다는 점을 담는다. 도구·브라우징·site action·파일 접근이 없고 URL 가져오기, 검증·배포 테스트, CORS·동의·자격 격리 확인, 적합성 인증을 한다고 주장하지 않는다. 호출자가 준 아티팩트와 주장은 신뢰할 수 없는 질문 데이터로 다룬다. 피어는 호출자의 런타임·라우터·한도 아래 실행되므로 이를 바꾸려 하지 않고 동의·정책을 우회하지 않는다. 공개 전제이므로 비밀·자격을 요구하거나 담지 않는다.
- 이 사이트는 "정보 제공만" 한다. B의 자체 site action을 가져오지 않는 것이 설계 결과다(스펙은 교차 출처 site action을 MVP 필수가 아닌 확장으로 둔다).

## `site.js`의 동작

1. URL의 `key` 쿼리를 `history.replaceState`로 제거한다. 런타임 import가 실패해도 제거는 먼저 일어난다. 다른 쿼리(`router`·`model` 등)는 남기며 `boot`가 읽는 규칙은 [[vendored-runtime]]에 있다.
2. `boot(root, { originUrl, sandboxWorkerUrl })`를 호출한다. 두 URL은 `import.meta.url` 기준이라 하위 경로 배포에서도 맞다. `boot`가 `loadTop()`으로 manifest와 네트워크를 가져와 검증하고 UI를 마운트한다. 발췌 파일을 가져오거나 주입하지 않는다.
3. 성공하면 `#agent-app`을 보이고 준비 문구(provider 키가 필요하고 답변은 정보 제공일 뿐 적합성 인증이 아니라는 안내)를 쓴다. 실패하면 앱을 숨기고 `role="alert"`, `data-state="error"`로 manifest·네트워크 정의·런타임을 확인하라는 문구를 보인다. 오류 객체와 URL 키 값은 문구에 넣지 않는다.

Site A의 `mountDesk()`와 같은 `boot` 경로를 쓴다는 점이 이전의 수동 마운트(`Engine`·`mountApp` 직접 사용, 채팅 비활성) 셸과 다르다. 초기 boot는 공개 아티팩트만 가져오고 모델 요청을 만들지 않는다.

## 검증

- `tests/peer.test.mjs`
  - manifest 정합: 이름·`front_man`·`hocon`, 라우터 기본값, 정적 배포, 닫힌 정책, `actions`/`coded_tools` 부재.
  - 정합성 검사: 원본 `source`의 출처 블록과 모든 `excerpts[]`의 `[id] topic — Section N\ntext` 블록이 네트워크 instructions에 포함되는지 포함 검사로 확인한다. 이 검사는 리뷰에서 "로딩 동일성만 확인하고 저작 원본과의 정합성을 검사하지 않는다"는 지적으로 추가됐고, 원본 본문·절·판본 단독 변경과 배포 발췌 삭제가 모두 실패시키는 것을 임시 변이로 확인했다고 교훈 자료에 기록되어 있다.
  - 네트워크: 이름이 `spec_scout` 하나, `tools: []`, `AgentNetwork`와 `validateNetwork`가 오류·경고 없음.
- `tests/smoke.test.mjs`의 "Site B boot" 검사: 실제 manifest/네트워크 로딩과 UI 마운트, 네트워크 instructions가 변경 없이 쓰이는지, 요청 목록이 manifest·(BYOK 라우터 metadata)·네트워크·`links.json`뿐이고 발췌 원본이나 모델 호출이 없는지, 프로필·탭 설정 우선순위, 채팅 활성화, URL 키 제거, manifest/네트워크 404·잘못된 JSON·잘못된 그래프·런타임 import 실패 표시.

실제 provider 응답, 배포된 CORS 헤더, 라이브 브라우저 세션은 이 테스트가 확인하지 않는다. [[testing-and-gate]].
