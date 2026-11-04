# 5주차: 화면과 API 연결

## 1. 구현 범위
기존 도서 서비스를 유지하면서 Member와 Rating 엔티티, Repository, DTO, Service와 세 조회 API를 추가했다. 즐겨찾기는 워크북에 맞춰 MySQL 테이블만 준비하고 API는 추가하지 않았다. 각 회원의 평점은 생성 시각 내림차순이며 같은 시각에는 ID 내림차순이다.

| Method / 경로 | 응답 |
| --- | --- |
| GET /members/nickname/{nickname} | {"available": true 또는 false} |
| GET /members/email/{email} | {"available": true 또는 false} |
| GET /members/{memberId}/ratings | ratingId, movieId, score, comment, createdAt, updatedAt의 배열. 회원이 없으면 404 |

CORS는 회원 조회 경로에 한해 localhost/127.0.0.1의 5173, 5174 포트를 허용한다. 인증이나 회원가입 기능은 이번 미션 범위에 포함되지 않는다.

## 2. MySQL 준비
MySQL Server를 설치하고 실행한다. Workbench에서 관리자 계정으로 접속해 `docs/week5-schema.sql`을 연 다음 실행한다. 이 파일은 별도 데이터베이스 `umcine_week5`를 새로 만들며 4주차 테이블도 빈 상태로 준비한다. 이미 같은 이름의 DB가 있다면 실행하지 말고 이름을 바꾼 뒤 연결 설정도 함께 변경한다. 기존 데이터를 삭제하는 명령은 없다. 샘플 비밀번호는 로그인용이 아닌 더미 문자열이다.

PowerShell에서 `study` 폴더로 이동해 실행한다. Java 21이 필요하다. 프로젝트에는 Gradle wrapper가 포함되어 있다. 로그인 비밀번호는 채팅, 코드, git에 넣지 않는다.

```powershell
$env:DB_PASSWORD = [System.Net.NetworkCredential]::new('', (Read-Host 'MySQL root 비밀번호' -AsSecureString)).Password
$env:DB_USERNAME = 'root'
.\gradlew.bat bootRun --args='--spring.profiles.active=week5'
```

종료 후 같은 PowerShell 창에서 `$env:DB_PASSWORD = $null`로 환경 변수 값을 제거한다. 기본 연결 주소는 localhost:3306/umcine_week5이며 필요하면 DB_URL 환경 변수로 변경한다. 원래 application.yaml은 수정하지 않았다.

## 3. 프론트와 실습
UMCine 프론트엔드를 `pnpm dev`로 실행하고 회원 정보 화면에서 닉네임 `수현`, 이메일 `noco@umc.com`, 회원 번호 `1`을 각각 확인한다. 첫 두 값은 사용 중, 평점은 최신순 2건이 나와야 한다. 존재하지 않는 회원 번호는 404 메시지가 나온다. 이 화면은 조회 실습이며 로그인이나 실제 개인정보 보호 기능은 구현하지 않았다.

Postman에서 `docs/week5.postman_collection.json`을 가져와 URL과 JSON 응답이 함께 보이도록 캡처한다. CORS 전후 실습은 서버를 `--spring.profiles.active=week5 --app.cors.enabled=false` 옵션으로 시작한 후 프론트의 회원 정보 화면에서 요청하면 된다. 다시 서버를 기본 설정으로 시작하면 허용된 출처에서 요청할 수 있다. Postman은 브라우저 CORS 정책을 적용받지 않으므로 브라우저에서 확인한다.

## 4. 임시 데모와 자동 테스트
MySQL이 준비되지 않았다면 `--spring.profiles.active=demo`를 사용해 임시 H2 DB와 샘플 데이터로 화면을 시험할 수 있다. 이는 MySQL 실습을 대체하지 않으며 서버를 끄면 데이터가 사라진다. `Week5ApiTests`는 H2로 중복/비중복, 사용자별 최신순, 404, CORS 허용/차단을 확인한다. 기존 4주차 테스트는 별도의 MySQL 환경이 필요하다.

## 5. 미션 기록
ERD, SQL 생성 및 시드, Entity/Repository/DTO/Service/Controller, Postman의 세 요청과 응답, CORS 전후, 본인 웹 화면의 API 호출 과정을 캡처하고 오류가 있었다면 원인과 해결 과정을 기록한다. 테스트하지 않은 항목은 검증한 것으로 기록하지 않는다.
