package com.umc.study;

import com.umc.study.repository.MemberRepository;
import com.umc.study.repository.RatingRepository;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.bean.override.mockito.MockitoSpyBean;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.ResultActions;
import org.springframework.transaction.annotation.Transactional;
import tools.jackson.databind.ObjectMapper;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.doReturn;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest(properties = "spring.datasource.url=jdbc:h2:mem:week6;MODE=MySQL;DB_CLOSE_DELAY=-1;DATABASE_TO_LOWER=TRUE")
@AutoConfigureMockMvc
@ActiveProfiles("demo")
@Transactional
class Week6ApiTests {
    @Autowired MockMvc mvc;
    @Autowired ObjectMapper mapper;
    @Autowired JdbcTemplate jdbc;
    @Autowired PasswordEncoder encoder;
    @MockitoSpyBean MemberRepository members;
    @MockitoSpyBean RatingRepository ratings;

    private ResultActions signUp(String email, String password, String nickname) throws Exception {
        return mvc.perform(post("/members").contentType(MediaType.APPLICATION_JSON)
                .content(mapper.writeValueAsString(Map.of(
                        "email", email, "password", password, "nickname", nickname))));
    }

    private ResultActions createRating(long memberId, String body) throws Exception {
        return mvc.perform(post("/members/{memberId}/ratings", memberId)
                .contentType(MediaType.APPLICATION_JSON).content(body));
    }

    private void failure(ResultActions result, int status, String code) throws Exception {
        result.andExpect(status().is(status))
                .andExpect(jsonPath("$.isSuccess").value(false))
                .andExpect(jsonPath("$.code").value(code))
                .andExpect(jsonPath("$.message").isNotEmpty())
                .andExpect(jsonPath("$.result").isEmpty());
    }

    @Test void signupStoresBcryptAndDoesNotExposePassword() throws Exception {
        var result = signUp("signup@example.com", "Umc!1234", "신규회원")
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.isSuccess").value(true))
                .andExpect(jsonPath("$.code").value("COMMON201"))
                .andExpect(jsonPath("$.result.email").value("signup@example.com"))
                .andExpect(jsonPath("$.result.nickname").value("신규회원"))
                .andExpect(jsonPath("$.result.password").doesNotExist()).andReturn();
        long id = mapper.readTree(result.getResponse().getContentAsString()).get("result").get("memberId").asLong();
        String hash = members.findById(id).orElseThrow().getPassword();
        assertThat(hash).hasSize(60).startsWith("$2");
        assertThat(hash).isNotEqualTo("Umc!1234");
        assertThat(encoder.matches("Umc!1234", hash)).isTrue();
    }

    @Test void bcryptUsesDifferentSaltForEachMember() throws Exception {
        signUp("salt1@example.com", "Umc!1234", "솔트하나").andExpect(status().isCreated());
        signUp("salt2@example.com", "Umc!1234", "솔트둘").andExpect(status().isCreated());
        var hashes = jdbc.queryForList("SELECT password FROM member WHERE email IN (?,?)",
                String.class, "salt1@example.com", "salt2@example.com");
        assertThat(hashes).hasSize(2);
        assertThat(hashes.get(0)).isNotEqualTo(hashes.get(1));
    }

    @Test void signupValidatesEmailNicknameAndEachPasswordRule() throws Exception {
        long before = members.count();
        failure(signUp("invalid", "Umc!1234", "정상닉네임"), 400, "COMMON4001");
        failure(signUp("", "Umc!1234", "정상닉네임"), 400, "COMMON4001");
        failure(signUp("valid@example.com", "Umc!1234", "가"), 400, "COMMON4001");
        failure(signUp("valid@example.com", "Umc!1234", "가".repeat(13)), 400, "COMMON4001");
        failure(signUp("valid@example.com", "Umc!1234", "  "), 400, "COMMON4001");
        for (String password : new String[]{"umc!1234", "UMC!1234", "Umc!abcd", "Umc12345", "Umc!1", ""}) {
            failure(signUp("valid@example.com", password, "정상닉네임"), 400, "COMMON4001");
        }
        assertThat(members.count()).isEqualTo(before);
    }

