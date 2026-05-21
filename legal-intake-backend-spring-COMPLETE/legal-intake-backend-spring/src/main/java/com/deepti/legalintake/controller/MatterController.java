package com.deepti.legalintake.controller;

import com.deepti.legalintake.dto.request.MatterRequest;
import com.deepti.legalintake.entity.Matter;
import com.deepti.legalintake.service.MatterService;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/** replaces matter.controller.js + matterRoutes.js */
@RestController
@RequestMapping("/api/matters")
@RequiredArgsConstructor
@Tag(name = "Matters")
public class MatterController {

    private final MatterService matterService;

    @PostMapping
    @PreAuthorize("hasRole('admin')")
    public ResponseEntity<Map<String, Object>> createMatter(@Valid @RequestBody MatterRequest req) {
        Matter m = matterService.createMatter(req);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(Map.of("success", true, "message", "Matter created successfully", "data", m));
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('admin','lawyer')")
    public ResponseEntity<Map<String, Object>> getAllMatters() {
        return ResponseEntity.ok(Map.of("success", true, "data", matterService.getAllMatters()));
    }

    @GetMapping("/expire-stale")
    @PreAuthorize("hasRole('admin')")
    public ResponseEntity<Map<String, Object>> expireStale(@RequestParam(defaultValue = "7") int days) {
        return ResponseEntity.ok(matterService.expireStaleMatters(days));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('admin','lawyer')")
    public ResponseEntity<Map<String, Object>> getMatterById(@PathVariable String id) {
        return ResponseEntity.ok(Map.of("success", true, "data", matterService.getMatterById(id)));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('admin')")
    public ResponseEntity<Map<String, Object>> updateMatter(@PathVariable String id,
                                                            @RequestBody MatterRequest req) {
        return ResponseEntity.ok(Map.of("success", true, "data", matterService.updateMatter(id, req)));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('admin')")
    public ResponseEntity<Map<String, Object>> deleteMatter(@PathVariable String id) {
        matterService.deleteMatter(id);
        return ResponseEntity.ok(Map.of("success", true, "message", "Matter deleted successfully"));
    }

    @PatchMapping("/{id}/status")
    @PreAuthorize("hasRole('lawyer')")
    public ResponseEntity<Map<String, Object>> updateMatterStatus(@PathVariable String id,
                                                                  @RequestBody Map<String, String> body) {
        return ResponseEntity.ok(Map.of("success", true,
                "data", matterService.updateMatterStatus(id, body.get("status"))));
    }
}