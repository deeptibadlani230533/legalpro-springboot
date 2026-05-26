package com.deepti.legalintake.service;

import com.deepti.legalintake.dto.request.*;
import com.deepti.legalintake.entity.Otp;
import com.deepti.legalintake.entity.User;
import com.deepti.legalintake.exception.ApiException;
import com.deepti.legalintake.repository.OtpRepository;
import com.deepti.legalintake.repository.UserRepository;
import com.deepti.legalintake.security.JwtUtil;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.IOException;
import java.net.URI;
import java.net.URLEncoder;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.time.LocalDateTime;
import java.util.Map;
import java.util.Optional;

@Service
@RequiredArgsConstructor
@Slf4j
public class AuthService {

    private final UserRepository      userRepository;
    private final OtpRepository       otpRepository;
    private final PasswordEncoder     passwordEncoder;
    private final JwtUtil             jwtUtil;
    private final JavaMailSender      mailSender;
    private final NotificationService notificationService;

    @Value("${google.client.id}")
    private String googleClientId;

    @Value("${google.client.secret}")
    private String googleClientSecret;

    @Value("${google.redirect.uri}")
    private String googleRedirectUri;

    @Value("${app.frontend.url}")
    private String frontendUrl;

    // ─── LOGIN ────────────────────────────────────────────────────────────────

    public Map<String, Object> login(LoginRequest req) {
        User user = userRepository.findByEmail(req.getEmail())
                .orElseThrow(() -> ApiException.unauthorized("Invalid email or password"));

        if (!passwordEncoder.matches(req.getPassword(), user.getPasswordHash())) {
            throw ApiException.unauthorized("Invalid email or password");
        }

        if ("pending".equals(user.getStatus())) {
            return Map.of("message", "Account pending approval", "status", "pending");
        }

        if ("rejected".equals(user.getStatus())) {
            return Map.of("message", "Your access request was declined", "status", "rejected");
        }

        String token = jwtUtil.generateToken(user.getId(), user.getRole());
        return Map.of(
                "message", "Login successful",
                "token",   token,
                "role",    user.getRole(),
                "userId",  user.getId(),
                "name",    user.getName(),
                "status",  "active"
        );
    }

    // ─── SIGNUP ───────────────────────────────────────────────────────────────

    @Transactional
    public Map<String, Object> signup(SignupRequest req) {
        if (userRepository.existsByEmail(req.getEmail())) {
            throw ApiException.badRequest("User already exists");
        }

        String passwordHash = passwordEncoder.encode(req.getPassword());

        User newUser = userRepository.save(User.builder()
                .name(req.getName())
                .email(req.getEmail())
                .passwordHash(passwordHash)
                .role(req.getRole() != null ? req.getRole() : "client")
                .status("pending")
                .build());

        notificationService.pushToRole("admin",
                Map.of("type", "NEW_USER_PENDING",
                        "message", "New user awaiting approval: " + newUser.getName(),
                        "userId", newUser.getId()));

        return Map.of(
                "message", "Registration submitted — awaiting admin approval",
                "status", "pending",
                "user", Map.of(
                        "id",    newUser.getId(),
                        "name",  newUser.getName(),
                        "email", newUser.getEmail(),
                        "role",  newUser.getRole()
                )
        );
    }

    // ─── GOOGLE OAUTH ─────────────────────────────────────────────────────────

    public String buildGoogleAuthUrl() {
        String scope = URLEncoder.encode("email profile", StandardCharsets.UTF_8);
        return "https://accounts.google.com/o/oauth2/v2/auth"
                + "?client_id=" + googleClientId
                + "&redirect_uri=" + URLEncoder.encode(googleRedirectUri, StandardCharsets.UTF_8)
                + "&response_type=code"
                + "&scope=" + scope
                + "&access_type=offline"
                + "&prompt=select_account";
    }

    /**
     * Step 2 — Google redirects back with ?code=...
     *
     * CHANGED: For NEW users we no longer save immediately.
     * Instead we redirect to /select-role?email=...&name=...
     * so the user can pick client or lawyer first.
     *
     * Existing users are handled as before.
     */
    @Transactional
    public String handleGoogleCallback(String code) {
        try {
            String tokenResponse = exchangeCodeForToken(code);
            JsonNode tokenJson   = new ObjectMapper().readTree(tokenResponse);
            String accessToken   = tokenJson.get("access_token").asText();

            String userInfoResponse = fetchGoogleUserInfo(accessToken);
            JsonNode userInfo       = new ObjectMapper().readTree(userInfoResponse);

            String email = userInfo.get("email").asText();
            String name  = userInfo.get("name").asText();

            Optional<User> existing = userRepository.findByEmail(email);

            if (existing.isPresent()) {
                User user = existing.get();

                if ("pending".equals(user.getStatus())) {
                    return frontendUrl + "/pending-approval";
                }
                if ("rejected".equals(user.getStatus())) {
                    return frontendUrl + "/login?error=rejected";
                }

                // Active — issue JWT and send to dashboard
                String token = jwtUtil.generateToken(user.getId(), user.getRole());
                String path  = "lawyer".equals(user.getRole()) ? "/lawyer/dashboard" : "/dashboard";
                return frontendUrl + "/oauth/callback?token=" + token
                        + "&role=" + user.getRole()
                        + "&redirect=" + path;
            }

            // ── NEW USER: redirect to role selection page ──────────────────
            return frontendUrl
                    + "/select-role?email=" + URLEncoder.encode(email, StandardCharsets.UTF_8)
                    + "&name="  + URLEncoder.encode(name,  StandardCharsets.UTF_8);

        } catch (Exception e) {
            log.error("Google OAuth callback error: {}", e.getMessage());
            return frontendUrl + "/login?error=oauth_failed";
        }
    }

