---
description: docs/demo-checklist.md 브라우저 검증 원장의 구성과 증거 규칙, B01–B10, run 1 실패와 보정, 공개 측정(§4), AW5 번들, §6 실측, temperature 적용 뒤 실측(§7)과 시간 한도 계산(§8), ADK·Claude 변환 시험 실행 공개 실측(§9), 미확인
---

# 실제 브라우저 검증 원장

`docs/demo-checklist.md`는 절차 체크리스트이자 **사용자가 실행해 제공한** 초기 브라우저 관찰(로컬과 공개), 그 뒤 구현자가 직접 실행한 공개 브라우저 실측(§6·§7·§9)과 공개 HTTP 측정의 원장이다. 체크리스트 작성이나 Node exit 0은 런타임 검증 완료가 아니다. 구현자는 정제된 Markdown 기록을 읽었을 뿐 라이브 브라우저 세션이나 스크린샷을 본 것이 아니며 원장은 그렇게 명시한다. 정적 쪽은 [[conformance-cli]], 배포는 [[deployment-and-release]]에 있다.

## 구성

| 절 | 내용 |
| --- | --- |
| 상단 상태·준비 기록 | 현재 판정 요약, 준비 당시 환경, 사용자 결정(2026-11-16 변경: 브라우저 실측은 구현자가 Edge CDP·Firefox BiDi와 dev router·sentinel 키로 직접 실행하고, 사람에게는 키 발급·폐기·계정·제출만 묻는다. Otari 경연 크레딧만 사용, 두 번째 모델은 내장 패널에서 선택) |
| §1 공통 설정·증거 규칙 | A는 `site-a/`, B는 `site-b/`를 각각 별도 origin에 서빙, 개별 케이스마다 새 페이지·초기화한 상태, 패널로만 모델 전환, DevTools Network와 Developer view 관찰, 키는 비공개 검사 후 존재 여부·`<redacted>`만 기록 |
| §2 시나리오 B01–B10 | 2-agent 위임·action(B01), 동의 후 정확한 이름의 피어(B02), 거절(B03), 거부된 origin(B04), 잘못된 네트워크·중복 이름(B05), 잘못된 명시적 피어 이름(B06), 키 비전달·caller router 유지(B07), sentinel 주입과 `remote_call.requestPayload` 필터링 관찰(B08), 합성 사이클(B09), 실행 한도(B10) |
| §3 실행 원장 | run 1 출처·한계, 사례 관찰, 발견과 후속, 승인된 소스 보정, run 2 중간·최종 재확인, 현재 수용 요약, 케이스 기록 템플릿 |
| §4 공개 배포 측정·심사 인계 | P01 공개 HTTP 측정(스크립트·표·해시·후속 재측정), P02 공개 브라우저 피어 흐름(run 1 실패·run 2 범위 PASS), 남은 인계 체크리스트 |
| §5 영상 계획 | 한 사례 서사, 녹화본 아님 |
| AW5 converter dogfooding | 변환 번들의 Node 정적 검증 요약, 재현 절차(계획), 사용자 승인 번들 실행 두 번의 결과와 답변 품질 진단 |
| §6 judge-ready fixes release check | R01 공개 바이트·저장소 공개 여부, R02 착륙 트리 `browser-check`, R06 부팅 오류 화면, deadline-config 뒤 실행 갱신(공개 Edge/Firefox 실측, CLI Theora 묶음 실행, 증거 보존) |
| §7 judge-facing public check | temperature 0.2 적용 뒤 고정 질문 여덟 번의 새 대화 실행(공개 A Edge 3·Firefox 1, 공개 B Edge 2, 변환 샘플 Edge 2)의 요청 값·경과 시간·답 가독성, 중단된 수집 시도, 증거 보존 위치 |
| §8 measured execution limits | §7의 최상위 run span `durationMs`에서 세 네트워크 선언과 runtime 상한을 계산한 근거 |
| §9 Convert → test run 공개 실측 | 공개 Review Desk에서 ADK 샘플 3회·Claude 샘플 1회의 변환 → 시험 실행과 Spec Scout 질문 1회, 보존된 미완료 시도, 요청 값·span·답 전문 읽기 |

