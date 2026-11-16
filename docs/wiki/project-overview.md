---
description: 프로젝트의 목표·고정 제약·디렉터리 책임·현재 구현 범위를 한곳에서 설명하는 지도 페이지
---

# 프로젝트 개요

Agent Review Desk(Site A)와 Spec Scout(Site B)는 Worldwide Agentic Web MVP Profile 0.2를 따르는 정적 브라우저 에이전트 사이트 두 개다. 애플리케이션 백엔드·DB·결제·인증은 두지 않는다. 근거: `README.md`, `docs/worldwide_agentic_web_mvp_spec.md`.

배포 계획은 Site A = GitHub Pages(`.github/workflows/pages.yml`, 아티팩트는 `site-a/`만), Site B = Cloudflare Pages(`site-b/_headers`로 CORS)이다. 공개 A(`https://almightie0214.github.io/agentic-web/`)와 공개 B(`https://spec-scout.pages.dev/`)의 HTTPS·ACAO·404 응답은 실측돼 원장에 있다([[deployment-and-release]]). 아래 [[vendored-runtime]] 등 세부 페이지와 [[testing-and-gate]]도 참고한다.

## 현재 구현된 것

- 스펙 사본 `docs/worldwide_agentic_web_mvp_spec.md`: 고정 커밋 `63a956cf4653f610b1c238c70946f4d7647d17a8`의 원문 앞에 출처 고지만 덧붙였다. 라이선스는 Apache-2.0(`LICENSE`).
- 두 사이트 각각의 런타임 복사본: [[vendored-runtime]].
- Site A: 런타임이 발행된 2-agent 네트워크를 불러와 설정·채팅·에이전트 점검 UI를 띄운다. [[site-a-review-desk]], [[network-publication]].
- Site A 검사 기능: manifest + resolved network JSON을 결정적 규칙으로 판정하는 [[validator-rules]], 이를 에이전트에 읽기 전용 도구로 제공하는 [[validator-action]], 공개 URL의 JSON을 같은 규칙으로 판정하는 [[url-audit]], 정상/실패 데모 입력인 [[fixtures-and-samples]]. 판정은 규칙이 하고 에이전트는 설명만 한다.
- Site B: 발췌 근거를 instructions에 직접 담은 1-agent `spec_scout` 네트워크를 `boot()`로 로드하는 정보 제공 전용 사이트. [[site-b-spec-scout]].
- 피어 연결: Site A coordinator가 `links.json`의 심볼릭 `spec_scout`를 해석해 동의 후 B의 네트워크를 A의 브라우저 런타임에서 실행하는 배선. 목적지는 공개 B `https://spec-scout.pages.dev/spec_scout`이며 공개 응답과 브라우저 피어 흐름이 범위가 한정된 실측으로 기록돼 있다. [[peer-connection]].
- 저장소 정적 적합성 CLI `tools/check-conformance.mjs`: 공유 규칙을 재사용하고 발행 파일·링크·private-context 선언·CORS 설정을 감사한다. [[conformance-cli]].
- 실제 브라우저 검증 원장 `docs/demo-checklist.md`: 사용자가 실행한 로컬·공개 브라우저 관찰, 공개 HTTP 측정, 미확인 항목. [[browser-evidence-ledger]].
- 역할 변환기(AW5): Theora 역할 지시문, 범용 Markdown(Claude agents) 파일, Google ADK Agent Config 폴더를 결정적으로 이 사이트의 런타임이 실행하는 resolved JSON 네트워크·manifest·links로 내보낸다(ADK는 `sub_agents` 위임 그래프를 그대로 옮기고 옮기지 않은 키를 이름으로 알린다). 규칙 명세 [[converter-mapping-contract]], 순수 코어·Node CLI·웹 탭 구조 [[converter-code-structure]], 테스트와 교훈 [[converter-verification]]. 쉘·git·gate 같은 하네스 기능과 ADK의 실행 동작 자체는 변환하지 않는다.
- 시험 실행: 검사를 통과한 네트워크를 방문자가 Review Desk에서 직접 눌러 같은 탭에서 한 메시지 돌린다. 가져온 정의는 게시 출처 없는 피어이고 추론은 방문자의 router·키로 간다. 두 페이지가 Import → Check → Ask the spec → Test run → Download 한 흐름으로 읽힌다. [[editor-test-run]]. 피어 참조는 부른 쪽 base로 한 번 풀어 정책·동의·읽기가 같은 주소를 쓴다. [[peer-destination-rule]].
- 실행 계약: 두 runtime 사본이 하나의 실행 루프, 실패를 답 문자열로 바꾸지 않는 경계 두 곳, 호출 범위 시간 한도(실측으로 정한 상한 180초)와 네트워크 선언 composition deadline, 실행되는 에이전트의 temperature 전달·검사, 정책 뒤 동의 기록, 화면에 보이는 부팅 오류를 지킨다. 쓰지 않는 기능(MCP·toolbox·coded tool·원격 action)은 컴파일에서 거부된다. [[runtime-execution-contract]].
- 페이지 CSP와 `tools/browser-check.mjs`: [[page-csp-and-browser-check]].
- 영문 `README.md`, 제출 초안 `docs/devpost.md`: [[deployment-and-release]]. 두 문서는 심사자가 읽는 현재 동작 설명이고 `devpost.md`는 제출 마감과 참가자 몫 할 일 표를 갖춘다. 해시·실패 이력은 원장에 둔다.
- 검사: [[testing-and-gate]].

