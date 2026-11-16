---
description: Agent Review Desk + Spec Scout 위키의 진입점. 프로젝트 지도, 두 사이트, 피어 연결, 벤더링 런타임과 실행 계약, 페이지 CSP, 네트워크 발행, 검사 기능, 적합성 CLI, 역할 변환기, 배포·브라우저 검증 원장, 테스트, 교훈 페이지로 안내한다.
---

# 위키 목차

Open Agentic Web Challenge 출품작(Agent Review Desk + Spec Scout)의 현재 코드 구조를 설명한다. 구현된 범위는 기반 골격·런타임·Site A 네트워크 발행과 검사 기능(규칙·action·URL 감사·UI), Site B의 Spec Scout 네트워크, Site A에서 Site B로 가는 피어 배선, 두 runtime 사본의 실행 계약(실패를 답으로 바꾸지 않는 경계, 호출 범위 시간 한도, 정책 뒤 동의 기록), 세 페이지의 CSP와 브라우저 확인 도구, 저장소 정적 적합성 CLI, Theora/Markdown 역할을 네트워크로 내보내는 결정적 변환기(출력 규칙·형식별 설명 포함; Node CLI와 Site A 변환 탭), 배포 설정(Pages 워크플로·`_headers`)과 영문 README·제출 초안(Testing instructions·제출 마감 포함), 사용자와 구현자가 실행한 브라우저 검증 원장이다. 피어 대상은 공개 B 주소(`https://spec-scout.pages.dev/spec_scout`)이고, 수정 뒤 공개 Edge·Firefox에서 Allow → 피어 답 → 최종 답이 끝까지 진행된 것이 범위가 한정된 실측으로 원장에 기록돼 있다(답 품질은 PASS가 아니다). 독립 심사자 접근·영상·최종 제출은 미완료다.

## 지도와 사이트

- [[project-overview]] — 목표, 제약, 디렉터리 지도, 아직 없는 것
- [[site-a-review-desk]] — Site A 페이지: 키 없는 검사·샘플·URL 감사 UI, 채팅 연결, 실행 그래프, 변환 탭에서 온 입력 받기
- [[site-b-spec-scout]] — Site B: 발췌 근거를 담은 1-agent 네트워크, 저작 원본과 배포본, boot 구조
- [[peer-connection]] — Site A coordinator → Site B 피어: links.json·allowed_peers 한 쌍, 동의 후 로컬 실행, 공개 주소, 공개 실측 결과와 한계, 주소를 한 곳에서만 단언하는 테스트
- [[vendored-runtime]] — 사이트별로 복사한 nsDeploy 런타임과 로컬 변경(호환 코드·쓰지 않는 기능 제거, 중복 이름 거부, 쿠키 미러링 제거)과 모듈 지도
- [[runtime-execution-contract]] — 실패 경계 두 곳, 호출 범위 시간 한도와 composition deadline 선언, 정책 뒤 동의 이벤트, 은퇴한 기능의 컴파일 거부, 부팅 오류 표시
- [[page-csp-and-browser-check]] — 세 페이지의 CSP meta와 `tools/browser-check.mjs`가 확인하는 흐름·위반 집계
- [[network-publication]] — manifest, resolved 네트워크 JSON, 라우터 기본값, action·링크 선언

## Review Desk 검사 기능

- [[validator-rules]] — `validateNetwork`: 규칙 ID, `valid` 기준, 스키마·resolved·참조·합성 판정과 이유
- [[validator-action]] — `validate_network` action과 리포트 근거 전용 reviewer 지시문
- [[url-audit]] — `auditUrl`: base path 보존, 획득 오류와 규칙 위반 구분, readiness
- [[fixtures-and-samples]] — 정상 1·불량 3 입력, 내장 샘플 4종, `test-slydata` 샘플, 변환기 입력과의 구분

## 역할 변환기 (AW5)

- [[converter-mapping-contract]] — `docs/converter.md`: 입력 선택, 이름·설명·비밀/경로 제거, front 선택, 네트워크·manifest·links 출력, 변환기 소유 출력 규칙과 형식별 설명, 변환하지 않는 것
- [[converter-code-structure]] — `site-a/converter/` 순수 모듈 4개, `tools/theora2hocon/theora2hocon.mjs`, 변환 탭, Review Desk 일회성 전달
- [[converter-verification]] — `tests/converter/` 구성, AW2·AW4 정적 검증 연계, 리뷰 교훈의 현재 방어

## 적합성·배포·검증 근거

- [[conformance-cli]] — `tools/check-conformance.mjs`: 공유 규칙 재사용, `publication.*` 검사, private-context 선언·CORS 설정 감사
- [[deployment-and-release]] — `pages.yml`(site-a만 배포), `site-b/_headers`, `site-b/404.html`, 페이지 CSP와 배포 바이트 확인, 피어 URL 변경 절차, 공개 실측, README·devpost 인계(Testing instructions·제출 마감), 남은 미완료
- [[browser-evidence-ledger]] — `docs/demo-checklist.md`: 실제 브라우저 검증 시나리오·증거 규칙·run 1 실패와 보정·공개 HTTP 측정과 공개 브라우저 피어 흐름·AW5 변환 번들 기록·judge-ready 수정 뒤 착륙 트리·공개 Edge/Firefox 실측(§6)·미확인

## 검사와 교훈

- [[testing-and-gate]] — `theora.gate.json`(테스트 + 적합성 CLI), `npm test`, 각 테스트 파일(`peer.test.mjs`·`conformance.test.mjs`·`tests/converter/` 포함)의 검사 범위와 게이트 밖 `browser-check`
- [[no-compat-code-lessons]] — 호환 코드 금지 규칙과 리뷰에서 얻은 교훈
