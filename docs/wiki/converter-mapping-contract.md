---
description: AW5 Theora/Markdown 변환기의 결정적 매핑 규칙(입력 선택, 이름·설명·제거 규칙, front 선택, 네트워크·manifest·links 출력)과 그 이유, 변환하지 않는 것
---

# 변환기 매핑 규약 (`docs/converter.md`)

AW5는 Theora 역할 지시문이나 범용 Markdown 에이전트 파일을, 이 저장소의 런타임이 브라우저에서 실행할 수 있는 resolved JSON 대화 네트워크로 내보낸다. 스펙 §7이 framework converter를 커뮤니티 기회로 두었기 때문이다. 규약 원본은 `docs/converter.md`이고 코드는 이를 따른다. 코드 구조는 [[converter-code-structure]], 검증은 [[converter-verification]]에 있다.

핵심 선택은 **LLM 없이 결정적으로 변환**하고, 모든 규칙에 안정적인 `CVT-*` ID를 붙여 테스트가 문구가 아니라 동작을 단언하게 한 것이다. ID는 AW2 검증 규칙 ID([[validator-rules]])가 아니며 번호를 재사용하지 않는다. 규칙을 바꾸면 규약·픽스처·테스트를 함께 고치고 옛 형식 읽기나 호환 모드는 두지 않는다(`CVT-CONTRACT-001`; [[no-compat-code-lessons]]의 같은 원칙).

## 입력

- **가상 파일**(`CVT-IN-001`): 파서는 `{path, content}[]`만 받는다. 경로는 대소문자를 구분하는 POSIX 상대 경로이며 선두 `/`·역슬래시·드라이브·빈/`.`/`..` 성분·NUL·중복은 오류다. 선택되지 않은 파일은 구조 검사 뒤 무시한다. 선두 BOM 하나와 CRLF/CR를 LF로 정규화하고, 선택된 역할/config의 NUL은 거부한다. 열거 순서는 결과에 영향이 없다.
- **레이아웃 선택**(`CVT-IN-002`): `theora`·`markdown`·생략(자동). 자동은 정확히 일치하는 Theora 역할 경로(.theora 아래 roles/<role>/agent.md, `<role>`은 디렉터리 성분 하나)가 하나라도 있으면 Theora, 아니면 Markdown이다. 명시한 레이아웃은 다른 쪽으로 폴백하지 않고, 두 레이아웃을 섞지 않는다. 선택된 역할이 없으면 오류다.
- **Theora**(`CVT-IN-003`): 디렉터리 이름이 역할 이름이고 `agent.md` 전체가 instructions다. Theora config(.theora 아래 config/theora.json)는 있으면 JSON 객체여야 하며 최상위 `front_man`만 읽는다. 그 값은 비어 있지 않은 문자열로 실제 역할 이름과 정확히 같아야 하고, 어긋나면 `--front`를 주어도 오류다. 다른 config 필드는 읽지도 복사하지도 않는다. 추측용 대체 키는 없다.
- **Markdown**(`CVT-IN-004`): 선택된 디렉터리의 바로 아래 `*.md`(소문자 확장자)만 쓴다. 프로젝트 루트에서는 .claude/agents 바로 아래 `*.md`가 하나라도 있으면 그쪽, 없으면 루트의 `*.md`다. 둘을 합치지 않고 README를 암묵적으로 읽지 않는다. 마크다운 링크·include·참조 파일은 따라가지 않는다.
- **frontmatter**(`CVT-MD-001`): 첫 줄이 정확히 `---`일 때만 있다. `name`·`description`만 읽고 단일 줄 평문·작은/큰따옴표·`|`/`>` 블록 스칼라를 지원하는 제한된 YAML 부분집합이다. null/불리언/숫자/컬렉션/태그/중복 키는 오류이며, 다른 필드(`tools`, `model`, `permissionMode` 등)는 평가하지 않고 내보내지도 않는다. 즉 출처 메타데이터가 도구나 권한을 만들 수 없다.

## 역할과 공개 텍스트