B08은 [[conformance-cli]]의 `test-slydata` 샘플을 기존 `Engine.runTurn(…, { slyData })` 옵션으로 주입하고 정의 fetch의 URL·헤더·본문을 병행 관찰하도록 한다. 판정은 PASS·FAIL·UNVERIFIED이며 모델이 도구를 썼다거나 비밀을 지켰다고 말한 것은 증거가 아니다.

## run 1에서 드러난 실패와 현재 코드의 반영

- **B05 중복 agent 이름이 추론 전에 거부되지 않았다.** `AgentNetwork`가 `Map`에 덮어써 마지막 정의만 남았다. 이제 `site-a/runtime/kernel.js`·`site-b/runtime/kernel.js` 생성자가 `filterConfig` 치환·trim 뒤 `Duplicate agent name '<name>'.`을 던진다. 최상위·피어 컴파일 모두에 적용된다(`tests/smoke.test.mjs`의 "network rejects duplicate names after config filtering").
- **B07 키가 loopback 쿠키로 A의 정적 서버에 전달됐다.** peer 격리와 caller router 유지는 관찰됐지만 광범위한 비노출은 실패였다. `byok.js`에서 키가 든 프로필 쿠키 미러링을 제거하고 `ui.js`의 쿠키 공유 안내도 뺐다. 프로필은 origin 로컬 localStorage, 탭 설정(sessionStorage)이 우선이다. 쿠키 이전·자동 정리는 없고 기존 테스트 쿠키는 사용자가 지워야 한다. 두 사이트 복사본 모두에 적용했다([[vendored-runtime]]).

## run 2 재확인(보정된 런타임 해시와 대응)과 범위

A/B 최상위 로더의 중복 이름 거부, 중복 피어의 피어 추론 전 거부, 패널 저장·선택·삭제·재로드와 두 모델 전환, 관찰된 A/B 정적 요청에 키 부재와 두 모델에서 caller router 유지가 PASS로 기록됐다. 반면 run 1의 나머지 사례(B01–B04, B06, B08–B09)는 run 1 관찰과 한계를 유지하며 보정 런타임에서 전부 다시 돌린 것이 아니다. B10 PASS는 관찰된 **24-agent 호출 상한**에 한정된다.

## AW5 변환 산출물의 브라우저 기록

`docs/demo-checklist.md`의 "AW5 converter dogfooding" 절이 변환기가 만든 번들([[converter-mapping-contract]])이 실제 브라우저 런타임에서 로드되고 위임되는지를 다룬다. Node 정적 검사(`CVT-VERIFY-001`; [[converter-verification]])와 분리된 근거다.

- **실행 범위**: 사용자가 승인해 Claude 데스크톱 앱의 내장 브라우저가 루프백 정적 서버에서 Theora 샘플(`site-a/converter/samples/theora/layout.json`)을 변환한 번들을 두 번 실행했다. 키는 사용자가 내장 패널에만 입력했다. 구현자는 정제된 텍스트 기록을 읽었을 뿐 라이브 세션·스크린샷·provider 응답 본문을 보지 않았다. 원장이 보고된 소스 리비전과 변환·런타임 경로의 일치를 확인했다.
- **관찰**: 변환 팀 로드와 coordinator → specialist → coordinator 위임이 두 번 모두 PASS(agent span 2·model_call span 3). 그러나 **답변 표시 품질은 두 번 모두 FAIL**(초안·메타 문구와 깨진 줄).
- **원인 진단의 한계**: 같은 탭의 trace·history 비교가 결함을 모델 출력(조정자 스트리밍 내용과 specialist 결과 자체의 토큰 훼손)에 위치시켰고 변환기·런타임 손상 증거는 없다. 왜 모델이 그렇게 썼는지는 설명되지 않았고 다른 모델이나 런타임 밖 재현은 시험하지 않았다. 사용자는 프롬프트·런타임 수정 요청을 철회했고 품질 보정은 이뤄지지 않았다. 품질 FAIL은 그대로 남는다.
- **아직 미확인**: 임의 입력의 위임 품질, 피어·동의·CORS·상한 집행(피어 이벤트가 0이라 운동되지 않음), 심사자 접근. 이 기록은 AW4 사례(B01 등)와 다른 네트워크라 그것을 대신하지 않는다.

