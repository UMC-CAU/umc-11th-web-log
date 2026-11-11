package com.umc.study.config;

import com.umc.study.interceptor.AuthInterceptor;
import com.umc.study.auth.LoginMemberArgumentResolver;
import org.springframework.web.method.support.HandlerMethodArgumentResolver;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.InterceptorRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
@RequiredArgsConstructor
public class WebConfig implements WebMvcConfigurer {
    private final AuthInterceptor authInterceptor;
    private final LoginMemberArgumentResolver loginMemberArgumentResolver;

    @Override
    public void addArgumentResolvers(List<HandlerMethodArgumentResolver> resolvers) {
        resolvers.add(loginMemberArgumentResolver);
    }

    @Override
    public void addInterceptors(InterceptorRegistry registry) {
        registry.addInterceptor(authInterceptor)
                .addPathPatterns("/**")
                .excludePathPatterns("/auth/**", "/error");
        // 회원가입/중복 확인/평점 목록은 인터셉터에서 HTTP 메서드까지 확인합니다.
    }
}
