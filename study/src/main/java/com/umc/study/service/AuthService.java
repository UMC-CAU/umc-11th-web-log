package com.umc.study.service;

import com.umc.study.dto.LoginRequest;
import com.umc.study.dto.LoginResponse;
import com.umc.study.entity.Member;
import com.umc.study.exception.ApiException;
import com.umc.study.repository.MemberRepository;
import com.umc.study.util.JwtUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class AuthService {
    private final MemberRepository memberRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;

    @Transactional(readOnly = true)
    public LoginResponse login(LoginRequest request) {
        Member member = memberRepository.findByEmail(request.email())
                .orElseThrow(() -> new ApiException(HttpStatus.UNAUTHORIZED, "AUTH401_1",
                        "이메일 또는 비밀번호가 올바르지 않습니다."));

        if (!passwordEncoder.matches(request.password(), member.getPassword())) {
            throw new ApiException(HttpStatus.UNAUTHORIZED, "AUTH401_1",
                    "이메일 또는 비밀번호가 올바르지 않습니다.");
        }

        String accessToken = jwtUtil.createAccessToken(member.getMemberId(), member.getEmail());
        return new LoginResponse(member.getNickname(), accessToken);
    }
}
