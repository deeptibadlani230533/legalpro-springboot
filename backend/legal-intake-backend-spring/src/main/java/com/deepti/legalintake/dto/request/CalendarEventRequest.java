package com.deepti.legalintake.dto.request;

import jakarta.validation.constraints.*;
import lombok.Data;

@Data
public class CalendarEventRequest {
    @NotBlank(message = "Title is required")
    private String title;

    private String type;   // "hearing", "deadline", "meeting", "reminder"

    @NotBlank(message = "Date is required")
    private String date;   // "2026-06-15"

    private String time;   // "14:30"
    private String notes;
    private Long caseId;
}