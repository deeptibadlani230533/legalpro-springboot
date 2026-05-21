package com.deepti.legalintake.repository;

import com.deepti.legalintake.entity.Task;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;

@Repository
public interface TaskRepository extends JpaRepository<Task, String> {

    // replaces: Task.findAll({ where: { status:"pending", dueDate:{ [Op.lt]: today } } })
    List<Task> findByStatusAndDueDateBeforeOrderByDueDateAsc(String status, LocalDate date);

    // replaces: Task.findAll({ where: { status:"pending", dueDate:{ [Op.between]: [today, nextWeek] } } })
    List<Task> findByStatusAndDueDateBetweenOrderByDueDateAsc(String status, LocalDate from, LocalDate to);

    long countByStatus(String status);

    long countByStatusAndDueDateBefore(String status, LocalDate date);

    long countByStatusAndDueDateBetween(String status, LocalDate from, LocalDate to);
}