## 공개 배포 측정 (§4)

이 절은 로컬 관찰과 별개로 공개 A(`https://almightie0214.github.io/agentic-web/`)와 공개 B(`https://spec-scout.pages.dev/`)를 측정한 기록이다. 원장이 정한 절차와 한계만 정리한다(위키 작성자는 라이브 세션을 본 것이 아니라 정제된 기록을 읽었다).

- **P01 — 자격 없는 HTTP 측정**: 먼저 공개 A의 `links.json`·`agent-manifest.json`을 저장소와 바이트 비교하고 다르면 중단하는 선행 조건이 있다. 그 뒤 모든 요청은 `credentials: 'omit'`·`redirect: 'manual'`·키·Cookie·Authorization 없이 보낸다. 결과는 A·B의 응답 전부 ACAO `*`·리다이렉트 없음, 200 본문은 저장소와 바이트 동일, B의 없는 경로는 공유 404 HTML이다. 리비전 `298ce2bee1001e7186e7f5325975c063729881d5`에서 세 번(최초·재측정·후속) 찍었고 Node 명령행 Origin/ACAO는 브라우저 CORS 집행이나 키 격리의 증거가 아니다.
- **P02 — 공개 브라우저 피어 흐름**: 사용자가 내장 패널에만 키를 넣었다. run 1(Resource Timing 기반)은 동의·피어 호출·호출자 라우터는 관찰했지만 피어가 도구 호출 마크업을 돌려줘 **답변이 실패**했고 와이어 키 격리는 미확인이었다. 별도 run 2(Edge/CDP, `Network.requestWillBeSentExtraInfo`로 실제 와이어 헤더 확인)는 Allow 전 B 요청 0건, B manifest·정의 200, `links.json` 404, `remote_call spec_scout`, 호출자 `api.otari.ai` 모델 호출, 완성된 답을 기록했고 캡처된 B GET 3건에 Cookie·Authorization·본문·`otk_`가 없다. run 1 실패는 run 2로 덮어쓰지 않고 남긴다.
- **한계**: PASS는 세 B 요청과 그 답의 인용 구조에 한정된다(인용 정확성 미검사, provider 헤더·본문 미관찰). 당시 Allow에는 전용 consent 이벤트가 없었고(지금 코드는 결정마다 하나 남긴다), 관찰된 별도 출처 요청의 정체는 미확인이었고, run 1의 마크업 출력은 재현되지 않아 원인 미진단이다. 이 관찰은 특정 시점의 스냅샷이다. 이 절의 정리된 의미는 [[peer-connection]], 배포 절차는 [[deployment-and-release]]에 있다.
- **미완료 인계**: 독립 심사자 본인의 접근, 영상, 최종 제출은 이 절에서 모두 체크되지 않았다. HTTP 측정만으로 "제출 준비 완료"를 선언하지 않는다.

## judge-ready 수정 뒤 실측 (§6)

`docs/demo-checklist.md` §6은 심사 전 수정([[runtime-execution-contract]], [[page-csp-and-browser-check]], [[converter-mapping-contract]])이 착륙된 뒤의 공개 배포와 로컬 착륙 트리를 관찰한 기록이다. 이 절도 위키 작성자가 라이브 세션을 본 것이 아니라 정제된 원장 기록을 읽은 것이다. 수치는 원장이 적은 값이다.

