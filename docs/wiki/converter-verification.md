---
description: 변환기 테스트(fixture·parse·emit·e2e·web), 정적 적합성 연계 검증의 범위와 한계, 리뷰에서 얻은 교훈의 현재 반영, 브라우저 증거와의 경계
---

# 변환기 검증과 교훈

규칙은 [[converter-mapping-contract]], 구현은 [[converter-code-structure]]에 있다. 모든 테스트는 `node --test "tests/**/*.test.mjs"`에 포함된다([[testing-and-gate]]).

## 테스트 구성 (`tests/converter/`)

| 파일 | 검사 |
| --- | --- |
| `tests/converter/fixtures/integrity.test.mjs` | 가상 Theora 레이아웃(`tests/converter/fixtures/mini-theora/layout.json`), Markdown 픽스처(`tests/converter/fixtures/sample-agents/`), ADK 픽스처(`tests/converter/fixtures/adk/root_agent.yaml`·`tests/converter/fixtures/adk/middle/agent.yaml`·`tests/converter/fixtures/adk/middle/leaf/agent.yaml`)가 존재하고 ADK 픽스처가 웹 샘플 `site-a/converter/samples/adk/`와 바이트 단위로 같은지, 세 입력 각각의 expected 스냅샷 디렉터리가 배선(별 모양 또는 세 단계 간선)과 빈 links를 선언하고 직렬화 형식이 일치 |
| `parse.test.mjs` | 코어가 `node:` import 없이 로드됨, 레이아웃 픽스처가 스냅샷과 같은 역할을 냄, 자동 선택 순서(Theora → ADK 뿌리 → Markdown, 명시 선택은 폴백 없음), BOM·줄바꿈 정규화, frontmatter 값 형식·거부 사례, 이름 규칙·충돌, 비밀/PEM/경로 줄 제거와 설명 도출, 빈 본문 거부, config 후보 검증, 진단에 원문 비노출. ADK: 공식 최소 모양과 LlmAgent 일곱 값, 참조의 파일별 상대 해석·원본 간선 순서·닿는 파일만 읽음, 없는·순환·중복 참조 실패, 필수 문자열·중복 키·따옴표 키·여러 문서 거부, 블록 들여쓰기(첫 내용 줄 기준·한 칸/네 칸·덜 들여쓴 줄 거부·내부 공백 보존), 알림이 정화된 키 이름만 담음 |
| `emit.test.mjs` | 파서→네트워크 바이트 스냅샷과 열거 순서 무관, front 비첫 번째여도 첫 agent로 내보냄, 단일 역할, ADK의 원본 자식 순서·중간 위임 간선, 실행·피어 능력 비통과, 잘못된 front/IR 거부, 동결 입력과 독립 객체, manifest·links 스텁, 모든 형식의 specialist 문구, 모듈의 브라우저 이식성 |
| `e2e.test.mjs` | 실제 CLI 프로세스로 픽스처→3개 산출물 바이트 대조(자동·명시 레이아웃, `--front` 재정렬), 인자·입력 오류 시 부분 번들 없음과 진단 비노출, 심볼릭 링크 비추종, 대소문자 변형 경로 비선택, AW2·AW4 정적 검사 연계. ADK CLI: 자동·명시 변환의 스냅샷·알림·번들 검사, 참조 입력 실패의 원자성, 심볼릭 참조·디렉터리 비추종, 닿은 파일만 읽을 수 있으면 됨, 알림 이름 정화 |
| `web.test.mjs` | 샘플의 공유 파이프라인·AW2 리포트·다운로드 바이트, 디렉터리/개별 파일 획득, CLI와 웹의 BOM 동등성, 무관 이진 파일 비해독, 오류 시 이전 산출물 제거와 진단 정화, 늦은 획득 무시, 전달 저장소 차단, Review Desk 일회성 소비와 불량 payload 거부. ADK 웹: 잘못된 참조·UTF-8이 번들 전체를 거부하고 알림이 값을 노출하지 않음 |

출력 규칙(`CVT-NET-005`)과 형식별 설명(`CVT-META-001`)이 생기면서 `tests/converter/fixtures/`의 입력 디렉터리 아래 expected 스냅샷도 같이 바뀌었다(ADK 입력용 `tests/converter/fixtures/adk/expected/`가 새로 생겼고 기존 두 스냅샷은 specialist 문구가 부른 쪽을 가리지 않는 새 문장으로 바뀌었다). `parse.test.mjs`는 기대 instructions 원문을 산출물 snapshot이 아니라 입력(가상 파일)에서 얻는다. snapshot 산출물의 instructions에는 emitter가 붙인 규칙 문장이 섞여 있어 파서가 낸 원문의 기대값으로 쓸 수 없기 때문이다. CLI와 웹이 같은 바이트를 내는지는 `e2e.test.mjs`·`web.test.mjs`가 계속 확인한다.

네트워크에 `llm_config.temperature: 0.2`가 들어가고 `max_execution_seconds`가 실측값(90)으로 바뀌면서 두 expected 스냅샷(`tests/converter/fixtures/mini-theora/expected/converted_team.network.json`, `tests/converter/fixtures/sample-agents/expected/converted_team.network.json`)과 `emit.test.mjs`의 정확한 봉투 단언이 함께 바뀌었다. `e2e.test.mjs`와 `web.test.mjs`는 산출물의 temperature를 확인하고 CLI와 웹의 바이트 동등을 이어 본다. 시간 한도 값이 실측 공식과 맞는지는 `tests/smoke.test.mjs`가 변환 샘플의 출력에서 확인한다([[runtime-execution-contract]]).

