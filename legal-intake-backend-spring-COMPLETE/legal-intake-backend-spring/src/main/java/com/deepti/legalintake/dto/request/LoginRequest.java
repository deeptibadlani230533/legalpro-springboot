package com.deepti.legalintake.dto.request;

import jakarta.validation.constraints.*;
import lombok.Data;

/** replaces loginSchema in schemas/auth.schema.js */
@Data
public class LoginRequest {
    @NotBlank @Email
    private String email;

    @NotBlank
    @Size(min = 6)
    private String password;
}