package com.umc.study.service;

import com.umc.study.dto.AvailabilityResponse;
import com.umc.study.dto.RatingResponse;
import com.umc.study.repository.MemberRepository;
import com.umc.study.repository.RatingRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;
import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class MemberQueryService {
    private final MemberRepository members;
    private final RatingRepository ratings;

    public AvailabilityResponse checkNickname(String nickname) {
        return new AvailabilityResponse(!members.existsByNickname(nickname));
    }
    public AvailabilityResponse checkEmail(String email) {
        return new AvailabilityResponse(!members.existsByEmail(email));
    }
    public List<RatingResponse> getRatings(Long memberId) {
        if (!members.existsById(memberId)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "회원을 찾을 수 없습니다.");
        }
        return ratings.findByMemberMemberIdOrderByCreatedAtDescRatingIdDesc(memberId)
                .stream().map(RatingResponse::from).toList();
    }
}
