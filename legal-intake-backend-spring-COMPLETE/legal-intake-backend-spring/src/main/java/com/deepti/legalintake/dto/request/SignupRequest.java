package com.deepti.legalintake.dto.request;

import jakarta.validation.constraints.*;
import lombok.Data;

/** replaces signupSchema in schemas/auth.schema.js */
@Data
public class SignupRequest {
    @NotBlank(message = "Name is required")
    @Size(min = 3, message = "Name must be at least 3 characters")
    private String name;

    @NotBlank(message = "Email is required")
    @Email(message = "Must be a valid email address")
    private String email;

    @NotBlank(message = "Password is required")
    @Size(min = 6, message = "Password must be at least 6 characters")
    private String password;

    @NotBlank(message = "Role is required")
    @Pattern(regexp = "admin|lawyer|client", message = "Role must be admin, lawyer, or client")
    private String role;
}