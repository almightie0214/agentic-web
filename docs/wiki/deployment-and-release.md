---
description: Site A GitHub Pages 워크플로, Site B _headers CORS 설정, README·devpost 인계 문서의 역할, 피어 URL 설정·변경 절차와 공개 배포 미확인 범위
---

# 배포 설정과 출품 인계

두 사이트는 **서로 다른 origin의 정적 호스트**에 따로 발행한다. 서버 런타임·백엔드·DB·인증은 없다. 같은 origin에 두 사이트 파일이 섞이면 피어 격리 시연이 무너지므로 발행 루트를 사이트 디렉터리로 한정하는 것이 이 페이지의 핵심 경계다. 설정 파일이 있다는 것은 활성화·공개 응답의 증거가 아니다.

## Site A — `.github/workflows/pages.yml`

- 트리거: `site-a/**` 또는 이 워크플로를 바꾼 `main` push와 `workflow_dispatch`. `site-a/converter/`·`converter.html`도 `site-a/` 아래라 함께 배포되고, 웹 변환 탭이 import하는 코어가 아티팩트 안에 있어야 하는 이유도 여기 있다([[converter-code-structure]]). 다른 경로만 바꾼 push는 배포하지 않는다. 권한은 `contents: read`, 배포 job은 `pages: write`·`id-token: write`, 환경 `github-pages`.
- 단계: checkout → `actions/configure-pages` → `actions/upload-pages-artifact`(`path: site-a`) → `actions/deploy-pages`.
- **아티팩트는 저장소 루트가 아니라 `site-a/`**다. Site B 파일이 A origin에 섞이지 않게 하는 이유다. 워크플로 주석도 같은 이유를 적는다.
- 이 파일은 한때 후속 commit에서 통째로 삭제된 적이 있어 `tests/peer.test.mjs`의 "Site A Pages artifact" 테스트가 워크플로 존재와 업로드 `path: site-a`를 정규식으로 확인한다. 루트 업로드로 바꾸는 변이는 이 테스트가 실패시킨다. 단 GitHub Pages 활성화·실제 배포 결과는 이 테스트가 확인하지 못한다.

## Site B — `site-b/_headers`

`/*`에 `Access-Control-Allow-Origin: *` 하나(공개 정적 아티팩트용, `Allow-Credentials` 없음). Cloudflare Pages가 이 파일을 읽어 응답 헤더를 붙이도록 `site-b/`를 발행 루트로 배포한다. 빌드 단계는 없고 `runtime/`·manifest·네트워크 정의·`_headers`·`404.html`(스크립트 없는 최상위 오류 페이지)이 함께 올라가야 한다. `spec-excerpts.json`은 실행에 필요 없다.

검증은 두 겹이지만 모두 **로컬 설정 검사**다: `tests/peer.test.mjs`가 `/*` 규칙과 credentials 헤더 부재를 확인하고, [[conformance-cli]]의 `publication.cors`가 발행된 각 아티팩트에 ACAO `*`가 정확히 하나 적용되는지 규칙 병합까지 본다. 배포된 HTTPS URL의 실제 응답 헤더·브라우저 교차 origin 읽기는 배포 뒤 따로 측정할 항목이다.

## 피어 URL 설정과 변경 절차

현재 `site-a/links.json`은 `https://spec-scout.pages.dev/spec_scout`를 가리키고 `site-a/agent-manifest.json`의 `allowed_peers`는 대응하는 `https://spec-scout.pages.dev`다([[peer-connection]]). 이전의 예약 주소는 교체됐다. 이 설정은 공개 응답·HTTPS/CORS·실제 피어 실행의 증거가 아니다. 주소를 또 바꿀 때는 `links.networks.review_desk.spec_scout`(`<B base>/spec_scout`)와 `allowed_peers`를 **함께** 바꾸고 닫힌 정책과 정확한 네트워크 이름을 유지한다. `tests/peer.test.mjs`가 두 선언의 정합성과 현재 기대 주소를 확인하므로 그 기대값도 같이 갱신하고, 테스트·CLI를 다시 돌린 뒤 A를 재배포한다. 배포된 산출물과 주소의 일치는 `docs/demo-checklist.md` 인계 항목에서 확인할 일이다.

## 문서 산출물

- `README.md`(영어): 아키텍처, 로컬 실행(저장소 루트에서 `python -m http.server`; 단일 서버는 UI 확인용이지 두 origin 격리·CORS 시험이 아님), 스펙 §별 구현·검사·브라우저 근거 매핑 표, 런타임 출처·로컬 변경, Apache-2.0. 상태 절이 구현된 것·로컬에서 관찰된 것·정정된 실패·미확인·공개 배포 대기를 구분한다.
- `docs/devpost.md`(영어): 제출문 초안(기능·기술·심사 기준 4개 대응)과 제출·공개 접근 인계 표. 항목은 모두 미체크이며 담당자·필요 입력·현재 상태를 적는다. 영상 계획은 문제 → 검사·수정 → 위임·동의·피어 호출 → 근거 한 사례에 집중한다.
- 변환기 안내: README는 CLI·웹 변환 기능과 함께 하네스 기능(셸·git·gate·권한 등)은 변환하지 않는다는 한계를 적는다. 한계의 원본은 [[converter-mapping-contract]]다.
- 근거 원장: [[browser-evidence-ledger]] (`docs/demo-checklist.md`).

두 문서는 통합 뒤 상태(브라우저 관찰, 런타임 보정)와 맞춰져야 한다. 병렬 작성 당시의 "아직 통합 전" 문장이 남아 리뷰에서 지적된 적이 있다([[no-compat-code-lessons]]).

## 아직 확인되지 않은 것

공개 HTTPS URL, GitHub Pages 활성화, 공개 CORS 응답 실측, 공개 리비전에서의 브라우저 확인, 심사자 접근, 이 상태를 근거로 한 "출품 준비 완료" 표시는 모두 미확인이다. 영상·스크린샷·Otari 메일 등 계정 소유 작업도 열려 있다(`docs/devpost.md` 인계 표).
