package com.umc.study;

import com.umc.study.interceptor.AuthInterceptor;
import com.umc.study.repository.MemberRepository;
import com.umc.study.util.JwtUtil;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.Date;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest(properties = {
        "spring.datasource.url=jdbc:h2:mem:interceptor;MODE=MySQL;DB_CLOSE_DELAY=-1;DATABASE_TO_LOWER=TRUE",
        "jwt.secret=interceptor-test-only-secret-at-least-32-bytes",
        "jwt.access-expiration=3600"
})
@AutoConfigureMockMvc
@ActiveProfiles("demo")
@Transactional
class AuthInterceptorTests {
    @Autowired MockMvc mvc;
    @Autowired JwtUtil jwtUtil;
    @Autowired MemberRepository members;

    @Test void nicknameUpdatePersistsAndAllowsCurrentNickname() throws Exception {
        String token = jwtUtil.createAccessToken(1L, "noco@umc.com");
        for (int i = 0; i < 2; i++) {
            mvc.perform(patch("/members/me").header(HttpHeaders.AUTHORIZATION, "Bearer " + token)
                            .contentType(MediaType.APPLICATION_JSON).content("{\"nickname\":\"새닉네임\"}"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.result.nickname").value("새닉네임"))
                    .andExpect(jsonPath("$.result.password").doesNotExist());
        }
        mvc.perform(get("/members/me").header(HttpHeaders.AUTHORIZATION, "Bearer " + token))
                .andExpect(jsonPath("$.result.nickname").value("새닉네임"));
    }

    @Test void nicknameUpdateRejectsDuplicateAndInvalidValues() throws Exception {
        String token = jwtUtil.createAccessToken(1L, "noco@umc.com");
        String otherNickname = members.findById(2L).orElseThrow().getNickname();
        mvc.perform(patch("/members/me").header(HttpHeaders.AUTHORIZATION, "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"nickname\":\"" + otherNickname + "\"}"))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.code").value("MEMBER409_1"));
        for (String nickname : new String[]{"", " ", "가", "가".repeat(13)}) {
            mvc.perform(patch("/members/me").header(HttpHeaders.AUTHORIZATION, "Bearer " + token)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content("{\"nickname\":\"" + nickname + "\"}"))
                    .andExpect(status().isBadRequest())
                    .andExpect(jsonPath("$.code").value("COMMON4001"));
        }
    }

    @Test void myInfoWithoutTokenRequiresLogin() throws Exception {
        mvc.perform(get("/members/me"))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.code").value("AUTH401_2"));
    }

    @Test void myInfoReturnsAuthenticatedMemberWithoutPassword() throws Exception {
        var member = members.findById(1L).orElseThrow();
        mvc.perform(get("/members/me").header(HttpHeaders.AUTHORIZATION,
                        "Bearer " + jwtUtil.createAccessToken(member.getMemberId(), member.getEmail())))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.isSuccess").value(true))
                .andExpect(jsonPath("$.code").value("COMMON200"))
                .andExpect(jsonPath("$.result.email").value(member.getEmail()))
                .andExpect(jsonPath("$.result.nickname").value(member.getNickname()))
                .andExpect(jsonPath("$.result.createdAt").isNotEmpty())
                .andExpect(jsonPath("$.result.password").doesNotExist())
                .andExpect(request().attribute(AuthInterceptor.MEMBER_ID, member.getMemberId()));
    }

    @Test void myInfoRejectsSingleCharacterPayloadTampering() throws Exception {
        String token = jwtUtil.createAccessToken(1L, "member@example.com");
        int index = token.indexOf('.') + 10;
        char replacement = token.charAt(index) == 'A' ? 'B' : 'A';
        String tampered = token.substring(0, index) + replacement + token.substring(index + 1);
        mvc.perform(get("/members/me").header(HttpHeaders.AUTHORIZATION, "Bearer " + tampered))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.code").value("AUTH401_3"));
    }

    @Test void myInfoForMissingMemberReturnsNotFound() throws Exception {
        mvc.perform(get("/members/me").header(HttpHeaders.AUTHORIZATION,
                        "Bearer " + jwtUtil.createAccessToken(Long.MAX_VALUE, "missing@example.com")))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.code").value("MEMBER404_1"));
    }

    @Test void protectedRoutesRequireBearerToken() throws Exception {
        mvc.perform(get("/books"))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.isSuccess").value(false))
                .andExpect(jsonPath("$.code").value("AUTH401_2"));
        mvc.perform(delete("/members/1/ratings/1").header(HttpHeaders.AUTHORIZATION, "Basic test"))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.code").value("AUTH401_2"));
        mvc.perform(post("/rentals").contentType(MediaType.APPLICATION_JSON).content("{}"))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.code").value("AUTH401_2"));
    }

    @Test void validTokenReachesControllerAndSetsMemberId() throws Exception {
        mvc.perform(get("/books").header(HttpHeaders.AUTHORIZATION,
                        "Bearer " + jwtUtil.createAccessToken(42L, "member@example.com")))
                .andExpect(status().isOk())
                .andExpect(request().attribute(AuthInterceptor.MEMBER_ID, 42L));
    }

    @Test void invalidSignatureMalformedAndEmptyTokensReturnCommonError() throws Exception {
        String wrongSignature = new JwtUtil("different-interceptor-secret-at-least-32-bytes", 3600L)
                .createAccessToken(1L, "member@example.com");
        for (String token : new String[]{"not-a-jwt", "", wrongSignature}) {
            mvc.perform(get("/books").header(HttpHeaders.AUTHORIZATION, "Bearer " + token))
                    .andExpect(status().isUnauthorized())
                    .andExpect(jsonPath("$.code").value("AUTH401_3"));
        }
    }

    @Test void expiredTokenReturnsSpecificError() throws Exception {
        String token = Jwts.builder().subject("1")
                .expiration(Date.from(Instant.now().minusSeconds(120)))
                .signWith(Keys.hmacShaKeyFor("interceptor-test-only-secret-at-least-32-bytes"
                        .getBytes(StandardCharsets.UTF_8))).compact();
        mvc.perform(get("/books").header(HttpHeaders.AUTHORIZATION, "Bearer " + token))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.code").value("AUTH401_4"));
    }

    @Test void publicReadEndpointsDoNotRequireToken() throws Exception {
        mvc.perform(get("/members/1/ratings")).andExpect(status().isOk());
        mvc.perform(get("/members/nickname/newnickname")).andExpect(status().isOk());
        mvc.perform(get("/members/email/new@example.com")).andExpect(status().isOk());
    }

    @Test void ratingCreationRequiresTokenDespitePublicListUsingSamePath() throws Exception {
        mvc.perform(post("/ratings").contentType(MediaType.APPLICATION_JSON)
                        .content("{\"movieId\":99001,\"score\":5}"))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.code").value("AUTH401_2"));
        mvc.perform(post("/ratings").contentType(MediaType.APPLICATION_JSON)
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + jwtUtil.createAccessToken(1L, "noco@umc.com"))
                        .content("{\"movieId\":99001,\"score\":5}"))
                .andExpect(status().isCreated());
    }

    @Test void preflightAllowsAuthorizationHeaderWithoutToken() throws Exception {
        mvc.perform(options("/books").header("Origin", "http://localhost:5173")
                        .header("Access-Control-Request-Method", "GET")
                        .header("Access-Control-Request-Headers", "authorization,content-type"))
                .andExpect(status().isOk())
                .andExpect(header().string("Access-Control-Allow-Origin", "http://localhost:5173"));
        mvc.perform(options("/members/1/ratings/1").header("Origin", "http://localhost:5173")
                        .header("Access-Control-Request-Method", "DELETE")
                        .header("Access-Control-Request-Headers", "authorization"))
                .andExpect(status().isOk());
    }
}
