---
description: tests/fixtures.mjs의 정상 1·불량 3 검사 입력과 site-a/samples/ 4개 샘플 파일이 같은 판정을 내도록 묶인 방식
---

# 픽스처와 내장 샘플

## `tests/fixtures.mjs`

`fixtures`는 서로 독립적인(`structuredClone`) JSON 직렬화 가능 검사 입력 4개다. 형태는 `{ baseUrl, manifest, network, links }`이며 `baseUrl`은 하위 경로를 유지하는 `https://review.example.test/agentic-web/`다(예약 도메인 `.test`라 실제 서비스가 아니다).

| 키 | 정의 | 기대 판정 |
| --- | --- | --- |
| `valid` | 2-agent 네트워크 `artifact_review`. 둘째 agent는 `parameters`가 없고 instructions에 `${visitor_note}` 리터럴이 있다 | `valid: true` |
| `bad-frontman` | manifest 항목에서 `front_man`만 삭제 | `manifest.front_man` 실패, `/manifest/networks/0/front_man` |
| `bad-schema` | 둘째 agent의 `parameters`를 `{ type: 'not-a-json-schema-type' }`로 선언 | `agent.parameters` 실패, `.../parameters/type` |
| `bad-cycle` | 둘째 agent의 tools를 자신의 피어 URL(`.../artifact_review`)로 | `peer.composition` 실패, `/network/tools/1/tools/0` |

정상 픽스처의 두 케이스(parameters 생략, `${...}` 리터럴)는 오탐을 막는 대조군이다 — 이유는 [[validator-rules]]. `tests/validator.test.mjs`의 `fixtures:` 테스트들이 픽스처 사전조건을 확인한다. 불량 픽스처는 정상 픽스처와 한 군데만 다르다는 것과 레퍼런스 런타임(`AgentNetwork`, `RemoteRegistry.checkCycle`, `schemaFor`)과의 정합성이다. 고정된 스펙 §2.2 예시와의 구조 비교도 한다.

## `site-a/samples/`

`valid`, `bad-frontman`, `bad-schema`, `bad-cycle` 각각 `<id>.network.json`이며 내용은 같은 id의 픽스처와 `deepEqual`이다(`tests/validator.test.mjs`의 `samples:` 테스트가 단언). 페이지의 샘플 버튼(`data-sample`)이 `./samples/<id>.network.json`을 가져와 입력란에 채우고 즉시 검사한다([[site-a-review-desk]]). 샘플 네트워크를 실행하거나 합성 피어에 접속하지 않으며, `bad-cycle`은 정적 진단만 보여 주고 실제 브라우저 순환 중단은 입증하지 않는다(`runtime.composition`은 모든 샘플에서 `unverified`).

픽스처를 고치면 샘플 JSON도 같이 고쳐야 한다. 둘이 어긋나면 테스트가 실패한다.
