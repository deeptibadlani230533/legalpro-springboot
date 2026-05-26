package com.deepti.legalintake.dto.request;

import jakarta.validation.constraints.*;
import lombok.Data;

/** replaces requestOtpSchema */
@Data
public class RequestOtpRequest {
    @NotBlank @Email
    private String email;
}