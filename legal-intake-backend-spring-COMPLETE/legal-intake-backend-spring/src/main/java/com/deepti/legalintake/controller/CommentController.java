package com.deepti.legalintake.controller;

import com.deepti.legalintake.dto.request.CommentRequest;
import com.deepti.legalintake.service.CommentService;
import com.deepti.legalintake.security.SecurityUtils;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/** replaces comment.controller.js + commentRoutes.js */
@RestController
@RequestMapping("/api/cases")
@RequiredArgsConstructor
@Tag(name = "Comments")
public class CommentController {

    private final CommentService commentService;
    private final SecurityUtils securityUtils;

    @GetMapping("/{id}/comments")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<List<Map<String, Object>>> getComments(@PathVariable Long id) {
        return ResponseEntity.ok(commentService.getComments(
                id, securityUtils.getCurrentUserId(), securityUtils.getCurrentUserRole()));
    }

    @PostMapping("/{id}/comments")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<Map<String, Object>> createComment(@PathVariable Long id,
                                                             @Valid @RequestBody CommentRequest req) {
        Map<String, Object> comment = commentService.createComment(
                id, req.getText(), securityUtils.getCurrentUserId(), securityUtils.getCurrentUserRole());
        return ResponseEntity.status(HttpStatus.CREATED).body(comment);
    }

    @DeleteMapping("/{caseId}/comments/{commentId}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<Map<String, String>> deleteComment(@PathVariable Long caseId,
                                                             @PathVariable Long commentId) {
        commentService.deleteComment(commentId, securityUtils.getCurrentUserId(), securityUtils.getCurrentUserRole());
        return ResponseEntity.ok(Map.of("message", "Comment deleted successfully"));
    }
}