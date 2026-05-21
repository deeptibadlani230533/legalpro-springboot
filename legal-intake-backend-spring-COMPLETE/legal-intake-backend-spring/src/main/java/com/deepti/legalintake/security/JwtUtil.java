package com.deepti.legalintake.security;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import jakarta.annotation.PostConstruct;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.util.Date;

/**
 * JWT UTILITY - replaces src/plugins/jwt.js
 *
 * In Node (Fastify) you had:
 *   fastify.register(require("@fastify/jwt"), { secret: process.env.JWT_SECRET });
 *   const token = await reply.jwtSign({ id: user.id, role: user.role }, { expiresIn: "1d" });
 *   const decoded = await request.jwtVerify();
 *
 * In Spring Boot, JWT is not built into the framework - we use the jjwt library manually.
 * This class wraps all JWT operations in one place.
 *
 * @Component marks this as a Spring Bean - meaning Spring creates ONE instance of this
 * class and manages it. You can then @Autowired inject it anywhere you need it.
 *
 * @Value("${jwt.secret}") reads the value from application.properties.
 * It's the Java equivalent of process.env.JWT_SECRET.
 *
 * @Slf4j generates a `log` field (Lombok).
 */
@Component
@Slf4j
public class JwtUtil {

    // @Value injects from application.properties: jwt.secret=...
    @Value("${jwt.secret}")
    private String jwtSecret;

    // @Value injects from application.properties: jwt.expiration=86400000
    @Value("${jwt.expiration}")
    private long jwtExpiration;

    // The actual HMAC signing key, created from the secret string
    private SecretKey signingKey;

    /**
     * @PostConstruct runs ONCE after Spring injects all @Value fields.
     * This is the right place to initialize things that depend on injected values.
     * (You can't do this in the constructor because @Value hasn't been injected yet.)
     */
    @PostConstruct
    public void init() {
        // Keys.hmacShaKeyFor creates a secure HMAC-SHA key from your secret string.
        // Uses SHA-256 which produces 256-bit tokens - same security level as @fastify/jwt default.
        this.signingKey = Keys.hmacShaKeyFor(jwtSecret.getBytes(StandardCharsets.UTF_8));
    }

    /**
     * GENERATE TOKEN - replaces: reply.jwtSign({ id, role }, { expiresIn: "1d" })
     *
     * @param userId the user's database ID
     * @param role   "admin", "lawyer", or "client"
     * @return signed JWT string like "eyJhbGciOiJIUzI1NiJ9..."
     */
    public String generateToken(Long userId, String role) {
        return Jwts.builder()
                .subject(String.valueOf(userId))   // "sub" claim = user ID
                .claim("role", role)               // custom "role" claim (same as your Node token)
                .issuedAt(new Date())              // "iat" claim
                .expiration(new Date(System.currentTimeMillis() + jwtExpiration))  // "exp" claim
                .signWith(signingKey)              // signs with HMAC-SHA256
                .compact();                        // produces the final token string
    }

    /**
     * EXTRACT ALL CLAIMS - equivalent of request.jwtVerify() returning the decoded payload
     * Claims = the payload of the JWT (the { id, role } object you put in at sign time)
     *
     * @throws JwtException if token is expired, tampered with, or invalid
     */
    public Claims extractAllClaims(String token) {
        return Jwts.parser()
                .verifyWith(signingKey)   // verify signature
                .build()
                .parseSignedClaims(token)
                .getPayload();
    }

    /**
     * Extract just the user ID from the token
     * In your Node code: request.user.id came from decoded.id
     * Here: claims.getSubject() returns the "sub" claim we set as userId
     */
    public Long extractUserId(String token) {
        return Long.parseLong(extractAllClaims(token).getSubject());
    }

    /**
     * Extract the role from the token
     * In your Node code: request.user.role came from decoded.role
     */
    public String extractRole(String token) {
        return extractAllClaims(token).get("role", String.class);
    }

    /**
     * Check if token is expired
     */
    public boolean isTokenExpired(String token) {
        try {
            return extractAllClaims(token).getExpiration().before(new Date());
        } catch (JwtException e) {
            return true;
        }
    }

    /**
     * Validate token - returns true only if token is properly signed AND not expired
     */
    public boolean isTokenValid(String token) {
        try {
            extractAllClaims(token);  // throws if invalid or expired
            return true;
        } catch (JwtException e) {
            log.warn("Invalid JWT: {}", e.getMessage());
            return false;
        }
    }
}