---
description: 변환기의 코드 구조. site-a/converter/ 순수 모듈 4개와 공용 YAML 판독, ADK 참조 따라 읽기, Node CLI의 파일 획득 경계, 변환 탭, Review Desk 일회성 전달의 호출 관계와 경계
---

# 변환기 코드 구조

규칙은 [[converter-mapping-contract]]에 있고, 이 페이지는 그 규칙을 구현한 파일과 호출 관계를 설명한다.

## 순수 코어 `site-a/converter/`

변환 로직은 DOM·저장소·네트워크·파일시스템·`node:*` 없이 메모리 값만 다루는 모듈이다(파서·네트워크 emitter·manifest emitter와 둘이 공유하는 설명 함수). Pages 아티팩트가 `site-a/`만 담기 때문에(`.github/workflows/pages.yml`, [[deployment-and-release]]) 웹 탭이 import하려면 코어가 `tools/`가 아니라 `site-a/` 아래에 있어야 한다. 그래서 Node CLI가 저장소 상대 경로로 `site-a/converter/`의 모듈을 import한다.

| 파일 | 함수 | 책임 |
| --- | --- | --- |
| `site-a/converter/parse-roles.mjs` | `parseRoles(files, { layout })`, `adkReferences(path, content)` | 가상 파일 검증·정규화, 레이아웃 선택(Theora → `root_agent.yaml`이 있으면 ADK → Markdown), 공용 YAML 판독 `yamlMapping`, 비밀/로컬 경로 줄 제거(`sanitize`), 이름·설명 도출, ADK 참조 트리 방문, config의 front 후보 검증, 옮기지 않은 키 알림. `{ roles, configFront, layout, notices }`를 낸다 |
| `site-a/converter/emit-network.mjs` | `emitNetwork(parsed, { front })` | 중간 표현을 다시 검증하고 front를 정해 front 우선 배열을 만든다. Theora·Markdown은 별 모양 배선, ADK는 각 역할의 `tools`(원본 간선, 자기 호출·중복·없는 대상은 `CVT-IR-001`로 거부)를 쓴다. 각 instructions 뒤에 `outputRules`(front 문장 / 부른 쪽을 가리지 않는 specialist 문장)를 붙이고 `temperature: 0.2`·`max_execution_seconds: 90`을 낸다 |
| `site-a/converter/emit-manifest.mjs` | `emitManifest(frontMan, layout)` | 이름 문법을 확인하고 형식별 설명을 담은 manifest와 빈 links 스텁을 새 객체로 낸다 |
| `site-a/converter/describe-layout.mjs` | `describeLayout(layout)` | `theora`·`markdown`·`adk`를 받아 형식별 설명 문구를 만든다. network와 manifest가 같은 함수를 쓰고 다른 값은 `CVT-META-001`로 거부한다 |

책임을 이렇게 나눈 이유: 공개 텍스트 정화는 파서에서 한 번만 하고 이후 단계는 정화된 값만 받는다. 출력 규칙은 파서가 아니라 emitter가 붙이므로 정화는 원문에만 적용되고 변환기가 쓴 문장은 정화를 거치지 않는다. 형식은 어댑터가 추측하지 않고 `parseRoles` 결과의 `layout`을 그대로 두 emitter에 넘긴다(`tools/theora2hocon/theora2hocon.mjs`와 `site-a/converter.js`가 같은 호출을 한다). 최종 front 선택은 emitter의 몫이라서 파서는 후보만 넘기고, ADK에서는 후보(뿌리)와 다른 명시 front를 emitter가 거부한다. 모든 단계의 오류는 `CVT-*: invalid converter input.` 형태이고 원문·경로·JSON 파서 메시지를 싣지 않는다. 입력 배열과 옵션은 바꾸지 않는다.

### ADK 읽기와 공용 YAML 판독

