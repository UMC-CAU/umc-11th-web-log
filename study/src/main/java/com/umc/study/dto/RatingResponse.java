package com.umc.study.dto;

import com.umc.study.entity.Rating;
import java.time.LocalDateTime;

public record RatingResponse(Long ratingId, Long movieId, Byte score, String comment,
                             LocalDateTime createdAt, LocalDateTime updatedAt) {
    public static RatingResponse from(Rating rating) {
        return new RatingResponse(rating.getRatingId(), rating.getMovieId(), rating.getScore(),
                rating.getComment(), rating.getCreatedAt(), rating.getUpdatedAt());
    }
}
