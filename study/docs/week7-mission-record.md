# 7주차 미션 기록 — JWT 인증과 평점 소유권 검증

작성일: 2026-11-11 (한국 시간)

## 1. 목표와 진행 상태

로그인으로 Access Token을 발급하고, 토큰에서 확인한 회원 ID로 내 정보와 평점 API를 처리했다. 평점 수정·삭제에는 작성자 확인을 추가했다.

Spring Boot 프로젝트의 실제 패키지는 워크북의 `com.umc.movie` 대신 `com.umc.study`를 사용했다.

- 필수 실습 1~6: 구현 완료
- 본문 9단계: 실제 로컬 HTTP 호출로 순서대로 검증 완료
- 자동 테스트: 총 54개 통과, 실패 0개
- 선택 미션 `@LoginMember`: 구현 및 정상 요청 검증 완료
- 선택 미션 60초 만료: 별도 임시 서버에서 실제 시간 경과 검증 완료
- Postman 직접 실행 및 제출용 화면 캡처: **사용자가 진행할 항목**

검증은 Node.js `fetch`와 Spring MockMvc로 수행했다. 이 문서와 JSON 결과는 실제 검증 기록이며, Postman에서 실행한 화면 캡처로 대체해 표시하지 않았다. 컴퓨터 조작은 사용자의 요청으로 중단했다.

## 2. 구현 과정

### 실습 1. 로그인 API

기존 `POST /auth/login`의 로그인 흐름과 테스트를 확인했다. 이메일로 회원을 찾고 `PasswordEncoder.matches()`로 입력 비밀번호와 저장된 BCrypt 해시를 비교한다. 성공하면 닉네임과 Access Token을 반환한다.

존재하지 않는 이메일과 틀린 비밀번호 모두 `401 / AUTH401_1`로 응답한다. 이메일 존재 여부를 실패 응답만으로 구분할 수 없게 하기 위해서다. 실제 HTTP 검증에서 두 응답 전체가 동일한지 비교했다.

### 실습 2. 토큰을 검사하는 인터셉터

`AuthInterceptor`가 Authorization 헤더의 `Bearer ` 접두사를 확인한 뒤 `JwtUtil`로 서명을 검증한다. 통과한 회원 ID만 요청 속성에 저장한다.

```text
클라이언트 요청
→ AuthInterceptor: 헤더 검사, 서명·만료 검증
→ request에 검증된 memberId 저장
→ LoginMemberArgumentResolver
→ 컨트롤러
→ 서비스의 데이터 소유권 검사
```

토큰이 없으면 `AUTH401_2`, 잘못된 토큰이면 `AUTH401_3`, 만료된 토큰이면 `AUTH401_4`를 사용한다. `ApiExceptionHandler`는 예외의 HTTP 상태와 code를 공통 응답에 그대로 담는다.

회원가입, 로그인, 닉네임·이메일 중복 확인, 회원별 평점 목록 조회는 공개 요청으로 유지했다. OPTIONS 요청도 인증 없이 통과시킨다.

### 실습 3. 내 정보 조회

`GET /members/me`에서 인증된 회원 ID로 회원을 조회한다. `MemberInfoResponse`에는 `email`, `nickname`, `createdAt`만 담는다. 비밀번호를 응답에 포함하지 않는지도 테스트했다.

정상 토큰으로 조회한 이메일이 로그인 계정의 이메일과 같은지 확인했고, payload 한 글자만 바꾼 토큰은 `401 / AUTH401_3`으로 거절됐다.

### 실습 4. 내 정보 수정

`PATCH /members/me`와 `MemberUpdateRequest`를 추가했다. 닉네임은 공백을 허용하지 않고 2~12자로 제한했다.

`existsByNicknameAndMemberIdNot()`로 본인을 제외한 닉네임 중복을 검사했다. 기존 닉네임을 그대로 제출하면 성공하며, 다른 회원의 닉네임을 제출하면 `409 / MEMBER409_1`을 반환한다. 변경은 `Member.updateNickname()`과 서비스 트랜잭션으로 저장한다.

### 실습 5. 평점 API를 토큰 기반으로 전환

| 기능 | 변경 전 | 변경 후 |
| --- | --- | --- |
| 등록 | `POST /members/{memberId}/ratings` | `POST /ratings` |
| 수정 | `PATCH /members/{memberId}/ratings/{ratingId}` | `PATCH /ratings/{ratingId}` |
| 삭제 | `DELETE /members/{memberId}/ratings/{ratingId}` | `DELETE /ratings/{ratingId}` |

평점 쓰기 API에서 경로의 회원 ID를 제거했다. 요청 바디도 `movieId`, `score`, `comment`만 사용한다. 서버가 토큰에서 확인한 회원 ID를 작성자로 사용하므로, 클라이언트가 작성자를 지정할 수 없다.

