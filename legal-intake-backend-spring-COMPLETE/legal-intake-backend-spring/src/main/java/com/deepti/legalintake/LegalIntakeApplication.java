package com.deepti.legalintake;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableAsync;
import org.springframework.scheduling.annotation.EnableScheduling;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@SpringBootApplication
@EnableAsync
@EnableScheduling
@RestController
public class LegalIntakeApplication {

	public static void main(String[] args) {
		SpringApplication.run(LegalIntakeApplication.class, args);
	}

	@GetMapping("/health")
	public Map<String, String> health() {
		return Map.of("status", "OK", "message", "Backend Running");
	}
}