# 6주차 백엔드 미션 — 회원가입과 평점 쓰기 API

## 구현한 내용

기존 Spring Boot 프로젝트에 회원가입과 평점 등록·수정·삭제를 추가했다. 5주차의 이메일/닉네임 중복 확인과 회원별 평점 조회 API는 기존 응답 형식을 유지했다.

- 회원가입 DTO에서 이메일 형식/필수 여부, 닉네임 2~12자, 비밀번호 대문자·소문자·숫자·특수문자 포함 및 8자 이상을 검증한다. 워크북의 특수문자 규칙은 `!@#$%^&*` 중 하나다.
- `PasswordEncoder`의 bcrypt cost 10으로 해시한 60자 문자열만 저장한다. 응답 DTO에는 memberId/email/nickname만 있고 비밀번호나 해시는 없다. bcrypt 입력 제한에 맞춰 UTF-8 72바이트 초과 입력도 400으로 거절한다.
- 영화 ID는 양의 정수, 별점은 필수 정수 1~5, 후기는 선택 입력/최대 500자로 검증한다. 소수 또는 문자열을 정수로 자동 변환하지 않도록 Jackson을 설정했다.
- 수정·삭제 전에 회원 및 평점의 존재 여부와 평점 소유자를 확인한다. 다른 회원의 평점은 403, 없는 회원·평점은 404다.
- 이메일/닉네임/회원·영화 조합은 서비스 사전 검사와 DB UNIQUE 제약으로 중복 저장을 막는다.
- 공통 응답은 `isSuccess/code/message/result`다. 삭제 성공은 HTTP 규칙에 따라 204와 빈 본문을 반환한다.
- 기존 조회 성공 응답과 도서 API의 ProblemDetail 형식은 유지한다. 전역 예외 처리는 회원·평점 컨트롤러 범위에 적용한다.
- CORS에 POST/PATCH/DELETE와 JSON Content-Type을 허용했다. 로그인 기능이나 인증 필터는 추가하지 않았다.

## API 명세

| 기능 | 요청 | 성공 응답 |
| --- | --- | --- |
| 회원가입 | POST /members | 201, result: {memberId, email, nickname} |
| 평점 등록 | POST /members/{memberId}/ratings | 201, result: ratingId |
| 평점 수정 | PATCH /members/{memberId}/ratings/{ratingId} | 200, result: null |
| 평점 삭제 | DELETE /members/{memberId}/ratings/{ratingId} | 204, 본문 없음 |
| 평점 조회(기존) | GET /members/{memberId}/ratings | 200, 평점 배열 |
| 이메일 확인(기존) | GET /members/email/{email} | 200, {available} |
| 닉네임 확인(기존) | GET /members/nickname/{nickname} | 200, {available} |

회원가입 요청:

```json
{"email":"umc@example.com","password":"Umc!1234","nickname":"moviefan"}
```

회원가입 응답:

```json
{
  "isSuccess": true,
  "code": "COMMON201",
  "message": "회원가입에 성공했습니다.",
  "result": {"memberId": 3, "email": "umc@example.com", "nickname": "moviefan"}
}
```

평점 등록 요청:

```json
{"movieId":550,"score":5,"comment":"재미있게 봤어요."}
```

수정 요청에서는 score가 필수이며 comment를 생략하거나 null로 보내면 기존 후기를 비운다. movieId와 작성자는 수정하지 않는다.

| HTTP | code | 이유 |
| --- | --- | --- |
| 400 | COMMON4001 | 필수값·형식·길이·범위 검증 실패 |
| 400 | COMMON4002 | JSON 파싱 실패, 소수/문자열 별점, 잘못된 경로 자료형 |
| 403 | RATING4031 | 다른 회원의 평점 수정·삭제 |
| 404 | MEMBER4041 | 쓰기 요청의 회원 없음 |
| 404 | RATING4041 | 수정·삭제할 평점 없음 |
| 409 | MEMBER4091 | 이메일 중복 |
| 409 | MEMBER4092 | 닉네임 중복 |
| 409 | RATING4091 | 같은 회원이 같은 영화에 중복 평점 등록 |
| 409 | COMMON4091 | DB UNIQUE/FK 등 무결성 제약 위반 |

검증 실패는 필드명과 실패 이유를 message에 모아서 반환하고 입력 원문은 포함하지 않는다. 예외 처리에서도 SQL/바인딩 값/DB 오류 원문을 응답하지 않는다.

