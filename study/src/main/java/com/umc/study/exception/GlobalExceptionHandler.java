package com.umc.study.exception;

import com.umc.study.controller.MemberController;
import com.umc.study.controller.AuthController;
import com.umc.study.controller.RatingController;
import com.umc.study.dto.ApiResponse;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;
import org.springframework.web.server.ResponseStatusException;
import java.util.stream.Collectors;

// 회원/평점/인증 API에 공통 응답 형식을 적용합니다.
@RestControllerAdvice(assignableTypes = {MemberController.class, RatingController.class, AuthController.class})
public class GlobalExceptionHandler {
    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ApiResponse<Void>> handleValidation(MethodArgumentNotValidException exception) {
        String message = exception.getBindingResult().getFieldErrors().stream()
                .map(error -> error.getField() + ": " + error.getDefaultMessage())
                .distinct().sorted().collect(Collectors.joining(" / "));
        return ResponseEntity.badRequest().body(ApiResponse.failure("COMMON4001", message));
    }

    @ExceptionHandler({HttpMessageNotReadableException.class, MethodArgumentTypeMismatchException.class})
    public ResponseEntity<ApiResponse<Void>> handleMalformedInput(Exception exception) {
        return ResponseEntity.badRequest().body(ApiResponse.failure("COMMON4002",
                "JSON 형식과 필드의 자료형을 확인해주세요. ID와 별점은 정수여야 합니다."));
    }

    @ExceptionHandler(DataIntegrityViolationException.class)
    public ResponseEntity<ApiResponse<Void>> handleDataIntegrity(DataIntegrityViolationException exception) {
        // 사전 중복 검사를 통과한 동시 요청도 DB UNIQUE 제약에서 실패할 수 있습니다.
        // SQL, 바인딩 값, 비밀번호 등 DB 예외 원문은 응답하지 않습니다.
        return ResponseEntity.status(409).body(ApiResponse.failure("COMMON4091",
                "데이터베이스 제약 조건을 위반했습니다. 중복 데이터 또는 참조 대상을 확인해주세요."));
    }

    @ExceptionHandler(ResponseStatusException.class)
    public ResponseEntity<ApiResponse<Void>> handleResponseStatus(ResponseStatusException exception) {
        int status = exception.getStatusCode().value();
        return ResponseEntity.status(status)
                .body(ApiResponse.failure("COMMON" + status, exception.getReason()));
    }
}
