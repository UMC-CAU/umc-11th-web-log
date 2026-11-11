package com.umc.study;

import com.umc.study.entity.Member;
import com.umc.study.repository.MemberRepository;
import com.umc.study.util.JwtUtil;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.ResultActions;
import org.springframework.transaction.annotation.Transactional;
import tools.jackson.databind.ObjectMapper;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest(properties = {
        "spring.datasource.url=jdbc:h2:mem:auth;MODE=MySQL;DB_CLOSE_DELAY=-1;DATABASE_TO_LOWER=TRUE",
        "jwt.secret=auth-test-only-secret-key-at-least-32-bytes",
        "jwt.access-expiration=3600"
})
@AutoConfigureMockMvc
@ActiveProfiles("demo")
@Transactional
class AuthApiTests {
    @Autowired MockMvc mvc;
    @Autowired ObjectMapper mapper;
    @Autowired MemberRepository members;
    @Autowired PasswordEncoder encoder;
    @Autowired JwtUtil jwtUtil;

    private ResultActions login(String email, String password) throws Exception {
        return mvc.perform(post("/auth/login").contentType(MediaType.APPLICATION_JSON)
                .content(mapper.writeValueAsString(Map.of("email", email, "password", password))));
    }

    @Test void signupThenLoginReturnsVerifiableTokenWithoutPassword() throws Exception {
        mvc.perform(post("/members").contentType(MediaType.APPLICATION_JSON).content("""
                {"email":"login@example.com","password":"Umc!1234","nickname":"로그인회원"}
                """)).andExpect(status().isCreated());

        var response = login("login@example.com", "Umc!1234")
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.isSuccess").value(true))
                .andExpect(jsonPath("$.code").value("COMMON200"))
                .andExpect(jsonPath("$.result.nickname").value("로그인회원"))
                .andExpect(jsonPath("$.result.accessToken").isNotEmpty())
                .andExpect(jsonPath("$.result.password").doesNotExist()).andReturn();
        String token = mapper.readTree(response.getResponse().getContentAsString())
                .get("result").get("accessToken").asText();
        assertThat(jwtUtil.getMemberId(token)).isEqualTo(
                members.findByEmail("login@example.com").orElseThrow().getMemberId());
    }

    @Test void unknownEmailAndWrongPasswordReturnSameUnauthorizedResponse() throws Exception {
        members.saveAndFlush(new Member("known@example.com", encoder.encode("Umc!1234"), "기존회원"));
        var unknown = login("unknown@example.com", "Umc!1234")
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.code").value("AUTH401_1"))
                .andExpect(jsonPath("$.isSuccess").value(false))
                .andExpect(jsonPath("$.result").isEmpty()).andReturn();
        var wrong = login("known@example.com", "wrong-password")
                .andExpect(status().isUnauthorized()).andReturn();
        assertThat(wrong.getResponse().getContentAsString())
                .isEqualTo(unknown.getResponse().getContentAsString());
    }

    @Test void legacyPasswordDoesNotNeedToMeetCurrentSignupRules() throws Exception {
        members.saveAndFlush(new Member("legacy@example.com", encoder.encode("old"), "예전회원"));
        login("legacy@example.com", "old").andExpect(status().isOk());
    }

    @Test void invalidOrMissingFieldsReturnCommonValidationError() throws Exception {
        for (String body : new String[]{"{}", "{\"email\":\"a@example.com\"}",
                "{\"email\":\"invalid\",\"password\":\"test\"}",
                "{\"email\":\"\",\"password\":\"test\"}",
                "{\"email\":\"a@example.com\",\"password\":\"  \"}"}) {
            mvc.perform(post("/auth/login").contentType(MediaType.APPLICATION_JSON).content(body))
                    .andExpect(status().isBadRequest())
                    .andExpect(jsonPath("$.code").value("COMMON4001"));
        }
        mvc.perform(post("/auth/login").contentType(MediaType.APPLICATION_JSON).content("{"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("COMMON4002"));
    }

    @Test void browserCanPreflightLogin() throws Exception {
        mvc.perform(options("/auth/login").header("Origin", "http://localhost:5173")
                        .header("Access-Control-Request-Method", "POST")
                        .header("Access-Control-Request-Headers", "content-type"))
                .andExpect(status().isOk())
                .andExpect(header().string("Access-Control-Allow-Origin", "http://localhost:5173"));
    }
}
