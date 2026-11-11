package com.umc.study.controller;

import com.umc.study.dto.ApiResponse;
import com.umc.study.dto.CreateRatingRequest;
import com.umc.study.dto.RatingResponse;
import com.umc.study.auth.LoginMember;
import com.umc.study.dto.UpdateRatingRequest;
import com.umc.study.service.RatingService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequiredArgsConstructor
@RequestMapping("/ratings")
public class RatingController {
    private final RatingService ratings;

    @PostMapping
    public ResponseEntity<ApiResponse<RatingResponse>> create(
            @LoginMember Long memberId,
            @Valid @RequestBody CreateRatingRequest request) {
        return ResponseEntity.status(201)
                .body(ApiResponse.created("평점 등록에 성공했습니다.", ratings.create(memberId, request)));
    }

    @PatchMapping("/{ratingId}")
    public ApiResponse<RatingResponse> update(@LoginMember Long memberId, @PathVariable Long ratingId,
                                    @Valid @RequestBody UpdateRatingRequest request) {
        return ApiResponse.ok("평점 수정에 성공했습니다.", ratings.update(memberId, ratingId, request));
    }

    @DeleteMapping("/{ratingId}")
    public ResponseEntity<ApiResponse<Void>> delete(@LoginMember Long memberId, @PathVariable Long ratingId) {
        ratings.delete(memberId, ratingId);
        return ResponseEntity.ok(ApiResponse.ok("평점을 삭제했습니다.", null));
    }
}
