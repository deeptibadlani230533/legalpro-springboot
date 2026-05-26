package com.deepti.legalintake.service;

import com.deepti.legalintake.entity.Case;
import com.deepti.legalintake.entity.CaseComment;
import com.deepti.legalintake.exception.ApiException;
import com.deepti.legalintake.repository.CasecommentRepository;
import com.deepti.legalintake.repository.CaseRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;

@Service
@RequiredArgsConstructor
public class CommentService {

    private final CasecommentRepository commentRepository;
    private final CaseRepository caseRepository;

    public List<Map<String, Object>> getComments(Long caseId, Long userId, String role) {
        Case c = caseRepository.findById(caseId)
                .orElseThrow(() -> ApiException.notFound("Case not found"));

        if ("client".equals(role) && !c.getUserId().equals(userId))
            throw ApiException.forbidden("Forbidden");

        return commentRepository.findByCaseIdWithAuthor(caseId).stream()
                .map(comment -> {
                    Map<String, Object> map = new HashMap<>();

                    map.put("id", comment.getId());
                    map.put("text", comment.getText());
                    map.put("caseId", comment.getCaseId());
                    map.put("createdAt", comment.getCreatedAt());
                    map.put("isMine", comment.getUserId().equals(userId));

                    // ✅ Safe author mapping
                    Map<String, Object> author = new HashMap<>();

                    if (comment.getAuthor() != null) {
                        author.put("id", comment.getAuthor().getId());
                        author.put("name", comment.getAuthor().getName());
                        author.put("role", comment.getAuthor().getRole());
                    } else {
                        author.put("id", null);
                        author.put("name", "Unknown");
                        author.put("role", "");
                    }

                    map.put("author", author);

                    return map;
                })
                .toList();
    }

    @Transactional
    public Map<String, Object> createComment(Long caseId, String text, Long userId, String role) {
        if (text == null || text.isBlank())
            throw ApiException.badRequest("Comment text cannot be empty");

        Case c = caseRepository.findById(caseId)
                .orElseThrow(() -> ApiException.notFound("Case not found"));

        if ("client".equals(role) && !c.getUserId().equals(userId))
            throw ApiException.forbidden("Forbidden");

        if ("lawyer".equals(role) && !userId.equals(c.getAssignedLawyerId()))
            throw ApiException.forbidden("You are not assigned to this case");

        CaseComment saved = commentRepository.save(CaseComment.builder()
                .text(text.trim())
                .caseId(caseId)
                .userId(userId)
                .build());

        // Re-fetch with author to return consistent shape
        List<Map<String, Object>> all = getComments(caseId, userId, role);

        return all.stream()
                .filter(m -> saved.getId().equals(m.get("id")))
                .findFirst()
                .orElseGet(() -> {
                    Map<String, Object> fallback = new HashMap<>();
                    fallback.put("id", saved.getId());
                    fallback.put("text", saved.getText());
                    return fallback;
                });
    }

    @Transactional
    public void deleteComment(Long commentId, Long userId, String role) {
        CaseComment comment = commentRepository.findById(commentId)
                .orElseThrow(() -> ApiException.notFound("Comment not found"));

        if (!"admin".equals(role) && !comment.getUserId().equals(userId))
            throw ApiException.forbidden("You can only delete your own comments");

        commentRepository.delete(comment);
    }
}