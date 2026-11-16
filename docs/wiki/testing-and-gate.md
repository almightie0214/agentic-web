---
description: theora.gate.json의 두 명령(node --test glob, 적합성 CLI)과 npm test, smoke·peer·conformance·validator·actions·audit·desk-ui·converter 테스트가 검사하는 범위와 검사하지 않는 것
---

# 검사: gate와 테스트 파일

## 명령

- `theora.gate.json`: commands에 `node --test tests/**/*.test.mjs`와 `node tools/check-conformance.mjs` 두 명령(배열 인자 형태)을 두고 timeout은 `5m`이다. 두 번째는 [[conformance-cli]]이며 실패 시 종료 코드 1이다.
- `package.json`의 `scripts.test`: `node --test "tests/**/*.test.mjs"`. gate 첫 명령과 같은 glob이다(CLI는 포함하지 않는다). npm 의존성은 없고 Node.js 24를 쓴다(`README.md`).
- `tests/` 디렉터리 자체를 인자로 쓰지 않는다. 아직 없는 후속 산출물은 현재 검사 조건으로 삼지 않는다. 검사 기능 테스트(`tests/validator.test.mjs` 등)도 같은 glob에 포함된다.

## `tests/smoke.test.mjs`

두 사이트를 같은 조건으로 검사하는 `runtimeTest(name, check)` 헬퍼가 A/B 테스트를 하나씩 생성한다.

사이트 A 전용:
- manifest·네트워크: 2-agent 구성, `front_man ∈ tools`, 위임 관계, resolved(미해결 지시어 없음), 라우터·모델 기본값, `actions` 선언(`validate_network`), `AgentNetwork`/`validateNetwork` 통과. 스크립트된 모델로 coordinator → reviewer → action 배선도 확인한다. [[network-publication]], [[validator-action]]
- `Engine`이 하위 경로(`https://example.test/agentic-web/site-a`)에서 상대 아티팩트만 가져오는지, manifest/네트워크 404·잘못된 JSON·잘못된 그래프에서 거부하는지.
- `site.js` boot 중 숨김 유지, 성공 시 표시, 실패 시 alert. 2-agent 구성은 coordinator `tools`에 `spec_scout` 링크 참조가 더해진 `['conformance_reviewer', 'spec_scout']`를 단언하고 manifest `allowed_peers`가 `links.json` 피어 URL의 origin과 같은지도 확인한다(주소 문자열을 따로 박지 않는다). [[site-a-review-desk]], [[peer-connection]]

## 검사 기능 테스트(Site A)

- `tests/validator.test.mjs`: 픽스처 사전조건(`fixtures:`)과 규칙 판정(`rules:`), 샘플 파일이 픽스처와 같은 리포트를 내는지(`samples:`). 형식이 틀린 입력, 스키마 방언, resolved 의존, 참조 무결성, 명명된 링크, 합성·실행 상한 경계를 다룬다. [[validator-rules]], [[fixtures-and-samples]]
- `tests/actions.test.mjs`: action 등록 메타데이터·입력 스키마, 영수증과 규칙 리포트의 동일성, 잘못된 인자와 JSON 오류 처리. [[validator-action]]
- `tests/audit.test.mjs`: 대체 `fetchImpl`로 하위 경로 보존, 공개 GET 한정, 획득 실패와 규칙 위반 분리. [[url-audit]]
- `tests/desk-ui.test.mjs`: 최소 DOM에서 실제 `site-a/site.js`를 실행해 키 없는 경로, 오래된 결과 무효화, 프리셋, 초안, 런타임 그래프를 확인. [[site-a-review-desk]]

## 공통·사이트 B 검사

A/B 공통(`runtimeTest`): 진입 파일·라이선스 존재, runner 선택 계약, 명시적 `mock_router`만 사용, `confirmText` 검증(직접 정규화·JSON·fenced 응답·welcome), BYOK가 현재 설정만 쓰는지(옛 슬롯 접근 부재, 프로필/탭 우선순위, 저장 실패 시 정리), 옛 activity 슬롯 비처리. 이들은 [[no-compat-code-lessons]]의 회귀 검사다.

