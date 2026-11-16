---
description: Theora·Markdown·Google ADK Agent Config 변환기의 결정적 매핑 규칙(입력 선택, ADK 참조 따라 읽기, 공용 YAML 부분집합, 이름·설명·제거 규칙, 옮기지 않은 키 알림, 네트워크·manifest·links 출력)과 그 이유, 변환하지 않는 것
---

# 변환기 매핑 규약 (`docs/converter.md`)

변환기는 Theora 역할 지시문, 범용 Markdown(Claude agents) 파일, Google ADK Agent Config 폴더를, 이 저장소의 런타임이 브라우저에서 실행할 수 있는 resolved JSON 대화 네트워크로 내보낸다. 스펙 §2.2가 ADK를 이름으로 적고 대응 관계를 적어 두었고 §7이 framework converter를 커뮤니티 기회로 두었기 때문에 추가 입력 형식은 ADK 하나다. 규약 원본은 `docs/converter.md`이고 코드는 이를 따른다. 코드 구조는 [[converter-code-structure]], 검증은 [[converter-verification]], 변환 결과를 그 자리에서 돌리는 일은 [[editor-test-run]]에 있다.

핵심 선택은 **LLM 없이 결정적으로 변환**하고, 모든 규칙에 안정적인 `CVT-*` ID를 붙여 테스트가 문구가 아니라 동작을 단언하게 한 것이다. ID는 AW2 검증 규칙 ID([[validator-rules]])가 아니며 번호를 재사용하지 않는다. 규칙을 바꾸면 규약·픽스처·테스트를 함께 고치고 옛 형식 읽기나 호환 모드는 두지 않는다(`CVT-CONTRACT-001`; [[no-compat-code-lessons]]의 같은 원칙).

## 입력

- **가상 파일**(`CVT-IN-001`): 파서는 `{path, content}[]`만 받는다. 경로는 대소문자를 구분하는 POSIX 상대 경로이며 선두 `/`·역슬래시·드라이브·빈/`.`/`..` 성분·NUL·중복은 오류다. 선택되지 않은 파일은 구조 검사 뒤 무시한다. 선두 BOM 하나와 CRLF/CR를 LF로 정규화하고, 선택된 파일의 NUL은 거부한다. 열거 순서는 결과에 영향이 없다. 어댑터(웹·CLI)는 선택된 파일만 UTF-8로 읽고(심볼릭 링크는 따라가지 않음) ADK에서는 공용 판독이 알려 주는 `sub_agents`의 `config_path`만 따라 읽는다. 따로 YAML을 읽는 두 번째 파서를 두지 않는다. 닿지 않는 파일이 읽을 수 없거나 UTF-8이 아니어도 변환은 되고, 참조된 파일이 그러면 실패한다.
- **레이아웃 선택**(`CVT-IN-002`): `theora`·`adk`·`markdown`·생략(자동). 자동은 정확히 일치하는 Theora 역할 경로가 하나라도 있으면 Theora, 아니면 입력 루트에 `root_agent.yaml`이 있으면 ADK, 아니면 Markdown이다. 명시한 레이아웃은 다른 쪽으로 폴백하지 않고, 형식을 섞지 않는다. 선택된 역할이 없으면 오류다.
- **Theora**(`CVT-IN-003`): 디렉터리 이름이 역할 이름이고 `agent.md` 전체가 instructions다. Theora config의 최상위 `front_man`만 읽고 실제 역할 이름과 정확히 같아야 하며 어긋나면 `--front`를 주어도 오류다. 다른 config 필드는 읽지도 복사하지도 않는다. Theora에는 옮기지 않은 키 알림이 없다(파일 전체가 지시문이기 때문).
- **Markdown**(`CVT-IN-004`): 선택된 디렉터리 바로 아래 `*.md`(소문자 확장자). 프로젝트 루트에서는 `.claude/agents` 바로 아래 `*.md`가 있으면 그쪽, 없으면 루트의 `*.md`다. 둘을 합치지 않고 링크·include는 따라가지 않는다.
- **frontmatter**(`CVT-MD-001`): 첫 줄이 정확히 `---`일 때만 있다. `name`·`description`을 문자열로만 읽는다(컬렉션은 값이 될 수 없다). 다른 필드(`tools`, `model` 등)는 평가·복사하지 않고 아래 알림으로 키 이름만 보고한다.

## Google ADK Agent Config (`CVT-ADK-001`)

기준 문법은 google/adk-python main `c6586f19ab`(2026-11-16)의 `AgentConfig.json`(`LlmAgentConfig`, `AgentRefConfig`)과 `config_agent_utils.resolve_agent_reference`다. ADK의 모든 설정이 아니라 아래 제한된 부분집합만 변환한다.

