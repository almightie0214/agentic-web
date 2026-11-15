---
description: theora.gate.json과 npm test의 동일한 glob 명령, smoke·validator·actions·audit·desk-ui 테스트 파일이 검사하는 범위와 검사하지 않는 것
---

# 검사: gate와 테스트 파일

## 명령

- `theora.gate.json`: commands에 `node --test tests/**/*.test.mjs` 명령 하나(배열 인자 형태)를 두고 timeout은 `5m`이다.
- `package.json`의 `scripts.test`: `node --test "tests/**/*.test.mjs"`. gate와 같은 glob이다. npm 의존성은 없고 Node.js 24를 쓴다(`README.md`).
- `tests/` 디렉터리 자체를 인자로 쓰지 않는다. 아직 없는 후속 산출물은 현재 검사 조건으로 삼지 않는다. 검사 기능 테스트(`tests/validator.test.mjs` 등)도 같은 glob에 포함된다.

## `tests/smoke.test.mjs`

두 사이트를 같은 조건으로 검사하는 `runtimeTest(name, check)` 헬퍼가 A/B 테스트를 하나씩 생성한다.

사이트 A 전용:
- manifest·네트워크: 2-agent 구성, `front_man ∈ tools`, 위임 관계, resolved(미해결 지시어 없음), 라우터·모델 기본값, `actions` 선언(`validate_network`), `AgentNetwork`/`validateNetwork` 통과. 스크립트된 모델로 coordinator → reviewer → action 배선도 확인한다. [[network-publication]], [[validator-action]]
- `Engine`이 하위 경로(`https://example.test/agentic-web/site-a`)에서 상대 아티팩트만 가져오는지, manifest/네트워크 404·잘못된 JSON·잘못된 그래프에서 거부하는지.
- `site.js` boot 중 숨김 유지, 성공 시 표시, 실패 시 alert. [[site-a-review-desk]]

## 검사 기능 테스트(Site A)

- `tests/validator.test.mjs`: 픽스처 사전조건(`fixtures:`)과 규칙 판정(`rules:`), 샘플 파일이 픽스처와 같은 리포트를 내는지(`samples:`). 형식이 틀린 입력, 스키마 방언, resolved 의존, 참조 무결성, 명명된 링크, 합성·실행 상한 경계를 다룬다. [[validator-rules]], [[fixtures-and-samples]]
- `tests/actions.test.mjs`: action 등록 메타데이터·입력 스키마, 영수증과 규칙 리포트의 동일성, 잘못된 인자와 JSON 오류 처리. [[validator-action]]
- `tests/audit.test.mjs`: 대체 `fetchImpl`로 하위 경로 보존, 공개 GET 한정, 획득 실패와 규칙 위반 분리. [[url-audit]]
- `tests/desk-ui.test.mjs`: 최소 DOM에서 실제 `site-a/site.js`를 실행해 키 없는 경로, 오래된 결과 무효화, 프리셋, 초안, 런타임 그래프를 확인. [[site-a-review-desk]]

## 공통·사이트 B 검사

A/B 공통(`runtimeTest`): 진입 파일·라이선스 존재, runner 선택 계약, 명시적 `mock_router`만 사용, `confirmText` 검증(직접 정규화·JSON·fenced 응답·welcome), BYOK가 현재 설정만 쓰는지(옛 슬롯 접근 부재, 프로필/탭 우선순위, 저장 실패 시 정리), 옛 activity 슬롯 비처리. 이들은 [[no-compat-code-lessons]]의 회귀 검사다.

Site B 전용: 셸 마운트, fetch 없음, 설정 우선순위, 채팅 비활성, URL 키 제거, 런타임 로드 실패 표시. [[site-b-spec-scout-shell]]

## 한계

테스트는 DOM·storage·fetch를 최소 대체물로 흉내 내어 실제 런타임 코드를 실행한다. 실제 provider 호출, 실제 브라우저 세션, 배포된 CORS/호스팅은 검증하지 않는다(`README.md` Tests 절).