- `readAdk(path, content)`가 한 설정 파일을 `yamlMapping`으로 읽는다(필드 표 `adkFields`: `name`·`instruction`은 문자열, `description`·`agent_class`는 빈 문자열 허용, `sub_agents`는 `references`). `agent_class`가 `llmClasses` 일곱 값이 아니면 거부하고, 각 `config_path`를 그 파일의 폴더 기준 루트 상대 정식 경로로 바꾼다(절대 경로·`..` 거부). 읽는 키 밖 최상위 키는 `ignoredKeys`가 되어 알림이 된다.
- `parseRoles`의 ADK 분기는 `root_agent.yaml`에서 시작해 `visit`로 참조를 따라가며, 파일이 없거나 이미 방문한 파일이면(순환·중복 참조) 실패한다. 닿지 않는 파일은 읽지 않는다. 역할의 `tools`는 자식 `name`을 참조 순서대로 담는다.
- **어댑터가 참조를 찾는 방법은 `adkReferences(path, content)` 하나다**(`readAdk(...).references`). 웹(`site-a/converter.js`의 `readAdkFiles`)과 CLI(`tools/theora2hocon/theora2hocon.mjs`의 `acquire`)가 같은 함수로 의존 파일을 찾으므로 어댑터가 YAML을 따로 해석하지 않고, 파서와 어댑터가 서로 다른 파일 집합을 읽는 일이 없다. 어댑터는 정식 경로의 각 성분을 실제 항목 이름과 `===`로 비교한다.
- `yamlMapping`은 같은 함수를 Markdown frontmatter(`markdown()`, 필드 `name`·`description`)에도 쓴다. 블록 스칼라는 첫 내용 줄의 들여쓰기를 벗기고, 구조 들여쓰기는 `indentation()`이 선두 ASCII 공백만 센다([[converter-verification]]의 교훈). 읽지 않는 키의 하위 줄은 `continuation`으로 모아 평가 없이 버린다.
- `notice(role, keys)`는 안전한 이름만 `keys`에, 나머지는 `hiddenKeyCount`로 센다.

파서 내부 요점: 경로 검사는 `(?![\s\S])` 끝 단언을 써서 JS `$`가 마지막 개행을 허용하는 틈으로 경로·이름 검증이 빠지지 않게 한다. 스칼라 파서는 암묵적 타입(null·숫자 등)을 오류로 거절하는 문자열 전용 부분집합이다. 코드 펜스 안의 제목은 설명 후보에서 제외한다(`firstHeading`). 선두 BOM은 `normalize()` 한 곳에서만 제거한다. 획득 단계가 BOM을 미리 지우면 두 번 지워져 CLI와 웹이 어긋난 적이 있다.

## Node CLI `tools/theora2hocon/theora2hocon.mjs`

```
node tools/theora2hocon/theora2hocon.mjs <input-dir> <out-dir> [--front <role>] [--layout theora|adk|markdown]
```

- **인자**(`argumentsFor`): 디렉터리 정확히 둘, `--front`/`--layout`는 중복·값 누락·미지의 플래그·잘못된 layout을 모두 거부한다.
- **획득**(`acquire`): 선택된 파일만 읽어 `{path, content}`로 만든다. 입력 루트 상위 경로까지 `lstat`로 확인해 심볼릭 링크를 따르지 않고, 디렉터리·파일 조회는 `readdir`의 실제 `entry.name`을 `===`로 비교하며 Dirent 종류가 일반 디렉터리/파일일 때만 선택한다. UTF-8은 `fatal: true, ignoreBOM: true` 디코더로 읽는다. 자동 선택은 Theora 역할 파일 유무 → 루트 `root_agent.yaml` 유무 → Markdown 순이며, 판정한 뒤 `parseRoles`에 레이아웃을 명시해 넘긴다. ADK는 `root_agent.yaml`에서 시작해 `adkReferences`가 알려 주는 파일만 읽고 같은 파일을 두 번 읽으려 하면 실패한다.
- **쓰기·출력**: 세 산출물을 메모리에서 직렬화한 뒤에야 `mkdir`·`writeFile`을 한다. 뒤이어 `parsed.notices`를 `Not converted for <role>: <keys>` 줄로 출력하고(키 값은 없음, 숨긴 키는 개수만) 성공 메시지는 배포·브라우저 동작이 검증되지 않았다고 말한다. 모든 예외는 한 줄 일반 메시지 `CVT-CLI-001: conversion failed…`와 종료 코드 1이다.

