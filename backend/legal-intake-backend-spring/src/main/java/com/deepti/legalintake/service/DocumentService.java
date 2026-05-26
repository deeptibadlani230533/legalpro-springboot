package com.deepti.legalintake.service;

import com.deepti.legalintake.entity.Document;
import com.deepti.legalintake.exception.ApiException;
import com.deepti.legalintake.repository.CaseRepository;
import com.deepti.legalintake.repository.DocumentRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.File;
import java.io.IOException;
import java.nio.file.*;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class DocumentService {

    private final DocumentRepository documentRepository;
    private final CaseRepository caseRepository;
    private final GeminiService geminiService;

    @Value("${app.upload.dir:uploads}")
    private String uploadDir;

    @Transactional
    public Map<String, Object> uploadDocument(MultipartFile file, Long caseId, Long uploadedBy) throws IOException {

        if (file == null || file.isEmpty()) {
            throw ApiException.badRequest("No file uploaded");
        }

        // ✅ Verify case exists
        caseRepository.findById(caseId)
                .orElseThrow(() -> ApiException.notFound("Case not found"));

        // ✅ Versioning
        int newVersion = documentRepository
                .findTopByCaseIdAndOriginalNameOrderByVersionDesc(caseId, file.getOriginalFilename())
                .map(d -> d.getVersion() + 1)
                .orElse(1);

        // ✅ Generate filename
        String extension = getExtension(file.getOriginalFilename());
        String storedName = UUID.randomUUID() + extension;

        // 🔥 FIX 1: Use absolute path (NO Tomcat temp path)
        String basePath = System.getProperty("user.dir") + File.separator + uploadDir;
        Path uploadPath = Paths.get(basePath);

        // 🔥 FIX 2: Ensure directory exists
        if (!Files.exists(uploadPath)) {
            Files.createDirectories(uploadPath);
            log.info("Created upload directory at {}", uploadPath);
        }

        // 🔥 FIX 3: Safe file path
        Path filePath = uploadPath.resolve(storedName);

        try {
            file.transferTo(filePath.toFile());
        } catch (IOException e) {
            log.error("File upload failed: {}", e.getMessage());
            throw new IOException("Failed to save file", e);
        }

        // ✅ Save document in DB
        Document doc = documentRepository.save(Document.builder()
                .caseId(caseId)
                .uploadedBy(uploadedBy)
                .originalName(file.getOriginalFilename())
                .storedName(storedName)
                .filePath(filePath.toString())
                .fileType(file.getContentType())
                .fileSize(file.getSize())
                .version(newVersion)
                .summary(null)
                .build());

        // 🔥 Async Gemini processing
        processWithGemini(doc.getId(), filePath.toString());

        return Map.of("success", true, "data", doc);
    }

    @Async("asyncExecutor")
    public void processWithGemini(Long documentId, String filePath) {
        try {
            String summary = geminiService.summarizeDocument(filePath);

            documentRepository.findById(documentId).ifPresent(doc -> {
                doc.setSummary(summary);
                documentRepository.save(doc);
                log.info("Gemini summary stored for document: {}", documentId);
            });
        } catch (Exception e) {
            log.error("Gemini processing failed for document {}: {}", documentId, e.getMessage());
        }
    }

    public List<Document> getDocumentsByCase(Long caseId) {
        return documentRepository.findByCaseIdOrderByCreatedAtDesc(caseId);
    }

    public Document getDocumentForDownload(Long id) {
        Document doc = documentRepository.findById(id)
                .orElseThrow(() -> ApiException.notFound("Document not found"));

        File file = new File(doc.getFilePath());

        // 🔥 FIX 4: Better error handling
        if (!file.exists()) {
            log.error("File missing on disk: {}", doc.getFilePath());
            throw ApiException.notFound("File not found on server");
        }

        return doc;
    }

    public List<Document> getDocumentHistory(Long caseId, String originalName) {
        List<Document> docs = documentRepository
                .findByCaseIdAndOriginalNameOrderByVersionDesc(caseId, originalName);

        if (docs.isEmpty()) {
            throw ApiException.notFound("No versions found for this file");
        }
        return docs;
    }

    @Transactional
    public Map<String, Object> deleteDocument(Long id) {
        Document doc = documentRepository.findById(id)
                .orElseThrow(() -> ApiException.notFound("Document not found"));

        File file = new File(doc.getFilePath());

        // 🔥 FIX 5: Safe delete
        if (file.exists()) {
            if (!file.delete()) {
                log.warn("Failed to delete file: {}", doc.getFilePath());
            }
        }

        documentRepository.delete(doc);
        return Map.of("success", true, "message", "Document deleted successfully");
    }

    private String getExtension(String filename) {
        if (filename == null) return "";
        int lastDot = filename.lastIndexOf('.');
        return lastDot >= 0 ? filename.substring(lastDot) : "";
    }
}