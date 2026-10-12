package com.common.chat.controller;

import com.common.chat.dto.ApiErrorResponse;
import com.common.chat.dto.FieldErrorDetail;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@RestControllerAdvice
public class GlobalExceptionHandler {

    private static final Logger log = LoggerFactory.getLogger(GlobalExceptionHandler.class);

    private String generateRequestId() {
        return "req_" + UUID.randomUUID().toString().replace("-", "").substring(0, 12);
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ApiErrorResponse> handleValidationException(MethodArgumentNotValidException ex) {
        String requestId = generateRequestId();
        List<FieldErrorDetail> fieldErrors = new ArrayList<>();
        for (FieldError fe : ex.getBindingResult().getFieldErrors()) {
            fieldErrors.add(new FieldErrorDetail(fe.getField(), fe.getDefaultMessage()));
        }

        ApiErrorResponse response = new ApiErrorResponse(
                "VALIDATION_ERROR",
                "One or more input fields failed validation",
                fieldErrors,
                requestId
        );
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(response);
    }

    @ExceptionHandler(BadCredentialsException.class)
    public ResponseEntity<ApiErrorResponse> handleBadCredentials(BadCredentialsException ex) {
        String requestId = generateRequestId();
        ApiErrorResponse response = new ApiErrorResponse(
                "INVALID_CREDENTIALS",
                "Invalid username or password",
                null,
                requestId
        );
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(response);
    }

    @ExceptionHandler(AccessDeniedException.class)
    public ResponseEntity<ApiErrorResponse> handleAccessDenied(AccessDeniedException ex) {
        String requestId = generateRequestId();
        ApiErrorResponse response = new ApiErrorResponse(
                "FORBIDDEN",
                ex.getMessage() != null ? ex.getMessage() : "Access is denied",
                null,
                requestId
        );
        return ResponseEntity.status(HttpStatus.FORBIDDEN).body(response);
    }

    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<ApiErrorResponse> handleIllegalArgument(IllegalArgumentException ex) {
        String requestId = generateRequestId();
        ApiErrorResponse response = new ApiErrorResponse(
                "BAD_REQUEST",
                ex.getMessage(),
                null,
                requestId
        );
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(response);
    }

    @ExceptionHandler(IllegalStateException.class)
    public ResponseEntity<ApiErrorResponse> handleIllegalState(IllegalStateException ex) {
        String requestId = generateRequestId();
        boolean isRateLimit = ex.getMessage() != null && ex.getMessage().toLowerCase().contains("rate limit");
        HttpStatus status = isRateLimit ? HttpStatus.TOO_MANY_REQUESTS : HttpStatus.BAD_REQUEST;

        ApiErrorResponse response = new ApiErrorResponse(
                isRateLimit ? "RATE_LIMIT_EXCEEDED" : "OPERATION_FAILED",
                ex.getMessage(),
                null,
                requestId
        );
        return ResponseEntity.status(status).body(response);
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ApiErrorResponse> handleGenericException(Exception ex) {
        String requestId = generateRequestId();
        log.error("Unhandled exception [{}]: {}", requestId, ex.getMessage(), ex);

        ApiErrorResponse response = new ApiErrorResponse(
                "INTERNAL_ERROR",
                "An unexpected server error occurred. Please try again later.",
                null,
                requestId
        );
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
    }
}