## 디렉터리 책임

| 경로 | 책임 |
| --- | --- |
| `site-a/` | Site A 정적 번들: `index.html`, `site.js`, `artifact-download.js`, `styles.css`, `agent-manifest.json`, `links.json`, `review_desk.network.json`, 검사 모듈 `validator-rules.mjs`·`actions.js`·`audit.js`, 데모 입력 `samples/`, 변환 탭 `converter.html`·`converter.js`와 순수 변환 모듈·샘플 `converter/`, `runtime/` |
| `site-b/` | Site B 정적 번들: `index.html`(스타일 인라인), `site.js`, `agent-manifest.json`, `spec_scout.network.json`(실행 배포본), `spec-excerpts.json`(발췌 저작 원본, 런타임이 읽지 않음), `runtime/`. Site A 파일에 의존하지 않는다 |
| `tests/` | `smoke.test.mjs`, `peer.test.mjs`, `conformance.test.mjs`, `validator.test.mjs`, `actions.test.mjs`, `audit.test.mjs`, `desk-ui.test.mjs`, `editor-runtime.test.mjs`, 공용 입력 `fixtures.mjs`, 변환기 테스트·픽스처 `converter/` |
| `tools/` | `check-conformance.mjs` 정적 적합성 CLI, `theora2hocon/theora2hocon.mjs` 변환 CLI, `browser-check.mjs` Edge/CDP 브라우저 확인(게이트 밖) |
| `.github/workflows/` | `pages.yml`: Site A만 배포 |
| `docs/` | 스펙 사본, `converter.md`(변환 매핑 규약), `demo-checklist.md`(브라우저 검증 원장), `devpost.md`(제출 초안). 위키는 `docs/wiki/` |

빈 디렉터리와 .gitkeep은 두지 않는다. 디렉터리는 파일이 생길 때 만들어진다.

## 지켜야 할 제약과 이유

- 자체 파일 참조는 모두 상대경로다. GitHub Pages가 agentic-web 같은 하위 경로로 배포하므로 루트 절대경로는 404가 된다. 다른 오리진의 피어 URL만 절대 URL이다. `site-a/site.js`는 `new URL('./', import.meta.url)`로 기준 URL을 만든다.
- 런타임은 레퍼런스(nsDeploy) 복사본을 쓰고 새로 만들지 않는다. 설정 패널과 키 저장 정책도 새로 만들지 않는다.
- 발행 네트워크 정의는 resolved JSON이며 공개를 전제로 하므로 비밀·키를 넣지 않는다.
- 판정 규칙은 `site-a/validator-rules.mjs` 한 곳이다. 붙여넣기·action·URL 감사가 재사용하며 복제하지 않는다.
- 사이트 콘텐츠는 영어다. 예제(피자/게스트하우스)는 구조 참고만 하고 문구·코드를 베끼지 않는다.
- 호환 코드는 두지 않는다: [[no-compat-code-lessons]].

## 아직 없는 것

- 정적 검사가 증명하지 못하는 실행 동작(브라우저의 피어 순환 중단, 동의, CORS, 상한 집행). 규칙 리포트와 CLI는 이를 `runtime.*` 미확인으로 표시한다. 일부는 사용자가 실행한 로컬 브라우저 관찰로 기록돼 있다. 변환 번들은 로드·위임이 반복 관찰됐지만(시험 실행 뒤 공개 사이트에서 ADK 세 번·Claude 한 번의 변환 시험 실행과 Spec Scout 질문 한 번의 위임 성공과 답 가독성은 §9에 범위 한정 PASS로 기록) 이전 AW5 Theora 샘플의 답변 품질은 FAIL로 남아 있고, 출력 규칙 도입 뒤 CLI 생성 묶음 1회 실행의 내부 specialist 답에도 메타 텍스트가 남았다. 수정 전 공개 Edge·Firefox 실측에서 피어 답의 모델 토큰이 일부 깨졌다. 세 네트워크가 temperature 0.2를 선언한 뒤의 공개 실측 여덟 번에서는 읽은 답에 깨진 문장이 관찰되지 않았지만 범위가 한정된 관찰이다([[browser-evidence-ledger]], [[runtime-execution-contract]]).
- 독립 심사자 본인의 공개 사이트 접근 확인, 영상, 최종 제출, provider 요청 헤더·본문 직접 관찰. 공개 HTTP·브라우저 측정은 특정 리비전·시각의 스냅샷이며 이 상태에서는 출품 준비 완료로 표시하지 않는다.