등록과 수정은 `RatingResponse`를 반환하도록 변경했다. 등록 직후에는 DB가 생성한 시각을 읽어 응답에 포함하도록 `saveAndFlush()` 후 `EntityManager.refresh()`를 사용했다. 삭제는 `200 / COMMON200`과 `result: null`을 반환한다.

### 실습 6. 소유권 검사

`findOwnedRating()`에서 먼저 평점을 찾고, 평점이 있으면 작성자 ID와 로그인한 회원 ID를 비교한다.

- 대상 평점이 없음: `404 / RATING404_1`
- 대상은 있지만 작성자가 다름: `403 / RATING403_1`
- 작성자가 같음: 수정 또는 삭제 진행

다른 회원의 토큰으로 수정·삭제를 시도한 뒤에도 원래 평점이 유지되는지 자동 테스트로 확인했다.

## 3. 본문 9단계 실제 검증 기록

환경은 Java 21, Spring Boot, 로컬 H2 `demo` 프로필, `http://localhost:8080`이다. 검증 시각은 2026-11-11 19:49 (KST)이며, 토큰 유효시간은 3,600초였다.

반복 실행 시 계정이 충돌하지 않도록 회원 이메일에 실행 시각을 붙였다. 이번 검증에서 A는 `a+1794394139321@umc.com`, B는 `b+1794394139321@umc.com`이었다. 기존 사용자의 계정을 테스트에 사용하지 않았다.

| 단계 | 실행 내용 | 실제 결과 |
| --- | --- | --- |
| 1 | A, B 회원가입 | 각각 `201 / COMMON201` |
| 2 | A, B 로그인 | 각각 `200 / COMMON200`, 토큰 발급 |
| 3 | A 토큰으로 평점 등록 | `201 / COMMON201`, `ratingId: 5` |
| 4 | 같은 영화 중복 등록 | `409 / RATING409_1` |
| 5 | A 토큰으로 본인 평점 수정 | `200 / COMMON200`, score가 3으로 변경 |
| 6 | B 토큰으로 A의 평점 수정 | `403 / RATING403_1` |
| 7 | 토큰 없이 같은 수정 요청 | `401 / AUTH401_2` |
| 8 | 존재하지 않는 평점 99999 삭제 | `404 / RATING404_1` |
| 9 | A 토큰으로 본인 평점 삭제 | `200 / COMMON200`, `result: null` |

실제 등록 요청 바디:

```json
{
  "movieId": 99007,
  "score": 5,
  "comment": "7주차 미션 등록"
}
```

실제 등록 성공 응답:

```json
{
  "isSuccess": true,
  "code": "COMMON201",
  "message": "평점 등록에 성공했습니다.",
  "result": {
    "ratingId": 5,
    "movieId": 99007,
    "score": 5,
    "comment": "7주차 미션 등록",
    "createdAt": "2026-11-11T19:49:00.246718",
    "updatedAt": "2026-11-11T19:49:00.246718"
  }
}
```

실제 타인 평점 수정 실패 응답:

```json
{
  "isSuccess": false,
  "code": "RATING403_1",
  "message": "본인이 작성한 평점만 수정하거나 삭제할 수 있습니다.",
  "result": null
}
```

실제 토큰 없는 내 정보 조회 응답:

```json
{
  "isSuccess": false,
  "code": "AUTH401_2",
  "message": "로그인이 필요한 요청입니다.",
  "result": null
}
```

9단계 뒤에 삭제한 평점을 다시 삭제해 404가 나오는지도 확인했다. 전체 HTTP 결과 22건은 [http-results.json](evidence/week7/http-results.json)에 기록했다. 이 파일에는 비밀번호와 원본 토큰을 남기지 않았다.

## 4. 선택 미션

### `@LoginMember`로 반복 코드 줄이기

적용 전:

```java
public ResponseEntity<ApiResponse<MemberInfoResponse>> getMyInfo(
        @RequestAttribute(AuthInterceptor.MEMBER_ID) Long memberId) {
    // ...
}
```

적용 후:

```java
public ResponseEntity<ApiResponse<MemberInfoResponse>> getMyInfo(
        @LoginMember Long memberId) {
    // ...
}
```

`LoginMemberArgumentResolver`는 `@LoginMember Long` 파라미터만 처리하고, 인터셉터가 요청 속성에 저장한 값을 읽는다. 요청 속성에 유효한 회원 ID가 없으면 `401 / AUTH401_2`를 던진다. `WebConfig.addArgumentResolvers()`에 등록했으며 내 정보 조회·수정, 평점 등록·수정·삭제에 모두 적용했다.

컨트롤러에서 `@RequestAttribute`와 문자열 `"memberId"`로 로그인 정보를 꺼내는 코드를 제거했다. 서비스 내부에서는 회원 ID를 계속 사용한다.

