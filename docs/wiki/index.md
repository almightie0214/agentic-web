---
description: Agent Review Desk + Spec Scout 위키의 진입점. 프로젝트 지도, 두 사이트, 벤더링 런타임, 네트워크 발행, 검사 기능, 테스트, 교훈 페이지로 안내한다.
---

# 위키 목차

Open Agentic Web Challenge 출품작(Agent Review Desk + Spec Scout)의 현재 코드 구조를 설명한다. 구현된 범위는 기반 골격·런타임·Site A 네트워크 발행과 Site A의 검사 기능(규칙·action·URL 감사·UI)까지다. Site B 네트워크는 아직 없다.

## 지도와 사이트

- [[project-overview]] — 목표, 제약, 디렉터리 지도, 아직 없는 것
- [[site-a-review-desk]] — Site A 페이지: 키 없는 검사·샘플·URL 감사 UI, 채팅 연결, 실행 그래프
- [[site-b-spec-scout-shell]] — 네트워크 없이 설정·채팅 UI만 띄우는 Site B 셸
- [[vendored-runtime]] — 사이트별로 복사한 nsDeploy 런타임과 로컬 변경
- [[network-publication]] — manifest, resolved 네트워크 JSON, 라우터 기본값, action 선언

## Review Desk 검사 기능

- [[validator-rules]] — `validateNetwork`: 규칙 ID, `valid` 기준, 스키마·resolved·참조·합성 판정과 이유
- [[validator-action]] — `validate_network` action과 리포트 근거 전용 reviewer 지시문
- [[url-audit]] — `auditUrl`: base path 보존, 획득 오류와 규칙 위반 구분, readiness
- [[fixtures-and-samples]] — 정상 1·불량 3 입력과 내장 샘플 4종

## 검사와 교훈

- [[testing-and-gate]] — `theora.gate.json`, `npm test`, 각 테스트 파일의 검사 범위
- [[no-compat-code-lessons]] — 호환 코드 금지 규칙과 리뷰에서 얻은 교훈
