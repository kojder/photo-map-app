package com.photomap.exception;

import lombok.Builder;
import lombok.Data;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.time.LocalDateTime;
import java.util.List;

/**
 * Global Exception Handler - Centralized error handling
 *
 * Best Practices Demonstrated:
 * - @RestControllerAdvice for global exception handling
 * - Multiple @ExceptionHandler methods for different exceptions
 * - Consistent ErrorResponse DTO
 * - Proper logging (full stack trace logged, generic message returned)
 * - Validation error handling with field details
 */
@RestControllerAdvice
@Slf4j
public class GlobalExceptionHandler {

    /**
     * Handle ResourceNotFoundException (404)
     * Photo not found, User not found, etc.
     */
    @ExceptionHandler(ResourceNotFoundException.class)
    public ResponseEntity<ErrorResponse> handleResourceNotFound(
        final ResourceNotFoundException ex
    ) {
        log.warn("Resource not found: {}", ex.getMessage());

        final ErrorResponse error = ErrorResponse.builder()
            .status(HttpStatus.NOT_FOUND.value())
            .message(ex.getMessage())
            .timestamp(LocalDateTime.now())
            .build();

        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(error);
    }

    /**
     * Handle FileUploadException (400)
     * Invalid file, file too large, unsupported format
     */
    @ExceptionHandler(FileUploadException.class)
    public ResponseEntity<ErrorResponse> handleFileUpload(
        final FileUploadException ex
    ) {
        log.warn("File upload error: {}", ex.getMessage());

        final ErrorResponse error = ErrorResponse.builder()
            .status(HttpStatus.BAD_REQUEST.value())
            .message(ex.getMessage())
            .timestamp(LocalDateTime.now())
            .build();

        return ResponseEntity.badRequest().body(error);
    }

    /**
     * Handle Validation Errors (400)
     * Bean Validation failures (@NotBlank, @Email, @Size, etc.)
     */
    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ErrorResponse> handleValidationErrors(
        final MethodArgumentNotValidException ex
    ) {
        final List<String> errors = ex.getBindingResult()
            .getFieldErrors()
            .stream()
            .map(error -> error.getField() + ": " + error.getDefaultMessage())
            .toList();

        log.warn("Validation failed: {}", errors);

        final ErrorResponse error = ErrorResponse.builder()
            .status(HttpStatus.BAD_REQUEST.value())
            .message("Validation failed")
            .errors(errors)
            .timestamp(LocalDateTime.now())
            .build();

        return ResponseEntity.badRequest().body(error);
    }

    /**
     * Handle Generic Exception (500)
     * Catch-all for unexpected errors
     * IMPORTANT: Log full stack trace, return generic message (don't expose internals)
     */
    @ExceptionHandler(Exception.class)
    public ResponseEntity<ErrorResponse> handleGenericException(final Exception ex) {
        // Log full stack trace for debugging
        log.error("Unexpected error", ex);

        // Return generic error (don't expose internal implementation details)
        final ErrorResponse error = ErrorResponse.builder()
            .status(HttpStatus.INTERNAL_SERVER_ERROR.value())
            .message("An unexpected error occurred")
            .timestamp(LocalDateTime.now())
            .build();

        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(error);
    }
}

/**
 * ErrorResponse DTO - Consistent error format
 */
@Data
@Builder
class ErrorResponse {
    private int status;
    private String message;
    private List<String> errors; // Optional: for validation errors
    private LocalDateTime timestamp;
}

/**
 * Custom Exceptions
 */
class ResourceNotFoundException extends RuntimeException {
    public ResourceNotFoundException(final String message) {
        super(message);
    }
}

class FileUploadException extends RuntimeException {
    public FileUploadException(final String message) {
        super(message);
    }
}
