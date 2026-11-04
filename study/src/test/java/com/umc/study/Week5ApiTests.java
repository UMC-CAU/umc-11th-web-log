package com.umc.study;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("demo")
class Week5ApiTests {
    @Autowired MockMvc mvc;

    @Test void checksExistingAndAvailableNickname() throws Exception {
        mvc.perform(get("/members/nickname/{nickname}", "수현")).andExpect(status().isOk()).andExpect(jsonPath("$.available").value(false));
        mvc.perform(get("/members/nickname/{nickname}", "새닉네임")).andExpect(status().isOk()).andExpect(jsonPath("$.available").value(true));
    }
    @Test void checksExistingAndAvailableEmail() throws Exception {
        mvc.perform(get("/members/email/{email}", "noco@umc.com")).andExpect(status().isOk()).andExpect(jsonPath("$.available").value(false));
        mvc.perform(get("/members/email/{email}", "new@example.com")).andExpect(status().isOk()).andExpect(jsonPath("$.available").value(true));
    }
    @Test void listsOnlyMembersRatingsInNewestOrder() throws Exception {
        mvc.perform(get("/members/1/ratings")).andExpect(status().isOk())
            .andExpect(jsonPath("$.length()").value(2))
            .andExpect(jsonPath("$[0].movieId").value(155))
            .andExpect(jsonPath("$[0].score").value(4))
            .andExpect(jsonPath("$[1].movieId").value(550))
            .andExpect(jsonPath("$[0].createdAt").exists());
        mvc.perform(get("/members/2/ratings")).andExpect(status().isOk()).andExpect(jsonPath("$.length()").value(1));
    }
    @Test void missingMemberIs404() throws Exception {
        mvc.perform(get("/members/999/ratings")).andExpect(status().isNotFound());
    }
    @Test void corsPermitsTheLocalAppAndRejectsOtherOrigins() throws Exception {
        mvc.perform(get("/members/nickname/test").header("Origin", "http://localhost:5173"))
            .andExpect(status().isOk()).andExpect(header().string("Access-Control-Allow-Origin", "http://localhost:5173"));
        mvc.perform(get("/members/nickname/test").header("Origin", "https://example.com"))
            .andExpect(status().isForbidden());
    }
}
