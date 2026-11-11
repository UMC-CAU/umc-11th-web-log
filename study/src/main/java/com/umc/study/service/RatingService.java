package com.umc.study.service;

import com.umc.study.dto.CreateRatingRequest;
import com.umc.study.dto.RatingResponse;
import com.umc.study.dto.UpdateRatingRequest;
import com.umc.study.entity.Member;
import com.umc.study.entity.Rating;
import com.umc.study.exception.ApiException;
import com.umc.study.repository.MemberRepository;
import com.umc.study.repository.RatingRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import jakarta.persistence.EntityManager;

@Service
@RequiredArgsConstructor
@Transactional
public class RatingService {
    private final MemberRepository members;
    private final RatingRepository ratings;
    private final EntityManager entityManager;

    public RatingResponse create(Long memberId, CreateRatingRequest request) {
        Member member = requireMember(memberId);
        if (ratings.existsByMemberMemberIdAndMovieId(memberId, request.movieId())) {
            throw new ApiException(HttpStatus.CONFLICT, "RATING409_1", "이미 이 영화에 평점을 남기셨습니다.");
        }
        Rating saved = ratings.saveAndFlush(new Rating(member, request.movieId(),
                request.score(), request.comment()));
        entityManager.refresh(saved);
        return RatingResponse.from(saved);
    }

    public RatingResponse update(Long memberId, Long ratingId, UpdateRatingRequest request) {
        Rating rating = findOwnedRating(memberId, ratingId);
        rating.update(request.score(), request.comment());
        ratings.flush();
        return RatingResponse.from(rating);
    }

    public void delete(Long memberId, Long ratingId) {
        ratings.delete(findOwnedRating(memberId, ratingId));
        ratings.flush();
    }

    private Member requireMember(Long memberId) {
        return members.findById(memberId).orElseThrow(() ->
                new ApiException(HttpStatus.NOT_FOUND, "MEMBER404_1", "해당 회원을 찾을 수 없습니다."));
    }

    private Rating findOwnedRating(Long memberId, Long ratingId) {
        Rating rating = ratings.findById(ratingId).orElseThrow(() ->
                new ApiException(HttpStatus.NOT_FOUND, "RATING404_1", "해당 평점을 찾을 수 없습니다."));
        if (!rating.getMember().getMemberId().equals(memberId)) {
            throw new ApiException(HttpStatus.FORBIDDEN, "RATING403_1",
                    "본인이 작성한 평점만 수정하거나 삭제할 수 있습니다.");
        }
        return rating;
    }
}
