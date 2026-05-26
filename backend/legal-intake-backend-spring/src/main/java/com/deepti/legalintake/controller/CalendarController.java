package com.deepti.legalintake.controller;

import com.deepti.legalintake.dto.request.CalendarEventRequest;
import com.deepti.legalintake.entity.CalendarEvent;
import com.deepti.legalintake.service.CalendarService;
import com.deepti.legalintake.security.SecurityUtils;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;

/** replaces calendar.controller.js + calendarRoutes.js */
@RestController
@RequestMapping("/api/calendar")
@RequiredArgsConstructor
@Tag(name = "Calendar")
public class CalendarController {

    private final CalendarService calendarService;
    private final SecurityUtils securityUtils;

    @GetMapping
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<List<CalendarEvent>> getEvents(
            @RequestParam(defaultValue = "0") int month,
            @RequestParam(defaultValue = "0") int year) {

        int m = month > 0 ? month : LocalDate.now().getMonthValue();
        int y = year  > 0 ? year  : LocalDate.now().getYear();

        return ResponseEntity.ok(calendarService.getEvents(
                securityUtils.getCurrentUserId(), securityUtils.getCurrentUserRole(), m, y));
    }

    @GetMapping("/{id}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<CalendarEvent> getEventById(@PathVariable Long id) {
        return ResponseEntity.ok(calendarService.getEventById(
                id, securityUtils.getCurrentUserId(), securityUtils.getCurrentUserRole()));
    }

    @PostMapping
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<CalendarEvent> createEvent(@Valid @RequestBody CalendarEventRequest req) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(calendarService.createEvent(req, securityUtils.getCurrentUserId()));
    }

    @PatchMapping("/{id}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<CalendarEvent> updateEvent(@PathVariable Long id,
                                                     @RequestBody CalendarEventRequest req) {
        return ResponseEntity.ok(calendarService.updateEvent(
                id, req, securityUtils.getCurrentUserId(), securityUtils.getCurrentUserRole()));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<Map<String, String>> deleteEvent(@PathVariable Long id) {
        calendarService.deleteEvent(id, securityUtils.getCurrentUserId(), securityUtils.getCurrentUserRole());
        return ResponseEntity.ok(Map.of("message", "Event deleted successfully"));
    }
}