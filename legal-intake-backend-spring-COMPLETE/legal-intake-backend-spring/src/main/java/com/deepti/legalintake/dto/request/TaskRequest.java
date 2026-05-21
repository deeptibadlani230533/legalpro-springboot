package com.deepti.legalintake.dto.request;

import jakarta.validation.constraints.*;
import lombok.Data;

@Data
public class TaskRequest {
    @NotBlank(message = "Title is required")
    private String title;

    private String description;

    @NotBlank(message = "Due date is required")
    private String dueDate;   // ISO date string like "2026-06-01"

    @NotBlank(message = "Matter ID is required")
    private String matterId;
}