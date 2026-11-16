---
description: Agent Review Desk + Spec Scout 위키의 진입점. 지도, 두 사이트, 피어 연결과 목적지 규칙, 런타임 실행 계약, 검사 기능, ADK 포함 변환기와 시험 실행, 배포·검증 원장, 테스트, 교훈으로 안내한다.
---

# 위키 목차

Open Agentic Web Challenge 출품작(Agent Review Desk + Spec Scout)의 현재 코드 구조를 설명한다. 구현된 범위는 기반 골격·런타임·Site A 네트워크 발행과 검사 기능(규칙·action·URL 감사·UI), Site B의 Spec Scout 네트워크, Site A에서 Site B로 가는 피어 배선, 피어 참조를 한 번 풀어 정식 주소 하나로 판단·읽는 규칙, 두 runtime 사본의 실행 계약(실패를 답으로 바꾸지 않는 경계, 공개 실측으로 정한 호출 범위 시간 한도, 실행되는 에이전트의 temperature 전달·검사, 정책 뒤 동의 기록), 세 페이지의 CSP와 브라우저 확인 도구, 저장소 정적 적합성 CLI, Theora/Markdown/Google ADK 에이전트 팀을 네트워크로 내보내는 결정적 변환기(출력 규칙·형식별 설명·옮기지 않은 키 알림 포함; Node CLI와 Site A 변환 탭), 검사를 통과한 네트워크를 Review Desk에서 같은 탭에 시험 실행하는 흐름(Import → Check → Ask the spec → Test run → Download), 배포 설정(Pages 워크플로·`_headers`)과 심사자용 영문 README·제출 원고(현재 동작만 적고 해시·실패 이력은 원장에 둔다), 사용자와 구현자가 실행한 브라우저 검증 원장이다. 피어 대상은 공개 B 주소(`https://spec-scout.pages.dev/spec_scout`)이다. 세 네트워크가 temperature 0.2를 선언한 뒤 공개 Edge·Firefox와 변환 샘플에서 고정 질문 여덟 번이 끝까지 진행됐고 읽은 답에 깨진 문장이 관찰되지 않았다는 범위 한정 실측과, ADK·Claude 샘플의 변환 → 시험 실행이 공개 사이트에서 실제 모델로 위임 성공·깨지지 않은 답으로 끝났다는 범위 한정 실측(§9)이 원장에 기록돼 있다(정확성·인용 충실도의 증명은 아니다). 독립 심사자 접근·영상·최종 제출은 미완료다.

## 지도와 사이트

- [[project-overview]] — 목표, 제약, 디렉터리 지도, 아직 없는 것
- [[site-a-review-desk]] — Site A 페이지: 키 없는 검사·샘플·URL 감사 UI, 채팅 연결, 시험 실행·내려받기 구역, 실행 그래프, 변환 탭에서 온 입력 받기
- [[site-b-spec-scout]] — Site B: 발췌 근거를 담은 1-agent 네트워크, 저작 원본과 배포본, boot 구조
- [[peer-connection]] — Site A coordinator → Site B 피어: links.json·allowed_peers 한 쌍, 동의 후 로컬 실행, 공개 주소, 공개 실측 결과와 한계, 주소를 한 곳에서만 단언하는 테스트
- [[peer-destination-rule]] — 피어 참조를 부른 쪽 base로 한 번 풀어 정책·동의·순환·캐시·예산·읽기가 같은 정식 주소를 쓰는 규칙, 게시 파일의 같은 출처·redirect 금지, 도구 별칭 충돌 방지
- [[vendored-runtime]] — 사이트별로 복사한 nsDeploy 런타임과 로컬 변경(호환 코드·쓰지 않는 기능 제거, 중복 이름 거부, 쿠키 미러링 제거, temperature 전달·상한 변경, `_compileDefinition`·`runEditor`, 피어 목적지)과 모듈 지도
- [[runtime-execution-contract]] — 실패 경계 두 곳, 호출 범위 시간 한도와 composition deadline 선언, 실측에서 나온 시간 상한 공식, temperature 선택·검사, 정책 뒤 동의 이벤트, 은퇴한 기능의 컴파일 거부, 부팅 오류 표시
- [[page-csp-and-browser-check]] — 세 페이지의 CSP meta와 `tools/browser-check.mjs`가 확인하는 흐름·위반 집계
- [[network-publication]] — manifest, resolved 네트워크 JSON, 라우터 기본값, temperature·시간 한도 선언, action·링크 선언

## Review Desk 검사 기능

- [[validator-rules]] — `validateNetwork`: 규칙 ID(`llm.temperature` 포함), `valid` 기준, 스키마·resolved·참조·합성 판정과 이유
- [[validator-action]] — `validate_network` action과 리포트 근거 전용 reviewer 지시문
- [[url-audit]] — `auditUrl`: base path 보존, 획득 오류와 규칙 위반 구분, readiness
- [[fixtures-and-samples]] — 정상 1·불량 3 입력, 내장 샘플 4종, `test-slydata` 샘플, 변환기 입력(ADK 샘플 포함)과의 구분

## 역할 변환기 (AW5)와 시험 실행

- [[converter-mapping-contract]] — `docs/converter.md`: 입력 선택(Theora·ADK·Markdown), ADK 참조 따라 읽기·지원 범위, 공용 YAML 부분집합, 이름·설명·비밀/경로 제거와 옮기지 않은 키 알림, front 선택, 네트워크(temperature 0.2·시간 한도 포함)·manifest·links 출력, 변환기 소유 출력 규칙과 형식별 설명, 변환하지 않는 것
- [[converter-code-structure]] — `site-a/converter/` 순수 모듈 4개와 `adkReferences`, `tools/theora2hocon/theora2hocon.mjs`, 변환 탭, Review Desk 일회성 전달
- [[converter-verification]] — `tests/converter/` 구성(ADK 포함), AW2·AW4 정적 검증 연계, 리뷰 교훈의 현재 방어
- [[editor-test-run]] — 검사를 통과한 네트워크를 게시 출처 없는 피어로 같은 탭에서 실행(router·예산·사이트 능력 규칙, `Engine.runEditor`, 화면 제어), 다섯 단계 nav와 내려받기

## 적합성·배포·검증 근거

- [[conformance-cli]] — `tools/check-conformance.mjs`: 공유 규칙 재사용, `publication.*` 검사, private-context 선언·CORS 설정 감사
- [[deployment-and-release]] — `pages.yml`(site-a만 배포), `site-b/_headers`, `site-b/404.html`, 페이지 CSP와 배포 바이트 확인, 피어 URL 변경 절차, 공개 실측, 심사자용 README·devpost 구성, 남은 미완료
- [[browser-evidence-ledger]] — `docs/demo-checklist.md`: 실제 브라우저 검증 시나리오·증거 규칙·run 1 실패와 보정·공개 HTTP 측정과 공개 브라우저 피어 흐름·AW5 변환 번들 기록·judge-ready 수정 뒤 착륙 트리·공개 Edge/Firefox 실측(§6)·temperature 적용 뒤 공개 실측(§7)·시간 한도 계산(§8)·ADK·Claude 변환 시험 실행 공개 실측(§9)·미확인

## 검사와 교훈

- [[testing-and-gate]] — `theora.gate.json`(테스트 + 적합성 CLI), `npm test`, 각 테스트 파일(`peer.test.mjs`·`editor-runtime.test.mjs`·`conformance.test.mjs`·`tests/converter/` 포함)의 검사 범위와 게이트 밖 `browser-check`
- [[no-compat-code-lessons]] — 호환 코드 금지 규칙과 리뷰에서 얻은 교훈