- **R01 공개 바이트·저장소**: `deadline-config` 착륙 리비전(`225890d241a9f4ef15956c9c3a69c5ece004d771`)에서 변경된 사이트 경로 67개 중 51개가 자격 없는 GET에 200과 동일 바이트로 응답하고 삭제된 런타임 모듈 16개는 404를 낸다. 저장소는 PUBLIC, Apache-2.0이고 공유 활동은 미기록이다. B의 `/index.html`은 `/`로 308 리다이렉트되어 정본 URL에서 비교했다.
- **R02 착륙 트리 `tools/browser-check.mjs`**: exit 0, Edge 157.0.4341.60, 모의 router만 사용, `unexpectedViolations: 0`, 세 페이지 모두 기대 위반(inline·eval)만 기록하고 inline은 실행되지 않았으며 eval은 `EvalError`를 냈다.
- **R06 부팅 오류 화면**: 네트워크 정의 응답만 중복 worker 이름 픽스처로 바꿔 서빙한 로컬 실행(원본 사이트·런타임 파일은 고치지 않음)에서 두 사이트 모두 고정 안내와 `Loader error: Duplicate agent name 'worker'.`를 보였고, URL 비밀 변형은 `[redacted]`로 가려졌다.
- **공개 Edge(CDP)·Firefox(BiDi) 실측**: 개발용 loopback router(`http://127.0.0.1:8640/api/v1`)와 가짜 sentinel 키만 패널에 넣었다(실제 키는 브라우저에 들어가지 않음). Allow 전 B 요청 0건, `consent` 이벤트 정확히 1개(`prompt_allow`), trust 표시 `Allow once: 1`, B manifest·정의 200과 `links.json` 404, 피어 답이 caller의 정상 tool 결과가 되어 최종 답까지 완료됐다. 캡처된 B 요청(브라우저당 32건)에는 Authorization·Cookie·sentinel이 없었고 세 페이지의 CSP 이벤트 배열은 비어 있었다. 두 피어 답 모두 모델 토큰이 일부 깨졌고 caller 최종 답이 그 사실을 밝혔다. **실행 완료는 관찰됐지만 답 품질은 PASS가 아니다.** 개발 router 접근을 위해 Edge는 `LocalNetworkAccessChecks` 비활성, Firefox는 임시 프로필의 `network.lna.skip-domains`를 써야 했다(기본 Firefox 프로필에서는 설정 대기가 시간 초과됐고 정확한 원인은 미진단). 기본 심사자 설정의 증거가 아니다.
- **`lc.getunicorn.org` 요청**: 두 브라우저 각각 8건 재현됐고 Edge는 문서 파서 위치를 initiator로 보고했으며 Firefox는 `type:other`만 주었다. 사용자 제공 환경 진단은 로컬 HTTPS 필터 주입이며 사이트 코드가 아니다. 필터 자체를 새로 검사한 것은 아니다.
- **CLI 생성 Theora 묶음 loopback 1회**(`127.0.0.1:8601`/`8602`): coordinator → specialist → 최종 호출이 모두 ok로 끝났고 최종 답에는 초안·계획 독백이 관찰되지 않았다. 다만 specialist 내부 답에는 메타 문장과 깨진 토큰이 남아 출력 규칙이 내부 메타 텍스트를 없애지는 못했다. 이전 AW5 품질 FAIL은 그대로 남는다.
- **시간 초과 기록**: 수정 전 고정 90초 composition deadline에서 Spec Scout 질문이 최종 호출에서 잘린 실패는 지워지지 않는다. 이후 한도는 네트워크 선언(당시 240/180, 현재는 아래 §8의 실측 계산값)으로 바뀌어 공개 Edge 실행(합계 약 159.8초)과 Firefox 실행(약 94.2초)이 한도 안에서 끝까지 완료됐다. 이 절은 정상 완료 측정이고 한도 만료 중단은 결정적 테스트가 다룬다.
- **증거 보존 교훈**: 첫 검토에서 원장이 실행 종료 시 지워지는 run tmp를 증거 보존 위치로 적었다. 실행 수명과 독립 검토 인계 수명을 혼동한 것이다. 이후 승인된 프로젝트 근거 루트에 저장된 원 출력 사본, 정확 복구본, 필드 추출본, 86파일 소스 재구성과 manifest·검증 결과를 두었다. 전체 live JSON과 전체 trace 배열은 복구되지 않았고 복구는 새 실행이 아니다. 요약이나 해시만으로 원자료를 대신하지 않는다(교훈: [[no-compat-code-lessons]]).

