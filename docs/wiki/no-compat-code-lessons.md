---
description: 호환 코드 금지 규칙이 벤더링 런타임에 적용된 방식과, 리뷰에서 나온 주석·A/B 불일치 교훈의 현재 코드 반영
---

# 호환 코드 금지와 리뷰 교훈

## 규칙

하네스는 실행 산출물에 구버전 호환 분기나 옛 자료·설정을 읽는 코드를 두지 않는다. 외부 런타임을 복사한 코드도 예외가 아니다. 고정 상류를 "그대로 복사하면 규칙도 충족한다"는 가정이 첫 번째로 깨졌다. 제거 내역은 [[vendored-runtime]]에 있다.

## 교훈

1. **복사 코드도 검토 대상이다.** 옛 runner 별칭(`index.js`), 옛 confirm 위젯 복원(`cruse.js`/`ui.js`), 폐기된 activity 슬롯(`ui.js`), 옛 BYOK 단독 키 슬롯(`byok.js`)이 반입돼 차례로 제거됐다. 한 지점을 고칠 때 같은 원인을 파일 전체에서 재검색해야 한다(`ui.js`의 옛 manifest 대체 해석, 제출 fallback, 검증 없는 welcome 마운트가 이렇게 발견됐다).
2. **회귀 검사는 실제 경계에서 건다.** 문자열 검색 대신 `boot`, `mountApp`, `renderPresentation`, `byok.js`를 실제로 실행해 옛 입력이 복원되지 않음을 확인한다. [[testing-and-gate]].
3. **A/B 복사본은 함께 고친다.** Site B의 `byok.js`만 고쳐 Site A에 같은 결함이 남았고, Goal 검토에서 발견돼 A도 제거됐다. 이후 BYOK 검사를 `runtimeTest`로 확장해 양쪽을 같은 조건으로 돌린다.
4. **제품 소스 주석에 Goal·Task·날짜·후속 계획을 쓰지 않는다.** `site-a/site.js`, `site-b/site.js`, `site-b/index.html`에서 후속 단계 인계 문구가 제거돼 현재 기술적 이유만 남았다. 인계 정보는 코드가 아니라 문서(예: [[site-b-spec-scout]])에 둔다.
5. **테스트 주석에도 같은 규칙이 적용된다.** `tests/validator.test.mjs`의 검증 범위 주석에 Task·Goal·후속 단계 식별자가 들어갔다가 현재 검증 범위만 설명하도록 고쳐졌다.
6. **검토 대상 입력의 잘못된 형식은 예외가 아니라 판정이나 표시로 돌려준다.** 규칙 모듈의 설정 처리와 링크 조회, UI의 표시 경계에서 같은 가정(필드가 문자열일 것)이 깨졌다. 자세한 경계는 [[validator-rules]]와 [[site-a-review-desk]].
7. **저작 원본과 배포본은 계약으로 묶는다.** Site B의 발췌 원본(`site-b/spec-excerpts.json`)과 네트워크 instructions는 로딩 동일성 검사만으로는 어긋남을 못 잡는다. 리뷰에서 지적되어 `tests/peer.test.mjs`에 원본의 출처 블록과 모든 발췌 본문·절을 instructions에 대해 포함 검사하는 회귀 검사가 추가됐다([[site-b-spec-scout]]).
8. **README의 현재 상태 설명은 통합 결과와 맞춘다.** 이전 단계의 안내가 남아 피어 배선과 모순된 적이 있어, 링크 목적지와 짝이 되는 허용 출처, 라이브 동작은 실측된 범위만 쓴다는 점, `links.json`과 `allowed_peers`를 함께 갱신해야 한다는 계약을 현재 배선에 맞게 고쳤다([[peer-connection]]). 예약 주소가 `pages.dev` 주소로 교체된 뒤에도 README·devpost가 예약 주소를 설명하던 것을 같은 방식으로 다시 맞췄다.
9. **삭제된 산출물은 존재 검사로 지킨다.** 승인된 `.github/workflows/pages.yml`이 후속 commit에서 통째로 사라졌다가 Goal 검토에서 발견돼 복원됐고, `tests/peer.test.mjs`에 파일 존재와 업로드 루트 `site-a` 검사가 추가됐다. 이 검사는 활성화·공개 배포를 증명하지 않는다([[deployment-and-release]]).
10. **병렬로 쓴 문서는 통합 뒤 다시 맞춘다.** `README.md`와 `docs/devpost.md`가 브라우저 검증 통합 전 상태를 현재처럼 적었다. 현재 상태·스펙 매핑·보안 설명·런타임 변경·심사 기준 대응·인계 표를 두 문서에서 함께 고쳤다.
11. **원자료와 대조해 기록한다.** 증거 원장에서 수기로 옮긴 실행 시각이 출처와 달랐던 것을 고쳤다. 블록 보고 범위, 실제 요청 시각, 제공되지 않은 시각을 구분한다([[browser-evidence-ledger]]).
12. **브라우저에서 확인된 결함은 두 런타임 복사본에 모두 고친다.** 중복 agent 이름과 쿠키로의 키 노출이 실제 브라우저 검증에서만 드러났고 A/B `kernel.js`·`byok.js`·`ui.js`에 같은 보정을 했다([[vendored-runtime]]).
13. **테스트마다 주소 문자열을 따로 박으면 주소 변경이 여러 테스트를 한꺼번에 깨뜨린다.** 예약 주소를 공개 B 주소로 바꿀 때 원인이 이것이었다. 현재 production 설정 테스트는 주소를 `site-a/links.json`과 `agent-manifest.json`에서 읽고 공개 주소를 단언하는 곳은 `tests/peer.test.mjs`의 production binding 테스트 하나다. production 설정을 읽지 않는 합성 테스트는 자체 `.invalid` 호스트를 쓴다([[peer-connection]]).
14. **정적 호스트의 기본 동작을 가정하지 않는다.** Cloudflare Pages는 최상위 `404.html`이 없으면 없는 경로에 `index.html`을 200으로 돌려줘 정의·links 실패가 숨는다. `site-b/404.html`이 이를 막고 공개 측정에서 404로 확인됐다([[deployment-and-release]]).
15. **변환기에서도 실제 경계에서 가정이 깨졌다.** 파일시스템 조회가 대소문자를 구분한다는 가정, 디렉터리의 모든 파일이 역할이라는 가정, BOM을 여러 단계가 지운다는 가정이 획득 경계에서 리뷰로 지적됐다. 현재 코드의 방어와 회귀 검사는 [[converter-verification]]에 있다.

