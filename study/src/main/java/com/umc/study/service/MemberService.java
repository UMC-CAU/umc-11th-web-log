package com.umc.study.service;

import com.umc.study.dto.MemberResponse;
import com.umc.study.dto.SignUpRequest;
import com.umc.study.entity.Member;
import com.umc.study.exception.ApiException;
import com.umc.study.repository.MemberRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.nio.charset.StandardCharsets;

@Service
@RequiredArgsConstructor
public class MemberService {
    private final MemberRepository members;
    private final PasswordEncoder passwordEncoder;

    @Transactional
    public MemberResponse signUp(SignUpRequest request) {
        // bcrypt는 72바이트를 넘는 입력을 처리하지 못하므로 해시 전에 검사합니다.
        if (request.password().getBytes(StandardCharsets.UTF_8).length > 72) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "COMMON4001",
                    "비밀번호는 UTF-8 기준 72바이트 이하로 입력해주세요.");
        }
        if (members.existsByEmail(request.email())) {
            throw new ApiException(HttpStatus.CONFLICT, "MEMBER4091", "이미 사용 중인 이메일입니다.");
        }
        if (members.existsByNickname(request.nickname())) {
            throw new ApiException(HttpStatus.CONFLICT, "MEMBER4092", "이미 사용 중인 닉네임입니다.");
        }
        Member saved = members.saveAndFlush(new Member(request.email(),
                passwordEncoder.encode(request.password()), request.nickname()));
        return new MemberResponse(saved.getMemberId(), saved.getEmail(), saved.getNickname());
    }
}