## 핵심 코드 링크

- [공통 응답](../src/main/java/com/umc/study/dto/ApiResponse.java)
- [회원가입 DTO](../src/main/java/com/umc/study/dto/SignUpRequest.java), [회원 응답 DTO](../src/main/java/com/umc/study/dto/MemberResponse.java)
- [회원가입 서비스](../src/main/java/com/umc/study/service/MemberService.java), [회원 컨트롤러](../src/main/java/com/umc/study/controller/MemberController.java)
- [평점 서비스](../src/main/java/com/umc/study/service/RatingService.java), [평점 컨트롤러](../src/main/java/com/umc/study/controller/RatingController.java)
- [등록 DTO](../src/main/java/com/umc/study/dto/CreateRatingRequest.java), [수정 DTO](../src/main/java/com/umc/study/dto/UpdateRatingRequest.java)
- [bcrypt 설정](../src/main/java/com/umc/study/config/PasswordConfig.java), [정수 입력 설정](../src/main/java/com/umc/study/config/JsonConfig.java)
- [전역 예외 처리](../src/main/java/com/umc/study/exception/GlobalExceptionHandler.java)
- [회귀 테스트](../src/test/java/com/umc/study/Week6ApiTests.java)

## 실행과 검증

Java 21을 사용한다. 아래 명령은 이 프로젝트의 `study` 폴더에서 실행한다.

```powershell
.\gradlew.bat test --tests '*Week6ApiTests' --tests '*Week5ApiTests'
.\gradlew.bat bootRun --args='--spring.profiles.active=demo'
```

Gradle이 잘못된 Java 버전을 사용한다면 JAVA_HOME을 설치된 JDK 21 경로로 설정한 뒤 같은 터미널에서 실행한다. demo는 외부 DB 없이 실행하는 H2 임시 DB이므로 종료 시 데이터가 사라진다. 실제 MySQL 환경은 기존 [5주차 실행 안내](week5-mission.md)의 week5 프로필을 사용한다. 이번 변경에 DB 삭제나 기존 데이터 변경 스크립트는 없다.

### 자동 검사 결과

H2를 사용하는 기존 Week5ApiTests 5개와 Week6ApiTests 17개, 총 22개 테스트 통과. bcrypt 해시 길이·일치 여부·서로 다른 salt, 비밀번호 응답 제외, 입력 검증, 실제 DB UNIQUE 위반, 소유권, 수정·삭제 후 DB 상태, CORS preflight를 확인했다.

DB 제약 테스트는 Repository의 사전 존재 확인만 false로 바꾸고 실제 JPA 저장은 수행했다. 이미 존재하는 이메일 또는 회원·영화 조합으로 저장을 시도하면 실제 H2 UNIQUE 제약이 이를 막고, 전역 예외 처리에서 409/COMMON4091로 변환했다. 동시 실행 테스트는 아니며, 동시 요청에서 사전 검사를 통과한 상황을 재현한 것이다.

### 실행 중 서버에 보낸 실제 HTTP 요청·응답

별도 demo 서버를 18086 포트에서 실행하고 [검증 스크립트](../scripts/verify-week6.mjs)로 15건을 호출해 상태 코드와 응답값을 검증했다.

```powershell
.\gradlew.bat bootRun --args='--spring.profiles.active=demo --server.port=18086'
# 별도 터미널에서 실행(Node.js 필요)
node scripts/verify-week6.mjs http://127.0.0.1:18086
```

- [실제 HTTP 원본 기록](evidence/http-records.json)
- [요청·응답 HTML 보고서](evidence/http-report.html)
- [회원가입 201 이미지 보고서](evidence/01-signup-201.png)
- [검증 실패 400 이미지 보고서](evidence/02-validation-400.png)
- [평점 등록 201 이미지 보고서](evidence/03-rating-201.png)

보고서에는 회원가입 성공/검증 실패/평점 등록·수정·삭제/각 오류가 모두 들어 있다. 파일을 브라우저에서 열어 확인할 수 있다. 이것은 실제 HTTP 응답으로 생성한 보고서이며 Postman 화면 캡처나 실제 MySQL 검증 결과가 아니다. PNG 3장도 동일한 원본 응답에서 생성했다. 다시 생성하려면 검증 스크립트 실행 후 Windows PowerShell에서 `./scripts/render-week6-evidence.ps1`을 실행한다.

### Postman 제출 자료 만들기

