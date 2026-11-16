---
description: docs/demo-checklist.md 실제 브라우저 검증 원장의 구성, 증거 규칙, 시나리오 B01–B10, run 1 실패와 런타임 보정, run 2 재확인 범위와 남은 미확인
---

# 실제 브라우저 검증 원장

`docs/demo-checklist.md`는 절차 체크리스트이자 **사용자가 실행해 제공한** 로컬 브라우저 관찰의 원장이다. 체크리스트 작성이나 Node exit 0은 런타임 검증 완료가 아니다. 구현자는 정제된 Markdown 기록을 읽었을 뿐 라이브 브라우저 세션이나 스크린샷을 본 것이 아니며 원장은 그렇게 명시한다. 정적 쪽은 [[conformance-cli]], 배포는 [[deployment-and-release]]에 있다.

## 구성

| 절 | 내용 |
| --- | --- |
| 상단 상태·준비 기록 | 현재 판정 요약, 준비 당시 환경, 사용자 결정(사용자가 직접 실행, Otari 경연 크레딧만 사용, 두 번째 모델은 내장 패널에서 선택) |
| §1 공통 설정·증거 규칙 | A는 `site-a/`, B는 `site-b/`를 각각 별도 origin에 서빙, 개별 케이스마다 새 페이지·초기화한 상태, 패널로만 모델 전환, DevTools Network와 Developer view 관찰, 키는 비공개 검사 후 존재 여부·`<redacted>`만 기록 |
| §2 시나리오 B01–B10 | 2-agent 위임·action(B01), 동의 후 정확한 이름의 피어(B02), 거절(B03), 거부된 origin(B04), 잘못된 네트워크·중복 이름(B05), 잘못된 명시적 피어 이름(B06), 키 비전달·caller router 유지(B07), sentinel 주입과 `remote_call.requestPayload` 필터링 관찰(B08), 합성 사이클(B09), 실행 한도(B10) |
| §3 실행 원장 | run 1 출처·한계, 사례 관찰, 발견과 후속, 승인된 소스 보정, run 2 중간·최종 재확인, 현재 수용 요약, 케이스 기록 템플릿 |
| §4 공개 배포·심사 인계 | 활성화 뒤 체크 항목(모두 미체크) |
| §5 영상 계획 | 한 사례 서사, 녹화본 아님 |

B08은 [[conformance-cli]]의 `test-slydata` 샘플을 기존 `Engine.runTurn(…, { slyData })` 옵션으로 주입하고 정의 fetch의 URL·헤더·본문을 병행 관찰하도록 한다. 판정은 PASS·FAIL·UNVERIFIED이며 모델이 도구를 썼다거나 비밀을 지켰다고 말한 것은 증거가 아니다.

## run 1에서 드러난 실패와 현재 코드의 반영

- **B05 중복 agent 이름이 추론 전에 거부되지 않았다.** `AgentNetwork`가 `Map`에 덮어써 마지막 정의만 남았다. 이제 `site-a/runtime/kernel.js`·`site-b/runtime/kernel.js` 생성자가 `filterConfig` 치환·trim 뒤 `Duplicate agent name '<name>'.`을 던진다. 최상위·피어 컴파일 모두에 적용된다(`tests/smoke.test.mjs`의 "network rejects duplicate names after config filtering").
- **B07 키가 loopback 쿠키로 A의 정적 서버에 전달됐다.** peer 격리와 caller router 유지는 관찰됐지만 광범위한 비노출은 실패였다. `byok.js`에서 키가 든 프로필 쿠키 미러링을 제거하고 `ui.js`의 쿠키 공유 안내도 뺐다. 프로필은 origin 로컬 localStorage, 탭 설정(sessionStorage)이 우선이다. 쿠키 이전·자동 정리는 없고 기존 테스트 쿠키는 사용자가 지워야 한다. 두 사이트 복사본 모두에 적용했다([[vendored-runtime]]).

## run 2 재확인(보정된 런타임 해시와 대응)과 범위

A/B 최상위 로더의 중복 이름 거부, 중복 피어의 피어 추론 전 거부, 패널 저장·선택·삭제·재로드와 두 모델 전환, 관찰된 A/B 정적 요청에 키 부재와 두 모델에서 caller router 유지가 PASS로 기록됐다. 반면 run 1의 나머지 사례(B01–B04, B06, B08–B09)는 run 1 관찰과 한계를 유지하며 보정 런타임에서 전부 다시 돌린 것이 아니다. B10 PASS는 관찰된 **24-agent 호출 상한**에 한정된다.

## 미확인으로 남은 것

provider 요청의 직접 헤더·본문, 정의 응답 본문 전체 검사, sentinel 헤더 검사 누락분, 실행되지 않은 한도(진행 중 deadline 포함), replacement_values 중복의 브라우저 확인과 최상위 B의 잘못된 형식·빈 그래프·누락 참조 변형, 공개 HTTPS/CORS와 심사 접근. 이들은 Node 결과로 대체하지 않는다. 사용자 확인된 키 폐기는 사용자의 보고이지 계정 검증이 아니다. 어느 것도 "출품 준비 완료"로 읽으면 안 된다.

## 기록할 때의 교훈

수기로 옮긴 중간 기록의 실행 시각이 원자료와 어긋난 적이 있어, 블록의 보고 범위와 실제 요청 시각, 제공되지 않은 개별 시각을 구분해 적도록 고쳤다. 원장 수정 때는 구현자 주장을 원자료와 대조한다([[no-compat-code-lessons]]).
