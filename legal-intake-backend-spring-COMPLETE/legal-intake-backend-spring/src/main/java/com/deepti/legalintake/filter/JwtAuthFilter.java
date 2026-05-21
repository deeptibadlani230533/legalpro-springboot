package com.deepti.legalintake.filter;

import com.deepti.legalintake.security.JwtUtil;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.List;

/**
 * JWT AUTHENTICATION FILTER - replaces middleware/authMiddleware.js
 *
 * In Node (Fastify) you had:
 *   async function authenticate(request, reply) {
 *     const decoded = await request.jwtVerify();
 *     request.user = decoded;
 *   }
 *   // Then on each route: preHandler: [authenticate]
 *
 * In Spring Boot, a Filter runs automatically on EVERY request.
 * No need to add it to each route - SecurityConfig.filterChain() wires it in once.
 *
 * OncePerRequestFilter = Spring guarantees this filter runs exactly once per request
 * (some filters can run multiple times in complex dispatch scenarios - this prevents that).
 *
 * How it works:
 * 1. Extract "Bearer <token>" from the Authorization header
 * 2. Validate the JWT using JwtUtil
 * 3. Extract userId and role from the token
 * 4. Create a Spring Authentication object and put it in SecurityContextHolder
 * 5. From here, Spring Security knows who the user is for this request
 *    - Controllers can call SecurityUtils.getCurrentUserId() to get the user's ID
 *    - @PreAuthorize("hasRole('admin')") works because the role is in SecurityContext
 *
 * This replaces: request.user = decoded in your Node middleware
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class JwtAuthFilter extends OncePerRequestFilter {

    private final JwtUtil jwtUtil;

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain filterChain)
            throws ServletException, IOException {

        // Step 1: Extract token from Authorization header
        // Header format: "Authorization: Bearer eyJhbGci..."
        // replaces: const decoded = await request.jwtVerify() (which also reads Authorization header)
        String token = extractToken(request);

        if (token != null && jwtUtil.isTokenValid(token)) {

            // Step 2: Extract user details from token
            // replaces: request.user = decoded  (decoded.id and decoded.role)
            Long userId = jwtUtil.extractUserId(token);
            String role  = jwtUtil.extractRole(token);

            // Step 3: Create Spring Authentication object
            // SimpleGrantedAuthority = a role/permission object
            // Spring Security expects roles prefixed with "ROLE_" when using hasRole()
            // So "admin" → "ROLE_admin", then @PreAuthorize("hasRole('admin')") works
            List<SimpleGrantedAuthority> authorities = List.of(
                    new SimpleGrantedAuthority("ROLE_" + role)
            );

            // UsernamePasswordAuthenticationToken = Spring's standard authentication holder
            // - principal (1st arg) = the "name" of the user, we store userId as String
            // - credentials (2nd arg) = null (we don't need the password after authentication)
            // - authorities (3rd arg) = list of roles/permissions
            UsernamePasswordAuthenticationToken authentication =
                    new UsernamePasswordAuthenticationToken(
                            String.valueOf(userId),  // SecurityUtils.getCurrentUserId() reads this
                            null,
                            authorities
                    );

            // Step 4: Store in SecurityContextHolder
            // This is how Spring knows who the current user is for this request.
            // It's thread-local, so each request has its own context.
            // replaces: request.user = decoded (Fastify stores it on the request object;
            //           Spring stores it in a thread-local context)
            SecurityContextHolder.getContext().setAuthentication(authentication);

            log.debug("JWT authenticated: userId={}, role={}", userId, role);
        }

        // Step 5: Continue with the next filter/handler in the chain
        // If no valid token was found, SecurityContextHolder has no authentication,
        // and Spring Security will return 401 for protected routes.
        filterChain.doFilter(request, response);
    }

    /**
     * Extract the JWT string from the Authorization header.
     * Header format: "Bearer eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIx..."
     * We strip the "Bearer " prefix to get just the token.
     *
     * replaces: the built-in @fastify/jwt header parsing
     */
    private String extractToken(HttpServletRequest request) {
        String bearerToken = request.getHeader("Authorization");
        if (StringUtils.hasText(bearerToken) && bearerToken.startsWith("Bearer ")) {
            return bearerToken.substring(7);  // remove "Bearer " (7 characters)
        }
        return null;
    }
}
