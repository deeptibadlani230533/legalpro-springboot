package com.deepti.legalintake.config;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.context.event.ApplicationEnvironmentPreparedEvent;
import org.springframework.context.ApplicationListener;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.env.ConfigurableEnvironment;
import org.springframework.core.env.MapPropertySource;
import software.amazon.awssdk.regions.Region;
import software.amazon.awssdk.services.secretsmanager.SecretsManagerClient;
import software.amazon.awssdk.services.secretsmanager.model.GetSecretValueRequest;
import software.amazon.awssdk.services.secretsmanager.model.GetSecretValueResponse;

import com.fasterxml.jackson.databind.ObjectMapper;

import java.util.Arrays;
import java.util.HashMap;
import java.util.Map;

/**
 * AWS SECRETS MANAGER CONFIG - replaces utils/secretsManager.js
 *
 * In Node (server.js):
 *   if (process.env.NODE_ENV === "production") {
 *     const secrets = await loadSecrets();
 *     process.env.JWT_SECRET = secrets.JWT_SECRET;
 *     process.env.DB_PASS = secrets.DB_PASS;
 *     ...
 *   }
 *
 * In Spring Boot, we implement ApplicationListener<ApplicationEnvironmentPreparedEvent>.
 * This fires BEFORE the app fully starts - the same early timing you need to inject
 * DB passwords before the connection pool is created.
 *
 * The loaded secrets are added as a PropertySource with high priority, which means
 * they OVERRIDE the application.properties ${DB_PASS} values.
 *
 * HOW TO ACTIVATE: set the "production" Spring profile:
 *   - On EC2: pass --spring.profiles.active=production as a JVM argument
 *   - Or set SPRING_PROFILES_ACTIVE=production environment variable
 *   - This is the equivalent of NODE_ENV=production
 *
 * If not in production profile → this class does nothing (same as your Node if-check).
 */
@Configuration
@Slf4j
public class AwsSecretsConfig implements ApplicationListener<ApplicationEnvironmentPreparedEvent> {

    private static final String SECRET_NAME = "legal-intake-secrets";
    private static final String AWS_REGION   = "ap-south-1";  // same as your secretsManager.js

    @Override
    public void onApplicationEvent(ApplicationEnvironmentPreparedEvent event) {
        ConfigurableEnvironment env = event.getEnvironment();

        // Only run in production profile (replaces: if (process.env.NODE_ENV === "production"))
        String[] activeProfiles = env.getActiveProfiles();
        boolean isProduction = Arrays.asList(activeProfiles).contains("production");

        if (!isProduction) {
            log.debug("Not in production profile — skipping AWS Secrets Manager");
            return;
        }

        log.info("Loading secrets from AWS Secrets Manager: {}", SECRET_NAME);

        try {
            // replaces: new SecretsManagerClient({ region: "ap-south-1" })
            SecretsManagerClient client = SecretsManagerClient.builder()
                    .region(Region.of(AWS_REGION))
                    .build();

            // replaces: client.send(new GetSecretValueCommand({ SecretId: "legal-intake-secrets" }))
            GetSecretValueResponse response = client.getSecretValue(
                    GetSecretValueRequest.builder()
                            .secretId(SECRET_NAME)
                            .build()
            );

            // replaces: JSON.parse(response.SecretString)
            ObjectMapper mapper = new ObjectMapper();
            @SuppressWarnings("unchecked")
            Map<String, Object> secrets = mapper.readValue(response.secretString(), Map.class);

            // Map AWS secret keys → Spring property keys
            // replaces: process.env.JWT_SECRET = secrets.JWT_SECRET etc.
            Map<String, Object> springProperties = new HashMap<>();
            if (secrets.containsKey("JWT_SECRET"))          springProperties.put("jwt.secret",              secrets.get("JWT_SECRET"));
            if (secrets.containsKey("DB_PASS"))             springProperties.put("spring.datasource.password", secrets.get("DB_PASS"));
            if (secrets.containsKey("POSTGRES_PASSWORD"))   springProperties.put("spring.datasource.password", secrets.get("POSTGRES_PASSWORD"));
            if (secrets.containsKey("EMAIL_USER"))          springProperties.put("spring.mail.username",     secrets.get("EMAIL_USER"));
            if (secrets.containsKey("EMAIL_PASS"))          springProperties.put("spring.mail.password",     secrets.get("EMAIL_PASS"));
            if (secrets.containsKey("GEMINI_API_KEY"))      springProperties.put("gemini.api.key",           secrets.get("GEMINI_API_KEY"));

            // Add as highest-priority property source (overrides application.properties)
            env.getPropertySources().addFirst(
                    new MapPropertySource("awsSecrets", springProperties)
            );

            log.info("✅ AWS Secrets loaded successfully ({} properties)", springProperties.size());

        } catch (Exception e) {
            log.error("❌ Failed to load AWS Secrets: {}", e.getMessage());
            // In production this should probably re-throw; for dev safety we just log
            throw new RuntimeException("Failed to load AWS secrets in production mode", e);
        }
    }
}
