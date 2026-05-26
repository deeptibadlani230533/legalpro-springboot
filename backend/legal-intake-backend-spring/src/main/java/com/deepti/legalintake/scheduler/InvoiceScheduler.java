package com.deepti.legalintake.scheduler;

import com.deepti.legalintake.entity.Invoice;
import com.deepti.legalintake.entity.User;
import com.deepti.legalintake.repository.InvoiceRepository;
import com.deepti.legalintake.repository.UserRepository;
import com.deepti.legalintake.service.WhatsAppService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.List;

/**
 * INVOICE SCHEDULER
 * ─────────────────────────────────────────────────────────────────────────────
 * Runs daily to find overdue invoices and send WhatsApp reminders to clients.
 *
 * Also enable scheduling in your main class:
 *   @SpringBootApplication
 *   @EnableScheduling          ← ADD THIS
 *   public class LegalIntakeApplication { ... }
 * ─────────────────────────────────────────────────────────────────────────────
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class InvoiceScheduler {

    private final InvoiceRepository invoiceRepository;
    private final UserRepository    userRepository;
    private final WhatsAppService   whatsApp;

    private static final DateTimeFormatter DISPLAY = DateTimeFormatter.ofPattern("dd MMM yyyy");

    /**
     * Runs every day at 9:00 AM.
     * Finds all invoices where:
     *   - status is "pending" or "partial"
     *   - dueOn is before today
     * Sends a WhatsApp overdue reminder to the client and marks them "overdue".
     */
    @Scheduled(cron = "0 0 9 * * *")   // 9 AM every day
    public void checkOverdueInvoices() {
        log.info("⏰ InvoiceScheduler: checking overdue invoices...");

        List<Invoice> overdueInvoices = invoiceRepository
                .findByStatusInAndDueOnBefore(
                        List.of("pending", "partial"),
                        LocalDate.now()
                );

        log.info("Found {} overdue invoice(s)", overdueInvoices.size());

        for (Invoice inv : overdueInvoices) {
            try {
                // Update status to overdue
                inv.setStatus("overdue");
                invoiceRepository.save(inv);

                // Get client's phone from their User record via the case
                if (inv.getCaseEntity() == null) continue;

                Long clientUserId = inv.getCaseEntity().getUserId();
                userRepository.findById(clientUserId).ifPresent(client -> {
                    String phone = client.getPhone();   // make sure User entity has phone field
                    String name  = client.getName();

                    long outstanding = (inv.getAmount() == null ? 0 : inv.getAmount())
                            - (inv.getPaid()   == null ? 0 : inv.getPaid());

                    String invoiceRef = "INV-" + inv.getId().substring(
                            Math.max(0, inv.getId().length() - 8)).toUpperCase();

                    String dueDate = inv.getDueOn() != null
                            ? inv.getDueOn().format(DISPLAY) : "—";

                    whatsApp.sendOverdueReminder(phone, name, invoiceRef, outstanding, dueDate);
                });

            } catch (Exception e) {
                log.error("❌ Failed processing overdue invoice {}: {}", inv.getId(), e.getMessage());
            }
        }
    }
}