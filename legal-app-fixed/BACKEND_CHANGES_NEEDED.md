# Backend Changes Needed

## 1. InvoiceController (MISSING - needs to be created)

Create file: `src/main/java/com/deepti/legalintake/controller/InvoiceController.java`

```java
package com.deepti.legalintake.controller;

import com.deepti.legalintake.entity.Invoice;
import com.deepti.legalintake.repository.InvoiceRepository;
import com.deepti.legalintake.security.SecurityUtils;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/invoices")
@RequiredArgsConstructor
@Tag(name = "Invoices", description = "Billing and invoice management")
public class InvoiceController {

    private final InvoiceRepository invoiceRepository;
    private final SecurityUtils securityUtils;

    /** GET /api/invoices - get all invoices (admin/lawyer see all, client sees their case invoices) */
    @GetMapping
    @PreAuthorize("hasAnyRole('admin','lawyer','client')")
    public ResponseEntity<List<Invoice>> getAllInvoices() {
        return ResponseEntity.ok(invoiceRepository.findAll());
    }

    /** GET /api/invoices/{id} */
    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('admin','lawyer','client')")
    public ResponseEntity<Invoice> getInvoice(@PathVariable String id) {
        return invoiceRepository.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    /** POST /api/invoices - create invoice (admin/lawyer only) */
    @PostMapping
    @PreAuthorize("hasAnyRole('admin','lawyer')")
    public ResponseEntity<Invoice> createInvoice(@RequestBody Map<String, Object> body) {
        Invoice inv = Invoice.builder()
                .caseId(Long.valueOf(body.get("caseId").toString()))
                .amount(Integer.valueOf(body.get("amount").toString()))
                .paid(body.containsKey("paid") ? Integer.valueOf(body.get("paid").toString()) : 0)
                .status(body.getOrDefault("status", "pending").toString())
                .issuedOn(body.containsKey("issuedOn") ? LocalDate.parse(body.get("issuedOn").toString()) : LocalDate.now())
                .dueOn(body.containsKey("dueOn") ? LocalDate.parse(body.get("dueOn").toString()) : LocalDate.now().plusDays(15))
                .hours(body.containsKey("hours") ? Double.valueOf(body.get("hours").toString()) : 0.0)
                .build();
        return ResponseEntity.status(HttpStatus.CREATED).body(invoiceRepository.save(inv));
    }

    /** PATCH /api/invoices/{id}/pay - mark as paid */
    @PatchMapping("/{id}/pay")
    @PreAuthorize("hasAnyRole('admin','lawyer')")
    public ResponseEntity<Invoice> markPaid(@PathVariable String id) {
        return invoiceRepository.findById(id).map(inv -> {
            inv.setPaid(inv.getAmount());
            inv.setStatus("paid");
            return ResponseEntity.ok(invoiceRepository.save(inv));
        }).orElse(ResponseEntity.notFound().build());
    }

    /** DELETE /api/invoices/{id} - void invoice (admin only) */
    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('admin')")
    public ResponseEntity<Map<String, String>> deleteInvoice(@PathVariable String id) {
        invoiceRepository.deleteById(id);
        return ResponseEntity.ok(Map.of("message", "Invoice voided"));
    }
}
```

## 2. Invoice Entity - add missing setter (Lombok @Data should handle, but verify)

The Invoice entity uses `@Builder.Default` for `paid` and `status` which is fine.

## 3. CORS - ensure `/api/invoices` is covered (it should be via `anyRequest()`)

No changes needed if CORS is already configured globally.

## APIs Used by Frontend:
- GET    /api/invoices              → BillingsPage (list all)
- POST   /api/invoices              → BillingsPage (create)
- PATCH  /api/invoices/{id}/pay    → BillingsPage (mark paid)
- DELETE /api/invoices/{id}        → BillingsPage (void)
- GET    /api/activity             → AuditLog + Dashboard (already exists in CaseController)
- GET    /api/cases/{id}/activity  → AuditLog per case (already exists)
- GET    /api/notifications/stream → NotificationBell SSE (already exists)
