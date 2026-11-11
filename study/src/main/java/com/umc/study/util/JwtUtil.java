package com.umc.study.util;

import com.umc.study.exception.ApiException;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.ExpiredJwtException;
import io.jsonwebtoken.Jws;
import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.time.Instant;
import java.util.Date;

@Component
public class JwtUtil {
    private final SecretKey secretKey;
    private final Duration accessExpiration;

    public JwtUtil(@Value("${jwt.secret}") String secret,
                   @Value("${jwt.access-expiration}") Long accessExpiration) {
        this.secretKey = Keys.hmacShaKeyFor(secret.getBytes(StandardCharsets.UTF_8));
        if (accessExpiration == null || accessExpiration <= 0) {
            throw new IllegalArgumentException("JWT 만료 시간은 0보다 큰 초 단위 값이어야 합니다.");
        }
        this.accessExpiration = Duration.ofSeconds(accessExpiration);
    }

    public String createAccessToken(Long memberId, String email) {
        Instant now = Instant.now();
        return Jwts.builder()
                .subject(String.valueOf(memberId))
                .claim("email", email)
                .issuedAt(Date.from(now))
                .expiration(Date.from(now.plus(accessExpiration)))
                .signWith(secretKey)
                .compact();
    }

    public Long getMemberId(String token) {
        try {
            return Long.valueOf(getClaims(token).getPayload().getSubject());
        } catch (ExpiredJwtException e) {
            throw new ApiException(HttpStatus.UNAUTHORIZED, "AUTH401_4",
                    "토큰이 만료되었습니다. 다시 로그인해주세요.");
        } catch (JwtException | IllegalArgumentException e) {
            throw new ApiException(HttpStatus.UNAUTHORIZED, "AUTH401_3",
                    "유효하지 않은 토큰입니다.");
        }
    }

    private Jws<Claims> getClaims(String token) {
        return Jwts.parser()
                .verifyWith(secretKey)
                .build()
                .parseSignedClaims(token);
    }
}
