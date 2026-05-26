package com.deepti.legalintake.seeder;

import com.deepti.legalintake.entity.User;
import com.deepti.legalintake.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

/**
 * DATA SEEDER - replaces src/database/seeders/seedAdmin.js
 *
 * In Node (server.js):
 *   const seedAdmin = require("./database/seeders/seedAdmin.js");
 *   await seedAdmin();
 *
 * In Spring Boot, ApplicationRunner runs automatically AFTER the application
 * has fully started (all beans loaded, DB connected, schema validated).
 * No manual invocation needed - Spring calls run() once on startup.
 *
 * ApplicationRunner vs CommandLineRunner:
 * - ApplicationRunner receives ApplicationArguments (parsed args)
 * - CommandLineRunner receives raw String[] args
 * - For seeding, both work; ApplicationRunner is more idiomatic.
 *
 * @Component = Spring creates and manages this bean automatically.
 * The run() method fires once on startup - perfect for initial data setup.
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class DataSeeder implements ApplicationRunner {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    /**
     * Equivalent of the seedAdmin() function in your Node project.
     *
     * Logic is identical:
     * 1. Check if an admin user already exists
     * 2. If not → create one with hashed password
     * 3. If yes → skip (idempotent, safe to run on every startup)
     */
    @Override
    public void run(ApplicationArguments args) {
        seedAdminUser();
    }

    private void seedAdminUser() {
        try {
            // replaces: User.findOne({ where: { role: "admin" } })
            boolean adminExists = userRepository.findByRoleOrderByCreatedAtDesc("admin")
                    .stream()
                    .findFirst()
                    .isPresent();

            if (!adminExists) {
                // replaces: bcrypt.hash("Admin@123", 10)
                String hashedPassword = passwordEncoder.encode("Admin@123");

                // replaces: User.create({ name, email, passwordHash, role })
                User admin = userRepository.save(User.builder()
                        .name("System Admin")
                        .email("admin@legal.com")
                        .passwordHash(hashedPassword)
                        .role("admin")
                                .status("active")
                        .build());

                log.info("✅ Admin user created: {} (id={})", admin.getEmail(), admin.getId());
            } else {
                log.info("ℹ️ Admin already exists, skipping seed");
            }
        } catch (Exception e) {
            // Don't crash the app if seeding fails - same behaviour as your Node version
            log.error("❌ Error seeding admin user: {}", e.getMessage());
        }
    }
}
