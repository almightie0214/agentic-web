---
description: 변환기의 코드 구조. site-a/converter/ 순수 모듈 4개, Node CLI의 파일 획득 경계, Site A 변환 탭과 Review Desk 일회성 전달의 호출 관계와 경계
---

# 변환기 코드 구조

규칙은 [[converter-mapping-contract]]에 있고, 이 페이지는 그 규칙을 구현한 파일과 호출 관계를 설명한다.

## 순수 코어 `site-a/converter/`

변환 로직은 DOM·저장소·네트워크·파일시스템·`node:*` 없이 메모리 값만 다루는 모듈이다(파서·네트워크 emitter·manifest emitter와 둘이 공유하는 설명 함수). Pages 아티팩트가 `site-a/`만 담기 때문에(`.github/workflows/pages.yml`, [[deployment-and-release]]) 웹 탭이 import하려면 코어가 `tools/`가 아니라 `site-a/` 아래에 있어야 한다. 그래서 Node CLI가 저장소 상대 경로로 `site-a/converter/`의 모듈을 import한다.

| 파일 | 함수 | 책임 |
| --- | --- | --- |
| `site-a/converter/parse-roles.mjs` | `parseRoles(files, { layout })` | 가상 파일 검증·정규화, 레이아웃 선택, frontmatter 부분집합 해석, 비밀/로컬 경로 줄 제거(`sanitize`), 이름·설명 도출, config의 front 후보 검증. `{ roles, configFront, layout }`을 낸다(`layout`은 선택된 입력 형식) |
| `site-a/converter/emit-network.mjs` | `emitNetwork(parsed, { front })` | 중간 표현을 다시 검증하고, 명시 front → config → 첫 역할 순으로 front를 정해 front 우선 배열과 별 모양 배선의 네트워크를 만든다. 각 instructions 뒤에 front/specialist별 출력 규칙(`outputRules`)을 붙이고 `max_execution_seconds: 240`을 낸다. `{ network, frontMan }` 반환 |
| `site-a/converter/emit-manifest.mjs` | `emitManifest(frontMan, layout)` | 이름 문법을 확인하고 형식별 설명을 담은 manifest와 빈 links 스텁을 새 객체로 낸다 |
| `site-a/converter/describe-layout.mjs` | `describeLayout(layout)` | `theora`·`markdown`만 받아 `Converted <Theora\|Markdown> role conversation network.`를 만든다. network와 manifest가 같은 함수를 쓰고 다른 값은 `CVT-META-001`로 거부한다 |

책임을 이렇게 나눈 이유: 공개 텍스트 정화는 파서에서 한 번만 하고(주석: "Public-text sanitation belongs to parseRoles") 이후 단계는 정화된 값만 받는다. 출력 규칙은 파서가 아니라 emitter가 붙이므로 정화는 원문에만 적용되고 변환기가 쓴 문장은 정화를 거치지 않는다. 형식은 어댑터가 추측하지 않고 `parseRoles` 결과의 `layout`을 그대로 두 emitter에 넘긴다(`tools/theora2hocon/theora2hocon.mjs`와 `site-a/converter.js`가 같은 호출을 한다). 최종 front 선택은 명시 옵션이 있는 emitter의 몫이라서 파서는 config 후보만 넘긴다. emitter는 후보와 옵션을 모두 검증해 어느 쪽도 조용히 폴백하지 않는다. 모든 단계의 오류는 `CVT-*: invalid converter input.` 형태이고 원문·경로·JSON 파서 메시지를 싣지 않는다. 입력 배열과 옵션은 바꾸지 않는다.

파서 내부 요점: 경로 검사는 `(?![\s\S])` 끝 단언을 써서 JS `$`가 마지막 개행을 허용하는 틈으로 경로·이름 검증이 빠지지 않게 한다. 스칼라 파서는 암묵적 타입(null·숫자 등)을 오류로 거절하는 문자열 전용 부분집합이다. 코드 펜스 안의 제목은 설명 후보에서 제외한다(`firstHeading`). 선두 BOM은 `normalize()` 한 곳에서만 제거한다. 획득 단계가 BOM을 미리 지우면 두 번 지워져 CLI와 웹이 어긋난 적이 있다(아래 어댑터 참고).

## Node CLI `tools/theora2hocon/theora2hocon.mjs`

```
node tools/theora2hocon/theora2hocon.mjs <input-dir> <out-dir> [--front <role>] [--layout theora|markdown]
```

