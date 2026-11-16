---
description: tools/check-conformance.mjs가 두 사이트의 발행 파일을 정적으로 감사하는 방식 — 공유 규칙 재사용, publication.* 규칙, private-context 선언·CORS 설정 검사, slydata 샘플, 검사하지 않는 것
---

# 적합성 CLI (`tools/check-conformance.mjs`)

저장소 루트에서 `node tools/check-conformance.mjs`로 돌리는 정적 감사 도구다. `theora.gate.json`의 두 번째 명령이기도 하다([[testing-and-gate]]). 파일을 읽을 뿐 네트워크 fetch, 벤더 로더 실행, DOM·storage 모사, 모델 호출은 하지 않는다. 종료 코드는 `valid`가 참이면 0, 아니면 1이다. 내보내기는 `checkConformance({ root })`이며 `{ valid, checks }`를 돌려준다.

## 왜 규칙을 다시 만들지 않는가

manifest·네트워크의 정적 규칙은 `site-a/validator-rules.mjs`의 `validateNetwork`가 이미 갖고 있다([[validator-rules]]). CLI는 이 함수를 import해 실제 두 사이트(`site-a`, `site-b`)의 manifest·네트워크 항목마다 호출하고 결과를 `site`, `networkName`을 붙여 그대로 합친다. 같은 판정이 붙여넣기·action·URL 감사·CLI에서 갈라지지 않게 하려는 경계다. manifest 항목이 하나도 없거나 읽히지 않아도 `manifest.*` 규칙은 받도록 별도로 호출한다. CLI 고유로 더한 것은 파일·링크·선언 감사뿐이다.

`tests/conformance.test.mjs`가 실제 산출물의 CLI 결과 중 `publication.*`이 아닌 항목이 `validateNetwork`를 직접 부른 결과와 같은지(`deepEqual`) 확인한다.

## CLI 고유 검사 (`publication.*`)

| 규칙 ID | 확인하는 것 |
| --- | --- |
| `publication.file` | manifest·정의·links·`actions.module`·`_headers`가 사이트 루트 안의 읽을 수 있는 일반 파일(JSON이면 파싱 가능)인지. 절대 경로(`/...`), 원격 URL, `..`로 나가는 참조, 루트 밖으로 풀리는 symlink는 거부한다. 각 사이트는 독립 발행 루트이기 때문이다. `links.json`만 없을 수 있지만(`optional`: ENOENT만 허용) 깨진 JSON이나 끊어진 링크는 실패다 |
| `publication.name` | 한 manifest 안의 네트워크 이름이 중복되지 않는지 |
| `publication.links`, `publication.links.network` | `links.json`이 `version: 1`과 `networks` 맵을 갖고, 각 키가 정확히 발행된 네트워크 이름인지 |
| `publication.links.bindings`, `.slot`, `.target` | 네트워크의 `links`와 `links.json` 바인딩이 맵이고, 선언된 `link_slots`를 가리키며, URL의 마지막 segment가 **상대편 사이트 manifest**에 발행된 이름과 정확히 같은지. 원격 origin 실제 접속이나 로더 실행은 하지 않는다 |
| `publication.private_context` | 아래 절 |
| `publication.cors` | `site-b/_headers`가 공개 아티팩트에 `Access-Control-Allow-Origin: *`를 정확히 하나만 적용하는지. 아래 절 |

`actions.module`은 존재만 확인하고 import하지 않는다(발행자 코드를 CLI가 실행하지 않는다).

## private-context 선언 감사 (`inspectPrivateContext`)