- **이름**(`CVT-ROLE-001`): Theora 이름과 명시적 `name`은 `[A-Za-z][A-Za-z0-9_]{0,59}` 문법을 검증하되 바꾸지 않는다. 이름이 없는 Markdown은 파일 stem을 slug화하고(비면 첫 제목), 대소문자 무시로 유일해야 한다. 충돌은 접미사를 붙이지 않고 거부한다. 런타임 `safeName` 재작성·절단 충돌을 피하려는 부분집합이다.
- **instructions·설명**(`CVT-ROLE-002`): frontmatter를 뗀 본문을 제거 규칙으로 정화하고 바깥 공백만 다듬는다. 본문이 비거나 제거 표지뿐이면 대체 에이전트를 만들지 않고 오류다. 설명은 정화된 frontmatter `description`, 없으면 첫 ATX 제목(코드 펜스 안은 제외), 없으면 첫 비어 있지 않은 줄, 그것도 없으면 `Role <name>.`이다. 모델로 요약하지 않는다.
- **비밀 줄 제거**(`CVT-SEC-001`): 정의가 공개된다는 전제라서 PEM 개인키 블록과 `api_key`·`secret`·`password`·`Authorization`·`Bearer`·`sk-`/`ghp_`/`github_pat_`/`AKIA` 패턴이 있는 줄 전체를 `[REDACTED_SECRET]`로 바꾼다. 제거된 원문은 표지·경고·오류에 넣지 않는다. 완전한 탐지기가 아니라는 점을 규약이 명시한다.
- **로컬 경로 줄 제거**(`CVT-SEC-002`): 비밀 제거 뒤, `/`·홈·상대 경로 접두사, 드라이브·UNC, 점으로 시작하는 theora·claude·ssh·codex 상태 디렉터리와 env 파일로 시작하는 토큰이 있는 줄을 `[REDACTED_LOCAL_PATH]`로 바꾼다. 접두사 없는 상대 서술이나 완전한 `https://` URL은 문자 그대로 남기며 해석·fetch하지 않는다.
- **메타데이터 비통과**(`CVT-SEC-003`): 원본 파일명·호스트 경로·원 config/frontmatter·타임스탬프를 산출물에 싣지 않는다. 진단은 규칙 ID와 입력 레코드 번호만 말하고 원문 줄이나 JSON 파서 발췌를 싣지 않는다. 영어 역할을 입력으로 가정하며 번역은 없다.

## front 선택과 중간 표현

`CVT-IR-001`: 파서가 `name`·`description`·`instructions`를 가진 역할 목록(이름의 JS 문자열 비교로 정렬)과, 검증된 config의 front 후보를 낸다. `CVT-FRONT-001`: front는 **명시 옵션 → config `front_man` → 정렬 첫 역할** 순이다. 명시 값은 정확히 일치해야 하고(공백·대소문자 불일치·미지의 이름은 실패) `coordinator`라는 이름이나 제목, 디렉터리 순서, 출처 도구 목록으로 권한을 추측하지 않는다. 역할 하나만 있어도 유효하다.

## 출력

