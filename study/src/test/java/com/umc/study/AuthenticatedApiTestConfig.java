package com.umc.study;

import com.umc.study.util.JwtUtil;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.boot.webmvc.test.autoconfigure.MockMvcBuilderCustomizer;
import org.springframework.context.annotation.Bean;
import org.springframework.http.HttpHeaders;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;

// 기존 업무 동작 테스트는 로그인한 요청을 기본으로 사용합니다.
@TestConfiguration(proxyBeanMethods = false)
class AuthenticatedApiTestConfig {
    @Bean
    MockMvcBuilderCustomizer authenticatedRequests(JwtUtil jwtUtil) {
        return builder -> builder.defaultRequest(get("/").header(HttpHeaders.AUTHORIZATION,
                "Bearer " + jwtUtil.createAccessToken(1L, "noco@umc.com")));
    }
}
