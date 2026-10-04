# 4주차 필수 미션 기록

## 목표와 범위

Spring Boot + JPA로 도서 목록 조회와 등록 API를 구현한다. 선택 심화 기능은 추가하지 않았다.

## 진행 과정

1. 현재 프로젝트를 확인했다. Book·Category 엔티티, 요청·응답 DTO, JpaRepository, 도서 Service·Controller가 이미 구현되어 있었다.
2. 수정 전 `src`와 `build.gradle`을 `backups/before-week4`에 복사했다. 시작 시점에는 도서 API가 이미 ORM 코드였으므로 이 백업이 3주차 Raw SQL 원본은 아니다. 3주차 원본 제출이 필요하면 기존 보관본을 별도로 사용한다. 백업은 Git 제외 대상이다.
3. 기존 MySQL에 연결해 `ddl-auto: validate`로 엔티티와 테이블의 호환성을 확인했다. `open-in-view: false`와 Service의 트랜잭션 안에서 응답 DTO를 만드는 구조를 유지했다.
4. 없는 카테고리에서 발생하던 일반 IllegalArgumentException을 전용 CategoryNotFoundException으로 변경하고 404로 처리했다.
5. DTO 검증 오류와 잘못된 JSON·자료형은 400으로 응답하도록 BookExceptionHandler를 추가했다. 검증 오류에는 필드명과 메시지를 제공한다.
6. 실제 MySQL과 MockMvc를 사용하는 통합 테스트를 실행했다. 테스트에서 생성한 행은 트랜잭션 종료 시 롤백된다. MySQL AUTO_INCREMENT 번호는 롤백 후에도 증가할 수 있다.

## 핵심 코드 위치

| 구분 | 파일 (`src/main/java/com/umc/study/` 기준) | 역할 |
| --- | --- | --- |
| Entity | `entity/Book.java`, `entity/Category.java` | PK, category_id FK 및 다대일 관계 |
| DTO | `dto/CreateBookRequest.java`, `dto/BookResponse.java` | 입력 검증과 응답 필드 분리 |
| Repository | `repository/BookRepository.java`, `repository/CategoryRepository.java` | JPA 조회·저장 |
| Service | `service/BookService.java` | 최신순 조회, 카테고리 확인, 트랜잭션, DTO 변환 |
| Controller | `controller/BookController.java` | GET /books, POST /books 및 201 |
| 예외 | `exception/BookExceptionHandler.java`, `exception/CategoryNotFoundException.java` | 400·404 오류 응답 |

## API 계약

- `GET /books`: 200. 모든 도서를 bookId 내림차순으로 반환한다. 대여 불가능한 도서도 포함한다.
- `POST /books`: categoryId, title, 선택 값 description을 받는다. 정상 등록은 201이다.
- 응답 필드는 bookId, title, description, categoryName, isAvailable이다.
- categoryId 누락, 공백 제목, 100자를 넘는 제목 및 잘못된 ID 자료형은 400이다.
- 존재하지 않는 categoryId는 404이며 도서를 저장하지 않는다.

## 실행과 Postman 제출 캡처

프로젝트 폴더의 PowerShell에서 실행한다.

```powershell
.\gradlew.bat --gradle-user-home C:\Users\82106\.gradle bootRun
```

1. Postman에서 `docs/week4.postman_collection.json`을 Import한다.
2. 컬렉션의 `baseUrl`을 서버 주소로, `categoryId`를 실제 DB에 존재하는 카테고리 ID로 설정한다. 기본값 1의 존재 여부는 DB에서 확인한다.
3. `GET 도서 목록 (200)`, `POST 도서 등록 (201)`, `POST 빈 제목 (400)` 또는 `POST 없는 카테고리 (404)`를 실행한다.
4. 요청 URL·본문, 응답 상태 코드·본문이 보이도록 캡처해 제출한다. 정상 POST는 실제 DB에 도서 한 권을 저장한다.
5. 위 핵심 코드 파일의 캡처 또는 직접 업로드한 GitHub 링크를 함께 첨부한다.

Postman 화면 캡처와 GitHub 업로드는 아직 수행하지 않았다. 아래 검증 결과는 실제 MySQL을 사용한 자동화 테스트 결과이며 Postman 실행 결과를 대신 주장하지 않는다.

## 검증 결과

2026-10-04 실행:

```powershell
.\gradlew.bat --gradle-user-home C:\Users\82106\.gradle test --console=plain
```

`BUILD SUCCESSFUL`: 애플리케이션 컨텍스트 테스트 1개와 API 통합 테스트 8개, 총 9개 통과.

| 테스트 | 확인 결과 |
| --- | --- |
| 목록 조회 | 200, 최신순, 카테고리 이름, 응답 DTO의 5개 필드, 대여 불가능한 도서 포함 |
| 정상 등록 | 201, 실제 저장, 대여 가능 기본값 true |
| 선택 설명 및 제목 경계값 | description 생략 가능, 100자 제목 등록 성공 |
| 공백 제목 | 400, 저장하지 않음 |
| 101자 제목 | 400, 저장하지 않음 |
| categoryId 누락 | 400, 저장하지 않음 |
| categoryId 자료형 오류 | 400, 저장하지 않음 |
| 없는 카테고리 | 404, 저장하지 않음 |

테스트 코드: `src/test/java/com/umc/study/BookApiTests.java`.
HTML 결과: `build/reports/tests/test/index.html`.

**검증 문장:** 실제 MySQL을 연결한 통합 테스트에서 도서 최신순 조회, 정상 등록 201, DTO 검증 오류 400, 존재하지 않는 카테고리 404를 확인하여 필수 API 요구사항과 일치함을 검증했다.

## Raw SQL과 달라진 점 (제출용)

1. Raw SQL에서는 SQL 문자열과 물음표 파라미터 순서를 직접 관리했지만, ORM에서는 JpaRepository의 조회·저장 메서드로 같은 작업을 수행한다.
2. book의 category_id를 단순 숫자로 다루는 대신 Book과 Category 사이의 다대일 객체 관계로 표현했다.
3. 요청 DTO의 검증을 통해 잘못된 입력을 Service 실행 전에 거르고, 응답 DTO에는 API에 필요한 다섯 필드만 담아 엔티티와 API 계약을 분리했다.
4. ORM도 내부적으로 SQL을 실행하므로 테이블 구조, FK, 트랜잭션과 쿼리 성능에 대한 이해는 여전히 필요하다.

## 트러블슈팅

- 이슈: Gradle 실행 시 `C:\.gradle`에 잠금 파일을 만들 수 없었다.
- 원인: 기본 Gradle 사용자 홈이 현재 실행 환경에서 쓰기 가능한 사용자 캐시 위치와 달랐다.
- 해결: 기존 캐시가 있는 `--gradle-user-home C:\Users\82106\.gradle`을 지정해 빌드와 테스트를 완료했다.

- 이슈: 존재하지 않는 카테고리에 일반 IllegalArgumentException을 던지고 별도 HTTP 예외 처리가 없었다.
- 원인: 비즈니스 예외를 클라이언트 응답 상태로 변환하는 코드가 없었다.
- 해결: 카테고리 전용 예외와 RestControllerAdvice를 추가하고 404 및 미저장을 테스트했다.
