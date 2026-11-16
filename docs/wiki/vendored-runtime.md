---
description: site-a/runtime과 site-b/runtime에 복사된 nsDeploy 브라우저 런타임의 출처, 모듈 책임, 이 프로젝트에서 제거한 호환 코드
---

# 벤더링된 런타임

두 사이트는 각각 독립된 복사본을 가진다: `site-a/runtime/`, `site-b/runtime/`. 원본은 `cognizant-ai-labs/agentic-web` 커밋 `63a956cf4653f610b1c238c70946f4d7647d17a8`의 `skills/agentify-website/runtime/`이다. 사이트마다 따로 두는 이유는 각 사이트가 하위 경로에서도 독립 배포 가능한 정적 번들이어야 하기 때문이다(Site B는 Site A 파일이 필요 없다). 각 복사본은 `LICENSE.txt`와 상위 문서를 보존하고, 로컬 변경은 각 `README.md` 상단 "Local distribution notice"에 적는다.

## 모듈 지도

- `index.js`: 공개 진입. `boot(root, opts)`가 URL 쿼리 위생 처리, BYOK 설정 읽기, `Engine` 생성, `loadTop()`, `mountApp`을 수행한다. `Engine`·`TraceBus`·`mountApp` 등도 재export한다. runner 선택은 없다. 두 사이트 모두 `site.js`가 이 `boot`를 호출한다.
- `engine.js`: manifest·네트워크 fetch와 컴파일(`_compile`: 은퇴 기능 거부, 구조 검증), 라우터 선택(`selectTopRouter`), 피어 정책, `_makeCtx`(호출 ctx와 동의 소유), `Session`. 원본 위치 기준 상대 URL을 해석한다.
- `kernel.js`, `hocon.js`: `AgentNetwork`·`validateNetwork`(시간·step 한도 형식 검증 포함)와 정의 파싱.
- `runner.js`, `scope.js`: 유일한 에이전트 실행 루프와 호출 범위 취소(`createCallScope`·`scoped`·`bindContext`). 규칙은 [[runtime-execution-contract]].
- `ui.js`, `cruse.js`, `cruse-render.js`: 설정 패널·채팅·에이전트 UI와 CRUSE 위젯 정규화/렌더링.
- `byok.js`: 프로필·탭 단위 키/라우터/모델 저장.
- `actions.js`, `action-transport.js`, `remote.js`: 사이트 action과 피어. `action-transport.js`는 같은 출처 module 로딩(`loadActionModule`)과 확인(`reviewActions`)만 남았다. MCP·toolbox·coded tool(sandbox)·원격 action 발견·bridge는 은퇴했다. 현재 Site A는 manifest의 `actions`로 `validate_network` action 하나만 연결하고([[validator-action]]), `spec_scout` 링크 참조로 피어를 쓴다(`engine.js`의 `resolveLink`·`manifestAllowsPeer`·`resolveRemote`, 동의 훅 `onConsent`; [[peer-connection]]). Site B는 action도 피어도 연결하지 않는다. 검사 규칙은 `kernel.js`의 `filterConfig`, `generated/graph.gen.mjs`의 `find_front_man`·`is_mcp_ref`, `remote.js`의 `RemoteRegistry`를 재사용한다([[validator-rules]]).

## 로컬 변경

호환 코드 제거(원본 대비 제거만, 기능 추가 없음):

- `index.js`: 옛 `langgraph` runner 별칭, 이어서 선택형 LangChain 경로 전체. 지금은 runner 선택 자체가 없다.
- `ui.js`: 옛 manifest `mock`/`base_url`로 mock URL을 추정하던 대체 경로. 지금은 `llm_router.mock_router`만 읽는다. 또 폐기된 `activity` 테마 슬롯 처리와 전용 CSS, 검증 없던 welcome 마운트(이제 응답과 같은 정규화 사용).
- `cruse.js`/`ui.js`: 누락된 `confirmText`를 `confirmLabel`이나 기본값에서 복원하던 분기. 이제 `confirm` 위젯은 비어 있지 않은 `confirmText`를 명시해야 하고 `confirmLabel`은 선택 사항이다.
- `byok.js`: 옛 단독 키 슬롯 `nsweb-byok-key`의 읽기·쓰기·삭제. 현재 탭 설정(`nsweb-byok-tab-key`, `nsweb-byok-model`, `nsweb-byok-router`)과 저장된 프로필만 설정 출처다. 우선순위는 탭 설정이 프로필보다 앞이다.

브라우저 검증 뒤 결함 보정:

- `kernel.js`(A/B 동일): `AgentNetwork` 생성자가 `filterConfig` 치환·trim 뒤 중복 agent 이름을 `Duplicate agent name '<name>'.`으로 거부한다(`Map` 덮어쓰기 전). 최상위와 피어 컴파일 모두 해당한다.
- `byok.js`/`ui.js`(A/B 동일): 키가 든 프로필 쿠키 미러링(loopback 포함)과 쿠키 공유 안내 제거. 브라우저 검증에서 키가 A의 정적 서버로 전달되는 것이 관찰돼 보정했다. 프로필은 origin 로컬 localStorage, 탭 설정이 우선이며 쿠키 이전·자동 정리는 없다. 경위: [[browser-evidence-ledger]].

마지막 두 항목은 호환 코드 제거가 아니라 브라우저 검증에서 확인된 결함의 최소 보정이다. 각 `README.md`의 Local distribution notice에도 적혀 있다.

심사 전 결함 수정(두 사본 동일, 상세는 [[runtime-execution-contract]]):

- 선택형 LangChain 루프(`Engine.enableLangChain`, `ctx.externalRunner`와 그 모듈·번들)와 쓰지 않는 기능(MCP·sandbox·sandbox worker·원격 action 발견·host form·bridge 모듈)을 지웠다. 지운 파일 목록은 [[runtime-execution-contract]]. 이를 선언한 네트워크는 `Engine._compile`에서 거부된다. 로컬 site action 경로와 `site-a/runtime/generated/graph.gen.mjs`·`site-a/runtime/generated/validation.gen.mjs`는 남았다.
- 실패 경계(`runAgent`·`dispatchToolCall`은 던지고 `executeToolCalls`만 오류 tool 결과로 바꿈), 호출 범위 deadline, 정책 뒤 동의 기록, 네트워크 선언 composition deadline, 한도 선언 형식 검증, 부팅 오류 표시.
- 이 수정은 `site-a/runtime/README.md`·`site-b/runtime/README.md`의 Local distribution notice에도 적혀 있다.

Site A의 `README.md`에는 상류 문서(사이트 action을 `website_*` 도구로 노출하는 편집 등)가 그대로 보존돼 있다. 이는 상류 설명이며 이 프로젝트의 action 연결은 위 문단과 [[validator-action]]에 있다.

## 주의

- 두 복사본은 같은 변경을 받아야 한다. 한쪽만 고치면 다른 쪽에 같은 결함이 남는다([[no-compat-code-lessons]]). 테스트는 `runtimeTest` 헬퍼로 A/B에 같은 검사를 돌린다([[testing-and-gate]]).
- 이 런타임을 새로 쓰지 않는 것이 설계 제약이다. 상류를 갱신할 때는 위 제거 사항과 실패·한도·동의 수정을 다시 적용하고 확인해야 한다. 상류 README 본문이 보존돼 있어 은퇴한 기능을 아직 설명할 수 있으나 약속이 아니다.
- 사용처: [[site-a-review-desk]], [[site-b-spec-scout]].
