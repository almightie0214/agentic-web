---
description: Site A GitHub Pages 워크플로, Site B _headers·404.html 설정, README·devpost 인계 문서의 역할, 피어 URL 변경 절차와 공개 실측 범위·남은 미완료
---

# 배포 설정과 출품 인계

두 사이트는 **서로 다른 origin의 정적 호스트**에 따로 발행한다. 서버 런타임·백엔드·DB·인증은 없다. 같은 origin에 두 사이트 파일이 섞이면 피어 격리 시연이 무너지므로 발행 루트를 사이트 디렉터리로 한정하는 것이 이 페이지의 핵심 경계다. 설정 파일이 있다는 것은 활성화·공개 응답의 증거가 아니며, 공개 응답은 배포 뒤 실측해 원장에 남긴다(아래 "공개 실측").

## Site A — `.github/workflows/pages.yml`

- 트리거: `site-a/**` 또는 이 워크플로를 바꾼 `main` push와 `workflow_dispatch`. `site-a/converter/`·`converter.html`도 `site-a/` 아래라 함께 배포되고, 웹 변환 탭이 import하는 코어가 아티팩트 안에 있어야 하는 이유도 여기 있다([[converter-code-structure]]). 다른 경로만 바꾼 push는 배포하지 않는다. 권한은 `contents: read`, 배포 job은 `pages: write`·`id-token: write`, 환경 `github-pages`.
- 단계: checkout → `actions/configure-pages` → `actions/upload-pages-artifact`(`path: site-a`) → `actions/deploy-pages`.
- **아티팩트는 저장소 루트가 아니라 `site-a/`**다. Site B 파일이 A origin에 섞이지 않게 하는 이유다. 워크플로 주석도 같은 이유를 적는다.
- 이 파일은 한때 후속 commit에서 통째로 삭제된 적이 있어 `tests/peer.test.mjs`의 "Site A Pages artifact" 테스트가 워크플로 존재와 업로드 `path: site-a`를 정규식으로 확인한다. 루트 업로드로 바꾸는 변이는 이 테스트가 실패시킨다. 단 이 테스트는 문자열 검사일 뿐 GitHub Pages 활성화·실제 배포 결과를 확인하지 못한다. 공개 A 주소(`https://almightie0214.github.io/agentic-web/`)의 산출물은 저장소 판본과 일치함이 실측됐다.

## Site B — `site-b/_headers`

`/*`에 `Access-Control-Allow-Origin: *` 하나(공개 정적 아티팩트용, `Allow-Credentials` 없음). Cloudflare Pages가 이 파일을 읽어 응답 헤더를 붙이도록 `site-b/`를 발행 루트로 배포한다. 빌드 단계는 없고 `runtime/`·manifest·네트워크 정의·`_headers`·`404.html`(스크립트 없는 최상위 오류 페이지)이 함께 올라가야 한다. `spec-excerpts.json`은 실행에 필요 없다.

**`404.html`이 필요한 이유**: Cloudflare Pages는 최상위 `404.html`이 없으면 없는 경로에 `index.html`을 200으로 돌려준다(공개 B의 `links.json`·`review_desk.network.json` 요청이 200 `text/html`로 관찰됐던 원인). 그러면 정의·links 요청의 실패가 404로 드러나지 않는다. 이 파일이 올라간 배포에서는 없는 경로가 404로 측정됐다.

저장소 안의 검증은 두 겹이며 **로컬 설정 검사**다: `tests/peer.test.mjs`가 `/*` 규칙과 credentials 헤더 부재, `404.html`의 스크립트 부재를 확인하고, [[conformance-cli]]의 `publication.cors`가 발행된 각 아티팩트에 ACAO `*`가 정확히 하나 적용되는지 규칙 병합까지 본다. 배포된 HTTPS 응답 헤더·상태는 아래 "공개 실측"이 따로 다룬다.

## 피어 URL 설정과 변경 절차

현재 `site-a/links.json`은 `https://spec-scout.pages.dev/spec_scout`를 가리키고 `site-a/agent-manifest.json`의 `allowed_peers`는 대응하는 `https://spec-scout.pages.dev`다([[peer-connection]]). 주소를 또 바꿀 때는 `links.networks.review_desk.spec_scout`(`<B base>/spec_scout`)와 `allowed_peers`를 **함께** 바꾸고 닫힌 정책과 정확한 네트워크 이름을 유지한다. production 설정을 검사하는 테스트는 주소를 이 두 JSON에서 읽으므로, 공개 B 주소 문자열을 단언하는 곳은 `tests/peer.test.mjs`의 production binding 테스트 하나뿐이다. 그 기대값을 같이 갱신하고 테스트·CLI를 다시 돌린 뒤 A를 재배포한다. `site-a/**`가 바뀐 push만 워크플로를 트리거하므로, 재배포 뒤에는 공개 A의 `links.json`·`agent-manifest.json`이 저장소 판본과 바이트 단위로 같은지 먼저 확인한다(다르면 배포 대기 또는 원인 보고).