이 절은 독립 검토·gate 판정이 아니다. 남은 한계는 피어·내부 specialist 모델 품질, 인용 정확성, provider 응답 본문과 caller tool payload 전체, 임의 변환 입력, 기본 심사자 추론 접근(참가자 소유의 열린 항목)이다. 답 품질의 최신 관찰은 아래 §7이다.

## temperature 적용 뒤 공개 실측 (§7)

`docs/demo-checklist.md` §7은 구현자가 직접 돌린 새 관찰이고 §6을 해석하지 않는다. 이 절은 위키 작성자가 라이브 세션을 본 것이 아니라 원장의 기록을 읽은 것이다. 측정 소스는 `sampling-temperature`가 착륙한 리비전이다.

- **조건**: 공개 A(`https://almightie0214.github.io/agentic-web/`)와 공개 B(`https://spec-scout.pages.dev/`), Edge 157(CDP)·Firefox 160(WebDriver BiDi), 매 실행이 버리는 프로필과 새 대화 상태(빈 history)에서 시작했다. 설정 패널에는 개발용 loopback router와 가짜 sentinel 키, 명시 모델 `alibaba/qwen3.8-flash`만 넣었다. Edge는 `LocalNetworkAccessChecks` 비활성, Firefox는 임시 프로필의 `network.lna.skip-domains`(호스트 전체 예외)를 써야 했다. 기본 심사자 설정의 증거가 아니다. 변환 샘플(`site-a/converter/samples/theora/layout.json`)은 `tools/theora2hocon/theora2hocon.mjs`로 변환해 loopback에서 서빙했고 다른 출처 피어는 없다(내부 specialist 위임만).
- **고정 질문**: A “Ask Spec Scout what MVP Profile 0.2 §3.2 requires before and while a caller loads a peer agent site.”, B “What does MVP Profile 0.2 §3.2 require before and while a caller loads a peer agent site?”, 변환 팀 “Help me plan a beginner repair workshop with a safety-focused session outline.” §3.2의 제목은 "Protocol for Loading a Peer Agent Site"라 질문도 그에 맞춘다("peer discovery"는 명세에 없는 말이다).
- **결과**: 여덟 실행이 모두 완료됐고 실제 모델 요청 20건이 모두 모델 `alibaba/qwen3.8-flash`·temperature 0.2·`stream: true`·HTTP 200으로 기록됐다. 구현자가 읽은 완전한 에이전트 답 14개에서 깨진 문장이 관찰되지 않았다. 이는 한정된 가독성 관찰이며 정확성·인용 충실도·안전·provider 신뢰성의 증명이 아니다. 내용상의 일반 결함(예: 어느 변환 답이 "약 1시간 30분"이라고 쓰고 목록 합은 110분)은 토큰 깨짐이 아니라서 따로 적혀 있다. 실행별 경과 시간은 원장 §7 표의 `durationMs`이다(최장값만 아래 §8에 온다). 공개 배포는 변경된 사이트 파일 12개가 소스와 바이트 단위로 같음을 자격 없는 GET으로 확인했다(전체 감사는 아니다).
- **중단된 수집 시도(실패 기록이지 PASS가 아니다)**: 최초 Edge 수집기가 CDP 콜백의 `postData` 부재 때문에 중단됐고 그 실행의 질문·답·시간은 알 수 없다. 변환 팀의 첫 서빙은 측정 서버가 생성된 `.mjs`를 `text/plain`으로 주어 부팅에서 멈췄다(모델 요청 없음). 두 경우 모두 측정 도구의 결함이고 제품 실패나 시간 한도 절단이 아니라는 사용자 결정(입력 83)으로 측정 집합에서 제외됐고 그 증거는 그대로 남아 있다. 재시도 규칙·샘플링 예외·임시 한도 상향은 더해지지 않았다.
- **증거 위치**: git 밖 로컬 자료(프로젝트 개발 영역의 judge-facing 폴더 아래 리비전 이름이 붙은 public-check 폴더; 시작점 manifest-final.json·verification-final.json, 케이스별 result.json·answers.txt)이다. 정확한 경로는 원장 §7에 있다. 공개 다운로드가 아니다. 원장이 저장소에 남기는 것은 조건·표·판단이고 답 전문은 그 로컬 자료에 있다. Otari 피드백 후보는 운영자의 이전 런타임 밖 진단 메모(스트리밍 + temperature 없음 2회 깨짐, 스트리밍 + 0.2 1회·비스트리밍 4회 깨끗)를 근거로 하며 구현자가 실험을 반복하지 않았고 피드백은 제출되지 않았다. 이 실측은 인과 증명이나 공급자의 기본값에 대한 지식이 아니다.

