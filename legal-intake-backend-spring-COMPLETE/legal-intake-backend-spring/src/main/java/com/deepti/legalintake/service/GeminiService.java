package com.deepti.legalintake.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;
import org.apache.poi.xwpf.extractor.XWPFWordExtractor;
import org.apache.poi.xwpf.usermodel.XWPFDocument;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.io.FileInputStream;
import java.net.URI;
import java.net.http.*;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.Base64;

@Service
@Slf4j
public class GeminiService {

    @Value("${gemini.api.key}")
    private String apiKey;

    @Value("${gemini.model}")
    private String model;

    private static final String GEMINI_URL =
            "https://generativelanguage.googleapis.com/v1beta/models/%s:generateContent?key=%s";

    private static final String SUMMARIZE_PROMPT = """
            You are an intelligent document analysis assistant.
            
            First determine whether the document is a LEGAL document or a GENERAL document.
            
            If it is a LEGAL document:
            - Act as an AI legal assistant.
            - Create a concise professional legal case summary.
            - Do NOT copy text directly from the document.
            - Include: Nature of the dispute, Parties involved, What happened,
              Legal allegation or claim, Financial or legal impact, Current case status if mentioned.
            
            If it is NOT a legal document:
            - Create a clear general summary of the document.
            - Explain the main idea, important information, and key takeaways.
            
            Output format:
            1 short paragraph (3-4 lines maximum)
            followed by 3-4 key bullet points and takeaways
            
            Use clear, professional language.
            """;

    // ========================= DOCUMENT SUMMARY =========================

    public String summarizeDocument(String filePath) throws Exception {
        String extension = getExtension(filePath);

        if (".pdf".equals(extension)) {
            return summarizePdf(filePath);
        } else if (".docx".equals(extension)) {
            return summarizeDocx(filePath);
        } else {
            throw new IllegalArgumentException("Unsupported file type. Only PDF and DOCX allowed.");
        }
    }

    private String summarizePdf(String filePath) throws Exception {
        byte[] fileBytes = Files.readAllBytes(Path.of(filePath));
        String base64Data = Base64.getEncoder().encodeToString(fileBytes);

        String requestBody = """
                {
                  "contents": [{
                    "parts": [
                      { "inline_data": { "mime_type": "application/pdf", "data": "%s" } },
                      { "text": "%s" }
                    ]
                  }]
                }
                """.formatted(base64Data, escape(SUMMARIZE_PROMPT));

        return callGeminiApi(requestBody);
    }

    private String summarizeDocx(String filePath) throws Exception {
        String text;
        try (FileInputStream fis = new FileInputStream(filePath);
             XWPFDocument doc = new XWPFDocument(fis);
             XWPFWordExtractor extractor = new XWPFWordExtractor(doc)) {
            text = extractor.getText();
        }

        String requestBody = """
                {
                  "contents": [{
                    "parts": [
                      { "text": "Document content:\\n%s\\n\\n%s" }
                    ]
                  }]
                }
                """.formatted(escape(text), escape(SUMMARIZE_PROMPT));

        return callGeminiApi(requestBody);
    }

    // ========================= CHAT =========================

    public String askLegalQuestion(String question) {
        try {
            String prompt = """
                    You are a legal assistant.
                    - Answer in simple language
                    - Be clear and structured
                    - Do NOT give final legal advice
                    - Say "consult a lawyer" if needed
                    
                    Question: %s
                    Answer:
                    """.formatted(question);

            String requestBody = """
                    {
                      "contents": [{
                        "parts": [{ "text": "%s" }]
                      }]
                    }
                    """.formatted(escape(prompt));

            return callGeminiApi(requestBody);

        } catch (Exception e) {
            log.error("Gemini chat error: {}", e.getMessage());
            return "Error generating response";
        }
    }

    // ========================= CORE API CALL =========================

    private String callGeminiApi(String requestBody) throws Exception {
        String url = GEMINI_URL.formatted(model, apiKey);

        HttpClient client = HttpClient.newHttpClient();
        HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create(url))
                .header("Content-Type", "application/json")
                .POST(HttpRequest.BodyPublishers.ofString(requestBody))
                .build();

        HttpResponse<String> response = client.send(request, HttpResponse.BodyHandlers.ofString());

        if (response.statusCode() != 200) {
            log.error("Gemini API error {}: {}", response.statusCode(), response.body());
            throw new RuntimeException("Gemini API error: " + response.statusCode());
        }

        // 🔥 PROPER JSON PARSING (FINAL FIX)
        ObjectMapper mapper = new ObjectMapper();
        JsonNode root = mapper.readTree(response.body());

        JsonNode textNode = root
                .path("candidates")
                .get(0)
                .path("content")
                .path("parts")
                .get(0)
                .path("text");

        if (textNode == null || textNode.isMissingNode()) {
            log.error("Unexpected Gemini response: {}", response.body());
            return "No response generated";
        }

        return textNode.asText();
    }

    // ========================= HELPERS =========================

    private String escape(String text) {
        return text.replace("\"", "\\\"").replace("\n", "\\n");
    }

    private String getExtension(String filePath) {
        int lastDot = filePath.lastIndexOf('.');
        return lastDot >= 0 ? filePath.substring(lastDot).toLowerCase() : "";
    }
}