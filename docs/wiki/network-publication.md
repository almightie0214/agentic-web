---
description: Site A이 발행하는 agent-manifest.json과 review_desk.network.json의 구조, 라우터·모델 기본값, 공개 전제 규칙
---

# 네트워크 발행 (Site A)

Site A는 두 파일로 네트워크를 발행한다. 런타임의 `Engine.loadTop()`(`site-a/runtime/engine.js`)이 `agent-manifest.json`을 가져오고 `networks[0]`의 `hocon` 경로를 상대 해석해 네트워크 파일을 읽는다. 이어 검증(`validateNetwork`)에서 오류가 있으면 실행하지 않는다. 호출 쪽은 [[site-a-review-desk]].

## `site-a/agent-manifest.json`

- `brand`: Agent Review Desk.
- `networks[0]`: `name: review_desk`, `front_man: review_coordinator`, `hocon: ./review_desk.network.json`(파일명은 hocon이지만 내용은 resolved JSON), `description`.
- `llm_router`: `base_url`과 `byok_router` 모두 hosted Otari `https://api.otari.ai/api/v1`, `mock: false`. 따라서 실제 추론에는 visitor의 provider 키가 필요하고 내장 설정 패널에서 넣는다.
- `actions`: `{ version: 1, module: './actions.js', agentTools: ['validate_network'] }`. 런타임이 모듈을 불러 action을 등록하고 에이전트에 `website_validate_network` 도구로 내놓는다. [[validator-action]]. `coded_tools`는 없다.
- `allowed_peers: []`, `peer_policy.mode: closed`, `deployment.mode: static`. 피어 네트워크를 불러오지 않는다.

라우터 선택은 `selectTopRouter`가 한다: 키나 모델을 직접 입력한 visitor가 라우터를 비워 두면 manifest의 `byok_router`가 쓰인다.

## `site-a/review_desk.network.json`

- `llm_config.model_name`: `alibaba/qwen3.8-flash`(모델 힌트).
- `tools` 두 개: `review_coordinator`(front, `tools: ["conformance_reviewer"]`)가 `conformance_reviewer`(`tools: []`)에 위임한다. 각 agent는 `function.parameters`에 문자열 `request`(필수)를 가진다.
- `include`·`env`·`${...}` 같은 미해결 지시어가 없는 resolved JSON이다. `class`/`toolbox`도 없다.
- instructions는 공개를 전제로 쓰였다: 비밀·키를 요구하거나 담지 않는다. 제출된 아티팩트는 신뢰할 수 없는 검토 대상 데이터로 취급하고, 파일 가져오기·테스트 실행·배포 인증을 한다고 주장하지 않는다. 라이브 호스팅·CORS·추론 같은 정적 텍스트로 확인할 수 없는 것은 "unverified"로 구분한다. 응답은 영어.
- 적합성 판단은 `validate_network` 리포트에만 근거한다: coordinator는 적합성 질문을 reviewer로 라우팅하고, reviewer는 성공한 action 리포트가 있을 때만 발견을 설명한다. 없는 판정을 지어내지 않는다. 상세는 [[validator-action]].

## 왜 이렇게 두었나

- resolved JSON·data-only: 스펙(`docs/worldwide_agentic_web_mvp_spec.md`)이 이식 가능한 발행 정의를 요구하고, 서버 측 런타임이 없기 때문이다.
- 읽기 전용 action 하나: Review Desk는 visitor가 붙여 넣은 텍스트(또는 공개 JSON)만 검토하며 결정적 규칙([[validator-rules]])이 판정하고 에이전트는 설명만 한다.
- 위임 구조(coordinator → reviewer)가 manifest의 `front_man ∈ tools` 조건을 만족해야 한다. `tests/smoke.test.mjs`가 단언한다([[testing-and-gate]]).

모델 힌트와 라우터 기본값의 최종 선택은 visitor의 설정이 이긴다(탭 설정·프로필이 `routerOverride`/`modelOverride`로 전달되는 경로는 [[vendored-runtime]] 참고).