### 60초 토큰 만료

기본 서버의 유효시간은 3,600초로 유지하고, 별도 임시 서버 `http://localhost:8081`에만 `JWT_ACCESS_EXPIRATION=60`을 적용했다.

기존 `clockSkewSeconds(60)` 설정은 만료 뒤에도 60초를 더 허용하므로, 워크북의 1분 만료 실습과 맞추기 위해 제거했다. 현재는 토큰의 `exp`가 지나면 만료로 처리한다.

실제 JWT의 `exp - iat`가 60인지 확인하고, 만료 전 조회 성공 → 만료 시각 경과 → 같은 토큰으로 조회 실패 → 토큰 없는 응답과 비교하는 순서로 검증했다. 상세 시각과 응답은 [expiry-results.json](evidence/week7/expiry-results.json)에 기록했다. UI 캡처는 별도로 진행해야 한다.

| 시각 (2026-11-11 KST) | 요청 | 실제 결과 |
| --- | --- | --- |
| 19:50:23 | 발급 직후 토큰으로 내 정보 조회 | `200 / COMMON200` |
| 19:51:23 | 같은 토큰으로 내 정보 재조회 | `401 / AUTH401_4` |
| 19:51:23 | 토큰 없이 내 정보 조회 | `401 / AUTH401_2` |

## 5. 테스트와 재현 방법

프로젝트 최상위에서 서버 실행:

```powershell
.\run-server.bat
```

demo DB는 메모리 DB이므로 서버 종료 시 계정과 평점이 사라진다. 재시작한 경우 회원가입부터 다시 진행한다.

`study` 폴더에서 전체 테스트:

```powershell
.\gradlew.bat --gradle-user-home "$env:USERPROFILE\.gradle" test --offline
```

캐시에 의존성이 없는 최초 환경에서는 `--offline`을 제외한다. 테스트는 `src/test/resources/application.properties`의 H2 demo 프로필과 테스트용 JWT 키를 사용한다.

| 테스트 클래스 | 통과 |
| --- | ---: |
| AuthApiTests | 5 |
| AuthInterceptorTests | 13 |
| JwtUtilTests | 5 |
| Week6ApiTests | 17 |
| Week5ApiTests | 5 |
| BookApiTests | 8 |
| StudyApplicationTests | 1 |
| 합계 | 54 |

JUnit 결과 요약은 [test-results.json](evidence/week7/test-results.json)에 저장했다.

프로젝트 최상위에서 실제 HTTP 검증 재실행:

```powershell
node study/scripts/verify-week7.mjs
```

선택 만료 실습을 다시 실행하려면 별도 PowerShell의 `study` 폴더에서 아래처럼 서버를 시작한다. 실습용 키이며 운영용으로 사용하지 않는다. 기본 8080 서버의 설정은 바뀌지 않는다.

```powershell
$env:JWT_SECRET = 'local-expiry-demo-secret-key-at-least-32-bytes'
$env:JWT_ACCESS_EXPIRATION = '60'
.\gradlew.bat --gradle-user-home "$env:USERPROFILE\.gradle" bootRun --args="--spring.profiles.active=demo --server.port=8081"
```

서버가 시작된 뒤 다른 터미널의 프로젝트 최상위에서 아래 검증을 실행한다. 이 스크립트는 실제로 약 1분간 기다린다.

```powershell
node study/scripts/verify-week7.mjs http://localhost:8081 --expiry
```

## 6. 직접 진행할 Postman 제출 캡처

[week7-mission.postman_collection.json](postman/week7-mission.postman_collection.json)을 Postman에 Import한다. `baseUrl` 기본값은 `http://localhost:8080`이다. 첫 요청부터 순서대로 Send하면 실행별 계정이 만들어지고, 로그인 응답에서 `tokenA`, `tokenB`, 등록 응답에서 `ratingId`가 자동으로 저장된다. 스크립트는 상태 코드와 응답 code도 검사한다.

컬렉션 18개 요청의 변수 치환과 pre-request/test 스크립트는 Node.js에서 실제 HTTP 요청과 함께 검사했다. 총 36개 상태·code 검사를 통과했으며, 결과는 [collection-validation.json](evidence/week7/collection-validation.json)에 저장했다. 이 검증은 Postman 앱에서 직접 실행한 것을 의미하지 않는다.

전체 폴더를 실행한 뒤에는 09에서 평점이 삭제되므로, 03과 06의 응답은 해당 단계에서 캡처한다. 다시 진행하려면 01-A부터 새로 실행한다.