[Postman 컬렉션](week6.postman_collection.json)을 가져와 순서대로 실행한다. baseUrl의 기본값은 http://localhost:8080이다. 회원가입 요청은 매번 새 이메일/닉네임을 만들고 응답에서 memberId를 저장한다. 평점 등록 후 ratingId도 자동 저장하므로 뒤의 수정·삭제 요청에 재사용된다. demo의 샘플 회원 1번을 사용해 다른 회원의 요청을 검증한다.

인증용으로 01 회원가입 성공(201), 02 검증 실패(400), 05 평점 등록(201) 또는 11 수정(200)의 요청 URL·본문·응답 상태·응답 JSON이 함께 보이도록 캡처한다. DB 제약의 사전 검사 우회 재현은 자동 테스트 결과로 확인한다. 실제 Postman 화면 캡처와 MySQL 검증은 별도로 진행해야 한다.

## 트러블슈팅 1건

**이슈:** 기존 5주차 테스트와 새 6주차 테스트를 함께 실행하자 H2에서 `Table "category" already exists` 오류가 발생했다.

**문제:** Mockito Repository spy 추가로 테스트의 Spring 컨텍스트가 분리되었는데, 두 컨텍스트의 datasource URL이 모두 `jdbc:h2:mem:umcine`이었다. `DB_CLOSE_DELAY=-1`로 첫 DB가 남은 상태에서 두 번째 컨텍스트가 같은 생성 SQL을 다시 실행했다.

**해결:** Week6ApiTests의 테스트 설정에서 DB 이름을 `week6`로 지정하여 5주차 테스트 DB와 분리했다. 이후 두 테스트 클래스를 함께 실행해 22개 테스트가 모두 통과했다. 운영 DB나 기존 데이터에는 변경이 없다.

## 학습 정리

DTO 검증은 입력 형식과 범위를, 서비스는 존재 여부와 소유권·중복 업무 규칙을, DB는 UNIQUE/FK 제약을 담당한다. 서비스의 exists 검사와 저장 사이에 다른 요청이 들어올 수 있으므로 DB 제약이 마지막으로 중복 저장을 막아야 한다. 현재 memberId는 과제 요구대로 경로에서 받으며, 로그인 인증을 구현한 것은 아니다.

### 핵심 키워드

- **Bean Validation과 @Valid:** DTO의 NotBlank/Email/Size/Min/Max 같은 애노테이션은 입력 규칙을 선언한다. 컨트롤러의 @Valid가 요청 DTO 검증을 시작하고, 실패하면 서비스에 전달하기 전에 오류 응답을 만든다.
- **class-validator와 ValidationPipe:** NestJS에서 사용하는 대응 개념이다. class-validator 데코레이터로 규칙을 쓰고 ValidationPipe로 요청을 검증한다. 이번 구현에서는 Spring Boot만 선택했으므로 해당 라이브러리는 설치하지 않았다.
- **bcrypt와 salt round:** 비밀번호를 되돌릴 수 없는 해시로 바꾼다. 무작위 salt 때문에 같은 비밀번호도 매번 다른 해시가 된다. cost 값이 커질수록 계산 비용이 증가한다. 이번 설정은 cost 10이며, 로그인 시에는 해시 문자열을 단순 비교하지 않고 PasswordEncoder.matches를 사용한다.
- **201 / 204 / 409:** 201은 회원이나 평점 생성 성공, 204는 삭제 성공이며 응답 본문 없음, 409는 이미 사용 중인 이메일이나 중복 평점처럼 현재 저장 상태와 요청이 충돌한 경우다.
- **UNIQUE와 동시성:** 사전 중복 검사와 실제 저장 사이에 다른 요청이 들어올 수 있다. 두 요청이 검사를 모두 통과해도 DB UNIQUE가 최종 중복 저장을 막고, 서버는 제약 위반을 409로 변환한다.
- **@RestControllerAdvice / Exception Filter:** 여러 컨트롤러에서 발생한 오류를 한 곳에서 정해진 응답으로 변환한다. Spring에서는 @RestControllerAdvice와 @ExceptionHandler를, NestJS에서는 Exception Filter를 사용한다.

참고: [Spring MVC Validation](https://docs.spring.io/spring-framework/reference/web/webmvc/mvc-controller/ann-validation.html), [Spring Security Password Storage](https://docs.spring.io/spring-security/reference/features/authentication/password-storage.html).