- **뿌리와 front**: 입력 루트의 `root_agent.yaml`이 뿌리이며 항상 front다. 명시 front가 뿌리와 다르면 오류다(같은 값 확인은 허용).
- **옮기는 키 넷**: `name`(이름 문법 검증, 고쳐 쓰지 않음) → 에이전트 이름, `description`(없으면 본문 규칙) → 설명, `instruction`(비밀·경로 줄 제거, 남는 글이 없으면 오류) → 지시문, `sub_agents` → 그 에이전트의 `tools`(원본에 적힌 순서). `name`·`instruction`은 필수 문자열이다. `sub_agents`가 없으면 부르는 곳이 없다.
- **`sub_agents` 항목**: `config_path` 하나만 가진 매핑이어야 한다. `code` 참조와 그 밖의 모양은 오류다. 정의가 입력에 없는 에이전트를 일부만 변환해 성공처럼 보이지 않게 하려는 fail-closed 선택이다(`CVT-ERR-001`).
- **참조 경로**: `config_path`는 그 설정 파일이 있는 폴더 기준이고 읽는 파서(`readAdk`)가 루트 기준 정식 경로로 바꾼다. 절대 경로와 `..`이 든 경로는 오류다(ADK는 폴더 안에 머무는 `..`을 받지만 여기서는 `..` 자체를 받지 않는다). 없는 파일·순환·두 번 참조된 파일도 오류다. 닿지 않는 YAML은 읽지 않는다.
- **에이전트 종류**: `agent_class`가 없거나 schema가 LlmAgent로 치는 값 일곱 개(`LlmAgent`, `Agent`, `google.adk.agents.LlmAgent`, `google.adk.agents.llm_agent.LlmAgent`, `google.adk.agents.Agent`, `google.adk.agents.llm_agent.Agent`, 빈 문자열)이면 변환한다. `SequentialAgent`·`ParallelAgent`·`LoopAgent`·사용자 클래스는 실행 순서를 데이터로 옮길 수 없어 오류다.
- **주장하지 않는 것**: ADK의 `sub_agents`는 제어를 넘기는 관계인데 여기서는 부르고 답을 받는 관계가 된다. 변환 결과는 지시문과 위임 그래프를 옮긴 것이고 ADK 실행과 같은 동작이 아니다(`CVT-LIMIT-001`).

### 공용 YAML 부분집합

Markdown frontmatter와 ADK가 같은 판독 함수(`parse-roles.mjs`의 `yamlMapping`)를 쓴다. 지원은 블록 매핑, 문자열 스칼라(plain·작은/큰따옴표·블록 `|`·`>`와 `-` chomping), 매핑의 블록 시퀀스(ADK `sub_agents`), 주석이다. 어떤 키가 어떤 값 모양을 받는지는 각 형식이 정한다(frontmatter의 `name`·`description`은 문자열만). 읽지 않는 키의 들여쓰기 하위 내용은 평가하지 않고 건너뛴다. 읽는 키에서 flow 컬렉션, anchor·alias, tag, `|+`·`>+`와 들여쓰기 숫자 표시, 따옴표 친 키, 중복 키, 여러 줄 plain 값, 여러 문서는 오류다. 일반 YAML 해석기가 아니다.

바뀐 것 하나: 블록 스칼라의 들여쓰기는 YAML대로 **첫 내용 줄의 들여쓰기**다(예전엔 두 칸 고정). ADK `instruction` 블록은 들여쓰기가 내용이라 정확히 벗겨야 하기 때문이다. 그래서 한 칸·네 칸 들여쓴 블록이 유효해졌고 첫 내용 줄보다 덜 들여쓴 내용 줄은 오류다. 구조 들여쓰기는 ASCII 공백만 센다. 블록 안의 탭·NBSP·EM SPACE 같은 공백은 내용으로 보존한다. 첫 구현이 일반 문자열의 `trimStart()`와 일괄 탭 거부를 구조 판정에 써서 내용의 탭과 유니코드 공백을 구조로 오인했다는 리뷰 지적이 있었고, `indentation()`이 선두 ASCII 공백만 세게 고쳤다. 같은 공용 함수에 적용되므로 어댑터별 예외 분기는 없다. 접힌 `>` 블록은 더 들여쓴 줄 앞뒤의 줄바꿈을 유지한다.

## 역할과 공개 텍스트

