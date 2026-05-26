package com.deepti.legalintake.dto.request;

import jakarta.validation.constraints.*;
import lombok.Data;

/** replaces assignLawyerSchema */
@Data
public class AssignLawyerRequest {
    @NotNull(message = "Lawyer ID is required")
    private Long lawyerId;
}