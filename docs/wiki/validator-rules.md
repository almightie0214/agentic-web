---
description: site-a/validator-rules.mjs의 validateNetwork 계약, 규칙 ID 묶음, valid 판정 기준, 런타임 재사용 경계와 리뷰에서 얻은 교훈
---

# 검사 규칙 모듈 (`validateNetwork`)

Review Desk의 모든 판정은 `site-a/validator-rules.mjs` 한 곳에서 나온다. 붙여넣기 검사(`site-a/site.js`), 사이트 action([[validator-action]]), URL 감사([[url-audit]])가 같은 함수를 부르므로 입력 경로가 달라도 같은 입력이면 같은 리포트가 나온다. 설계 이유: "규칙이 판정하고 에이전트는 설명만 한다."

## 계약

`validateNetwork(input)` → `{ valid, checks }`. 이미 파싱된 JSON만 받고 fetch·에이전트 실행·입력 변경을 하지 않는다(`tests/validator.test.mjs`가 `fetch`를 막아 두고 입력 불변과 결정성을 단언한다).

- 입력: `manifest`, `network`(resolved JSON), 선택 `links`(links.json), `networkName`(manifest의 정확한 이름 선택. 없으면 첫 항목이며, 요청한 이름이 없으면 다른 항목으로 대체하지 않는다), `baseUrl`(배포 사이트 base — 하위 경로 포함, 정의 URL이 아님), `activePeerChain`(현재 활성 조상 피어 네트워크 URL 배열).
- 각 check: `ruleId`, `status`(`pass` | `fail` | `warning` | `unverified`), `path`(입력에 대한 JSON Pointer), `message`, `hint`(pass면 빈 문자열).
- `valid`: 실패가 없고, `warning`은 허용하며, `unverified`는 `runtime.*` 규칙일 때만 허용한다. 즉 지원하지 않는 `$schema` 방언 같은 미확인 스키마는 `valid`를 막는다. `valid: true`는 정적 검사 통과일 뿐 실제 호스팅·CORS·동의·순환 중단의 증거가 아니다.
- 잘못된 입력 구조(배열이어야 할 자리에 객체, 문자열이어야 할 이름 자리에 객체 등)는 예외가 아니라 실패 check로 돌려준다.

## 규칙 묶음

| 묶음 | 규칙 ID | 내용 |
| --- | --- | --- |
| manifest | `manifest.networks`, `manifest.name`/`front_man`/`hocon`, `manifest.selection` | 발행 네트워크 존재, 필수 문자열, 정확한 이름 선택 |
| 네트워크 | `network.document`, `network.description`, `network.tools`, `network.front_man.exists`, `network.front_man.selected`, `network.config` | metadata.description, front_man이 tools에 존재하고 레퍼런스 런타임의 진입 에이전트 선택과 일치, 설정 처리 실패 |
| identity | `network.identity.name`, `network.identity.front_man` | manifest가 이름을 공급하고, 중복 선언(`network.name`, `network.front_man`)은 일치해야 함 |
| 에이전트 | `agent.name`, `agent.description`, `agent.parameters` | 고유한 비어 있지 않은 이름, `function.description`, 선언된 parameters의 스키마 구조 |
| resolved | `network.resolved` | include/`$env`/치환 의존 금지 |
| 참조 | `agent.tools`, `tool.local`, `tool.mcp`, `tool.link`, `tool.peer.url` | tools 배열, 로컬 에이전트·MCP 서술자·명명된 링크·직접 피어 URL |
| 합성 | `peer.base`, `peer.chain`, `peer.composition` | 활성 피어 체인 재진입 |
| 실행 상한 | `execution.limit` | `max_steps`·`max_execution_seconds` 미선언은 `warning`, 선언된 잘못된 값은 `fail` |
| 미확인 | `runtime.composition`, `runtime.safety` | 항상 `unverified`를 내어 정적 입력으로 알 수 없는 것을 구분 |

## 핵심 판단과 이유

- **parameters 생략은 통과다.** 없으면 런타임이 `request:string` 기본 스키마를 적용하므로 `agent.parameters`가 기본 적용 pass를 낸다(`schemaFor`, `site-a/runtime/runner.js`와 대조 — `tests/validator.test.mjs`). 선언했는데 무효인 스키마만 실패한다. 스키마 검사(`inspectSchema`)는 Draft 4/6/7/2019-09/2020-12의 키워드 구조만 보며 인스턴스 검증기가 아니다. `$schema`가 없으면 2020-12로 간주하고, 공식 식별자 밖의 방언은 `unverified`로 두며, `$ref` 대상은 가져오지 않는다.
- **자유 텍스트의 `${...}`는 허용한다.** `inspectResolved`는 설정 위치만 본다. `instructions`·`command`(런타임이 system 프롬프트로 쓰는 필드)와 description·metadata·parameters 등은 리터럴로 취급한다. 반면 `commondefs`의 `replacement_strings`·`replacement_values`가 실제 값을 바꾸면 리터럴 필드여도 실패다. `include`/`$include`/`$env` 키도 실패다(단, `link_slots`·`links`·`link_labels`의 이름 키는 제외).
- **합성 사이클은 활성 피어 체인 재진입만 뜻한다.** 내부 agent의 상호 참조·재귀·반복 호출은 합법이며 사이클로 보지 않는다. 판정은 레퍼런스 `RemoteRegistry.checkCycle`(`site-a/runtime/remote.js`)을 재사용한다. 입력으로 `activePeerChain`을 받거나, `baseUrl`이 있으면 자신의 피어 URL로 되돌아오는 선언된 hop을 진단한다. 도달 가능한 에이전트(front_man에서 시작)의 피어 hop만 대상이다. 실제 브라우저가 호출을 중단하는지는 이 규칙이 입증하지 않는다(`runtime.composition`이 미확인으로 남김).
- **명명된 링크와 직접 피어 참조는 소비 계약이 다르다.** 직접 참조는 `/`로 시작하는 루트 상대 경로를 `baseUrl` 기준으로 해석할 수 있지만, `network.links`와 `links.json`의 `networks[이름]` 바인딩은 완전한 절대 URL이어야 한다(`Engine.prototype.resolveLink`와 대조한 테스트). 명명된 링크는 `network.link_slots`에 선언되어 있어야 하며 두 출처의 바인딩을 합쳐 쓴다.
- 피어 URL은 HTTPS(개발용 loopback만 HTTP)이고 경로가 정확한 발행 네트워크 이름으로 끝나야 한다. 사이트 base나 로컬 파일 경로는 실패다.

## 교훈(리뷰 지적에서)

1. 런타임 호출 경계 전체를 보호한다. 진입 에이전트 선택에서 `filterConfig`/`find_front_man` 설정 치환 오류가 예외로 새어 나갔고, 호출 경계를 감싸 `network.config` 실패 check로 바꿨다.
2. 판정은 소비하는 런타임의 계약과 일치해야 한다. `command`를 리터럴로 분류하지 않아 오탐이 났고, 상대 URL 해석을 명명된 링크에까지 적용해 실행 불가능한 바인딩이 통과했다. 둘 다 `runner.js`·`resolveLink`와 대조해 고쳤다.
3. 형식이 틀린 필드를 키로 쓰지 않는다. `manifest.name`이 비문자열이어도 `links.networks[name]` 조회에서 예외가 나지 않도록 `text()` 검증 뒤에만 키로 쓴다. 같은 가정이 UI의 표시 경계에서도 깨졌다 — [[site-a-review-desk]].

픽스처와 샘플 입력은 [[fixtures-and-samples]]에서 설명한다.
