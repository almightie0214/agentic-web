---
description: Site B(Spec Scout)가 네트워크를 불러오지 않고 공식 런타임의 설정 UI만 마운트하는 셸의 구조와 이유
---

# Site B — Spec Scout 셸

현재 Site B는 네트워크가 없는 셸이다. 설정과 채팅 UI는 Site A와 같은 공식 런타임 UI이지만, 자체 복사본 `site-b/runtime/`을 쓴다([[vendored-runtime]]). 네트워크 연결은 후속 단계(README: AW3)이며 아직 구현되지 않았다.

## 구성

- `site-b/index.html`: 스타일을 인라인으로 포함해 Site A 디렉터리의 파일을 참조하지 않는다(독립 배포 단위). `header`·`agents` 슬롯은 `hidden inert`로 두고, `settings`와 `chat` 슬롯만 쓴다.
- `site-b/site.js`: `mountShell()`.

## `site.js`의 동작과 이유

1. URL에 `key`가 있으면 `history.replaceState`로 제거한다. 런타임 `boot`의 자격 위생과 맞춘 것이다. `router`·`model` 쿼리는 남기지만 읽지 않는다.
2. `boot()`를 쓰지 않는다. `boot`는 `engine.loadTop()`으로 manifest를 반드시 가져오는데 Site B에는 발행된 네트워크가 없기 때문이다. 대신 `Engine`, `TraceBus`, `mountApp`을 직접 쓰고, `getSelectedByokProfile()`/`loadTabByokSetup()`으로 얻은 키·라우터·모델을 `Engine`에 넘긴다. 즉 manifest를 가져오지 않고 설정 패널만 마운트한다.
3. 검증된 네트워크가 없으므로 `#ns-input`과 `#ns-send`를 비활성화하고 placeholder로 안내한다. 에이전트 점검 슬롯도 숨긴다.
4. 런타임 로드 실패 시 앱을 숨기고 `role="alert"` 오류 문구를 보인다(URL 키 값은 문구에 포함되지 않는다).

네트워크가 연결되면 이 셸 코드(수동 마운트와 비활성화)가 바뀌어야 한다는 점에 주의한다. 이 내용은 소스 주석이 아니라 이 페이지로 남긴다([[no-compat-code-lessons]]의 주석 규칙).

## 검증

`tests/smoke.test.mjs`의 "Site B shell" 검사가 empty/profile/tab/failure 시나리오에서 UI 마운트, fetch 없음, 프로필·탭 설정 우선순위, 채팅 비활성, URL 키 제거를 확인한다. [[testing-and-gate]].
