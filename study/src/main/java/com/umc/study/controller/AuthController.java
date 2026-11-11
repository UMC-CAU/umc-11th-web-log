package com.umc.study.controller;

import com.umc.study.dto.ApiResponse;
import com.umc.study.dto.LoginRequest;
import com.umc.study.dto.LoginResponse;
import com.umc.study.service.AuthService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/auth")
@RequiredArgsConstructor
public class AuthController {
    private final AuthService authService;

    @PostMapping("/login")
    public ResponseEntity<ApiResponse<LoginResponse>> login(@RequestBody @Valid LoginRequest request) {
        return ResponseEntity.ok(ApiResponse.ok("로그인에 성공했습니다.", authService.login(request)));
    }
}
