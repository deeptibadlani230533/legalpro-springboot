package com.deepti.legalintake.controller;

import com.deepti.legalintake.entity.Document;
import com.deepti.legalintake.service.DocumentService;
import com.deepti.legalintake.security.SecurityUtils;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.core.io.FileSystemResource;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.List;
import java.util.Map;

/**
 * DOCUMENT CONTROLLER - replaces document.controller.js + documentRoutes.js
 *
 * File upload: @RequestParam("file") MultipartFile file
 * This replaces @fastify/multipart completely - Spring handles multipart automatically.
 *
 * File download: returns Resource with Content-Disposition header
 * This replaces: reply.header("Content-Disposition", ...) + fs.createReadStream()
 */
@RestController
@RequestMapping("/api/documents")
@RequiredArgsConstructor
@Tag(name = "Documents")
public class DocumentController {

    private final DocumentService documentService;
    private final SecurityUtils securityUtils;

    /**
     * POST /api/documents
     * @RequestParam("file")   = the file field in the multipart form
     * @RequestParam("caseId") = the caseId field in the multipart form
     * replaces: request.file() + filePart.fields.caseId.value
     */
    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Upload a document for a case")
    public ResponseEntity<Map<String, Object>> uploadDocument(
            @RequestParam("file") MultipartFile file,
            @RequestParam("caseId") Long caseId) throws IOException {

        Map<String, Object> result = documentService.uploadDocument(
                file, caseId, securityUtils.getCurrentUserId());
        return ResponseEntity.status(HttpStatus.CREATED).body(result);
    }

    /** GET /api/documents/case/:caseId */
    @GetMapping("/case/{caseId}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<Map<String, Object>> getDocumentsByCase(@PathVariable Long caseId) {
        List<Document> docs = documentService.getDocumentsByCase(caseId);
        return ResponseEntity.ok(Map.of("success", true, "data", docs));
    }

    /**
     * GET /api/documents/:id/download
     * FileSystemResource = Spring's way to stream a file in a response
     * replaces: fs.createReadStream(document.filePath) piped to reply
     */
    @GetMapping("/{id}/download")
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Download a document file")
    public ResponseEntity<Resource> downloadDocument(@PathVariable Long id) {
        Document doc = documentService.getDocumentForDownload(id);

        Resource resource = new FileSystemResource(doc.getFilePath());

        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType(doc.getFileType()))
                .header(HttpHeaders.CONTENT_DISPOSITION,
                        "attachment; filename=\"" + doc.getOriginalName() + "\"")
                .body(resource);
    }

    /** GET /api/documents/case/:caseId/history/:originalName - versioning */
    @GetMapping("/case/{caseId}/history/{originalName}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<Map<String, Object>> getDocumentHistory(
            @PathVariable Long caseId,
            @PathVariable String originalName) {
        List<Document> docs = documentService.getDocumentHistory(caseId, originalName);
        return ResponseEntity.ok(Map.of("success", true, "data", docs));
    }

    /** DELETE /api/documents/:id - admin only */
    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('admin')")
    public ResponseEntity<Map<String, Object>> deleteDocument(@PathVariable Long id) {
        return ResponseEntity.ok(documentService.deleteDocument(id));
    }
}