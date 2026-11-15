---
description: site-a/audit.js의 auditUrl이 base URL 또는 manifest URL에서 공개 JSON 세 개를 가져와 같은 규칙으로 판정하고 획득 오류와 규칙 위반을 구분하는 방식
---

# URL 감사 (`auditUrl`)

`site-a/audit.js`의 `auditUrl(value, { fetchImpl, networkName, signal })`은 사이트 base URL이나 `agent-manifest.json` URL을 받아 `agent-manifest.json` → manifest가 가리키는 네트워크 JSON → `links.json`을 가져오고 [[validator-rules]]의 `validateNetwork`를 그대로 호출한다. 규칙을 따로 구현하지 않는다.

## 동작

- **base path 보존.** URL을 origin으로 줄이지 않는다. 슬래시 없는 base도 디렉터리로 보고 `/`를 붙이며(`/agentic-web` → `/agentic-web/`), manifest URL이면 `new URL('./', target)`을 `baseUrl`로 쓴다. 이 `baseUrl`이 규칙 입력으로 넘어가 피어 정체성 검사에 쓰인다. 네트워크 정의는 `manifest.networks[n].hocon`을 base 기준으로 해석한다.
- **공개 JSON GET만.** `mode: 'cors'`, `credentials: 'omit'`, `cache: 'no-store'`. HTTPS만(개발용 loopback HTTP 허용), URL 자격 정보 금지. 추론·action/코드 import·피어 순회·브라우저 저장소 접근 없음. 사용자가 시작한 감사는 아티팩트 GET만 허가하며 런타임 피어 호출은 허가하지 않는다.
- **networkName**은 정확히 일치하는 manifest 항목만 선택하고 첫 항목으로 대체하지 않는다.
- **세 아티팩트를 모두 읽는다.** `links.json`이 없으면 획득 오류가 되어 판정은 `incomplete`다. 네트워크 JSON과 links가 모두 획득되고 오류가 없을 때만 전체 `report = validateNetwork(input)`을 낸다. manifest에 `hocon`이 없거나 정의 URL이 공개 HTTPS가 아니면 `manifest.*` check(와 `publication.definition.url`)만으로 보고서를 만든다.

## 결과 모양

`{ baseUrl, manifestUrl, artifacts, errors, input, report, readiness }`.

- `errors`는 **획득** 오류다(`kind`: `input` | `fetch` | `http` | `json` | `aborted`). 가져오지 못한 JSON에 대해 리포트를 지어내지 않는다. 일반 fetch 실패는 연결·TLS·브라우저 정책·CORS 가운데 어느 것인지 확정하지 않는다는 문구를 쓴다. 본문 읽기 실패는 JSON 오류가 아닌 전송 실패다.
- `readiness.status`: 실패한 규칙이 있으면 `blocked`, 획득 오류가 있거나 `report.valid`가 아니면 `incomplete`, 아니면 `static-ready`. `static-ready`는 정적 아티팩트가 통과했다는 뜻일 뿐 `readiness.runtime`은 항상 `'unverified'`다.
- 획득 오류가 없는데 규칙이 실패한 경우(예: 이름이 잘못된 manifest)는 `blocked`로, 획득 문제와 규칙 위반이 섞이지 않는다.

현재 Site A 자신은 `links.json`을 발행하지 않으므로(`site-a/`에 없음) 자기 URL 감사는 `links` 획득 오류로 `incomplete`가 된다(`README.md`의 설명).

`tests/audit.test.mjs`가 하위 경로 보존, 공개 GET 한정, 픽스처 리포트와의 동일성, 정확한 이름 선택, fetch·HTTP·JSON·취소 실패 분리, 안전하지 않은 정의 참조, 미지원 방언의 미확인 처리를 검사한다. UI에서의 사용은 [[site-a-review-desk]].
