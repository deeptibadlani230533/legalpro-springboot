package com.deepti.legalintake.service;

import com.deepti.legalintake.dto.request.MatterRequest;
import com.deepti.legalintake.entity.Matter;
import com.deepti.legalintake.exception.ApiException;
import com.deepti.legalintake.repository.MatterRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

/** replaces services/matter.service.js */
@Service
@RequiredArgsConstructor
public class MatterService {

    private final MatterRepository matterRepository;

    @Transactional
    public Matter createMatter(MatterRequest req) {
        return matterRepository.save(Matter.builder()
                .title(req.getTitle())
                .description(req.getDescription())
                .clientName(req.getClientName())
                .assignedLawyerId(req.getAssignedLawyerId())
                .build());
    }

    public List<Matter> getAllMatters() {
        return matterRepository.findAllByOrderByCreatedAtDesc();
    }

    public Matter getMatterById(String id) {
        return matterRepository.findById(id)
                .orElseThrow(() -> ApiException.notFound("Matter not found"));
    }

    @Transactional
    public Matter updateMatter(String id, MatterRequest req) {
        Matter m = getMatterById(id);
        if (req.getTitle()            != null) m.setTitle(req.getTitle());
        if (req.getDescription()      != null) m.setDescription(req.getDescription());
        if (req.getClientName()       != null) m.setClientName(req.getClientName());
        if (req.getAssignedLawyerId() != null) m.setAssignedLawyerId(req.getAssignedLawyerId());
        return matterRepository.save(m);
    }

    @Transactional
    public void deleteMatter(String id) {
        matterRepository.delete(getMatterById(id));
    }

    @Transactional
    public Matter updateMatterStatus(String id, String newStatus) {
        Matter m = getMatterById(id);

        // State machine - replaces the transitions map in your Node service
        boolean valid = switch (m.getStatus()) {
            case "open"        -> "in_progress".equals(newStatus);
            case "in_progress" -> "closed".equals(newStatus);
            default            -> false;
        };

        if (!valid) throw ApiException.badRequest(
                "Invalid transition from " + m.getStatus() + " → " + newStatus);

        m.setStatus(newStatus);
        if ("closed".equals(newStatus)) m.setClosedAt(LocalDateTime.now());
        return matterRepository.save(m);
    }

    @Transactional
    public Map<String, Object> expireStaleMatters(int days) {
        if (days <= 0) throw ApiException.badRequest("Days must be a positive integer");
        LocalDateTime threshold = LocalDateTime.now().minusDays(days);
        int count = matterRepository.expireStaleMatters(threshold, LocalDateTime.now());
        return Map.of("updatedCount", count, "message", "Expired matters older than " + days + " days");
    }
}