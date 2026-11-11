package com.umc.study;

import com.umc.study.exception.ApiException;
import com.umc.study.util.JwtUtil;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.Date;

import static org.assertj.core.api.Assertions.*;

class JwtUtilTests {
    private static final String SECRET = "jwt-test-only-secret-key-at-least-32-bytes";
    private final JwtUtil jwtUtil = new JwtUtil(SECRET, 3600L);

    @Test void issuedTokenContainsMemberEmailAndOneHourLifetime() {
        String token = jwtUtil.createAccessToken(42L, "member@example.com");
        assertThat(jwtUtil.getMemberId(token)).isEqualTo(42L);
        var claims = Jwts.parser().verifyWith(Keys.hmacShaKeyFor(SECRET.getBytes(StandardCharsets.UTF_8)))
                .build().parseSignedClaims(token).getPayload();
        assertThat(claims.get("email", String.class)).isEqualTo("member@example.com");
        assertThat(claims.getExpiration().getTime() - claims.getIssuedAt().getTime()).isEqualTo(3_600_000L);
    }

    @Test void expiredTokenReturnsSpecificUnauthorizedError() {
        String token = Jwts.builder().subject("42")
                .expiration(Date.from(Instant.now().minusSeconds(120)))
                .signWith(Keys.hmacShaKeyFor(SECRET.getBytes(StandardCharsets.UTF_8))).compact();
        assertTokenFailure(token, "AUTH401_4");
    }

    @Test void wrongSignatureAndMalformedTokensAreRejected() {
        String token = new JwtUtil("different-test-only-key-at-least-32-bytes", 3600L)
                .createAccessToken(42L, "member@example.com");
        assertTokenFailure(token, "AUTH401_3");
        assertTokenFailure("not-a-jwt", "AUTH401_3");
        assertTokenFailure("", "AUTH401_3");
        assertTokenFailure(null, "AUTH401_3");
    }

    @Test void invalidMemberIdIsRejectedEvenWithValidSignature() {
        String token = Jwts.builder().subject("invalid")
                .signWith(Keys.hmacShaKeyFor(SECRET.getBytes(StandardCharsets.UTF_8))).compact();
        assertTokenFailure(token, "AUTH401_3");
    }

    @Test void nonPositiveExpirationIsRejectedAtStartup() {
        assertThatIllegalArgumentException().isThrownBy(() -> new JwtUtil(SECRET, 0L));
        assertThatIllegalArgumentException().isThrownBy(() -> new JwtUtil(SECRET, -1L));
    }

    private void assertTokenFailure(String token, String code) {
        assertThatThrownBy(() -> jwtUtil.getMemberId(token)).isInstanceOfSatisfying(ApiException.class, e -> {
            assertThat(e.getStatus()).isEqualTo(HttpStatus.UNAUTHORIZED);
            assertThat(e.getCode()).isEqualTo(code);
        });
    }
}
