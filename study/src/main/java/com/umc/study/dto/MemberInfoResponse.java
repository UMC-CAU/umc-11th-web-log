package com.umc.study.dto;

import com.umc.study.entity.Member;
import java.time.LocalDateTime;

public record MemberInfoResponse(String email, String nickname, LocalDateTime createdAt) {
    public static MemberInfoResponse from(Member member) {
        return new MemberInfoResponse(member.getEmail(), member.getNickname(), member.getCreatedAt());
    }
}
