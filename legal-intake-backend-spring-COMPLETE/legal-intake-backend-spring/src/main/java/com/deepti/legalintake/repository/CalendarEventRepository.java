package com.deepti.legalintake.repository;

import com.deepti.legalintake.entity.CalendarEvent;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;

@Repository
public interface CalendarEventRepository extends JpaRepository<CalendarEvent, Long> {

    // Admin: all events in date range
    List<CalendarEvent> findByDateBetweenOrderByDateAscTimeAsc(LocalDate start, LocalDate end);

    // Lawyer/Client: only their own events in date range
    List<CalendarEvent> findByUserIdAndDateBetweenOrderByDateAscTimeAsc(Long userId, LocalDate start, LocalDate end);
}