    /**
     * POST /api/auth/google/complete
     *
     * Called by SelectRole.jsx after the user picks their role.
     * Creates the user as pending and returns status.
     */
    @Transactional
    public Map<String, Object> completeGoogleSignup(String email, String name, String role) {

        // Guard: if somehow they already exist (double submit), handle gracefully
        Optional<User> existing = userRepository.findByEmail(email);
        if (existing.isPresent()) {
            User user = existing.get();
            if ("active".equals(user.getStatus())) {
                String token = jwtUtil.generateToken(user.getId(), user.getRole());
                return Map.of("token", token, "role", user.getRole(), "status", "active");
            }
            // Already pending or rejected
            return Map.of("status", user.getStatus(), "message", "Account already exists");
        }

        String allowedRole = ("lawyer".equals(role)) ? "lawyer" : "client";

        User newUser = userRepository.save(User.builder()
                .name(name)
                .email(email)
                .passwordHash(passwordEncoder.encode(java.util.UUID.randomUUID().toString()))
                .role(allowedRole)
                .status("pending")
                .build());

        log.info("New Google OAuth user created with role {}: {} ({})", allowedRole, name, email);

        notificationService.pushToRole("admin",
                Map.of("type",    "NEW_USER_PENDING",
                        "message", "New Google sign-in awaiting approval: " + name + " (" + allowedRole + ")",
                        "userId",  newUser.getId()));

        return Map.of("status", "pending", "message", "Account created — awaiting admin approval");
    }

    // ─── PRIVATE HELPERS ──────────────────────────────────────────────────────

    private String exchangeCodeForToken(String code) throws IOException, InterruptedException {
        String body = "code="          + URLEncoder.encode(code,                StandardCharsets.UTF_8)
                + "&client_id="        + URLEncoder.encode(googleClientId,      StandardCharsets.UTF_8)
                + "&client_secret="    + URLEncoder.encode(googleClientSecret,  StandardCharsets.UTF_8)
                + "&redirect_uri="     + URLEncoder.encode(googleRedirectUri,   StandardCharsets.UTF_8)
                + "&grant_type=authorization_code";

        HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create("https://oauth2.googleapis.com/token"))
                .header("Content-Type", "application/x-www-form-urlencoded")
                .POST(HttpRequest.BodyPublishers.ofString(body))
                .build();

        return HttpClient.newHttpClient()
                .send(request, HttpResponse.BodyHandlers.ofString())
                .body();
    }

    private String fetchGoogleUserInfo(String accessToken) throws IOException, InterruptedException {
        HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create("https://www.googleapis.com/oauth2/v2/userinfo"))
                .header("Authorization", "Bearer " + accessToken)
                .GET()
                .build();

        return HttpClient.newHttpClient()
                .send(request, HttpResponse.BodyHandlers.ofString())
                .body();
    }

    // ─── OTP ──────────────────────────────────────────────────────────────────

    @Transactional
    public Map<String, String> requestOTP(RequestOtpRequest req) {
        userRepository.findByEmail(req.getEmail())
                .orElseThrow(() -> ApiException.notFound("User not found"));

        otpRepository.deleteByEmail(req.getEmail());

        String code = String.valueOf((int)(Math.random() * 900000) + 100000);
        LocalDateTime expiresAt = LocalDateTime.now().plusMinutes(5);

        otpRepository.save(Otp.builder()
                .email(req.getEmail())
                .code(code)
                .expiresAt(expiresAt)
                .verified(false)
                .build());

        sendOtpEmail(req.getEmail(), code);
        return Map.of("message", "OTP sent to your email successfully");
    }

    @Transactional
    public Map<String, String> verifyOTP(VerifyOtpRequest req) {
        Otp otpRecord = otpRepository
                .findTopByEmailAndCodeAndVerifiedFalseOrderByCreatedAtDesc(req.getEmail(), req.getOtp())
                .orElseThrow(() -> ApiException.badRequest("Invalid or expired OTP"));

        if (otpRecord.getExpiresAt().isBefore(LocalDateTime.now())) {
            throw ApiException.badRequest("OTP expired");
        }

        otpRecord.setVerified(true);
        otpRepository.save(otpRecord);
        return Map.of("message", "OTP verified successfully");
    }

    @Transactional
    public Map<String, String> resetPassword(ResetPasswordRequest req) {
        Otp otpRecord = otpRepository
                .findTopByEmailAndVerifiedTrueOrderByCreatedAtDesc(req.getEmail())
                .orElseThrow(() -> ApiException.badRequest("OTP not verified"));

        if (otpRecord.getExpiresAt().isBefore(LocalDateTime.now())) {
            throw ApiException.badRequest("OTP expired");
        }

        User user = userRepository.findByEmail(req.getEmail())
                .orElseThrow(() -> ApiException.notFound("User not found"));

        user.setPasswordHash(passwordEncoder.encode(req.getNewPassword()));
        userRepository.save(user);
        otpRepository.delete(otpRecord);

        return Map.of("message", "Password reset successful");
    }

    private void sendOtpEmail(String toEmail, String code) {
        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setTo(toEmail);
            message.setSubject("Your Legal Intake OTP Code");
            message.setText(
                    "Your OTP code is: " + code + "\n\n" +
                            "This code expires in 5 minutes.\n" +
                            "If you did not request this, please ignore this email."
            );
            mailSender.send(message);
        } catch (Exception e) {
            log.error("Failed to send OTP email to {}: {}", toEmail, e.getMessage());
        }
    }
}