    @Test void signupRejectsMissingFieldsAndOversizedBcryptInput() throws Exception {
        failure(mvc.perform(post("/members").contentType(MediaType.APPLICATION_JSON).content("{}")),
                400, "COMMON4001");
        failure(signUp("long@example.com", "Umc!1234" + "가".repeat(22), "정상닉네임"), 400, "COMMON4001");
    }

    @Test void duplicateEmailAndNicknameHaveDifferentCodes() throws Exception {
        long before = members.count();
        failure(signUp("noco@umc.com", "Umc!1234", "새로운닉네임"), 409, "MEMBER4091");
        failure(signUp("new@example.com", "Umc!1234", "수현"), 409, "MEMBER4092");
        assertThat(members.count()).isEqualTo(before);
    }

    @Test void createUpdateReadDeleteRating() throws Exception {
        var created = createRating(1, """
                {"movieId":90001,"score":5,"comment":"처음 후기"}
                """).andExpect(status().isCreated())
                .andExpect(jsonPath("$.code").value("COMMON201"))
                .andExpect(jsonPath("$.isSuccess").value(true)).andReturn();
        long id = mapper.readTree(created.getResponse().getContentAsString()).get("result").asLong();
        var oldUpdatedAt = jdbc.queryForObject("SELECT updated_at FROM rating WHERE rating_id = ?",
                java.sql.Timestamp.class, id);
        mvc.perform(patch("/members/1/ratings/{id}", id).contentType(MediaType.APPLICATION_JSON)
                .content("""
                        {"score":3,"comment":"수정 후기"}
                        """)).andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value("COMMON200"))
                .andExpect(jsonPath("$.isSuccess").value(true));
        assertThat(jdbc.queryForObject("SELECT score FROM rating WHERE rating_id = ?", Integer.class, id)).isEqualTo(3);
        assertThat(jdbc.queryForObject("SELECT comment FROM rating WHERE rating_id = ?", String.class, id)).isEqualTo("수정 후기");
        assertThat(jdbc.queryForObject("SELECT updated_at FROM rating WHERE rating_id = ?",
                java.sql.Timestamp.class, id)).isAfterOrEqualTo(oldUpdatedAt);
        mvc.perform(get("/members/1/ratings")).andExpect(status().isOk())
                .andExpect(jsonPath("$[0].ratingId").value(id))
                .andExpect(jsonPath("$[0].score").value(3));
        mvc.perform(delete("/members/1/ratings/{id}", id)).andExpect(status().isNoContent())
                .andExpect(content().string(""));
        assertThat(ratings.existsById(id)).isFalse();
    }

    @Test void commentIsOptionalAndCanBeCleared() throws Exception {
        createRating(1, "{\"movieId\":90002,\"score\":1}").andExpect(status().isCreated());
        mvc.perform(patch("/members/1/ratings/1").contentType(MediaType.APPLICATION_JSON)
                .content("{\"score\":5}")).andExpect(status().isOk());
        assertThat(jdbc.queryForObject("SELECT comment FROM rating WHERE rating_id = 1", String.class)).isNull();
        createRating(1, mapper.writeValueAsString(Map.of("movieId",90003,"score",5,"comment","가".repeat(500))))
                .andExpect(status().isCreated());
    }

    @Test void invalidRatingInputsAreNotSaved() throws Exception {
        long before = ratings.count();
        for (String body : new String[]{
                "{}", "{\"movieId\":1}", "{\"score\":3}",
                "{\"movieId\":0,\"score\":3}", "{\"movieId\":-1,\"score\":3}",
                "{\"movieId\":1,\"score\":0}", "{\"movieId\":1,\"score\":6}"}) {
            failure(createRating(1, body), 400, "COMMON4001");
        }
        failure(createRating(1, mapper.writeValueAsString(Map.of("movieId",1,"score",5,"comment","가".repeat(501)))),
                400, "COMMON4001");
        assertThat(ratings.count()).isEqualTo(before);
    }

    @Test void decimalAndStringIntegersAreRejectedInsteadOfTruncated() throws Exception {
        for (String body : new String[]{
                "{\"movieId\":90001,\"score\":2.5}",
                "{\"movieId\":90001.5,\"score\":3}",
                "{\"movieId\":90001,\"score\":\"3\"}",
                "{\"movieId\":\"90001\",\"score\":3}",
                "{\"movieId\":90001,\"score\":\"abc\"}", "{"}) {
            failure(createRating(1, body), 400, "COMMON4002");
        }
        failure(mvc.perform(patch("/members/1/ratings/1").contentType(MediaType.APPLICATION_JSON)
                .content("{\"score\":1.5}")), 400, "COMMON4002");
    }

    @Test void updateRejectsMissingOrInvalidScoreAndLongComment() throws Exception {
        for (String body : new String[]{"{}", "{\"score\":0}", "{\"score\":6}"}) {
            failure(mvc.perform(patch("/members/1/ratings/1").contentType(MediaType.APPLICATION_JSON)
                    .content(body)), 400, "COMMON4001");
        }
        failure(mvc.perform(patch("/members/1/ratings/1").contentType(MediaType.APPLICATION_JSON)
                .content(mapper.writeValueAsString(Map.of("score",3,"comment","가".repeat(501))))),
                400, "COMMON4001");
        assertThat(jdbc.queryForObject("SELECT score FROM rating WHERE rating_id = 1", Integer.class)).isEqualTo(5);
    }

    @Test void duplicateRatingReturns409AndLeavesOneRow() throws Exception {
        failure(createRating(1, "{\"movieId\":550,\"score\":3}"), 409, "RATING4091");
        assertThat(jdbc.queryForObject("SELECT COUNT(*) FROM rating WHERE member_id=1 AND movie_id=550", Long.class)).isEqualTo(1);
    }

    @Test void anotherMemberCannotModifyOrDeleteRating() throws Exception {
        failure(mvc.perform(patch("/members/2/ratings/1").contentType(MediaType.APPLICATION_JSON)
                .content("{\"score\":1}")), 403, "RATING4031");
        failure(mvc.perform(delete("/members/2/ratings/1")), 403, "RATING4031");
        assertThat(ratings.existsById(1L)).isTrue();
        assertThat(jdbc.queryForObject("SELECT score FROM rating WHERE rating_id=1", Integer.class)).isEqualTo(5);
    }

    @Test void missingRatingOrMemberReturns404() throws Exception {
        failure(createRating(999, "{\"movieId\":1,\"score\":3}"), 404, "MEMBER4041");
        failure(mvc.perform(patch("/members/1/ratings/999").contentType(MediaType.APPLICATION_JSON)
                .content("{\"score\":3}")), 404, "RATING4041");
        failure(mvc.perform(delete("/members/1/ratings/999")), 404, "RATING4041");
        failure(mvc.perform(delete("/members/999/ratings/1")), 404, "MEMBER4041");
    }

    @Test void invalidPathVariableReturnsConsistent400() throws Exception {
        failure(createRating(-1, "{\"movieId\":1,\"score\":3}"), 404, "MEMBER4041");
        failure(mvc.perform(delete("/members/1/ratings/abc")), 400, "COMMON4002");
    }

    @Test void databaseUniquenessStillRejectsSignupWhenPrecheckMissesDuplicate() throws Exception {
        doReturn(false).when(members).existsByEmail("noco@umc.com");
        failure(signUp("noco@umc.com", "Umc!1234", "경쟁요청"), 409, "COMMON4091");
        assertThat(jdbc.queryForObject("SELECT COUNT(*) FROM member WHERE email='noco@umc.com'", Long.class)).isEqualTo(1);
    }

    @Test void databaseUniquenessStillRejectsRatingWhenPrecheckMissesDuplicate() throws Exception {
        doReturn(false).when(ratings).existsByMemberMemberIdAndMovieId(1L, 550L);
        failure(createRating(1, "{\"movieId\":550,\"score\":3}"), 409, "COMMON4091");
        assertThat(jdbc.queryForObject("SELECT COUNT(*) FROM rating WHERE member_id=1 AND movie_id=550", Long.class)).isEqualTo(1);
    }

    @Test void browserPreflightsAllowWriteMethodsAndJson() throws Exception {
        for (String method : new String[]{"POST", "PATCH", "DELETE"}) {
            mvc.perform(options("/members/1/ratings/1")
                    .header("Origin", "http://localhost:5173")
                    .header("Access-Control-Request-Method", method)
                    .header("Access-Control-Request-Headers", "content-type"))
                    .andExpect(status().isOk())
                    .andExpect(header().string("Access-Control-Allow-Origin", "http://localhost:5173"));
        }
    }
}