- **이름**(`CVT-ROLE-001`): Theora 이름과 ADK `name`, 명시적 frontmatter `name`은 `[A-Za-z][A-Za-z0-9_]{0,59}` 문법을 검증하되 바꾸지 않는다. 이름이 없는 Markdown은 파일 stem을 slug화하고(비면 첫 제목), 모든 형식에서 대소문자 무시로 유일해야 한다. 충돌은 접미사 없이 거부한다. 런타임 `safeName` 재작성·절단 충돌을 피하려는 부분집합이다.
- **instructions·설명**(`CVT-ROLE-002`): 본문(ADK는 `instruction`)을 제거 규칙으로 정화하고 바깥 공백만 다듬는다. 비거나 제거 표지뿐이면 대체 에이전트를 만들지 않고 오류다. 설명은 정화된 명시 `description`, 없으면 첫 ATX 제목(코드 펜스 안은 제외), 없으면 첫 비어 있지 않은 줄, 그것도 없으면 `Role <name>.`이다. 모델로 요약하지 않는다.
- **비밀 줄 제거**(`CVT-SEC-001`): 정의가 공개된다는 전제라서 PEM 개인키 블록과 `api_key`·`secret`·`password`·`Authorization`·`Bearer`·`sk-`/`ghp_`/`github_pat_`/`AKIA` 패턴이 있는 줄 전체를 `[REDACTED_SECRET]`로 바꾼다. 제거된 원문은 표지·경고·오류에 넣지 않는다. 완전한 탐지기가 아니다.
- **로컬 경로 줄 제거**(`CVT-SEC-002`): 비밀 제거 뒤 `/`·홈·상대 경로 접두사, 드라이브·UNC, 점으로 시작하는 theora·claude·ssh·codex 상태 디렉터리와 env 파일로 시작하는 토큰이 있는 줄을 `[REDACTED_LOCAL_PATH]`로 바꾼다. 접두사 없는 상대 서술이나 완전한 `https://` URL은 남기며 해석·fetch하지 않는다.
- **메타데이터 비통과와 알림**(`CVT-SEC-003`): 원본 파일명·호스트 경로·원 config/frontmatter·타임스탬프를 산출물에 싣지 않는다. 진단은 규칙 ID와 입력 레코드 번호만 말한다. 예외로 **정화된 키 이름만 든 알림은 산출물 밖에서 허용**된다. 역할별로 옮기지 않은 원본 최상위 키(ADK의 `tools`·`model`·schema·callback, Markdown frontmatter의 `name`·`description` 밖 키)를 보고하되, 키 이름이 `[A-Za-z_][A-Za-z0-9_]*` 꼴이고 비밀·경로 규칙에 걸리지 않을 때만 이름을, 아니면 숨긴 개수만 싣는다. 값과 판독 오류 원문은 어디에도 싣지 않는다. 알림은 변환기 화면과 CLI 출력에만 나오고 network·manifest·links에는 들어가지 않는다.

## front 선택과 중간 표현

`CVT-IR-001`: 파서가 `name`·`description`·`instructions`(ADK는 `tools`도 자식 이름으로)를 가진 역할 목록(이름의 JS 문자열 비교로 정렬), 선택된 `layout`, front 후보 `configFront`(ADK는 뿌리 이름), `notices: [{role, keys, hiddenKeyCount}]`를 낸다. `CVT-FRONT-001`: Theora·Markdown의 front는 **명시 옵션 → config `front_man` → 정렬 첫 역할** 순이다. 명시 값은 정확히 일치해야 하고 `coordinator`라는 이름이나 제목, 디렉터리 순서, 출처 도구 목록으로 권한을 추측하지 않는다. ADK는 뿌리가 항상 front다.

## 출력