e2e의 임시 입력·산출물은 OS 임시 폴더가 아니라 저장소의 개발 영역(.theora 아래 tmp/converter-e2e) `mkdtemp` 작업공간에 만들고 `t.after`로 지운다. 저장소에 실제 `.theora` 상태를 커밋하지 않고 입력용 Theora 레이아웃도 이 작업공간 안에서만 조립한다.

## AW2·AW4 정적 검증 연계

`CVT-VERIFY-001` e2e는 CLI가 만든 번들을 `validateNetwork`(`site-a/validator-rules.mjs`)에 넣고, 같은 바이트를 일회용 `site-a/`·`site-b/` 두 발행 루트에 복사한 임시 트리에서 `tools/check-conformance.mjs`([[conformance-cli]])를 실행한다. AW4 CLI는 임의 출력 디렉터리를 받지 않고 저장소 모양 트리를 감사하므로 이렇게 스테이징하며 운영 사이트 파일은 건드리지 않는다. 런타임 모듈은 import 해석용으로만 복사한다. 두 레이아웃 × front가 coordinator·specialist인 경우 모두 통과하고 `runtime.safety`·`runtime.composition`은 `unverified`로 남는다. front 참조 누락·지역 호출 끊김·links 키 불일치·정의 파일 누락을 일부러 만든 번들은 규칙 실패와 CLI 종료 코드 1을 낸다. 이 검사는 브라우저 로딩·모델 동작·위임을 증명하지 않는다.

## 리뷰 교훈과 현재 코드의 방어

1. **고정 경로의 대소문자는 파일시스템 조회에 맡기지 않는다.** CLI가 `lstat` 성공을 정확한 이름 일치로 간주해 대소문자를 무시하는 호스트에서 `.Theora`·`Agent.md` 같은 변형이 역할이 됐다. 지금은 `readdir`의 `entry.name`을 `===`로 비교한다(theora 상태 디렉터리·`roles`·`config`·`agent.md`·`theora.json`·claude agents 디렉터리 모두). e2e에 변형 경로·변형 config·변형 Claude 디렉터리 회귀 검사가 있다.
2. **임시 자료는 하네스가 지정한 `.theora` 개발 영역 아래에 둔다.** e2e 작업공간을 위 위치로 옮기고 고유성·격리·삭제를 확인하는 검사를 더했다.
3. **선택되지 않은 파일은 읽지 않는다.** 변환 탭이 디렉터리의 모든 파일을 먼저 UTF-8 해독해 무관한 이진 파일에서 변환이 멈췄다. 이제 `readLocalFiles` 경계에서 레이아웃별 선택 파일만 읽고, 선택된 파일의 UTF-8 오류만 거부하며, 다른 레이아웃으로 바꾸면 정상 복구된다. 무관 파일의 `arrayBuffer`가 호출되지 않음을 확인한다.
4. **BOM 정규화의 소유자는 파서 하나다.** 웹 획득이 BOM을 먼저 지우면 파서가 또 지워 같은 입력에서 CLI와 웹의 산출물이 달라졌다. 두 웹 경로(로컬 파일·샘플)를 `ignoreBOM: true` 디코더로 통일하고 BOM 1·2개 입력의 역할 데이터와 세 산출물 바이트가 CLI와 같음을 검사한다.
5. **YAML 구조 들여쓰기는 ASCII 공백만 센다.** 블록 스칼라의 들여쓰기를 두 칸 고정에서 첫 내용 줄 기준으로 바꾸는 첫 구현이 일반 문자열 `trimStart()`와 일괄 탭 거부를 구조 판정에 써서, 블록 내용 안의 탭·NBSP·EM SPACE 같은 공백을 구조 들여쓰기로 오인했다. 이는 ADK `instruction`의 내부 서식과 추가 들여쓰기를 보존해야 한다는 규칙을 깼다. `parse-roles.mjs`의 `indentation()`이 선두 ASCII 공백만 세고, 블록의 첫 내용 줄·공백만 있는 줄·접힌(`>`) 스칼라의 추가 들여쓰기 판정이 같은 구분을 쓴다. 공용 `yamlMapping` 한 곳의 수정이라 ADK와 Markdown frontmatter 모두에 적용된다. 구조 탭이나 부족한 ASCII 들여쓰기는 여전히 거부하고, 최종 바깥 공백 trim(`CVT-ROLE-002`)은 그대로다. `parse.test.mjs`의 블록 들여쓰기 테스트가 지적된 입력과 내부 공백 문자, 공백만 있는 내용 줄, 접힌 스칼라를 확인한다.
6. **현재 상태 문서는 구현과 맞춘다.** `README.md`와 `docs/devpost.md`가 이미 바뀐 피어 주소를 예약 주소로 설명하던 것을 현재 설정(`https://spec-scout.pages.dev/spec_scout`)에 맞췄다([[peer-connection]], [[deployment-and-release]]).

## 브라우저 증거의 위치

변환 산출물이 실제 브라우저 런타임에서 로드되고 위임되는지는 Node 검사로 대신할 수 없다. 사용자 승인 아래 관찰한 AW5 기록과, ADK·Claude 샘플의 변환 → 시험 실행을 공개 사이트에서 실제 모델로 돌린 §9 기록의 요약과 한계는 [[browser-evidence-ledger]]에 있다. 시험 실행 쪽 검사는 [[editor-test-run]]에 있다.
