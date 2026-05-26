package com.deepti.legalintake.controller;

import com.deepti.legalintake.dto.request.*;
import com.deepti.legalintake.service.AuthService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.net.URI;
import java.util.Map;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
@Tag(name = "Authentication", description = "Signup, Login, OTP, Password Reset, Google OAuth")
public class AuthController {

    private final AuthService authService;

    @PostMapping("/login")
    @Operation(summary = "Login")
    public ResponseEntity<Map<String, Object>> login(@Valid @RequestBody LoginRequest req) {
        return ResponseEntity.ok(authService.login(req));
    }

    @PostMapping("/signup")
    @Operation(summary = "Signup — creates pending account awaiting admin approval")
    public ResponseEntity<Map<String, Object>> signup(@Valid @RequestBody SignupRequest req) {
        return ResponseEntity.status(HttpStatus.CREATED).body(authService.signup(req));
    }

    @PostMapping("/request-otp")
    public ResponseEntity<Map<String, String>> requestOtp(@Valid @RequestBody RequestOtpRequest req) {
        return ResponseEntity.ok(authService.requestOTP(req));
    }

    @PostMapping("/verify-otp")
    public ResponseEntity<Map<String, String>> verifyOtp(@Valid @RequestBody VerifyOtpRequest req) {
        return ResponseEntity.ok(authService.verifyOTP(req));
    }

    @PostMapping("/reset-password")
    public ResponseEntity<Map<String, String>> resetPassword(@Valid @RequestBody ResetPasswordRequest req) {
        return ResponseEntity.ok(authService.resetPassword(req));
    }

    // ─── GOOGLE OAUTH ────────────────────────────────────────────────────────

    @GetMapping("/google")
    @Operation(summary = "Initiate Google OAuth flow")
    public ResponseEntity<Void> googleLogin() {
        String googleAuthUrl = authService.buildGoogleAuthUrl();
        return ResponseEntity.status(HttpStatus.FOUND)
                .location(URI.create(googleAuthUrl))
                .build();
    }

    @GetMapping("/google/callback")
    @Operation(summary = "Google OAuth callback — redirects to frontend")
    public ResponseEntity<Void> googleCallback(@RequestParam String code) {
        String redirectUrl = authService.handleGoogleCallback(code);
        return ResponseEntity.status(HttpStatus.FOUND)
                .location(URI.create(redirectUrl))
                .build();
    }

    /**
     * POST /api/auth/google/complete
     * Called by SelectRole.jsx after user picks their role.
     * Body: { email, name, role }
     */
    @PostMapping("/google/complete")
    @Operation(summary = "Complete Google signup after role selection")
    public ResponseEntity<Map<String, Object>> completeGoogleSignup(
            @RequestBody Map<String, String> body) {

        String email = body.get("email");
        String name  = body.get("name");
        String role  = body.get("role");

        if (email == null || email.isBlank() || role == null || role.isBlank()) {
            return ResponseEntity.badRequest()
                    .body(Map.of("message", "Email and role are required"));
        }

        return ResponseEntity.ok(authService.completeGoogleSignup(email, name, role));
    }
}