## Site A 변환 탭 `site-a/converter.html` + `converter.js`

- `site-a/converter.html`은 `site-a/styles.css`를 Review Desk와 공유하고 `site-a/index.html`과 같은 다섯 단계 nav를 가진다(Import 현재 위치). 디렉터리 선택(`webkitdirectory`)·Markdown 파일 선택·레이아웃(자동·Theora·ADK·Markdown)·front 입력과 샘플 버튼 셋(`data-converter-sample`: claude, adk, theora; 이 순서)을 둔다. "Source keys not converted" 구역 `#converter-notices`가 알림을 보인다. 산출물 구역의 안내는 현재 동작대로 Review Desk에서 검사·명세 질문·명시적 시험 실행을 하라고 안내한다([[editor-test-run]]).
- `site-a/converter.js`의 `convert()`는 같은 `parseRoles` → `emitNetwork` → `emitManifest`를 호출하고, 세 산출물을 AW2 `validateNetwork`([[validator-rules]])에 넣어 리포트를 그린 뒤 `artifactDownloads`(`site-a/artifact-download.js`)로 다운로드 링크를 만든다. `parsed.notices`는 "Not converted for <role>: …" 줄로 표시한다. 검증 실패는 성공으로 표시하지 않는다. 변환 오류는 `CVT-…` 규칙 ID만 보이고 원문은 보이지 않는다. 옵션 변경이나 새 입력은 `invalidate()`가 이전 결과·다운로드를 지운다.
- **획득 경계**(`readLocalFiles`, `readAdkFiles`): 레이아웃을 정한 뒤 선택된 파일만 UTF-8 해독하고 나머지는 경로만 남기고 내용을 읽지 않는다(`content: ''`). ADK는 `readAdkFiles`가 `adkReferences`를 따라 필요한 파일만 읽는다(로컬 파일과 샘플 fetch 두 경로가 이 함수를 공유). 디코더는 CLI와 같은 `fatal: true, ignoreBOM: true`. 비동기 획득은 토큰(`acquisition`)으로 늦게 도착한 결과가 새 입력을 덮지 못하게 한다.
- **샘플**: `site-a/converter/samples/claude-agents/`(coordinator·specialist), `site-a/converter/samples/adk/`(`site-a/converter/samples/adk/root_agent.yaml` → `site-a/converter/samples/adk/middle/agent.yaml` → `site-a/converter/samples/adk/middle/leaf/agent.yaml`, 뿌리 coordinator → specialist → researcher의 세 단계, 중간 에이전트는 `tools`·`model` 키를 가져 알림이 보인다), `site-a/converter/samples/theora/layout.json`을 `fetch`로 읽어 같은 파이프라인에 태운다.

## Review Desk로의 일회성 전달

변환 탭의 "Open artifacts in Review Desk"는 `sessionStorage`의 키 `agent-review-desk:converter`에 `{manifest, network, links}`를 쓰고 `site-a/index.html`로 이동한다. `site-a/site.js`의 `receiveConvertedInput()`이 페이지 로드 때 키를 읽자마자 **먼저 삭제**하고(잘못된 값도 제거), 구조를 검사한 뒤 입력란을 채우고 `validateNetwork` 리포트를 보인다. 삭제가 실패하면 소비하지 않고 저장소를 못 쓰면 데스크 자체는 막지 않는다. 이 전달은 정적 검토 입력만 채운다. 네트워크를 로드·실행하지 않고, 피어에 접촉하지 않고, 자격 증명을 주지 않고, 동의를 건너뛰지 않는다. 실행은 현재 검사에 실패가 없고 방문자가 Run을 눌렀을 때뿐이다([[editor-test-run]], [[site-a-review-desk]]).

## 변경하지 않은 것

변환기는 벤더 로더를 Node에서 실행하지 않는다. 서버·DB·인증은 없다. 시험 실행을 위한 런타임 변경은 변환기가 아니라 `site-a/runtime/`의 `Engine`에 있다([[vendored-runtime]]).
