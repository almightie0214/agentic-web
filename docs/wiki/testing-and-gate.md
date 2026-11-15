---
description: theora.gate.json과 npm test의 동일한 glob 명령, tests/smoke.test.mjs가 실제로 검사하는 범위와 검사하지 않는 것
---

# 검사: gate와 smoke 테스트

## 명령

- `theora.gate.json`: commands에 `node --test tests/**/*.test.mjs` 명령 하나(배열 인자 형태)를 두고 timeout은 `5m`이다.
- `package.json`의 `scripts.test`: `node --test "tests/**/*.test.mjs"`. gate와 같은 glob이다. npm 의존성은 없고 Node.js 24를 쓴다(`README.md`).
- `tests/` 디렉터리 자체를 인자로 쓰지 않는다. 아직 없는 후속 산출물은 현재 검사 조건으로 삼지 않는다. 설계는 이후 단계에서 적합성 검사 명령을 추가한다고 계획했으며 현재 gate에는 없다.

## `tests/smoke.test.mjs`

한 파일에 모두 있다. 두 사이트를 같은 조건으로 검사하는 `runtimeTest(name, check)` 헬퍼가 A/B 테스트를 하나씩 생성한다.

사이트 A 전용:
- manifest·네트워크: 2-agent 구성, `front_man ∈ tools`, 위임 관계, resolved(미해결 지시어 없음), 라우터·모델 기본값, `AgentNetwork`/`validateNetwork` 통과. [[network-publication]]
- `Engine`이 하위 경로(`https://example.test/agentic-web/site-a`)에서 상대 아티팩트만 가져오는지, manifest/네트워크 404·잘못된 JSON·잘못된 그래프에서 거부하는지.
- `site.js` boot 중 숨김 유지, 성공 시 표시, 실패 시 alert. [[site-a-review-desk]]

A/B 공통(`runtimeTest`): 진입 파일·라이선스 존재, runner 선택 계약, 명시적 `mock_router`만 사용, `confirmText` 검증(직접 정규화·JSON·fenced 응답·welcome), BYOK가 현재 설정만 쓰는지(옛 슬롯 접근 부재, 프로필/탭 우선순위, 저장 실패 시 정리), 옛 activity 슬롯 비처리. 이들은 [[no-compat-code-lessons]]의 회귀 검사다.

Site B 전용: 셸 마운트, fetch 없음, 설정 우선순위, 채팅 비활성, URL 키 제거, 런타임 로드 실패 표시. [[site-b-spec-scout-shell]]

## 한계

테스트는 DOM·storage·fetch를 최소 대체물로 흉내 내어 실제 런타임 코드를 실행한다. 실제 provider 호출, 실제 브라우저 세션, 배포된 CORS/호스팅은 검증하지 않는다(`README.md` Tests 절).
