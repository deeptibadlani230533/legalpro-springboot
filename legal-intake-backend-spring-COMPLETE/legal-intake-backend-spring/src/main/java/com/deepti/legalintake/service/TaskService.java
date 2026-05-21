package com.deepti.legalintake.service;

import com.deepti.legalintake.dto.request.TaskRequest;
import com.deepti.legalintake.entity.Task;
import com.deepti.legalintake.exception.ApiException;
import com.deepti.legalintake.repository.MatterRepository;
import com.deepti.legalintake.repository.TaskRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;

/** replaces services/task.service.js */
@Service
@RequiredArgsConstructor
public class TaskService {

    private final TaskRepository taskRepository;
    private final MatterRepository matterRepository;

    @Transactional
    public Task createTask(TaskRequest req) {
        matterRepository.findById(req.getMatterId())
                .orElseThrow(() -> ApiException.notFound("Matter not found"));

        return taskRepository.save(Task.builder()
                .title(req.getTitle())
                .description(req.getDescription())
                .dueDate(LocalDate.parse(req.getDueDate()))
                .matterId(req.getMatterId())
                .status("pending")
                .build());
    }

    public List<Task> getAllTasks() { return taskRepository.findAll(); }

    public Task getTaskById(String id) {
        return taskRepository.findById(id)
                .orElseThrow(() -> ApiException.notFound("Task not found"));
    }

    @Transactional
    public Task updateTask(String id, TaskRequest req) {
        Task t = getTaskById(id);
        if (req.getTitle()       != null) t.setTitle(req.getTitle());
        if (req.getDescription() != null) t.setDescription(req.getDescription());
        if (req.getDueDate()     != null) t.setDueDate(LocalDate.parse(req.getDueDate()));
        return taskRepository.save(t);
    }

    @Transactional
    public void deleteTask(String id) { taskRepository.delete(getTaskById(id)); }

    @Transactional
    public Task completeTask(String id) {
        Task t = getTaskById(id);
        t.setStatus("completed");
        return taskRepository.save(t);
    }

    public Map<String, Object> getOverdueTasks() {
        List<Task> tasks = taskRepository
                .findByStatusAndDueDateBeforeOrderByDueDateAsc("pending", LocalDate.now());
        return Map.of("count", tasks.size(), "tasks", tasks);
    }

    public Map<String, Object> getUpcomingTasks() {
        List<Task> tasks = taskRepository
                .findByStatusAndDueDateBetweenOrderByDueDateAsc("pending", LocalDate.now(), LocalDate.now().plusDays(7));
        return Map.of("count", tasks.size(), "tasks", tasks);
    }

    public Map<String, Object> getTaskSummary() {
        LocalDate today = LocalDate.now();
        return Map.of(
                "pending",   taskRepository.countByStatus("pending"),
                "completed", taskRepository.countByStatus("completed"),
                "overdue",   taskRepository.countByStatusAndDueDateBefore("pending", today),
                "upcoming",  taskRepository.countByStatusAndDueDateBetween("pending", today, today.plusDays(7))
        );
    }
}