16. **실패 판정은 표현과 무관해야 한다.** AAOSA 응답의 `Response`가 문자열이면 `cruse.js`가 재귀 해석 없이 바로 text로 돌려줘, 잘못된 presentation이나 쓸 수 없는 action만 참조한 presentation이 정상 답으로 통과했다. 객체·문자열·fenced 문자열을 같은 `unwrap` 경로로 보내 presentation 정규화와 `runAgent`의 답 수용 검사를 거치게 했고 두 사본(`site-a/runtime/cruse.js`, `site-b/runtime/cruse.js`) 모두 고쳤다. 회귀 검사는 정상 AAOSA 응답의 실제 presentation 내용과 빈 text를 단언하고 불량 변형은 실제 피어 세션에서 `status=error`와 agent·`remote_call`·tool 오류 span을 확인한다([[runtime-execution-contract]]).
17. **시간 한도 검사는 결정적 제어로 쓴다.** 실제 시간 경과나 sleep에 기대면 목표 대기에 들어가기 전에 만료돼도 통과하고 느리다. mock Date·timer와 진입/완료 deferred로 한도 직전·만료 시각을 명시적으로 진행하고, 늦게 온 입력과 형제 완료가 부수 효과를 남기지 않는지 확인한다([[testing-and-gate]]).
18. **기능을 지운 diff는 마지막 호출자를 잃은 선언도 함께 지운다.** 원격 action 발견 모듈을 지우자 SHA-256의 마지막 소비자가 사라졌는데 `web-crypto.js`의 전용 구현이 남아 있었다. 두 사본에서 함께 제거하고 `engine.js`가 쓰는 `randomUuid`는 남겼다([[vendored-runtime]]).
19. **증거의 수명과 검토 인계의 수명은 다르다.** 원장이 실행 종료 시 지워지는 run tmp를 독립 검토용 보존 위치로 적어 검토자가 원자료를 대조하지 못했다. 승인된 프로젝트 근거 루트에 원 출력·복구본·재구성 소스와 manifest를 보존하고 README·devpost의 같은 전제를 함께 고쳤다. 소실된 자료는 소실이라고 구분해 적는다([[browser-evidence-ledger]]).
20. **"유일하다"는 가정은 정화·절단 뒤에도 성립하는지 본다.** 피어 목적지를 정식 주소로 바꾸면서 모델 도구 이름 자리에 게시 네트워크 이름만 쓰자, 경로가 다른 피어의 정화된 이름이 같아져 앞 대상을 덮어썼다. 대상 주소와 모델 별칭의 책임을 나누고(`toolPath`) 공통 등록 경계에서 충돌 없는 별칭을 주도록 두 사본을 같이 고쳤다([[peer-destination-rule]]).
21. **같은 페이지 안의 이동은 fragment로 쓴다.** 공개 기본 URL(디렉터리 주소)에서 내부 단계 링크가 파일 이름이 붙은 상대 주소이면 다른 document로 간주돼 다시 로드되어 검사한 입력·내려받기·답을 잃었다. 내부 네 링크를 fragment로 고치고 의도한 문서 간 링크(`converter.html`의 것)는 유지했다. 두 페이지 문자열이 같아야 한다는 검사는 목적지 검사로 바꿨다([[editor-test-run]]).
22. **정상 결과 모양을 text 하나로 가정하지 않는다.** 시험 실행 화면이 structured presentation만 있는 정상 답을 버려 빈 Answer가 성공처럼 보였다. 같은 표시 경계에서 text·presentation 전부를 읽기 전용으로 보이고 `presentationIssues`는 오류 진단으로 처리한다. 표시할 답이 없으면 정상 완료로 두지 않는다([[editor-test-run]]).
23. **표지는 이름 추측이 아니라 데이터에서 온다.** 실행 그래프가 trace의 `origin`·`peerOrigin`을 표시하지 않아 `editor` 표지가 화면에 없었다. 공용 렌더러가 출처·피어 목적지를 `[출처 → 피어 출처]`로 보이게 고쳤고 이름이 `editor`인지 보는 분기는 두지 않았다([[site-a-review-desk]]).
24. **구조 판정과 내용 보존을 같은 함수에서 섞지 않는다.** YAML 블록 스칼라의 구조 들여쓰기에 일반 `trimStart()`·일괄 탭 거부를 쓰자 내용의 탭·유니코드 공백이 구조로 읽혔다. 구조는 ASCII 공백만 센다([[converter-verification]]).

## 이 페이지가 보장하지 않는 것

교훈 자료는 리뷰 결과 요약이며, 위 항목의 수정은 현재 파일에서 확인한 내용(예: `site-a/runtime/index.js`에 별칭이 없고 `byok.js`가 탭·프로필 설정만 다룸)에 한정한다. 검사 통과 여부를 이 위키 작성 중 실행해 확인하지는 않았다.
