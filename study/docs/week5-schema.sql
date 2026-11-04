-- 새 학습용 데이터베이스에만 실행하세요. 기존 DB를 삭제하거나 변경하지 않습니다.
CREATE DATABASE umcine_week5 CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE umcine_week5;
-- 같은 애플리케이션의 기존 4주차 JPA 엔티티도 시작할 때 검증하므로 빈 테이블을 준비합니다.
CREATE TABLE category (category_id BIGINT AUTO_INCREMENT PRIMARY KEY, name VARCHAR(255) NOT NULL);
CREATE TABLE book (book_id BIGINT AUTO_INCREMENT PRIMARY KEY, category_id BIGINT NOT NULL, title VARCHAR(100) NOT NULL, description TEXT, is_available BIT NOT NULL DEFAULT 1, FOREIGN KEY (category_id) REFERENCES category(category_id));
CREATE TABLE member (member_id BIGINT AUTO_INCREMENT PRIMARY KEY, email VARCHAR(254) NOT NULL UNIQUE, password VARCHAR(60) NOT NULL, nickname VARCHAR(50) NOT NULL UNIQUE, created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP, updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP);
CREATE TABLE rating (rating_id BIGINT AUTO_INCREMENT PRIMARY KEY, member_id BIGINT NOT NULL, movie_id BIGINT NOT NULL, score TINYINT NOT NULL, comment TEXT, created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP, updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP, FOREIGN KEY (member_id) REFERENCES member(member_id), UNIQUE KEY uk_rating_member_movie (member_id, movie_id));
CREATE TABLE favorite (favorite_id BIGINT AUTO_INCREMENT PRIMARY KEY, member_id BIGINT NOT NULL, movie_id BIGINT NOT NULL, created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP, updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP, FOREIGN KEY (member_id) REFERENCES member(member_id), UNIQUE KEY uk_favorite_member_movie (member_id, movie_id));
-- 실제 비밀번호가 아닌 테스트 데이터입니다.
INSERT INTO member (email, password, nickname) VALUES ('noco@umc.com', 'dummy-not-a-real-password', '수현'), ('minseo@umc.com', 'dummy-not-a-real-password', '민서');
INSERT INTO rating (member_id, movie_id, score, comment, created_at, updated_at) VALUES (1, 550, 5, '최고의 영화!', '2026-01-01 12:00:00', '2026-01-01 12:00:00'), (1, 155, 4, '다시 봐도 명작', '2026-01-02 12:00:00', '2026-01-02 12:00:00'), (2, 550, 3, '호불호가 갈릴 것 같아요', '2026-01-03 12:00:00', '2026-01-03 12:00:00');
