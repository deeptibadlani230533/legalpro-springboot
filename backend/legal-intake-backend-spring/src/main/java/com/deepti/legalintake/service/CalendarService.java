package com.deepti.legalintake.service;

import com.deepti.legalintake.dto.request.CalendarEventRequest;
import com.deepti.legalintake.entity.CalendarEvent;
import com.deepti.legalintake.exception.ApiException;
import com.deepti.legalintake.repository.CalendarEventRepository;
import com.deepti.legalintake.repository.CaseRepository;
import com.deepti.legalintake.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.YearMonth;
import java.time.format.DateTimeFormatter;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class CalendarService {

    private final CalendarEventRepository calendarEventRepository;
    private final CaseRepository          caseRepository;
    private final UserRepository          userRepository;   // ← NEW
    private final WhatsAppService         whatsApp;         // ← NEW

    private static final DateTimeFormatter DISPLAY = DateTimeFormatter.ofPattern("dd MMM yyyy");

    @Transactional
    public CalendarEvent createEvent(CalendarEventRequest req, Long userId) {
        if (req.getCaseId() != null) {
            caseRepository.findById(req.getCaseId())
                    .orElseThrow(() -> ApiException.notFound("Linked case not found"));
        }

        CalendarEvent saved = calendarEventRepository.save(CalendarEvent.builder()
                .title(req.getTitle())
                .type(req.getType() != null ? req.getType() : "reminder")
                .date(LocalDate.parse(req.getDate()))
                .time(req.getTime())
                .notes(req.getNotes())
                .caseId(req.getCaseId())
                .userId(userId)
                .build());

        // ✅ WhatsApp: send hearing/deadline notification when event is created
        // Only send for hearing or deadline type events — skip plain reminders
        try {
            String type = saved.getType() != null ? saved.getType().toLowerCase() : "";

            if (type.equals("hearing") || type.equals("deadline")) {
                String dateStr = saved.getDate().format(DISPLAY);
                String timeStr = saved.getTime() != null ? saved.getTime() : "As scheduled";

                if (type.equals("hearing") && req.getCaseId() != null) {
                    // Hearing — notify the event creator + assigned lawyer if case is linked
                    caseRepository.findById(req.getCaseId()).ifPresent(caseEntity -> {
                        // Notify client (event creator)
                        userRepository.findById(userId).ifPresent(creator ->
                                whatsApp.sendHearingScheduled(
                                        creator.getPhone(), creator.getName(),
                                        caseEntity.getCaseTitle(),
                                        dateStr, timeStr,
                                        req.getNotes() != null ? req.getNotes() : "As notified",
                                        null, null   // lawyer notified separately below
                                )
                        );

                        // Notify assigned lawyer if one exists
                        if (caseEntity.getAssignedLawyerId() != null) {
                            userRepository.findById(caseEntity.getAssignedLawyerId()).ifPresent(lawyer ->
                                    userRepository.findById(userId).ifPresent(creator ->
                                            whatsApp.sendHearingScheduled(
                                                    null, null,   // client already notified above
                                                    caseEntity.getCaseTitle(),
                                                    dateStr, timeStr,
                                                    req.getNotes() != null ? req.getNotes() : "As notified",
                                                    lawyer.getPhone(), lawyer.getName()
                                            )
                                    )
                            );
                        }
                    });

                } else {
                    // Deadline or hearing without a case — just notify the creator
                    userRepository.findById(userId).ifPresent(creator ->
                            whatsApp.sendDeadlineReminder(
                                    creator.getPhone(),
                                    creator.getName(),
                                    saved.getTitle(),
                                    saved.getType(),
                                    dateStr
                            )
                    );
                }
            }
        } catch (Exception e) {
            log.warn("WhatsApp skipped for createEvent: {}", e.getMessage());
        }

        return saved;
    }

    public List<CalendarEvent> getEvents(Long userId, String role, int month, int year) {
        YearMonth ym    = YearMonth.of(year, month);
        LocalDate start = ym.atDay(1);
        LocalDate end   = ym.atEndOfMonth();

        return "admin".equals(role)
                ? calendarEventRepository.findByDateBetweenOrderByDateAscTimeAsc(start, end)
                : calendarEventRepository.findByUserIdAndDateBetweenOrderByDateAscTimeAsc(userId, start, end);
    }

    public CalendarEvent getEventById(Long id, Long userId, String role) {
        CalendarEvent e = calendarEventRepository.findById(id)
                .orElseThrow(() -> ApiException.notFound("Event not found"));

        if (!"admin".equals(role) && !e.getUserId().equals(userId))
            throw ApiException.forbidden("Forbidden");

        return e;
    }

    @Transactional
    public CalendarEvent updateEvent(Long id, CalendarEventRequest req, Long userId, String role) {
        CalendarEvent e = getEventById(id, userId, role);
        if (req.getTitle() != null) e.setTitle(req.getTitle());
        if (req.getDate()  != null) e.setDate(LocalDate.parse(req.getDate()));
        if (req.getTime()  != null) e.setTime(req.getTime());
        if (req.getNotes() != null) e.setNotes(req.getNotes());
        if (req.getType()  != null) e.setType(req.getType());
        return calendarEventRepository.save(e);
    }

    @Transactional
    public void deleteEvent(Long id, Long userId, String role) {
        calendarEventRepository.delete(getEventById(id, userId, role));
    }
}