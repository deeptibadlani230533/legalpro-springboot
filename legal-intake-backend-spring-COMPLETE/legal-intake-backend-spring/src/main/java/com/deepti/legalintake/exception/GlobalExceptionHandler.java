package com.deepti.legalintake.exception;

import com.deepti.legalintake.exception.ApiException;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.multipart.MaxUploadSizeExceededException;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;

/**
 * GLOBAL EXCEPTION HANDLER
 * Equivalent of: app.setErrorHandler(require("./utils/errorHandler")) in app.js
 *                + the ApiError class in utils/apiError.js
 *
 * @RestControllerAdvice means: intercept exceptions thrown from ANY @RestController.
 * Instead of try-catch in every controller, exceptions bubble up and land here.
 *
 * This is one of the things interviewers specifically look for in Spring Boot projects.
 * A project without a GlobalExceptionHandler looks incomplete to an interviewer.
 *
 * @Slf4j is Lombok - generates a `log` field so we can do log.error(), log.info() etc.
 */
@RestControllerAdvice
@Slf4j
public class GlobalExceptionHandler {

    /**
     * Handles our custom ApiException (replaces: throw new ApiError(404, "Case not found"))
     * In Java we throw: throw new ApiException(HttpStatus.NOT_FOUND, "Case not found")
     */
    @ExceptionHandler(ApiException.class)
    public ResponseEntity<ErrorResponse> handleApiException(ApiException ex) {
        log.warn("API Exception: {} - {}", ex.getStatus(), ex.getMessage());
        return ResponseEntity
                .status(ex.getStatus())
                .body(new ErrorResponse(ex.getMessage(), ex.getStatus().value()));
    }

    /**
     * Handles validation errors from @Valid on request bodies.
     * Replaces your Fastify schemas (signupSchema, loginSchema etc).
     *
     * Example: if someone sends { "email": "notanemail" }, Spring validates
     * the @Email annotation on your DTO and this method sends back:
     * { "errors": { "email": "must be a well-formed email address" } }
     */
    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<Map<String, Object>> handleValidationErrors(MethodArgumentNotValidException ex) {
        Map<String, String> fieldErrors = new HashMap<>();
        for (FieldError error : ex.getBindingResult().getFieldErrors()) {
            fieldErrors.put(error.getField(), error.getDefaultMessage());
        }

        Map<String, Object> body = new HashMap<>();
        body.put("message", "Validation failed");
        body.put("errors", fieldErrors);
        body.put("status", 400);

        return ResponseEntity.badRequest().body(body);
    }

    /**
     * Handles Spring Security's 403 - same as your rolePolicy.js returning 403
     * "Forbidden: You don't have permission"
     */
    @ExceptionHandler(AccessDeniedException.class)
    public ResponseEntity<ErrorResponse> handleAccessDenied(AccessDeniedException ex) {
        return ResponseEntity
                .status(HttpStatus.FORBIDDEN)
                .body(new ErrorResponse("Forbidden: You don't have permission", 403));
    }

    /**
     * Handles wrong password / invalid credentials - maps to your 401 in auth.service.js
     */
    @ExceptionHandler(BadCredentialsException.class)
    public ResponseEntity<ErrorResponse> handleBadCredentials(BadCredentialsException ex) {
        return ResponseEntity
                .status(HttpStatus.UNAUTHORIZED)
                .body(new ErrorResponse("Invalid email or password", 401));
    }

    /**
     * Handles file too large - same as your multipart fileSize limit error
     */
    @ExceptionHandler(MaxUploadSizeExceededException.class)
    public ResponseEntity<ErrorResponse> handleFileTooLarge(MaxUploadSizeExceededException ex) {
        return ResponseEntity
                .status(HttpStatus.PAYLOAD_TOO_LARGE)
                .body(new ErrorResponse("File size exceeds the 50MB limit", 413));
    }

    /**
     * Catch-all for any unexpected exception.
     * Equivalent of the final else in your errorHandler.js.
     * In production you never want to expose raw stack traces to the client.
     */
    @ExceptionHandler(Exception.class)
    public ResponseEntity<ErrorResponse> handleGenericException(Exception ex) {
        log.error("Unhandled exception: {}", ex.getMessage(), ex);
        return ResponseEntity
                .status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(new ErrorResponse("An internal server error occurred", 500));
    }

    /**
     * Inner record for the error response shape.
     * record = a special class in Java 16+ that auto-generates constructor,
     * getters, equals, hashCode, toString. Cleaner than a full class for simple DTOs.
     *
     * Jackson (JSON library) will serialize this to:
     * { "message": "...", "status": 404, "timestamp": "2026-05-03T10:30:00" }
     */
    public record ErrorResponse(String message, int status, LocalDateTime timestamp) {
        // This secondary constructor defaults timestamp to now
        public ErrorResponse(String message, int status) {
            this(message, status, LocalDateTime.now());
        }
    }
}