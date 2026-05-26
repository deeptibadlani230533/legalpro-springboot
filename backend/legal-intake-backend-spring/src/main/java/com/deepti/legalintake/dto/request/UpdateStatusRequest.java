package com.deepti.legalintake.dto.request;

import jakarta.validation.constraints.*;
import lombok.Data;

/** replaces updateStatusSchema */
@Data
public class UpdateStatusRequest {
    @NotBlank
    @Pattern(regexp = "open|assigned|in_progress|closed",
            message = "Status must be: open, assigned, in_progress, or closed")
    private String status;
}