---
description: 변환기 테스트(fixture·parse·emit·e2e·web), 정적 적합성 연계 검증의 범위와 한계, 리뷰에서 얻은 교훈의 현재 반영, 브라우저 증거와의 경계
---

# 변환기 검증과 교훈

규칙은 [[converter-mapping-contract]], 구현은 [[converter-code-structure]]에 있다. 모든 테스트는 `node --test "tests/**/*.test.mjs"`에 포함된다([[testing-and-gate]]).

## 테스트 구성 (`tests/converter/`)

| 파일 | 검사 |
| --- | --- |
| `tests/converter/fixtures/integrity.test.mjs` | 가상 Theora 레이아웃(`tests/converter/fixtures/mini-theora/layout.json`: coordinator·specialist·config 3개 레코드, config가 유효한 JSON이고 `front_man: coordinator`), `tests/converter/fixtures/sample-agents/coordinator.md`·`tests/converter/fixtures/sample-agents/specialist.md`가 존재하는지, 두 입력 각각의 expected 스냅샷 디렉터리가 front→specialist 배선과 빈 links를 선언하고 직렬화 형식이 일치 |
| `parse.test.mjs` | 코어가 `node:` import 없이 로드됨, 두 레이아웃 픽스처가 스냅샷과 같은 역할을 냄, Theora 우선·Claude 디렉터리 선택, BOM·줄바꿈 정규화, frontmatter 값 형식·거부 사례, 이름 규칙·충돌, 비밀/PEM/경로 줄 제거와 설명 도출, 빈 본문 거부, config 후보 검증, 진단에 원문 비노출 |
| `emit.test.mjs` | 파서→네트워크 바이트 스냅샷과 열거 순서 무관, front 비첫 번째여도 첫 agent로 내보냄(별 모양 간선), 단일 역할, 실행·피어 능력 비통과, 잘못된 front/IR 거부, 동결 입력과 독립 객체, manifest·links 스텁, 모듈의 브라우저 이식성 |
| `e2e.test.mjs` | 실제 CLI 프로세스로 픽스처→3개 산출물 바이트 대조(자동·명시 레이아웃, `--front` 재정렬), 인자·입력 오류 시 부분 번들 없음과 진단 비노출, 심볼릭 링크 비추종, 대소문자 변형 경로 비선택, AW2·AW4 정적 검사 연계 |
| `web.test.mjs` | 두 샘플의 공유 파이프라인·AW2 리포트·다운로드 바이트, 디렉터리/개별 파일 획득, CLI와 웹의 BOM 동등성, 무관 이진 파일 비해독, 오류 시 이전 산출물 제거와 진단 정화, 늦은 획득 무시, 전달 저장소 차단, Review Desk 일회성 소비와 불량 payload 거부 |

e2e의 임시 입력·산출물은 OS 임시 폴더가 아니라 저장소의 개발 영역(.theora 아래 tmp/converter-e2e) `mkdtemp` 작업공간에 만들고 `t.after`로 지운다. 저장소에 실제 `.theora` 상태를 커밋하지 않고 입력용 Theora 레이아웃도 이 작업공간 안에서만 조립한다.

## AW2·AW4 정적 검증 연계

`CVT-VERIFY-001` e2e는 CLI가 만든 번들을 `validateNetwork`(`site-a/validator-rules.mjs`)에 넣고, 같은 바이트를 일회용 `site-a/`·`site-b/` 두 발행 루트에 복사한 임시 트리에서 `tools/check-conformance.mjs`([[conformance-cli]])를 실행한다. AW4 CLI는 임의 출력 디렉터리를 받지 않고 저장소 모양 트리를 감사하므로 이렇게 스테이징하며 운영 사이트 파일은 건드리지 않는다. 런타임 모듈은 import 해석용으로만 복사한다. 두 레이아웃 × front가 coordinator·specialist인 경우 모두 통과하고 `runtime.safety`·`runtime.composition`은 `unverified`로 남는다. front 참조 누락·지역 호출 끊김·links 키 불일치·정의 파일 누락을 일부러 만든 번들은 규칙 실패와 CLI 종료 코드 1을 낸다. 이 검사는 브라우저 로딩·모델 동작·위임을 증명하지 않는다.

## 리뷰 교훈과 현재 코드의 방어

1. **고정 경로의 대소문자는 파일시스템 조회에 맡기지 않는다.** CLI가 `lstat` 성공을 정확한 이름 일치로 간주해 대소문자를 무시하는 호스트에서 `.Theora`·`Agent.md` 같은 변형이 역할이 됐다. 지금은 `readdir`의 `entry.name`을 `===`로 비교한다(theora 상태 디렉터리·`roles`·`config`·`agent.md`·`theora.json`·claude agents 디렉터리 모두). e2e에 변형 경로·변형 config·변형 Claude 디렉터리 회귀 검사가 있다.
2. **임시 자료는 하네스가 지정한 `.theora` 개발 영역 아래에 둔다.** e2e 작업공간을 위 위치로 옮기고 고유성·격리·삭제를 확인하는 검사를 더했다.
3. **선택되지 않은 파일은 읽지 않는다.** 변환 탭이 디렉터리의 모든 파일을 먼저 UTF-8 해독해 무관한 이진 파일에서 변환이 멈췄다. 이제 `readLocalFiles` 경계에서 레이아웃별 선택 파일만 읽고, 선택된 파일의 UTF-8 오류만 거부하며, 다른 레이아웃으로 바꾸면 정상 복구된다. 무관 파일의 `arrayBuffer`가 호출되지 않음을 확인한다.
4. **BOM 정규화의 소유자는 파서 하나다.** 웹 획득이 BOM을 먼저 지우면 파서가 또 지워 같은 입력에서 CLI와 웹의 산출물이 달라졌다. 두 웹 경로(로컬 파일·샘플)를 `ignoreBOM: true` 디코더로 통일하고 BOM 1·2개 입력의 역할 데이터와 세 산출물 바이트가 CLI와 같음을 검사한다.
5. **현재 상태 문서는 구현과 맞춘다.** `README.md`와 `docs/devpost.md`가 이미 바뀐 피어 주소를 예약 주소로 설명하던 것을 현재 설정(`https://spec-scout.pages.dev/spec_scout`)에 맞췄다([[peer-connection]], [[deployment-and-release]]).

## 브라우저 증거의 위치

변환 산출물이 실제 브라우저 런타임에서 로드되고 위임되는지는 Node 검사로 대신할 수 없어 `docs/demo-checklist.md`의 AW5 절에 사용자 승인 아래 관찰한 기록이 있다. 요약과 한계는 [[browser-evidence-ledger]]에 있다.
