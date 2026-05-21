package com.deepti.legalintake.controller;

import com.deepti.legalintake.service.NotificationService;
import com.deepti.legalintake.security.JwtUtil;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

/**
 * SSE NOTIFICATION CONTROLLER (NEW FEATURE)
 *
 * This is the endpoint your React frontend connects to for live notifications.
 *
 * Frontend usage (add this to your React app):
 *   const token = localStorage.getItem("token");
 *   const es = new EventSource(`http://localhost:3000/api/notifications/stream?token=${token}`);
 *   es.addEventListener("notification", (e) => {
 *     const data = JSON.parse(e.data);
 *     // data.type = "NEW_CASE" | "CASE_ASSIGNED" | "CASE_STATUS_UPDATED"
 *     // data.message = "New case submitted: Property Dispute"
 *     showToast(data.message);
 *   });
 *
 * Why token in query param instead of Authorization header?
 * Browser's EventSource API doesn't support custom headers.
 * So we pass the JWT as a query param and validate it manually here.
 * This is the standard SSE authentication pattern.
 *
 * produces = MediaType.TEXT_EVENT_STREAM_VALUE:
 * This sets Content-Type: text/event-stream - the SSE protocol content type.
 * The browser keeps the connection alive as long as this response is open.
 */
@RestController
@RequestMapping("/api/notifications")
@RequiredArgsConstructor
@Slf4j
@Tag(name = "Notifications (SSE)")
public class NotificationController {

    private final NotificationService notificationService;
    private final JwtUtil jwtUtil;

    /**
     * GET /api/notifications/stream?token=<JWT>
     *
     * Returns an SSE stream (persistent HTTP connection).
     * Client registers here; server pushes events whenever something happens.
     */
    @GetMapping(value = "/stream", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    @Operation(summary = "Subscribe to real-time notifications via SSE",
            description = "Pass JWT as ?token= query param (EventSource doesn't support headers)")
    public SseEmitter subscribe(@RequestParam String token) {

        // Validate JWT manually (can't use Spring Security filter here because
        // SecurityConfig marks this path as permitAll() - token comes as query param)
        if (!jwtUtil.isTokenValid(token)) {
            SseEmitter emitter = new SseEmitter();
            emitter.completeWithError(new RuntimeException("Invalid token"));
            return emitter;
        }

        Long userId = jwtUtil.extractUserId(token);
        String role = jwtUtil.extractRole(token);

        log.info("SSE subscription: userId={}, role={}", userId, role);

        return notificationService.subscribe(userId, role);
    }
}