## 시간 한도 계산 (§8)

`docs/demo-checklist.md` §8은 새 실행 없이 §7의 여덟 실행에서 세 네트워크의 `max_execution_seconds`와 runtime 상한을 계산한 근거다. 원자료는 각 실행의 result.json이고 입력은 사용자 결정(입력 83)이 승인한 집합이다. 시간 한도로 끊긴 실행은 없었다. 공식은 `30 * ceil(2 * max(durationMs) / 30000)`이고 최상위 `kind:"run"` span의 `durationMs`만 쓴다(세팅 시간이나 중첩 span 합은 쓰지 않는다).

| 네트워크 | 최장 케이스 | 최장 durationMs | 결과 |
| --- | --- | ---: | ---: |
| review_desk | `a-edge-2` | 78037.2 | 180초 |
| spec_scout | `b-edge-1` | 47318.2 | 120초 |
| 변환 팀(converted_team) | `team-edge-2` | 43567.7 | 90초 |

runtime 상한은 `max(90, 180, 120, 90) = 180`이다. 이 값은 고정 질문과 조건의 실측 예산이고 임의 질문이나 provider 응답 시간이 그 안에 들어오는 보장이 아니다. 새 한도의 공개 배포와 라이브 재측정은 하지 않았다. 이전 절의 옛 선언(240/180/240, 상한 300)은 그때 측정된 버전의 기록이다. 결과가 코드에 반영된 방식은 [[runtime-execution-contract]]의 "시간 상한은 실측에서 나온다"에 있다. 이 값이 `README.md`·`docs/devpost.md`의 본문에는 실리지 않는다([[deployment-and-release]]).

## ADK·Claude 변환 시험 실행 공개 실측 (§9)

`docs/demo-checklist.md` §9는 `convert-test-run`이 착륙한 판본(`fcc8c0410b268b0e69ecf3a199efa4cc5e6ec47c`)을 기준으로 구현자가 직접 돌린 관찰이다. 이 절은 위키 작성자가 라이브 세션을 본 것이 아니라 원장의 기록을 읽은 것이다. 변환 시험 실행([[editor-test-run]])과 피어 목적지 규칙([[peer-destination-rule]]) 뒤의 공개 사이트를 대상으로 한다.

