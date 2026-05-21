package com.deepti.legalintake.dto.request;

import jakarta.validation.constraints.*;
import lombok.Data;

@Data
public class ChatRequest {
    @NotBlank(message = "Question is required")
    private String question;
}