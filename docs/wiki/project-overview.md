---
description: 프로젝트의 목표·고정 제약·디렉터리 책임·현재 구현 범위를 한곳에서 설명하는 지도 페이지
---

# 프로젝트 개요

Agent Review Desk(Site A)와 Spec Scout(Site B)는 Worldwide Agentic Web MVP Profile 0.2를 따르는 정적 브라우저 에이전트 사이트 두 개다. 애플리케이션 백엔드·DB·결제·인증은 두지 않는다. 근거: `README.md`, `docs/worldwide_agentic_web_mvp_spec.md`.

계획된 배포는 Site A = GitHub Pages, Site B = Cloudflare Pages(_headers 파일로 CORS 강제)이다. 설계 문서의 계획이며 저장소에는 호스팅 설정 파일이 아직 없다(`README.md`도 호스팅 설정은 제공하지 않는다고 적는다). 아래 [[vendored-runtime]] 등 세부 페이지와 [[testing-and-gate]]도 참고한다.

## 현재 구현된 것

- 스펙 사본 `docs/worldwide_agentic_web_mvp_spec.md`: 고정 커밋 `63a956cf4653f610b1c238c70946f4d7647d17a8`의 원문 앞에 출처 고지만 덧붙였다. 라이선스는 Apache-2.0(`LICENSE`).
- 두 사이트 각각의 런타임 복사본: [[vendored-runtime]].
- Site A: 런타임이 발행된 2-agent 네트워크를 불러와 설정·채팅·에이전트 점검 UI를 띄운다. [[site-a-review-desk]], [[network-publication]].
- Site A 검사 기능: manifest + resolved network JSON을 결정적 규칙으로 판정하는 [[validator-rules]], 이를 에이전트에 읽기 전용 도구로 제공하는 [[validator-action]], 공개 URL의 JSON을 같은 규칙으로 판정하는 [[url-audit]], 정상/실패 데모 입력인 [[fixtures-and-samples]]. 판정은 규칙이 하고 에이전트는 설명만 한다.
- Site B: 네트워크 없이 설정 UI만 띄우는 셸. [[site-b-spec-scout-shell]].
- 검사: [[testing-and-gate]].

## 디렉터리 책임

| 경로 | 책임 |
| --- | --- |
| `site-a/` | Site A 정적 번들: `index.html`, `site.js`, `styles.css`, `agent-manifest.json`, `review_desk.network.json`, 검사 모듈 `validator-rules.mjs`·`actions.js`·`audit.js`, 데모 입력 `samples/`, `runtime/` |
| `site-b/` | Site B 정적 번들: `index.html`(스타일 인라인), `site.js`, `runtime/`. Site A 파일에 의존하지 않는다 |
| `tests/` | `smoke.test.mjs`, `validator.test.mjs`, `actions.test.mjs`, `audit.test.mjs`, `desk-ui.test.mjs`, 공용 입력 `fixtures.mjs` |
| `docs/` | 스펙 사본(위키는 `docs/wiki/`) |
| tools 디렉터리 | README가 개발 도구용으로 예약했다고 말하지만 현재 파일이 없다 |

빈 디렉터리와 .gitkeep은 두지 않는다. 디렉터리는 파일이 생길 때 만들어진다.

## 지켜야 할 제약과 이유

- 자체 파일 참조는 모두 상대경로다. GitHub Pages가 agentic-web 같은 하위 경로로 배포하므로 루트 절대경로는 404가 된다. 다른 오리진의 피어 URL만 절대 URL이다. `site-a/site.js`는 `new URL('./', import.meta.url)`로 기준 URL을 만든다.
- 런타임은 레퍼런스(nsDeploy) 복사본을 쓰고 새로 만들지 않는다. 설정 패널과 키 저장 정책도 새로 만들지 않는다.
- 발행 네트워크 정의는 resolved JSON이며 공개를 전제로 하므로 비밀·키를 넣지 않는다.
- 판정 규칙은 `site-a/validator-rules.mjs` 한 곳이다. 붙여넣기·action·URL 감사가 재사용하며 복제하지 않는다.
- 사이트 콘텐츠는 영어다. 예제(피자/게스트하우스)는 구조 참고만 하고 문구·코드를 베끼지 않는다.
- 호환 코드는 두지 않는다: [[no-compat-code-lessons]].

## 아직 없는 것

- Site B의 네트워크(README는 후속 단계 AW3에서 연결한다고 적는다).
- 산출물 적합성을 gate 단계에서 따로 검사하는 명령(현재 gate는 `node --test`뿐이다).
- 정적 검사가 증명하지 못하는 실행 동작(브라우저의 피어 순환 중단, 동의, CORS, 상한 집행). 규칙 리포트는 이를 `runtime.*` 미확인으로 표시한다.
- 실제 provider나 배포된 브라우저 세션에 대한 검증. 현재 테스트는 이를 확인하지 않는다.