- **사전 대조**: 실행 전 공개 A·B의 변경 사이트 파일 23개(A 18, B 5)를 자격 없는 GET으로 읽어 모두 HTTP 200·redirect 없음·원본 바이트와 같음을 확인했다. 변경 파일 대조이지 사이트 전체 보안·CORS 감사가 아니다.
- **조건**: 공개 Review Desk와 공개 Spec Scout, 실제 모델(`alibaba/qwen3.8-flash`)이고 모의 router는 쓰지 않았다. 설정 패널에는 개발용 loopback router와 가짜 sentinel 키만 넣었다. Edge(CDP)는 `LocalNetworkAccessChecks` 비활성, Firefox(BiDi)는 버리는 프로필의 로컬 네트워크 예외를 써야 했다. 기본 심사자 환경의 성공 증거가 아니다.
- **질문과 흐름**: ADK 질문은 중간 에이전트를 거쳐 잎까지 가야만 답할 수 있는 것(경로 코드 `CEDAR-27`은 `researcher`에만 있다)으로 고정했다. 변환 실행은 샘플 버튼 → 정적 검사 통과 → Open in Review Desk → 같은 탭의 Test run 메시지·Run이고, 인계 직후 run이 없음을 확인한 뒤 눌렀다. Spec Scout는 기존 채팅 Send → 동의 카드 Allow 한 번이다.
- **미완료 시도(실패 기록, PASS 아님)**: 최초 Edge ADK 시도(`adk-edge-1`)는 `observation timeout: sample conversion`으로 exit 1이었다. 사람 입력 86 / D67이 정적 HTML의 버튼이 모듈 핸들러 등록 전에 존재하는 **수집기 준비 경쟁**을 원인으로 확인했고, 실패 원본을 보존한 별도 재개(`adk-edge-1-r2`)를 승인했다. 제품 실패로 간주하지 않고 성공으로 바꾸지도 않는다.
- **결과**: 다섯 실행(ADK Edge 2회·Firefox 1회, Claude Edge 1회, Spec Scout Edge 1회)이 모두 exit 0이고 모든 run·agent·tool·model 종료 span이 `ok`였다. 구현자가 읽은 답 전문 13개에 깨진 문장이 관찰되지 않았다. ADK 세 건은 뿌리 → 중간 → 잎의 두 위임 tool이 모두 성공이고 하위 에이전트의 답 전문이 다음 모델 요청의 tool 결과와 정확히 같았으며 화면에 `Not converted for specialist: tools, model.` 알림이 있었다. Claude는 coordinator → specialist가 성공했다(specialist 답이 `Recommendation to coordinator:`로 시작해 출력 규칙이 완벽히 지켜졌다고 주장하지 않는다). Spec Scout은 Allow 전 B 요청 0건·동의 이벤트 1개, 이후 B manifest·정의 200·`links.json` 404·피어 답이 caller의 tool 결과로 돌아온 성공이었다. 실제 모델 요청 21건 모두 `alibaba/qwen3.8-flash`·temperature 0.2·`stream: true`·HTTP 200이고, 세 페이지의 측정된 CSP 이벤트 배열은 비었다. 실행 시간은 원장 표의 `durationMs`이다(ADK 13.0–15.9초, Claude 28.7초, Spec Scout 81.8초 정도).
- **한계**: 위 다섯 실행에 한정한 위임 성공·답 가독성 PASS다. 임의 입력, 정확성·인용 충실도, 일반 모델 안정성, 기본 심사자 추론 접근, 상한 만료·Stop·동시 실행 거부의 공개 운동, 모든 네트워크 요청의 키 격리 보증은 주장하지 않는다. 독립 리뷰·전체 gate·제출 준비 완료의 판정도 아니다. 증거는 git 밖 로컬 자료(프로젝트 개발 영역의 convert-test-run 아래 판본 이름 public-check 폴더, 시작점 `manifest-final.json`·`verification-final.json`)이며 공개 다운로드가 아니다.

## 미확인으로 남은 것

provider 요청의 직접 헤더·본문, 정의 응답 본문 전체 검사, sentinel 헤더 검사 누락분, 실시간 한도 만료 중단(결정적 테스트만 다룸; AW4 당시 B10은 24-agent 상한만 관찰), replacement_values 중복의 브라우저 확인과 최상위 B의 잘못된 형식·빈 그래프·누락 참조 변형, 심사자 접근. 이들은 Node 결과로 대체하지 않는다. 사용자 확인된 키 폐기는 사용자의 보고이지 계정 검증이 아니다. 어느 것도 "출품 준비 완료"로 읽으면 안 된다.

## 기록할 때의 교훈

수기로 옮긴 중간 기록의 실행 시각이 원자료와 어긋난 적이 있어, 블록의 보고 범위와 실제 요청 시각, 제공되지 않은 개별 시각을 구분해 적도록 고쳤다. 원장 수정 때는 구현자 주장을 원자료와 대조한다([[no-compat-code-lessons]]).