## 공개 실측

공개 실측은 `docs/demo-checklist.md` §4에 기록돼 있다([[browser-evidence-ledger]]). 자격 없는 GET으로 공개 A·B 산출물의 URL·상태·Content-Type·ACAO·리다이렉트를 쟀고, 실제 브라우저에서 사용자가 내장 패널에 키를 넣어 동의 → 피어 호출을 관찰했다. 정리된 결과는 [[peer-connection]]의 "공개 배포에서 관찰된 것"에 있다. 이 측정은 특정 리비전·시각의 스냅샷이며 지속 보장이 아니고, 키·쿠키·인증 값은 근거에 남기지 않는다.

## 페이지 CSP와 배포 바이트 확인

A의 `index.html`·`converter.html`과 B의 `index.html`은 CSP meta를 선언한다. A는 `_headers` 같은 헤더 설정 파일이 없고 B의 `site-b/_headers`는 CORS 한 줄뿐이라 정책을 페이지 meta에 둔다. 정책과 검사 도구는 [[page-csp-and-browser-check]]에 있다. 배포 후 확인은 원장 §6이 기록한다([[browser-evidence-ledger]]). 변경된 공개 A·B 파일을 `origin/main` 리비전의 파일과 바이트 비교하고, 삭제된 런타임 모듈이 404인지 확인하고, 착륙 트리에 `tools/browser-check.mjs`를 다시 돌리는 절차다. 이 결과는 특정 리비전·시각의 스냅샷이다.

## 문서 산출물

- `README.md`(영어): 제품 설명으로 읽히는 첫 절(증거 세부는 `docs/demo-checklist.md`로 링크), 제출 마감(2027-01-11 08:00 PT = 2027-01-12 01:00 KST), 공개 저장소 상태(PUBLIC, Apache-2.0, 공유 활동 미기록), 영어 Testing instructions(키 없이 되는 것, 채팅에 필요한 OpenAI 호환 router 키와 ⚙ 패널 입력 위치, 키는 방문자 브라우저에만 남는다는 점, 기대 흐름), 아키텍처, 로컬 실행(저장소 루트에서 `python -m http.server`; 단일 서버는 UI 확인용이지 두 origin 격리·CORS 시험이 아님), 스펙 §별 구현·검사·브라우저 근거 매핑 표, 런타임 출처·로컬 변경, Apache-2.0. 상태 절이 구현된 것·공개 주소와 바인딩·로컬에서 관찰된 것·정정된 실패·공개 HTTP·브라우저 관찰·미확인을 구분하며 공개 주소는 실제 상태와 맞게 쓴다(현재 상태를 설명하는 부분에는 예약 주소·미배포 서술이 남지 않았다).
- `docs/devpost.md`(영어): 제출문 초안(기능·기술·심사 기준 4개 대응), 영어 Testing instructions, 제출 마감과 제출·공개 접근 인계 표. 공개 저장소 행은 PUBLIC·Apache-2.0으로 체크되고 심사자 추론 접근 행은 참가자 소유의 열린 항목이다. 담당자·필요 입력·현재 상태를 적는 항목들이며, 실측이 끝난 Pages 활성화·B 배포·바인딩·HTTP/CORS·브라우저 피어 관찰 행(과 변환 번들 관찰 행)만 체크돼 있고 스크린샷·영상·독립 심사자 접근·최종 제출 등은 미체크다. Otari 계정·피드백은 대회 규정 §4에 따라 선택 사항으로 적혀 있다. 영상 계획은 문제 → 검사·수정 → 위임·동의·피어 호출 → 근거 한 사례에 집중한다.
- 변환기 안내: README는 CLI·웹 변환 기능과 함께 하네스 기능(셸·git·gate·권한 등)은 변환하지 않는다는 한계를 적는다. 한계의 원본은 [[converter-mapping-contract]]다.
- 근거 원장: [[browser-evidence-ledger]] (`docs/demo-checklist.md`).

두 문서는 통합 뒤 상태(브라우저 관찰, 런타임 보정)와 맞춰져야 한다. 병렬 작성 당시의 "아직 통합 전" 문장이 남아 리뷰에서 지적된 적이 있다([[no-compat-code-lessons]]).

## 아직 미완료인 것

독립 심사자 본인의 공개 사이트 접근 확인, 영상·스크린샷·최종 제출, 이 상태를 근거로 한 "출품 준비 완료" 표시는 모두 미완료다(`docs/devpost.md` 인계 표). 실측 범위 밖의 변경(다른 리비전·다른 시각)은 다시 측정해야 한다. 공개 실행에서도 provider 요청 헤더·본문은 직접 관찰되지 않았고, 피어 답의 모델 텍스트 품질은 PASS가 아니다. 심사자 추론 접근(채팅은 방문자가 설정하는 OpenAI 호환 router 키가 필요하고 공유 키는 싣지 않는다)은 참가자 소유의 열린 항목이고, 공유 활동 기록과 독립 검토·gate 결과도 이 문서가 확정하지 않는다.
