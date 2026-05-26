package com.deepti.legalintake.dto.request;

import jakarta.validation.constraints.*;
import lombok.Data;

@Data
public class CommentRequest {
    @NotBlank(message = "Comment text cannot be empty")
    private String text;
}