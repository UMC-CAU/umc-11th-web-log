package com.umc.study.controller;

import com.umc.study.dto.AvailabilityResponse;
import com.umc.study.dto.RatingResponse;
import com.umc.study.service.MemberQueryService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/members")
@RequiredArgsConstructor
public class MemberController {
    private final MemberQueryService service;

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
