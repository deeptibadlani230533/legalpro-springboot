package com.deepti.legalintake.dto.request;

import jakarta.validation.constraints.*;
import lombok.Data;

/** replaces verifyOtpSchema */
@Data
public class VerifyOtpRequest {
    @NotBlank @Email
    private String email;

    @NotBlank
    @Size(min = 4, max = 6)
    private String otp;
}