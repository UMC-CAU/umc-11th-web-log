package com.umc.study.entity;

import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

@Entity
@Table(name = "rating", uniqueConstraints = @UniqueConstraint(name = "uk_rating_member_movie", columnNames = {"member_id", "movie_id"}))
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class Rating {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "rating_id")
    private Long ratingId;
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "member_id", nullable = false)
    private Member member;
    @Column(name = "movie_id", nullable = false)
    private Long movieId;
    @Column(nullable = false)
    private Byte score;
    @Column(columnDefinition = "TEXT")
    private String comment;
    @Column(name = "created_at", nullable = false, insertable = false, updatable = false)
    private LocalDateTime createdAt;
    @Column(name = "updated_at", nullable = false, insertable = false)
    private LocalDateTime updatedAt;

    public Rating(Member member, Long movieId, Integer score, String comment) {
        this.member = member;
        this.movieId = movieId;
        this.score = score.byteValue();
        this.comment = comment;
    }

    public void update(Integer score, String comment) {
        this.score = score.byteValue();
        this.comment = comment;
        // MySQL ON UPDATE와 임시 H2 DB에서 동일하게 수정 시각을 갱신합니다.
        this.updatedAt = LocalDateTime.now();
    }
}
