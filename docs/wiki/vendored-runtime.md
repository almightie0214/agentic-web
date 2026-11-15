---
description: site-a/runtime과 site-b/runtime에 복사된 nsDeploy 브라우저 런타임의 출처, 모듈 책임, 이 프로젝트에서 제거한 호환 코드
---

# 벤더링된 런타임

두 사이트는 각각 독립된 복사본을 가진다: `site-a/runtime/`, `site-b/runtime/`. 원본은 `cognizant-ai-labs/agentic-web` 커밋 `63a956cf4653f610b1c238c70946f4d7647d17a8`의 `skills/agentify-website/runtime/`이다. 사이트마다 따로 두는 이유는 각 사이트가 하위 경로에서도 독립 배포 가능한 정적 번들이어야 하기 때문이다(Site B는 Site A 파일이 필요 없다). 각 복사본은 `LICENSE.txt`와 상위 문서를 보존하고, 로컬 변경은 각 `README.md` 상단 "Local distribution notice"에 적는다.

## 모듈 지도

- `index.js`: 공개 진입. `boot(root, opts)`가 URL 쿼리 위생 처리, BYOK 설정 읽기, `Engine` 생성, `loadTop()`, `mountApp`을 수행한다. `Engine`·`TraceBus`·`mountApp` 등도 재export하며 Site B 셸이 이를 직접 쓴다.
- `engine.js`: manifest·네트워크 fetch와 컴파일, 라우터 선택(`selectTopRouter`), 피어 정책. 원본 위치 기준 상대 URL을 해석한다.
- `kernel.js`, `hocon.js`: `AgentNetwork`·`validateNetwork`와 정의 파싱.
- `runner.js`, `langchain-runner.mjs`와 사이트별 runtime 아래 generated 폴더의 번들: 에이전트 실행 루프. LangChain 경로는 `runner=langchain` 선택 시에만 켜지고 `deployment.mode`가 `static`이면 켜지지 않는다.
- `ui.js`, `cruse.js`, `cruse-render.js`: 설정 패널·채팅·에이전트 UI와 CRUSE 위젯 정규화/렌더링.
- `byok.js`: 프로필·탭 단위 키/라우터/모델 저장.
- `actions.js` 등 action 관련 모듈, `sandbox*.js`, `mcp.js`, `remote.js`: 사이트 action과 피어/MCP. 현재 Site A는 manifest의 `actions`로 `validate_network` action 하나만 연결하고([[validator-action]]) 피어는 쓰지 않는다. 검사 규칙은 `kernel.js`의 `filterConfig`, `generated/graph.gen.mjs`의 `find_front_man`·`is_mcp_ref`, `remote.js`의 `RemoteRegistry`를 재사용한다([[validator-rules]]).

## 로컬 변경(호환 코드 제거)

원본 대비 제거한 것만 있고 기능을 새로 만들지 않았다:

- `index.js`: 옛 `langgraph` runner 별칭. 지금은 `langchain` 선택이거나 미지정(기본)만 있다.
- `ui.js`: 옛 manifest `mock`/`base_url`로 mock URL을 추정하던 대체 경로. 지금은 `llm_router.mock_router`만 읽는다. 또 폐기된 `activity` 테마 슬롯 처리와 전용 CSS, 검증 없던 welcome 마운트(이제 응답과 같은 정규화 사용).
- `cruse.js`/`ui.js`: 누락된 `confirmText`를 `confirmLabel`이나 기본값에서 복원하던 분기. 이제 `confirm` 위젯은 비어 있지 않은 `confirmText`를 명시해야 하고 `confirmLabel`은 선택 사항이다.
- `byok.js`: 옛 단독 키 슬롯 `nsweb-byok-key`의 읽기·쓰기·삭제. 현재 탭 설정(`nsweb-byok-tab-key`, `nsweb-byok-model`, `nsweb-byok-router`)과 저장된 프로필만 설정 출처다. 우선순위는 탭 설정이 프로필보다 앞이다.

Site A의 `README.md`에는 상류 문서(사이트 action을 `website_*` 도구로 노출하는 편집 등)가 그대로 보존돼 있다. 이는 상류 설명이며 이 프로젝트의 action 연결은 위 문단과 [[validator-action]]에 있다.

## 주의

- 두 복사본은 같은 변경을 받아야 한다. 한쪽만 고치면 다른 쪽에 같은 결함이 남는다([[no-compat-code-lessons]]). 테스트는 `runtimeTest` 헬퍼로 A/B에 같은 검사를 돌린다([[testing-and-gate]]).
- 이 런타임을 새로 쓰지 않는 것이 설계 제약이다. 상류를 갱신할 때는 위 제거 사항을 다시 적용하고 확인해야 한다.
- 사용처: [[site-a-review-desk]], [[site-b-spec-scout-shell]].
