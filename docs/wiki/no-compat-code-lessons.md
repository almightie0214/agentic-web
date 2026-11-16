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

## 이 페이지가 보장하지 않는 것

교훈 자료는 리뷰 결과 요약이며, 위 항목의 수정은 현재 파일에서 확인한 내용(예: `site-a/runtime/index.js`에 별칭이 없고 `byok.js`가 탭·프로필 설정만 다룸)에 한정한다. 검사 통과 여부를 이 위키 작성 중 실행해 확인하지는 않았다.
