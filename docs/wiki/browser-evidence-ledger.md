---
description: docs/demo-checklist.md 실제 브라우저 검증 원장의 구성, 증거 규칙, 시나리오 B01–B10, run 1 실패와 보정, run 2 재확인, 공개 배포 HTTP 측정과 공개 브라우저 피어 흐름(§4), AW5 변환 번들의 로드·위임 PASS와 답변 품질 FAIL, 미확인
---

# 실제 브라우저 검증 원장

`docs/demo-checklist.md`는 절차 체크리스트이자 **사용자가 실행해 제공한** 브라우저 관찰(로컬과 공개)과 구현자가 잰 공개 HTTP 측정의 원장이다. 체크리스트 작성이나 Node exit 0은 런타임 검증 완료가 아니다. 구현자는 정제된 Markdown 기록을 읽었을 뿐 라이브 브라우저 세션이나 스크린샷을 본 것이 아니며 원장은 그렇게 명시한다. 정적 쪽은 [[conformance-cli]], 배포는 [[deployment-and-release]]에 있다.

## 구성

| 절 | 내용 |
| --- | --- |
| 상단 상태·준비 기록 | 현재 판정 요약, 준비 당시 환경, 사용자 결정(사용자가 직접 실행, Otari 경연 크레딧만 사용, 두 번째 모델은 내장 패널에서 선택) |
| §1 공통 설정·증거 규칙 | A는 `site-a/`, B는 `site-b/`를 각각 별도 origin에 서빙, 개별 케이스마다 새 페이지·초기화한 상태, 패널로만 모델 전환, DevTools Network와 Developer view 관찰, 키는 비공개 검사 후 존재 여부·`<redacted>`만 기록 |
| §2 시나리오 B01–B10 | 2-agent 위임·action(B01), 동의 후 정확한 이름의 피어(B02), 거절(B03), 거부된 origin(B04), 잘못된 네트워크·중복 이름(B05), 잘못된 명시적 피어 이름(B06), 키 비전달·caller router 유지(B07), sentinel 주입과 `remote_call.requestPayload` 필터링 관찰(B08), 합성 사이클(B09), 실행 한도(B10) |
| §3 실행 원장 | run 1 출처·한계, 사례 관찰, 발견과 후속, 승인된 소스 보정, run 2 중간·최종 재확인, 현재 수용 요약, 케이스 기록 템플릿 |
| §4 공개 배포 측정·심사 인계 | P01 공개 HTTP 측정(스크립트·표·해시·후속 재측정), P02 공개 브라우저 피어 흐름(run 1 실패·run 2 범위 PASS), 남은 인계 체크리스트 |
| §5 영상 계획 | 한 사례 서사, 녹화본 아님 |
| AW5 converter dogfooding | 변환 번들의 Node 정적 검증 요약, 재현 절차(계획), 사용자 승인 번들 실행 두 번의 결과와 답변 품질 진단 |

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
- **한계**: PASS는 세 B 요청과 그 답의 인용 구조에 한정된다(인용 정확성 미검사, provider 헤더·본문 미관찰). Allow에는 전용 consent 이벤트가 없고, 관찰된 별도 출처 요청의 정체는 미확인이며, run 1의 마크업 출력은 재현되지 않아 원인 미진단이다. 이 관찰은 특정 시점의 스냅샷이다. 이 절의 정리된 의미는 [[peer-connection]], 배포 절차는 [[deployment-and-release]]에 있다.
- **미완료 인계**: 독립 심사자 본인의 접근, 영상, 최종 제출은 이 절에서 모두 체크되지 않았다. HTTP 측정만으로 "제출 준비 완료"를 선언하지 않는다.

## 미확인으로 남은 것

provider 요청의 직접 헤더·본문, 정의 응답 본문 전체 검사, sentinel 헤더 검사 누락분, 실행되지 않은 한도(진행 중 deadline 포함), replacement_values 중복의 브라우저 확인과 최상위 B의 잘못된 형식·빈 그래프·누락 참조 변형, 심사자 접근. 이들은 Node 결과로 대체하지 않는다. 사용자 확인된 키 폐기는 사용자의 보고이지 계정 검증이 아니다. 어느 것도 "출품 준비 완료"로 읽으면 안 된다.

## 기록할 때의 교훈

수기로 옮긴 중간 기록의 실행 시각이 원자료와 어긋난 적이 있어, 블록의 보고 범위와 실제 요청 시각, 제공되지 않은 개별 시각을 구분해 적도록 고쳤다. 원장 수정 때는 구현자 주장을 원자료와 대조한다([[no-compat-code-lessons]]).
