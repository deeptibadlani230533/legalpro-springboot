package com.deepti.legalintake.controller;

import com.deepti.legalintake.dto.request.ChatRequest;
import com.deepti.legalintake.service.GeminiService;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import java.util.Map;

/** replaces chatController.js + chatRoutes.js */
@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
@Tag(name = "AI Chat")
public class ChatController {

    private final GeminiService geminiService;

    /** POST /api/chat */
    @PostMapping("/chat")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<Map<String, Object>> chat(@Valid @RequestBody ChatRequest req) {
        String response = geminiService.askLegalQuestion(req.getQuestion());
        return ResponseEntity.ok(Map.of("success", true, "response", response));
    }
}