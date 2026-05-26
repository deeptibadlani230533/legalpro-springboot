package com.deepti.legalintake.config;

import com.deepti.legalintake.filter.JwtAuthFilter;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.List;

/**
 * SECURITY CONFIGURATION - replaces:
 *   - app.register(cors, { origin: true, methods: [...] }) in app.js
 *   - app.register(require("./plugins/jwt")) in app.js
 *   - preHandler: [authenticate, allowRoles(...)] on each route
 *
 * @Configuration = this class provides Spring Beans (methods annotated with @Bean)
 * @EnableWebSecurity = activates Spring Security for this application
 * @EnableMethodSecurity = enables @PreAuthorize annotations on controller methods
 *   This replaces your allowRoles("admin", "lawyer") pattern - instead you write
 *   @PreAuthorize("hasRole('admin') or hasRole('lawyer')") on the controller method.
 *
 * Think of this file as the master configuration for everything security-related.
 * It's the most important config file in the project.
 */
@Configuration
@EnableWebSecurity
@EnableMethodSecurity
@RequiredArgsConstructor
public class SecurityConfig {

    private final JwtAuthFilter jwtAuthFilter;

    /**
     * PASSWORD ENCODER - replaces bcrypt.hash() and bcrypt.compare()
     *
     * In Node: const passwordHash = await bcrypt.hash(password, 10);
     * In Java: passwordEncoder.encode(password)  → same bcrypt hash
     *
     * In Node: const match = await bcrypt.compare(password, foundUser.passwordHash);
     * In Java: passwordEncoder.matches(rawPassword, storedHash) → same comparison
     *
     * BCryptPasswordEncoder(10) = bcrypt with cost factor 10 (same as your "10" in Node)
     *
     * @Bean = Spring creates this once and makes it available for injection everywhere.
     * We inject it in AuthService to hash/verify passwords.
     */
    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder(10);
    }

    /**
     * AUTHENTICATION MANAGER
     * Used by AuthService to authenticate login requests.
     * Spring Boot auto-configures this based on your setup; we just expose it as a bean.
     */
    @Bean
    public AuthenticationManager authenticationManager(AuthenticationConfiguration config)
            throws Exception {
        return config.getAuthenticationManager();
    }

    /**
     * CORS CONFIGURATION - replaces app.register(cors, { origin: true, methods: [...] })
     *
     * In Node Fastify: origin: true = allow all origins
     * Here: we also allow all origins (fine for development/this project's EC2 setup)
     *
     * allowedOriginPatterns("*") = allow any origin (same as origin: true in Fastify)
     * allowedMethods = same list as your Node config
     * allowedHeaders = same as your allowedHeaders: ["Content-Type", "Authorization"]
     * allowCredentials = allow cookies/auth headers to be sent cross-origin
     */
    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration config = new CorsConfiguration();
        config.setAllowedOriginPatterns(List.of("*"));   // allow all origins
        config.setAllowedMethods(List.of("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"));
        config.setAllowedHeaders(List.of("Content-Type", "Authorization", "Accept"));
        config.setExposedHeaders(List.of("Authorization", "Content-Type", "Cache-Control", "X-Accel-Buffering")); // expose JWT header in responses
        config.setAllowCredentials(true);
        config.setMaxAge(3600L);  // cache preflight response for 1 hour

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", config);  // apply to ALL routes
        return source;
    }

    /**
     * SECURITY FILTER CHAIN - the heart of Spring Security
     *
     * This defines which routes are public (no auth needed) vs protected,
     * and wires up our JWT filter into the processing pipeline.
     *
     * The order matters: our JwtAuthFilter runs BEFORE Spring's built-in
     * UsernamePasswordAuthenticationFilter, setting the user in SecurityContextHolder
     * so Spring Security can then enforce access rules.
     */
    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
                // Disable CSRF - we use JWT (stateless), not sessions/cookies.
                // CSRF protection is only needed for browser session-based auth.
                .csrf(AbstractHttpConfigurer::disable)

                // Apply our CORS config (defined above)
                .cors(cors -> cors.configurationSource(corsConfigurationSource()))

                // STATELESS session - Spring should NOT create HTTP sessions.
                // This is correct for JWT-based auth. Every request must carry its own JWT.
                .sessionManagement(session ->
                        session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))

                // ROUTE-LEVEL ACCESS RULES
                // These are the "public" routes - equivalent of NOT adding preHandler: [authenticate]
                .authorizeHttpRequests(auth -> auth
                        // Health check - public (same as your GET /health route)
                        .requestMatchers("/health").permitAll()

                        // Auth routes - public (no token needed to login/signup)
                        // Equivalent of: app.register(authRoutes, { prefix: "/api/auth" }) without preHandler
                        .requestMatchers("/api/auth/**").permitAll()

                        // Swagger UI - public (so interviewers can see your API docs)
                        .requestMatchers("/swagger-ui.html", "/swagger-ui/**", "/api-docs/**").permitAll()

                        // SSE endpoint - public access at URL level, token sent as query param
                        .requestMatchers("/api/notifications/stream").permitAll()

                        // OPTIONS preflight requests (CORS) - always allow
                        .requestMatchers(HttpMethod.OPTIONS, "/**").permitAll()

                        // Everything else requires authentication
                        // Individual role checks are done with @PreAuthorize on controller methods
                        .anyRequest().authenticated()
                )

                // Wire in our custom JWT filter
                // It runs BEFORE Spring's default auth filter
                // This is how Spring "learns" who the user is from the JWT on each request
                .addFilterBefore(jwtAuthFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }
}