- **인자**(`argumentsFor`): 디렉터리 정확히 둘, `--front`/`--layout`는 중복·값 누락·미지의 플래그·잘못된 layout을 모두 거부한다.
- **획득**(`acquire`): 선택된 파일만 읽어 `{path, content}`로 만든다. 입력 루트 상위 경로까지 `lstat`로 확인해 심볼릭 링크를 따르지 않고, 디렉터리·파일 조회는 `readdir`의 실제 `entry.name`을 `===`로 비교하며 Dirent 종류가 일반 디렉터리/파일일 때만 선택한다. 대소문자를 무시하는 파일시스템에서 `.Theora/`나 `Agent.md` 같은 변형이 정확한 경로로 오인되던 문제를 고친 결과다. UTF-8은 `fatal: true, ignoreBOM: true` 디코더로 읽어 BOM 정규화를 파서에 맡긴다. Claude 에이전트가 있으면 루트 Markdown보다 우선한다. 자동 선택은 정확한 Theora 역할 파일 유무로 판정한 뒤 `parseRoles`에 레이아웃을 명시해 넘긴다.
- **쓰기**: 세 산출물을 메모리에서 직렬화한 뒤에야 `mkdir`·`writeFile`을 하므로 파싱/매핑 실패가 부분 번들을 남기지 않는다. 쓰기 실패는 비정상 종료다.
- **오류 출력**: 모든 예외를 한 줄 일반 메시지 `CVT-CLI-001: conversion failed…`로 바꿔 호스트 경로·원문 노출을 막고 종료 코드 1을 설정한다. 성공 메시지도 "배포와 브라우저 동작은 검증되지 않았다"고 말한다. 종료 코드 0은 파일이 써졌다는 뜻일 뿐이다.

## Site A 변환 탭 `site-a/converter.html` + `converter.js`

- `site-a/converter.html`은 `site-a/styles.css`를 Review Desk와 공유하고 `site-a/index.html`과 서로 링크한다(`site-a/index.html`의 내비 링크). 디렉터리 선택(`webkitdirectory`)·Markdown 파일 선택·레이아웃·front 입력과 두 샘플 버튼(`data-converter-sample`)을 둔다. 숨김 디렉터리(theora·claude 상태 폴더)를 브라우저가 빠뜨리면 발견할 수 없다는 안내가 있다.
- `site-a/converter.js`의 `convert()`는 같은 `parseRoles` → `emitNetwork` → `emitManifest`를 호출하고, 세 산출물을 AW2 `validateNetwork`([[validator-rules]])에 넣어 리포트를 그린 뒤 객체 URL 다운로드 링크를 만든다. 검증 실패는 성공으로 표시하지 않는다. 변환 오류는 `CVT-…` 규칙 ID만 보이고 원문은 보이지 않는다. 옵션 변경이나 새 입력은 `invalidate()`가 이전 결과·다운로드를 지운다.
- **획득 경계**(`readLocalFiles`): 레이아웃을 정한 뒤 선택된 역할/config 파일만 UTF-8 해독하고 나머지는 경로만 남기고 내용을 읽지 않는다(`content: ''`). 무관한 이진 파일이 정상 변환을 막던 문제를 이 경계에서 고쳤다. 디코더는 CLI와 같은 `fatal: true, ignoreBOM: true`이고 샘플 Markdown도 같은 디코더로 읽는다. 비동기 획득은 토큰(`acquisition`)으로 늦게 도착한 결과가 새 입력을 덮지 못하게 한다.
- **샘플**: `site-a/converter/samples/claude-agents/coordinator.md`·`site-a/converter/samples/claude-agents/specialist.md`(Claude agents 형식)와 `site-a/converter/samples/theora/layout.json`(가상 파일 배열)을 `fetch`로 읽어 같은 파이프라인에 태운다.

## Review Desk로의 일회성 전달

변환 탭의 "Open artifacts in Review Desk"는 `sessionStorage`의 키 `agent-review-desk:converter`에 `{manifest, network, links}`를 쓰고 `site-a/index.html`로 이동한다. `site-a/site.js`의 `receiveConvertedInput()`이 페이지 로드 때 키를 읽자마자 **먼저 삭제**하고(잘못된 값도 제거), 키가 정확히 셋·각각 객체·`manifest.networks`/`network.tools` 배열 구조를 검사한 뒤 입력란을 채우고 `validateNetwork` 리포트를 보인다. 삭제가 실패하면 소비하지 않고, 저장소를 못 쓰면 데스크 자체는 막지 않는다. 이 전달은 정적 검토 입력만 채우며 네트워크를 채팅에 로드·실행하지 않고, 피어에 접촉하지 않고, 자격 증명을 주지 않고, 동의를 건너뛰지 않는다. 변환 결과를 실제로 돌리려면 산출물과 레퍼런스 런타임을 별도 정적 호스팅에 두어야 하며 새 런타임 어댑터나 설정 UI는 만들지 않았다([[site-a-review-desk]]).

## 변경하지 않은 것

런타임(`site-a/runtime/`)은 그대로 쓰고 새로 만들지 않는다. 변환기는 벤더 로더를 Node에서 실행하지 않는다. 서버·DB·인증은 없다.
