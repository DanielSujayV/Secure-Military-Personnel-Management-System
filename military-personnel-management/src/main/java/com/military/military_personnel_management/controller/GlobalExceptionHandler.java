package com.military.military_personnel_management.controller;

import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;
import java.util.Map;

@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(ResponseStatusException.class)
    public ResponseEntity<Map<String, Object>> handleResponseStatus(
            ResponseStatusException exception) {
        int status = exception.getStatusCode().value();
        String message = exception.getReason() == null
                ? "Request could not be completed" : exception.getReason();
        return response(status, message);
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<Map<String, Object>> handleValidation(
            MethodArgumentNotValidException exception) {
        return response(HttpStatus.BAD_REQUEST.value(), "Request validation failed");
    }

    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<Map<String, Object>> handleIllegalArgument(
            IllegalArgumentException exception) {
        String message = exception.getMessage() == null
                ? "Invalid request" : exception.getMessage();
        return response(HttpStatus.BAD_REQUEST.value(), message);
    }

    @ExceptionHandler(IllegalStateException.class)
    public ResponseEntity<Map<String, Object>> handleIllegalState(
            IllegalStateException exception) {
        String message = exception.getMessage() == null
                ? "Request conflicts with the current state" : exception.getMessage();
        return response(HttpStatus.CONFLICT.value(), message);
    }

    @ExceptionHandler(DataIntegrityViolationException.class)
    public ResponseEntity<Map<String, Object>> handleDataIntegrity(
            DataIntegrityViolationException exception) {
        return response(HttpStatus.CONFLICT.value(),
                "The request conflicts with an existing database record");
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<Map<String, Object>> handleUnexpected(
            Exception exception) {
        return response(HttpStatus.INTERNAL_SERVER_ERROR.value(),
                "An unexpected server error occurred");
    }

    private ResponseEntity<Map<String, Object>> response(
            int status, String message) {
        return ResponseEntity.status(status).body(Map.of(
                "status", status,
                "message", message,
                "timestamp", LocalDateTime.now().toString()
        ));
    }
}