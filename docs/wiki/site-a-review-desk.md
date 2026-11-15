---
description: Site A(Agent Review Desk)의 index.html·site.js·styles.css 구성과 런타임 boot로 네트워크를 불러오는 흐름, 실패 표시 방식
---

# Site A — Agent Review Desk

## 구성

- `site-a/index.html`: 상태 문단 `#site-status`(`role="status"`), `<noscript>` 안내, 처음엔 `hidden`인 `section#agent-app`. 그 안에 런타임이 채우는 슬롯 `data-ns-slot="header" | "settings" | "chat" | "agents"`가 있고, settings/chat은 `.desk-workspace` 레이아웃에 놓인다. 모든 참조는 `./styles.css`, `./site.js`처럼 상대경로다.
- `site-a/styles.css`: 사이트 스타일(`.site-shell`, `.desk-workspace`, `.desk-settings`, `.desk-chat`, 오류 상태 `.site-status[data-state="error"]`). 설계는 Review Desk와 이후 Converter가 이 스타일을 공유한다고 계획했다.
- `site-a/site.js`: 부트 셸. 새 설정 UI나 키 저장 로직은 없다.

## 부팅 흐름

`site-a/site.js`의 `mountDesk()`:

1. `./runtime/index.js`를 동적 import해 `boot(root, { originUrl, sandboxWorkerUrl })`를 호출한다. 두 URL은 `import.meta.url` 기준 상대 해석이라 하위 경로 배포에서도 맞다.
2. `boot`(`site-a/runtime/index.js`)가 `Engine`을 만들고 `engine.loadTop()`으로 `agent-manifest.json`과 네트워크 JSON을 읽어 검증한 뒤 `mountApp`으로 공식 설정 패널·채팅·에이전트 UI를 마운트한다. 자세한 데이터는 [[network-publication]], 런타임 동작은 [[vendored-runtime]].
3. 성공하면 `#agent-app`을 보이게 하고 준비 문구(provider 키가 필요하고 사이트 action은 연결되지 않았다는 안내)를 상태 문단에 쓴다.
4. 실패하면(런타임·manifest·네트워크 로드/검증 실패 모두) 앱을 숨긴 채 `role="alert"`, `data-state="error"`로 "could not be loaded" 안내를 보인다. 오류 객체를 문구에 노출하지 않는다.

앱은 `boot`가 끝나기 전에는 숨겨져 있다. 검증을 통과하지 못한 네트워크로는 UI가 열리지 않는다.

## 설정과 키

설정 패널(Provider URL, 모델 입력/목록, BYOK, 프로필 저장)은 런타임 내장이다. 키·라우터·모델은 URL이 아니라 호스트 옵션, 탭 설정, 저장된 프로필에서만 온다. URL의 `key`는 주소창에서 제거된다(`site-a/runtime/index.js`). 사이트 코드가 키 정책을 따로 두지 않는 것이 설계 선택이다.

## 검증

`tests/smoke.test.mjs`가 boot 성공/실패 시 가시성, `index.html`의 슬롯, 하위 경로에서의 아티팩트 로드를 검사한다. [[testing-and-gate]] 참고.