| 제출물 | 컬렉션 요청 | 캡처에 포함할 내용 | 상태 |
| --- | --- | --- | --- |
| 로그인 성공 | 02-A | URL, 200 상태, nickname과 accessToken 응답 | 직접 촬영 필요 |
| 토큰 없는 내 정보 조회 | 10 | GET `/members/me`, No Auth, 401, `AUTH401_2` | 직접 촬영 필요 |
| 다른 회원의 평점 수정 | 06 | PATCH URL, B 토큰 사용, 403, `RATING403_1` | 직접 촬영 필요 |
| 본인 평점 등록 | 03 | POST `/ratings`, memberId 없는 요청 JSON, 201, `COMMON201` | 직접 촬영 필요 |

추가 선택 제출물은 만료 전 200과 만료 후 `401 / AUTH401_4` 화면, 그리고 `@LoginMember` 적용 코드와 정상 조회 응답이다. 캡처를 이 문서 또는 Notion 미션 페이지에 붙인 뒤 제출한다.

## 7. 트러블슈팅

### 기존 평점 API가 URL 회원 ID를 신뢰하던 문제

- 이슈: 토큰 검증이 있더라도 컨트롤러가 URL의 회원 ID를 사용하면 요청자가 다른 회원 번호를 지정할 수 있었다.
- 원인: 인증된 회원 ID와 업무 처리에 사용하는 회원 ID의 출처가 달랐다.
- 해결: 평점 쓰기 경로에서 memberId를 제거하고 `@LoginMember`로 검증된 ID를 전달했다. B 회원 토큰으로 A 평점을 수정·삭제하는 테스트를 추가해 기존 데이터가 유지되는지도 확인했다.

### 전체 테스트가 환경 설정 때문에 시작되지 않던 문제

- 이슈: 전체 테스트 첫 실행에서 기존 테스트 일부가 JWT 환경변수 누락, MySQL/H2 설정 불일치, member 테이블 누락으로 실패했다.
- 원인: 일부 테스트는 demo 프로필이나 테스트용 JWT 설정 없이 애플리케이션 설정을 읽었다.
- 해결: 테스트 리소스에 demo 프로필과 테스트용 JWT 설정을 추가했다. 전체 54개 테스트가 MySQL 없이 통과했다.

### Gradle이 `C:\.gradle`에 캐시를 만들려던 문제

- 이슈: 기본 실행에서 캐시 잠금 파일을 만들지 못했다.
- 해결: `--gradle-user-home "$env:USERPROFILE\.gradle"`로 기존 사용자 캐시 경로를 지정해 실행했다.

### 평점 등록 응답의 생성 시각

- 원인: createdAt/updatedAt은 DB 기본값이 생성하므로 저장 직후의 엔티티가 값을 갖고 있지 않을 수 있다.
- 해결: flush 후 엔티티를 refresh해서 DB가 생성한 값을 읽었다. 실제 등록 응답에 두 시각이 포함되는 것을 확인했다.

### 폐기한 URL의 405 응답

- 이슈: 검증 스크립트에서 폐기한 POST 경로에도 `COMMON405`가 있을 것이라고 가정해 추가 검사에 실패했다.
- 원인: 해당 경로는 GET 목록 조회만 남아 있어 Spring 기본 405 응답이 반환된다.
- 해결: 명세에 없는 응답 code를 가정하지 않고, 해당 요청은 405 상태와 쓰기 경로 폐기 여부를 검증하도록 수정했다.

## 8. 학습 정리

인증은 요청자를 확인하는 과정이고, 인가는 확인된 요청자가 특정 데이터를 변경할 수 있는지 판단하는 과정이다. 정상 토큰을 가진 B도 A의 평점을 수정할 수 없다는 결과로 둘의 차이를 확인했다.

JWT payload는 내용을 읽을 수 있으므로 비밀번호 같은 비밀 정보를 넣지 않는다. payload를 읽거나 변경하는 것 자체를 막는 방식이 아니라, 서버가 서명 검증으로 변경된 토큰을 거절하는 방식이다. 이번 검증에서는 payload 한 글자 변경으로 `AUTH401_3`이 반환됐다.

401은 토큰 누락·위조·만료처럼 인증이 실패한 경우이고, 403은 인증을 통과했지만 해당 평점을 수정할 권한이 없는 경우다. 404는 대상 평점이 없는 경우로 구분했다.

## 9. 제출 전 남은 작업

- [ ] Postman에서 컬렉션을 직접 실행하고 필수 응답 4장을 촬영한다.
- [ ] 선택 미션을 제출한다면 만료 전후 응답과 `@LoginMember` 코드를 캡처한다.
- [ ] 이 기록과 실제 캡처를 Notion 미션 페이지에 옮긴다.
- [ ] 직접 확인한 학습 후기와 스터디 인증샷을 추가한다.
- [ ] 완성한 Notion 페이지 URL을 제출한다.

외부 사이트 업로드, Notion 게시, 미션 제출은 수행하지 않았다.
