package com.umc.study.interceptor;

import com.umc.study.exception.ApiException;
import com.umc.study.util.JwtUtil;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.HandlerInterceptor;

@Component
@RequiredArgsConstructor
public class AuthInterceptor implements HandlerInterceptor {
    public static final String MEMBER_ID = "memberId";
    private static final String BEARER_PREFIX = "Bearer ";
    private final JwtUtil jwtUtil;

    @Override
    public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler) {
        if (HttpMethod.OPTIONS.matches(request.getMethod()) || isPublicRequest(request)) {
            return true;
        }

        String header = request.getHeader(HttpHeaders.AUTHORIZATION);
        if (header == null || !header.startsWith(BEARER_PREFIX)) {
            throw new ApiException(HttpStatus.UNAUTHORIZED, "AUTH401_2", "로그인이 필요한 요청입니다.");
        }

        Long memberId = jwtUtil.getMemberId(header.substring(BEARER_PREFIX.length()));
        request.setAttribute(MEMBER_ID, memberId);
        return true;
    }

    private boolean isPublicRequest(HttpServletRequest request) {
        String path = request.getServletPath();
        // MockMvc를 포함해 servletPath가 비어 있는 요청도 처리합니다.
        if (path.isEmpty()) {
            path = request.getRequestURI().substring(request.getContextPath().length());
        }
        if (HttpMethod.POST.matches(request.getMethod()) && "/members".equals(path)) {
            return true;
        }
        // 같은 평점 경로라도 POST(등록)는 토큰이 필요합니다.
        return HttpMethod.GET.matches(request.getMethod())
                && (path.matches("/members/nickname/[^/]+")
                || path.matches("/members/email/[^/]+")
                || path.matches("/members/[^/]+/ratings"));
    }
}