- **네트워크**(`CVT-NET-001`~`005`): 이름은 항상 `converted_team`, 파일은 `converted_team.network.json`. 최상위는 `metadata.description`(형식별), `llm_config`(`alibaba/qwen3.8-flash`, `temperature: 0.2`), `max_steps: 12`, `max_execution_seconds: 90`, `tools`이다. 90초는 변환 샘플의 승인된 공개 실측 최장 `durationMs`에 `30 * ceil(2 * max / 30000)`을 적용한 최상위 질의 한도 선언이다(상한은 `MAX_EXECUTION_SECONDS` 180; [[runtime-execution-contract]]). `temperature`는 형식과 무관하게 고정이다. `include`·`$env`·`class`·MCP·action·private-context 허용·외부 URL은 합성하지 않는다.
- **에이전트와 배선**(`CVT-NET-002`~`004`): 선택된 front를 **첫 agent로**(벤더 `find_front_man`이 instructions를 가진 첫 agent를 고르므로) 내보내고 나머지는 이름순이다. 모든 agent의 `function.parameters`는 `inquiry` 문자열 하나만 필수인 공용 스키마다. Theora·Markdown은 front의 `tools`가 나머지 전부(이름순)이고 나머지는 `tools: []`인 별 모양이다. **ADK는 원본의 `sub_agents` 간선을 원본 순서대로 쓰고** 여러 단계(A → B → C)도 납작하게 펴지 않는다. 자식 없는 잎도 그대로다. 위임을 유도하는 문장은 덧붙이지 않는다. 호출 가능하다는 사실이 모델의 실제 위임을 증명하지 않는다.
- **출력 규칙**(`CVT-NET-005`): 각 agent의 instructions는 정화된 원문 뒤에 LF 두 개, `## Converter-owned output rule`, 변환기가 소유하는 한 문장이 붙는다. 어느 문장인지는 이름이 아니라 최종 선택된 front가 정한다. front: `Return only the final answer intended for the visitor. …`. specialist(모든 형식, 부른 쪽을 가리지 않음): `Return only the answer to the inquiry you received. Do not include drafts, plans, process notes, or messages addressed to other roles.` 예전 문구는 "front가 보낸 inquiry"라고 적어 front가 나머지를 모두 부르는 그래프만 가정했는데, 여러 단계에서는 부른 쪽이 front가 아니기 때문에 바꿨다. 출력 규칙의 원래 원인은 공개 실행에서 coordinator 최종 호출이 초안·메타 문장을 스트리밍한 것이다. 이는 모델에 대한 지시일 뿐 새 도구·권한·위임 간선을 만들지 않고 모델의 준수를 증명하지 않는다.
- **형식별 설명**(`CVT-META-001`): network의 `metadata.description`과 manifest의 `networks[0].description`이 같은 값이다. `Converted Theora role conversation network.`, `Converted Markdown role conversation network.`, `Converted Google ADK agent network.`. 형식은 `parseRoles`의 `layout`으로 나르고 `describe-layout.mjs`가 만들며 빠지거나 잘못되면 emitter가 거부한다.
- **manifest**(`CVT-MAN-001`): `brand: Converted Role Team`, 네트워크 한 개(`front_man`과 형식별 `description`만 가변), 사이트 기본 라우터, `allowed_peers: []`, `peer_policy: { mode: closed }`, `deployment: { mode: static }`. 참조는 상대 경로다.
- **links**(`CVT-LINK-001`): `{ "version": 1, "networks": { "converted_team": {} } }`. 자리 표시용 피어 URL이나 동의 부여를 만들지 않는다.
- **직렬화**(`CVT-OUT-001`): 세 파일만, `JSON.stringify(value, null, 2) + '\n'`, UTF-8. 같은 가상 입력·옵션이면 CLI와 웹의 바이트가 같고 파일 열거 순서와 무관하다.

## 어댑터와 웹의 실행 경계

- **CLI**(`CVT-CLI-001`): `--layout theora|adk|markdown`. 산출물을 메모리에서 모두 만든 뒤에야 쓰고, 알림은 산출물과 별도로 출력한다.
- **웹**(`CVT-WEB-001`): 같은 모듈로 변환하고 `validateNetwork`를 거쳐 보고서·알림·다운로드를 보인다. 샘플 버튼 순서는 Claude agents team, Google ADK team, Theora role team이다. 변환기 탭은 일회성 `sessionStorage` 전달로 Review Desk에 정적 검사용 입력만 넘기며 가져오기·검토만으로는 실행·피어 접촉·자격 증명 제공·동의 우회가 없다. 현재 검사에 실패가 없을 때 방문자가 Review Desk의 **Test run**에서 Run을 눌러야 한 메시지가 실행된다. 가져온 네트워크는 게시 출처 없는 피어로 돈다([[editor-test-run]]). 두 페이지 머리에 같은 다섯 단계 nav가 있다.

## 실패와 한계

`CVT-ERR-001`: 선택된·닿는 역할 하나라도 잘못되면(형식·config·참조·클래스·중복 이름·빈 본문·지원 밖 YAML·잘못된 front) 입력 전체가 오류이며 부분 성공이나 LLM 수리는 없다. 선택 밖 파일과 옮기지 않는 메타데이터만 무시한다. `CVT-LIMIT-001`: 이것은 **역할 텍스트와 위임 그래프의 내보내기**이지 Theora·Claude·ADK 하네스 이식이 아니다. 셸·git·gate·테스트·파일시스템·스케줄링·수명 주기 훅·권한·예산·상태·MCP·출처 도구 목록(ADK AgentTool 포함)·모델 선택·schema·callback·스킬·입출력 타입은 변환하지 않는다. 워크플로 에이전트는 근사하지 않고 거부한다. 백엔드·DB·인증·결제·새 런타임은 생성하지 않고, 세 데이터 파일은 호스팅 앱이 아니다. README와 제출 초안은 이 한계를 유지해야 한다([[deployment-and-release]]).

## 정적 검증과 브라우저 검증의 구분

`CVT-VERIFY-001`: 정적 규칙 리포트와 스냅샷은 브라우저 로딩·모델 동작·위임·동의·CORS를 증명하지 않는다. 실제 브라우저 증거는 [[browser-evidence-ledger]]에 있다. ADK 샘플 변환→시험 실행의 공개 실측은 같은 원장 §9가 기록한다.
