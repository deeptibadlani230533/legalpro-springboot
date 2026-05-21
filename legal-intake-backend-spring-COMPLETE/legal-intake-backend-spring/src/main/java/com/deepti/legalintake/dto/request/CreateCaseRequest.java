package com.deepti.legalintake.dto.request;

import jakarta.validation.constraints.*;
import lombok.Data;

/** replaces createCaseSchema */
@Data
public class CreateCaseRequest {
    @NotBlank(message = "Case title is required")
    @Size(min = 3)
    private String caseTitle;

    private String description;

    @NotBlank(message = "Client name is required")
    @Size(min = 3)
    private String clientName;

    @NotBlank(message = "Client email is required")
    @Email
    private String clientEmail;

    private String clientPhone;
    private String clientAddress;
    private String category;
    private String incidentDate;   // ISO date string, parsed in service
    private String opponentName;
    private Double claimAmount;
}