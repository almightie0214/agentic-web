---
description: Agent Review Desk + Spec Scout 위키의 진입점. 프로젝트 지도, 두 사이트, 벤더링 런타임, 네트워크 발행, 검사, 교훈 페이지로 안내한다.
---

# 위키 목차

Open Agentic Web Challenge 출품작(Agent Review Desk + Spec Scout)의 현재 코드 구조를 설명한다. 지금 구현된 범위는 기반 골격·런타임·Site A 네트워크 발행까지다.

- [[project-overview]] — 목표, 제약, 디렉터리 지도, 아직 없는 것
- [[site-a-review-desk]] — Site A 셸과 `boot` 연결, 실패 처리
- [[site-b-spec-scout-shell]] — 네트워크 없이 설정·채팅 UI만 띄우는 Site B 셸
- [[vendored-runtime]] — 사이트별로 복사한 nsDeploy 런타임과 로컬 변경
- [[network-publication]] — manifest, resolved 네트워크 JSON, 라우터 기본값
- [[testing-and-gate]] — `theora.gate.json`, `npm test`, `tests/smoke.test.mjs`의 검사 범위
- [[no-compat-code-lessons]] — 호환 코드 금지 규칙과 리뷰에서 얻은 교훈
