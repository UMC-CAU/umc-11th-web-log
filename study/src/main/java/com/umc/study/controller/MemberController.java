package com.umc.study.controller;

import com.umc.study.dto.AvailabilityResponse;
import com.umc.study.dto.RatingResponse;
import com.umc.study.service.MemberQueryService;
import com.umc.study.service.MemberService;
import com.umc.study.dto.ApiResponse;
import com.umc.study.dto.MemberResponse;
import com.umc.study.dto.SignUpRequest;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/members")
@RequiredArgsConstructor
public class MemberController {
    private final MemberQueryService service;
    private final MemberService memberService;

    @PostMapping
    public ResponseEntity<ApiResponse<MemberResponse>> signUp(@Valid @RequestBody SignUpRequest request) {
        return ResponseEntity.status(201)
                .body(ApiResponse.created("회원가입에 성공했습니다.", memberService.signUp(request)));
    }

    @GetMapping("/nickname/{nickname}")
    public AvailabilityResponse checkNickname(@PathVariable String nickname) {
        return service.checkNickname(nickname);
    }
    @GetMapping("/email/{email}")
    public AvailabilityResponse checkEmail(@PathVariable String email) {
        return service.checkEmail(email);
    }
    @GetMapping("/{memberId}/ratings")
    public List<RatingResponse> ratings(@PathVariable Long memberId) {
        return service.getRatings(memberId);
    }
}
