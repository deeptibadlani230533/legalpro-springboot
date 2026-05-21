package com.deepti.legalintake.dto.request;

import jakarta.validation.constraints.*;
import lombok.Data;

@Data
public class MatterRequest {
    @NotBlank(message = "Title is required")
    private String title;

    private String description;

    @NotBlank(message = "Client name is required")
    private String clientName;

    private String assignedLawyerId;
}