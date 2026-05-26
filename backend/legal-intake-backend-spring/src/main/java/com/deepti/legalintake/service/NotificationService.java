package com.deepti.legalintake.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.io.IOException;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.CopyOnWriteArrayList;

/**
 * SSE NOTIFICATION SERVICE (NEW FEATURE - not in Node version)
 *
 * SSE = Server-Sent Events. The client opens a persistent HTTP connection,
 * and the server can push events down at any time - without the client polling.
 *
 * In your project this is used for:
 * - Admin gets notified when a new case is submitted (client submits → admin sees it live)
 * - Lawyer gets notified when a case is assigned to them
 * - Case status changes appear in real-time on dashboard
 *
 * How SSE works vs WebSocket:
 * - SSE = one-way (server → client only). Perfect for notifications.
 * - WebSocket = two-way. Heavier, needed for chat.
 * - SSE is built into HTTP/1.1. No extra protocol or library needed.
 *
 * Storage:
 * - userEmitters: Map<userId, List<SseEmitter>>  → per-user connections
 * - roleEmitters: Map<role, List<SseEmitter>>    → broadcast to all admins/lawyers/clients
 *
 * ConcurrentHashMap + CopyOnWriteArrayList = thread-safe collections
 * (multiple requests = multiple threads, all modifying these maps simultaneously)
 */
@Service
@Slf4j
public class NotificationService {

    // userId → list of SSE connections for that user
    // (same user can have multiple browser tabs open)
    private final Map<Long, CopyOnWriteArrayList<SseEmitter>> userEmitters = new ConcurrentHashMap<>();

    // role → list of SSE connections for that role
    private final Map<String, CopyOnWriteArrayList<SseEmitter>> roleEmitters = new ConcurrentHashMap<>();

    private final ObjectMapper objectMapper = new ObjectMapper();

    /**
     * SUBSCRIBE - called when a client opens the SSE connection
     * Frontend: const eventSource = new EventSource("/api/notifications/stream?token=...")
     *
     * SseEmitter = Spring's SSE response object.
     * timeout = how long to keep connection open (30 min here)
     * After timeout the client auto-reconnects (built into EventSource API)
     */
    public SseEmitter subscribe(Long userId, String role) {
        SseEmitter emitter = new SseEmitter(30 * 60 * 1000L); // 30 minutes

        // Register by user ID
        userEmitters.computeIfAbsent(userId, k -> new CopyOnWriteArrayList<>()).add(emitter);

        // Register by role
        roleEmitters.computeIfAbsent(role, k -> new CopyOnWriteArrayList<>()).add(emitter);

        // Clean up when connection closes (user closes tab, network drops etc.)
        emitter.onCompletion(() -> removeEmitter(userId, role, emitter));
        emitter.onTimeout(()    -> removeEmitter(userId, role, emitter));
        emitter.onError(e       -> removeEmitter(userId, role, emitter));

        // Send a "connected" event immediately so the frontend knows it's live
        try {
            emitter.send(SseEmitter.event()
                    .name("connected")
                    .data(Map.of("message", "Connected to notifications", "userId", userId)));
        } catch (IOException e) {
            log.warn("Failed to send connection event to user {}", userId);
        }

        log.info("User {} (role: {}) connected to SSE", userId, role);
        return emitter;
    }

    /**
     * PUSH TO SPECIFIC USER - e.g. "You have been assigned case X"
     * Called from CaseService.assignLawyer() → pushes to the assigned lawyer
     */
    public void pushToUser(Long userId, Map<String, Object> payload) {
        CopyOnWriteArrayList<SseEmitter> emitters = userEmitters.get(userId);
        if (emitters == null || emitters.isEmpty()) return;

        sendToEmitters(emitters, userId + "", payload);
    }

    /**
     * PUSH TO ALL USERS WITH A ROLE - e.g. "New case submitted" → all admins
     * Called from CaseService.createCase() → pushes to all connected admin users
     */
    public void pushToRole(String role, Map<String, Object> payload) {
        CopyOnWriteArrayList<SseEmitter> emitters = roleEmitters.get(role);
        if (emitters == null || emitters.isEmpty()) return;

        sendToEmitters(emitters, role, payload);
    }

    /**
     * BROADCAST TO ALL connected users (for system-wide events)
     */
    public void broadcast(Map<String, Object> payload) {
        userEmitters.values().forEach(emitters -> sendToEmitters(emitters, "all", payload));
    }

    private void sendToEmitters(CopyOnWriteArrayList<SseEmitter> emitters, String target, Map<String, Object> payload) {
        try {
            String json = objectMapper.writeValueAsString(payload);
            // Iterate over a copy to avoid ConcurrentModificationException
            for (SseEmitter emitter : emitters) {
                try {
                    emitter.send(SseEmitter.event()
                            .name("notification")
                            .data(json));
                } catch (IOException e) {
                    // This emitter is dead - remove it
                    emitters.remove(emitter);
                    log.debug("Removed dead SSE emitter for target: {}", target);
                }
            }
        } catch (Exception e) {
            log.error("Failed to push notification to {}: {}", target, e.getMessage());
        }
    }

    private void removeEmitter(Long userId, String role, SseEmitter emitter) {
        userEmitters.getOrDefault(userId, new CopyOnWriteArrayList<>()).remove(emitter);
        roleEmitters.getOrDefault(role,   new CopyOnWriteArrayList<>()).remove(emitter);
        log.info("User {} disconnected from SSE", userId);
    }
}