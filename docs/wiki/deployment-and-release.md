---
description: Site A GitHub Pages 워크플로, Site B _headers·404.html 설정, 심사자용 README·devpost 문서의 역할, 피어 URL 변경 절차와 공개 실측 범위·남은 미완료
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

공개 실측은 `docs/demo-checklist.md` §4·§6·§7·§9에 기록돼 있다([[browser-evidence-ledger]]). 자격 없는 GET으로 공개 A·B 산출물의 URL·상태·Content-Type·ACAO·리다이렉트를 쟀고, 실제 브라우저에서 내장 패널에 키(또는 개발 router용 가짜 sentinel 키)를 넣어 동의 → 피어 호출을 관찰했다. 정리된 결과는 [[peer-connection]]의 "공개 배포에서 관찰된 것"에 있다. 이 측정은 특정 리비전·시각의 스냅샷이며 지속 보장이 아니고, 키·쿠키·인증 값은 근거에 남기지 않는다.

## 페이지 CSP와 배포 바이트 확인

A의 `index.html`·`converter.html`과 B의 `index.html`은 CSP meta를 선언한다. A는 `_headers` 같은 헤더 설정 파일이 없고 B의 `site-b/_headers`는 CORS 한 줄뿐이라 정책을 페이지 meta에 둔다. 정책과 검사 도구는 [[page-csp-and-browser-check]]에 있다. 배포 후 확인은 원장 §6이 기록한다([[browser-evidence-ledger]]). 변경된 공개 A·B 파일을 `origin/main` 리비전의 파일과 바이트 비교하고, 삭제된 런타임 모듈이 404인지 확인하고, 착륙 트리에 `tools/browser-check.mjs`를 다시 돌리는 절차다. 원장 §7은 temperature 변경 뒤 변경된 사이트 파일 12개의 바이트를 같은 방식으로 비교했고, §9는 변환 시험 실행이 착륙한 뒤 변경된 23개(A 18, B 5)를 비교했다. 이 결과는 특정 리비전·시각의 스냅샷이다.

## 문서 산출물

- `README.md`(영어): 심사자가 읽는 글이다. 첫 화면에 한 문단 소개(무엇·누구·왜)와 공개 링크 셋(Review Desk, Role Converter, Spec Scout), "Try it in one minute — no API key" 3단계, Otari 키로 채팅·피어를 해 보는 단계가 있다. 시연 질문은 명세 §3.2 제목("Protocol for Loading a Peer Agent Site")에 맞춘 "Ask Spec Scout what MVP Profile 0.2 §3.2 requires before and while a caller loads a peer agent site."다. 이어 명세 §6 MVP Interoperability Checks 일곱 항목이 사이트의 어느 화면·동작에서 보이는지 적은 표(확인하는 방법만 적고 판정 주장은 하지 않는다), 커뮤니티가 바로 쓸 수 있는 두 CLI(`tools/check-conformance.mjs`, `tools/theora2hocon/theora2hocon.mjs`)의 실행 예와 출력이 뜻하는 것, 구조 요약(두 출처·정적 호스팅·BYOK·동의·CSP·한도), 검증 기록 링크 한 줄(`docs/demo-checklist.md`), 출처·라이선스가 있다. 커밋 해시·지난 실패 이력·환경 진단은 본문에 넣지 않고 원장에만 둔다. 시간 한도는 "네트워크가 정하고 runtime 상한 아래에 있다"는 동작만 적고 초 단위 숫자는 적지 않는다(실측으로 바뀔 수 있다; [[runtime-execution-contract]]). 채팅에 키가 필요하고 키는 방문자 브라우저에만 남는다는 점, 변환기가 하네스 기능(셸·git·권한 등)은 변환하지 않는다는 한계는 본문에 유지된다(한계의 원본은 [[converter-mapping-contract]]). 변환기 절은 세 입력(Claude agents·Google ADK·Theora)과 CLI 예(`--layout adk` 포함), 옮기지 않은 키 알림, ADK의 `sub_agents`가 제어 이양이 아니라 부르고 답받는 위임으로 바뀐다는 점, 그리고 Review Desk의 명시적 **Test run**(게시 출처 없는 피어, 사이트 액션·저장 링크 없음, 다른 사이트 호출은 정책·동의, 상대 참조 거부, 채팅과 겹치지 않음, Stop)을 현재 동작으로 적는다([[editor-test-run]]).
- `docs/devpost.md`(영어): Devpost 양식에 붙일 원고다. 양식 절(Inspiration, What it does, How we built it, Challenges we ran into, Accomplishments, What we learned, What's next, Built with), 심사 기준 네 개에 대한 짧은 답(현재 동작 근거만), Otari 피드백 후보(스트리밍 + temperature 없음에서 qwen3.8-flash 답이 무너진 런타임 밖 진단과 선언한 0.2에서 읽은 실측을 구분해 적는다; 제출되지 않았다), 제출 마감(2027-01-11 08:00 PT = 2027-01-12 01:00 KST)과 참가자 몫 할 일 표(스크린샷, 영상, Otari 계정 이메일·선택 피드백, 심사자 추론 접근, 최종 제출, 2027-01-19까지 공개 유지)가 있다. 끝난 행과 내부 검증 행은 표에서 뺐다. 영상 계획은 원장 §5에 있다.
- 근거 원장: [[browser-evidence-ledger]] (`docs/demo-checklist.md`).

두 문서는 현재 동작만 적는다. 병렬 작성 당시의 "아직 통합 전" 문장이 남아 리뷰에서 지적된 적이 있고([[no-compat-code-lessons]]), 한때 시연 질문이 "peer discovery"로 적혀 명세 §3.2 제목과 어긋났다. 지금은 제목에 맞는다. 이 두 문서의 본문과 원장의 역할을 나누는 것이 경계다. 증거 원장에는 해시·실패·진단이 남고 심사자용 글에는 제품 설명만 남는다.

## 아직 미완료인 것

독립 심사자 본인의 공개 사이트 접근 확인, 영상·스크린샷·최종 제출, 이 상태를 근거로 한 "출품 준비 완료" 표시는 모두 미완료다(`docs/devpost.md` 인계 표). 실측 범위 밖의 변경(다른 리비전·다른 시각)은 다시 측정해야 한다. 공개 실행에서도 provider 요청 헤더·본문은 직접 관찰되지 않았다. 답 가독성은 temperature 0.2 적용 뒤 여덟 번의 실행에서 깨진 문장이 관찰되지 않았지만 그것은 범위가 한정된 관찰이다([[browser-evidence-ledger]]). 심사자 추론 접근(채팅은 방문자가 설정하는 OpenAI 호환 router 키가 필요하고 공유 키는 싣지 않는다)은 참가자 소유의 열린 항목이고, 공유 활동 기록과 독립 검토·gate 결과도 이 문서가 확정하지 않는다.
