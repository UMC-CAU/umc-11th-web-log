package com.umc.study.auth;

import com.umc.study.exception.ApiException;
import com.umc.study.interceptor.AuthInterceptor;
import org.springframework.core.MethodParameter;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.web.bind.support.WebDataBinderFactory;
import org.springframework.web.context.request.NativeWebRequest;
import org.springframework.web.context.request.RequestAttributes;
import org.springframework.web.method.support.HandlerMethodArgumentResolver;
import org.springframework.web.method.support.ModelAndViewContainer;

@Component
public class LoginMemberArgumentResolver implements HandlerMethodArgumentResolver {
    @Override
    public boolean supportsParameter(MethodParameter parameter) {
        return parameter.hasParameterAnnotation(LoginMember.class)
                && Long.class.equals(parameter.getParameterType());
    }

    @Override
    public Object resolveArgument(MethodParameter parameter, ModelAndViewContainer container,
                                  NativeWebRequest request, WebDataBinderFactory binderFactory) {
        Object memberId = request.getAttribute(AuthInterceptor.MEMBER_ID, RequestAttributes.SCOPE_REQUEST);
        if (!(memberId instanceof Long)) {
            throw new ApiException(HttpStatus.UNAUTHORIZED, "AUTH401_2", "로그인이 필요한 요청입니다.");
        }
        return memberId;
    }
}