Site B 전용(`smoke.test.mjs`의 Site B boot 검사): 실제 manifest·네트워크 로딩과 UI 마운트, instructions 무변경 사용, 요청이 런타임 메타데이터뿐(발췌 원본·모델 호출 없음), 설정 우선순위, 채팅 활성, URL 키 제거, manifest·네트워크·JSON·그래프·런타임 실패 표시. [[site-b-spec-scout]]

## `tests/peer.test.mjs` (피어 연결)

`node --test` glob에 포함되는 테스트로, 두 사이트의 실제 JSON 산출물과 레퍼런스 런타임을 읽는다. 검사 범위: A의 `links.json`·`allowed_peers`·`peer_policy` 정합(공개 B 주소 문자열은 production binding 테스트 한 곳에서만 단언하고 나머지 production 설정 테스트는 주소를 `links.json`에서 읽는다), 닫힌 정책의 origin 판정, 동의가 선행하는 허용·거절·이름 불일치 시나리오(모델 호출만 스크립트), B manifest의 정확한 네트워크 이름·action 부재, 발췌 저작 원본과 네트워크 instructions의 포함 검사, B 네트워크의 1-agent 구조. [[peer-connection]], [[site-b-spec-scout]]

## `tests/conformance.test.mjs` (적합성 CLI)

`checkConformance()`와 실제 CLI 프로세스(`spawnSync`)를 실제 산출물과 임시 격리 복사본에 돌린다: 공유 규칙 리포트 보존, `fetch` 미호출, `test-slydata` 샘플, 파일·링크·이름·참조 이탈 실패 사례, private-context 선언, CORS 규칙 병합, 사이클 불확실·상한 경고. 센티널 값이 출력에 없음도 확인한다. [[conformance-cli]]

## `tests/converter/` (변환기)

glob `tests/**/*.test.mjs`가 하위 디렉터리를 포함하므로 `tests/converter/fixtures/integrity.test.mjs`·`parse.test.mjs`·`emit.test.mjs`·`e2e.test.mjs`·`web.test.mjs`도 같은 명령에서 돌아간다. 각 파일의 범위와 AW2·AW4 정적 검사 연계, 리뷰 교훈은 [[converter-verification]]에 있다. e2e는 저장소의 .theora 개발 영역 아래 임시 작업공간을 쓰고 지운다. 실제 브라우저 로드와 모델 동작은 이 테스트가 증명하지 않는다.

## `tests/peer.test.mjs`의 배포 설정 검사

`site-b/_headers`에 `/*` ACAO `*`가 있고 credentials 허용이 없음, `site-b/404.html`이 스크립트·인라인 이벤트 없는 최상위 페이지임, `.github/workflows/pages.yml`이 존재하고 `upload-pages-artifact`의 `path`가 `site-a`임을 정규식으로 확인한다. 설정 문자열 검사일 뿐 배포 활성화·공개 응답은 확인하지 않는다. [[deployment-and-release]]

## 한계

테스트는 DOM·storage·fetch를 최소 대체물로 흉내 내어 실제 런타임 코드를 실행한다. 실제 provider 호출, 실제 브라우저 세션, 배포된 CORS/호스팅은 검증하지 않는다(`README.md` Tests 절). 브라우저 동작은 사용자가 실행한 로컬 관찰이 [[browser-evidence-ledger]]에 따로 기록돼 있으며 Node 검사가 그것을 대체하지 않는다. 런타임 smoke 테스트에는 중복 agent 이름 거부(`network rejects duplicate names after config filtering`)와 프로필이 쿠키를 읽거나 쓰지 않음(`profiles stay in localStorage without cookie access`) 회귀 검사도 있다.