- **네트워크**(`CVT-NET-001`~`005`): 이름은 항상 `converted_team`(입력 디렉터리·레이아웃·front와 무관), 파일은 `converted_team.network.json`. 최상위는 `metadata.description`(입력 형식별, `CVT-META-001`), `llm_config`(`model_name: alibaba/qwen3.8-flash`, `temperature: 0.2`), `max_steps: 12`, `max_execution_seconds: 90`, `tools`이다. `temperature`는 입력 형식과 무관하게 0.2로 고정이고, 런타임이 실행되는 에이전트의 값(없으면 그 네트워크의 값)을 모델 요청에 실어 모델 선택 override와 별개로 유지된다. 이 선언이 답 품질을 증명하지는 않는다. 90은 입력 형식과 무관한 최상위 질의 한도 선언이고 런타임이 이를 composition deadline으로 쓴다. 변환 샘플의 승인된 공개 실측 최장 `durationMs` 43567.7ms에 `30 * ceil(2 * max / 30000)`을 적용한 값이다(선언이 없으면 90초, 상한은 두 runtime 사본의 `MAX_EXECUTION_SECONDS` 180; [[runtime-execution-contract]]). 피어로 호출될 때 caller의 더 짧은 한도를 늘리지 못한다. CLI와 웹이 같은 바이트를 내는지는 아래 `CVT-OUT-001`이 보장한다(산출물의 temperature도 같다). `include`·`$env`·`class`·MCP·action·private-context 허용·외부 URL은 합성하지 않는다. 선택된 front를 **첫 agent로** 내보내는데, 벤더 런타임의 `find_front_man`이 network 수준 `front_man` 필드가 아니라 instructions를 가진 첫 agent를 고르기 때문이다. 나머지는 이름순이다. 모든 agent의 `function.parameters`는 `inquiry` 문자열 하나만 필수인 공용 스키마이고(출처의 타입 정보는 추론하지 않는다), front의 `tools`는 나머지 역할 전부(이름순), 나머지 agent는 `tools: []`인 별 모양 배선이다. 위임을 유도하는 문장을 출처 instructions에 덧붙이지 않는다.
- **출력 규칙**(`CVT-NET-005`): 각 agent의 instructions는 정화된 원문 뒤에 LF 두 개, `## Converter-owned output rule`, 변환기가 소유하는 한 문장이 붙는다. 규칙은 역할 이름이 아니라 최종 선택된 front에 따라 정해진다. front는 방문자에게 최종 답만 내고 초안·계획·과정 메모·다른 역할에게 하는 말을 넣지 않는다. specialist는 front가 보낸 inquiry에 대한 답만 낸다. 단일 역할도 front 규칙을 받고 front를 바꾸면 이전 front는 specialist 규칙을 받는다. 원인은 공개 실행(AW5 s3·s300)에서 coordinator 최종 호출이 초안·메타 문장을 스트리밍했는데 변환기가 역할 원문만 instructions로 썼던 것이다. 이는 모델에 대한 지시일 뿐 새 도구·권한·위임 간선을 만들거나 모델의 실제 준수를 증명하지 않는다.
- **입력 형식별 설명**(`CVT-META-001`): network의 `metadata.description`과 manifest의 `networks[0].description`이 파서가 선택한 형식을 따라 `Converted Theora role conversation network.` 또는 `Converted Markdown role conversation network.`로 같아야 한다. 이전에는 형식과 무관하게 Markdown 문구로 고정되어 있었다. 형식은 `parseRoles`의 `layout` 결과로 나르고 어댑터 둘이 같은 값을 넘긴다. 형식이 빠지거나 잘못되면 emitter가 거부한다.
- **manifest**(`CVT-MAN-001`): `brand: Converted Role Team`, 네트워크 한 개(`front_man`과 형식별 `description`만 가변), 사이트 기본 라우터(`https://api.otari.ai/api/v1`, `mock: false`), `allowed_peers: []`, `peer_policy: { mode: closed }`, `deployment: { mode: static }`. 참조는 하위 경로 호스팅을 위해 상대 경로다. 새 자격·설정 UI는 만들지 않는다.
- **links**(`CVT-LINK-001`): `{ "version": 1, "networks": { "converted_team": {} } }`. 자리 표시용 피어 URL이나 동의 부여를 만들지 않는다.
- **직렬화**(`CVT-OUT-001`): 세 파일만, `JSON.stringify(value, null, 2) + '\n'`, UTF-8. 같은 가상 입력·옵션이면 CLI와 웹의 바이트가 같다.

## 실패와 한계

`CVT-ERR-001`: 선택된 역할 하나라도 잘못되면(형식·config·중복 이름·빈 본문·잘못된 front) 입력 전체가 오류이며 부분 성공이나 LLM 수리는 없다. `CVT-LIMIT-001`: 이것은 **역할 텍스트와 새 기본 대화 그래프의 내보내기**이지 Theora나 Claude 하네스 이식이 아니다. 셸·git·gate·테스트·파일시스템·스케줄링·수명 주기 훅·권한·예산·상태·MCP·출처 도구 목록·스킬·입출력 타입은 변환하지 않는다. 그런 능력을 요청하는 문장이 남아도 능력을 주지 않으며, 호출 가능한 역할이 있다는 사실이 모델이 실제로 위임한다는 증거도 아니다. 백엔드·DB·인증·결제·새 런타임은 생성하지 않고, 세 데이터 파일은 호스팅 앱이 아니다. README와 제출 초안은 이 한계를 유지해야 한다([[deployment-and-release]]).

## 정적 검증과 브라우저 검증의 구분

`CVT-VERIFY-001`: 정적 규칙 리포트와 스냅샷은 브라우저 로딩·모델 동작·위임·동의·CORS를 증명하지 않는다. 실제 브라우저 증거는 [[browser-evidence-ledger]]의 AW5 절에 있다.
