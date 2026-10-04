package com.umc.study;

import com.umc.study.entity.Book;
import com.umc.study.repository.BookRepository;
import com.umc.study.repository.CategoryRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.ObjectMapper;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@Transactional
class BookApiTests {
    @Autowired MockMvc mvc;
    @Autowired JdbcTemplate jdbc;
    @Autowired BookRepository books;
    @Autowired CategoryRepository categories;
    @Autowired ObjectMapper mapper;
    Long categoryId;

    @BeforeEach
    void prepareCategory() {
        jdbc.update("INSERT INTO category (name) VALUES (?)", "미션 테스트");
        categoryId = jdbc.queryForObject("SELECT LAST_INSERT_ID()", Long.class);
    }

    @Test
    void listReturnsEveryBookNewestFirstWithResponseDto() throws Exception {
        var category = categories.findById(categoryId).orElseThrow();
        var first = books.saveAndFlush(new Book(category, "첫 번째 테스트 도서", null));
        var second = books.saveAndFlush(new Book(category, "두 번째 테스트 도서", "설명"));
        jdbc.update("UPDATE book SET is_available = false WHERE book_id = ?", first.getBookId());
        // Clear managed entities so the GET reads actual database values.
        entityManager.clear();
        var result = mvc.perform(get("/books"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].bookId").value(second.getBookId()))
                .andExpect(jsonPath("$[0].categoryName").value("미션 테스트"))
                .andExpect(jsonPath("$[1].bookId").value(first.getBookId()))
                .andExpect(jsonPath("$[1].isAvailable").value(false))
                .andReturn();
        JsonNode response = mapper.readTree(result.getResponse().getContentAsString());
        assertThat(response.size()).isEqualTo(books.count());
        for (JsonNode book : response) {
            assertThat(book.propertyNames()).containsExactlyInAnyOrder(
                    "bookId", "title", "description", "categoryName", "isAvailable");
        }
    }

    @Autowired jakarta.persistence.EntityManager entityManager;

    @Test
    void createReturns201AndPersistsBook() throws Exception {
        var result = mvc.perform(post("/books").contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"categoryId": %d, "title": "ORM 테스트 도서", "description": "등록 검증"}
                                """.formatted(categoryId)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.title").value("ORM 테스트 도서"))
                .andExpect(jsonPath("$.description").value("등록 검증"))
                .andExpect(jsonPath("$.categoryName").value("미션 테스트"))
                .andExpect(jsonPath("$.isAvailable").value(true)).andReturn();
        long id = mapper.readTree(result.getResponse().getContentAsString()).get("bookId").asLong();
        entityManager.flush();
        entityManager.clear();
        assertThat(books.findById(id).orElseThrow().getTitle()).isEqualTo("ORM 테스트 도서");
    }

    @Test
    void descriptionIsOptionalAnd100CharacterTitleIsValid() throws Exception {
        mvc.perform(post("/books").contentType(MediaType.APPLICATION_JSON)
                        .content("{\"categoryId\":%d,\"title\":\"%s\"}".formatted(categoryId, "가".repeat(100))))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.description").isEmpty());
    }

    @Test
    void blankTitleIsRejected() throws Exception {
        assertRejected("{\"categoryId\":%d,\"title\":\"   \"}".formatted(categoryId), 400);
    }

    @Test
    void longTitleIsRejected() throws Exception {
        assertRejected("{\"categoryId\":%d,\"title\":\"%s\"}".formatted(categoryId, "가".repeat(101)), 400);
    }

    @Test
    void missingCategoryIdIsRejected() throws Exception {
        assertRejected("{\"title\":\"테스트\"}", 400);
    }

    @Test
    void invalidCategoryTypeIsRejected() throws Exception {
        assertRejected("{\"categoryId\":\"abc\",\"title\":\"테스트\"}", 400);
    }

    @Test
    void nonexistentCategoryReturns404WithoutSaving() throws Exception {
        assertRejected("{\"categoryId\":-1,\"title\":\"테스트\"}", 404);
    }

    private void assertRejected(String body, int status) throws Exception {
        long before = books.count();
        mvc.perform(post("/books").contentType(MediaType.APPLICATION_JSON).content(body))
                .andExpect(status().is(status))
                .andExpect(jsonPath("$.status").value(status));
        assertThat(books.count()).isEqualTo(before);
    }
}
