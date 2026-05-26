package com.deepti.legalintake.controller;

import com.deepti.legalintake.dto.request.TaskRequest;
import com.deepti.legalintake.entity.Task;
import com.deepti.legalintake.service.TaskService;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import java.util.Map;

/** replaces task.controller.js + taskRoutes.js */
@RestController
@RequestMapping("/api/tasks")
@RequiredArgsConstructor
@Tag(name = "Tasks")
public class TaskController {

    private final TaskService taskService;

    @PostMapping
    @PreAuthorize("hasAnyRole('lawyer','admin')")
    public ResponseEntity<Map<String, Object>> createTask(@Valid @RequestBody TaskRequest req) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(Map.of("message", "Task created successfully", "task", taskService.createTask(req)));
    }

    @GetMapping
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<?> getAllTasks() { return ResponseEntity.ok(taskService.getAllTasks()); }

    @GetMapping("/overdue")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<?> getOverdueTasks() { return ResponseEntity.ok(taskService.getOverdueTasks()); }

    @GetMapping("/upcoming")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<?> getUpcomingTasks() { return ResponseEntity.ok(taskService.getUpcomingTasks()); }

    @GetMapping("/summary")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<?> getTaskSummary() { return ResponseEntity.ok(taskService.getTaskSummary()); }

    @GetMapping("/{id}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<Task> getTaskById(@PathVariable String id) {
        return ResponseEntity.ok(taskService.getTaskById(id));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('lawyer','admin')")
    public ResponseEntity<Map<String, Object>> updateTask(@PathVariable String id,
                                                          @RequestBody TaskRequest req) {
        return ResponseEntity.ok(Map.of("message", "Task updated", "task", taskService.updateTask(id, req)));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('admin')")
    public ResponseEntity<Map<String, String>> deleteTask(@PathVariable String id) {
        taskService.deleteTask(id);
        return ResponseEntity.ok(Map.of("message", "Task deleted successfully"));
    }

    @PatchMapping("/{id}/complete")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<Map<String, Object>> completeTask(@PathVariable String id) {
        return ResponseEntity.ok(Map.of("message", "Task marked as completed", "task", taskService.completeTask(id)));
    }
}