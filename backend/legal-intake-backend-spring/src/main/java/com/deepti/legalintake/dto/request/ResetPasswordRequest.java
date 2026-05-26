package com.deepti.legalintake.dto.request;

import jakarta.validation.constraints.*;
import lombok.Data;

/** replaces resetPasswordSchema */
@Data
public class ResetPasswordRequest {
    @NotBlank @Email
    private String email;

    @NotBlank
    @Size(min = 6, message = "Password must be at least 6 characters")
    private String newPassword;
}