package com.umc.study.service;

import com.umc.study.dto.CreateRatingRequest;
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

@Service
@RequiredArgsConstructor
@Transactional
public class RatingService {
    private final MemberRepository members;
    private final RatingRepository ratings;

    public Long create(Long memberId, CreateRatingRequest request) {
        Member member = requireMember(memberId);
        if (ratings.existsByMemberMemberIdAndMovieId(memberId, request.movieId())) {
            throw new ApiException(HttpStatus.CONFLICT, "RATING4091", "이미 이 영화에 평점을 남기셨습니다.");
        }
        return ratings.saveAndFlush(new Rating(member, request.movieId(),
                request.score(), request.comment())).getRatingId();
    }

    public void update(Long memberId, Long ratingId, UpdateRatingRequest request) {
        Rating rating = findOwnedRating(memberId, ratingId);
        rating.update(request.score(), request.comment());
        ratings.flush();
    }

    public void delete(Long memberId, Long ratingId) {
        ratings.delete(findOwnedRating(memberId, ratingId));
        ratings.flush();
    }

    private Member requireMember(Long memberId) {
        return members.findById(memberId).orElseThrow(() ->
                new ApiException(HttpStatus.NOT_FOUND, "MEMBER4041", "존재하지 않는 회원입니다."));
    }

    private Rating findOwnedRating(Long memberId, Long ratingId) {
        requireMember(memberId);
        Rating rating = ratings.findById(ratingId).orElseThrow(() ->
                new ApiException(HttpStatus.NOT_FOUND, "RATING4041", "존재하지 않는 평점입니다."));
        if (!rating.getMember().getMemberId().equals(memberId)) {
            throw new ApiException(HttpStatus.FORBIDDEN, "RATING4031",
                    "본인이 작성한 평점만 수정하거나 삭제할 수 있습니다.");
        }
        return rating;
    }
}
