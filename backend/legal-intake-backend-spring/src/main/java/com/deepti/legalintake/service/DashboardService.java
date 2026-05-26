package com.deepti.legalintake.service;

import com.deepti.legalintake.repository.CaseRepository;
import com.deepti.legalintake.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import java.util.Map;

/** replaces services/dashboard.service.js */
@Service
@RequiredArgsConstructor
public class DashboardService {

    private final CaseRepository caseRepository;
    private final UserRepository userRepository;

    public Map<String, Object> getStats() {
        long totalCases    = caseRepository.count();
        long pendingIntake = caseRepository.countByStatus("open");
        long activeLawyers = userRepository.countByRole("lawyer");

        return Map.of(
                "totalCases",    totalCases,
                "pendingIntake", pendingIntake,
                "activeLawyers", activeLawyers
        );
    }
}