# JWT 로그인과 인증 인터셉터

## 구현 흐름

`POST /auth/login` → `LoginRequest` 검증 → `AuthService` → `MemberRepository.findByEmail()` → BCrypt 비밀번호 비교 → `JwtUtil` 토큰 발급 → `LoginResponse`

- 성공: HTTP 200, `COMMON200`, 닉네임과 Access Token 반환
- 이메일이 없거나 비밀번호 불일치: HTTP 401, `AUTH401_1` (같은 메시지)
- 필수값 누락 또는 이메일 형식 오류: HTTP 400, `COMMON4001`
- 잘못된 JSON: HTTP 400, `COMMON4002`
- `JwtUtil.getMemberId()`는 서명을 검증한 뒤 회원 ID를 반환합니다. 만료는 `AUTH401_4`, 잘못된 토큰은 `AUTH401_3` 예외입니다. exp 시각이 지나면 즉시 만료로 처리합니다.

`AuthInterceptor`가 컨트롤러 실행 전에 Bearer 토큰을 확인합니다. `WebConfig`에서 전체 경로에 등록하고 `/auth/**`, `/error`를 제외합니다. 회원가입 POST, 닉네임/이메일 확인 GET, 회원별 평점 목록 GET은 인터셉터에서 공개 요청으로 처리합니다. 기존 회원별 평점 쓰기 경로는 제거했고, `/ratings`의 등록·수정·삭제에는 토큰이 필요합니다.

검증된 회원 ID는 요청의 `AuthInterceptor.MEMBER_ID` (`memberId`) 속성에 저장됩니다. 컨트롤러에서는 `@RequestAttribute(AuthInterceptor.MEMBER_ID) Long memberId`로 받을 수 있습니다. 현재 컨트롤러는 `@LoginMember Long memberId`로 인증된 회원 ID를 받습니다. 평점 쓰기 경로는 `POST /ratings`, `PATCH /ratings/{ratingId}`, `DELETE /ratings/{ratingId}`이며 수정·삭제는 서비스에서 작성자와 로그인 회원을 비교합니다. 상세 구현과 검증 결과는 [7주차 미션 기록](week7-mission-record.md)을 참고하세요.

보호된 API 호출 시 Postman의 **Authorization → Bearer Token**에 로그인 응답의 `accessToken`을 입력하세요. 또는 다음 헤더를 직접 추가합니다.

```http
Authorization: Bearer 발급받은토큰
```

토큰 누락/잘못된 인증 방식은 HTTP 401 `AUTH401_2`, 잘못된 토큰은 `AUTH401_3`, 만료는 `AUTH401_4`입니다. OPTIONS 요청은 인증 없이 통과하며 CORS는 `Authorization` 헤더를 허용합니다.

## 실행과 호출

가장 간단한 실행 방법은 프로젝트 최상위의 `run-server.bat`를 더블클릭하는 것입니다. PowerShell에서는 프로젝트 최상위에서 `./run-server.bat`를 실행하세요. 로컬 실습용 JWT 키를 실행할 때마다 새로 생성하고 demo 프로필을 적용합니다. 환경변수 JWT_SECRET이 이미 있으면 해당 값을 사용합니다. 창에서 `Ctrl+C`로 종료합니다.

실행 환경에 `JWT_SECRET`과 `JWT_ACCESS_EXPIRATION`을 설정하세요.

- `JWT_SECRET`: UTF-8 기준 최소 32바이트의 비밀키
- `JWT_ACCESS_EXPIRATION`: 초 단위 양수 (예: `3600` = 1시간)

Spring Boot는 `.env.local` 파일을 자동으로 읽지 않습니다. IDE 실행 설정이나 터미널 환경변수로 전달해야 합니다.

DB 없이 실행하려면 `study` 폴더에서 환경변수를 설정한 뒤 `./gradlew.bat bootRun --args='--spring.profiles.active=demo'`를 사용합니다. demo DB는 서버 종료 시 사라집니다. demo의 기존 회원은 비밀번호가 더미 값이므로 먼저 회원가입하세요.

1. `POST /members`

```json
{"email":"login@example.com","password":"Umc!1234","nickname":"로그인회원"}
```

2. `POST /auth/login` (`Content-Type: application/json`)

```json
{"email":"login@example.com","password":"Umc!1234"}
```

응답 예시:

```json
{
  "isSuccess": true,
  "code": "COMMON200",
  "message": "로그인에 성공했습니다.",
  "result": {
    "nickname": "로그인회원",
    "accessToken": "발급된 JWT 문자열"
  }
}
```

## 테스트

`./gradlew.bat test --tests com.umc.study.AuthApiTests --tests com.umc.study.JwtUtilTests --tests com.umc.study.AuthInterceptorTests`

이 테스트는 H2와 테스트 전용 JWT 설정을 사용하므로 MySQL이나 별도 JWT 환경변수가 필요하지 않습니다.

## 비밀값 관리

DB 비밀번호는 DB_PASSWORD 환경변수로 전달합니다. 고정 JWT 키와 실제 DB 비밀번호는 Git에 저장하지 않습니다. .env.example은 형식만 보여주는 예시이며 Spring은 이 파일을 자동으로 읽지 않습니다. 로컬 demo 실행은 임의의 임시 키를 생성하므로 서버를 재시작한 뒤 다시 로그인해야 합니다.