에이전트별 `allow.to_downstream.sly_data` / `allow.to_upstream.sly_data` **선언**만 본다. 생략·`null`·빈 배열은 deny-by-default라 `pass`, 이름이 명시된 필드가 있으면 `warning`(하류·상류 공개를 따로 검토하라는 뜻), 와일드카드 `*`·문자열·중복·공백·비문자열·잘못된 모양은 `fail`이다. 네트워크 수준 `allow`는 레퍼런스 런타임이 상속하지 않으므로 경고한다. 발행된 `sly_data` 속성은 공개 JSON일 뿐 호출 컨텍스트 주입의 증거가 아니라는 경고를 내며, 값은 출력하지 않는다(테스트가 센티널 값이 리포트와 stdout에 없음을 확인). 선언이 유효해도 런타임 필터링·목적지 범위 제한은 입증되지 않는다.

## CORS 설정 감사 (`inspectCors`)

`_headers`를 줄 단위로 읽어 사이트 상대 경로 규칙(`*`, `:name` 자리표시 지원)만 해석하고 지원하지 않는 규칙·고아 헤더·잘못된 선언은 `fail`로 낸다. 발행된 각 아티팩트 경로(manifest와 매니페스트가 가리키는 정의, `links.json`이 있으면 그것)에 일치하는 **모든** 규칙을 합쳐, ACAO 선언이 `*` 하나뿐이고 `! Access-Control-Allow-Origin` 제거가 없을 때만 `pass`다. 중복 선언은 쓸 수 있는 와일드카드 응답 헤더가 아니라고 보고 실패시킨다. 이 검사는 로컬 설정 파일 검사이며 배포된 HTTPS 응답의 CORS 실측을 대신하지 않는다([[deployment-and-release]]).

## 샘플 `site-a/samples/test-slydata.network.json`

다른 검사기 샘플처럼 `{ manifest, network, links }` 입력 봉투다. 별도 발행 네트워크가 아니고 페이지의 샘플 버튼(`data-sample`)에도 연결돼 있지 않다. CLI는 이 파일에도 `validateNetwork`와 private-context 감사를 돌리고 모든 항목에 `sample` 문맥을 붙인다. 내용은 `context_probe`(`public_sentinel`만 `to_downstream`에 허용, `to_upstream` 빈 배열)가 `context_observer`에 위임하고 링크 `spec_scout` 피어를 부르는 무해한 구조이며 `private_sentinel`·`public_sentinel`은 비밀이 아닌 센티널 문자열이다.

`network.sly_data`는 런타임이 호출 컨텍스트로 쓰지 않는다. 실제 주입은 브라우저에서 기존 `Engine.runTurn(message, { slyData })` 옵션으로 하는 관찰 절차이며(`metadata.browser_observation`에 설정·주입·관찰·증거 한계 문장이 있다), 그 결과는 [[browser-evidence-ledger]]에서 다룬다. CLI용 브라우저 모사나 제품 토글은 만들지 않았다.

## 출력과 경계

각 항목은 `[status] site[/sample:…][/네트워크] ruleId path: message`로 출력되고 마지막 줄이 `Static repository conformance: PASS|FAIL`이다. 이 줄은 브라우저 동작, 정확한 이름의 로더 거부, 공개 HTTPS/CORS, 동의·키·라우터 격리·private context·사이클·실행 한도 집행이 **확인되지 않았음**을 매번 명시한다. 중복 agent 이름·잘못된 명시적 피어 이름이 로더에서 모델 호출 전에 거부되는지는 Node가 아니라 실제 브라우저에서 관찰할 대상이다. `runtime.*` 규칙은 `unverified`로 남으며 CLI는 이를 `pass`로 바꾸지 않는다.

## 테스트

`tests/conformance.test.mjs`: 실제 산출물 통과와 공유 리포트 보존, 작업 디렉터리와 무관한 실행, `fetch` 미호출, 샘플 검사, 손상·누락·중복·참조 이탈 등 실패 사례의 stdout·종료 코드 1, private-context 선언 표, CORS 규칙 표(주석뿐·범위 불일치·중복·제거·CRLF 등), 정의 참조의 루트 이탈, 선택적 `links.json`. 변조 사례는 두 사이트 파일을 임시 폴더에 복사해 그 복사본을 바꾼 뒤 CLI를 돌린다.
