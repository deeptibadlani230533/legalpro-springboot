package com.deepti.legalintake.controller;

import com.deepti.legalintake.entity.Invoice;
import com.deepti.legalintake.service.InvoiceService;
import com.deepti.legalintake.security.SecurityUtils;
import io.swagger.v3.oas.annotations.Operation;
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
@Tag(name = "Invoices / Billing", description = "Invoice management for legal case billing")
public class InvoiceController {

    private final InvoiceService invoiceService;
    private final SecurityUtils securityUtils; // 🔥 NEW

    // ─── CLIENT INVOICES (FIXED) ─────────────────────────────

    @GetMapping("/client")
    @PreAuthorize("hasRole('client')")
    @Operation(summary = "Get invoices for logged-in client")
    public ResponseEntity<List<Invoice>> getClientInvoices() {
        Long userId = securityUtils.getCurrentUserId();
        return ResponseEntity.ok(invoiceService.getInvoicesForClient(userId));
    }

    // ─── GET ALL ─────────────────────────────────────────────

    @GetMapping
    @PreAuthorize("hasAnyRole('admin','lawyer')")
    public ResponseEntity<List<Invoice>> getAllInvoices() {
        return ResponseEntity.ok(invoiceService.getAllInvoices());
    }

    // ─── SUMMARY ─────────────────────────────────────────────

    @GetMapping("/summary")
    @PreAuthorize("hasAnyRole('admin','lawyer')")
    public ResponseEntity<Map<String, Object>> getBillingSummary() {
        return ResponseEntity.ok(invoiceService.getBillingSummary());
    }

    // ─── BY STATUS ───────────────────────────────────────────

    @GetMapping("/status/{status}")
    @PreAuthorize("hasAnyRole('admin','lawyer')")
    public ResponseEntity<List<Invoice>> getByStatus(@PathVariable String status) {
        return ResponseEntity.ok(invoiceService.getInvoicesByStatus(status));
    }

    // ─── BY CASE ─────────────────────────────────────────────

    @GetMapping("/case/{caseId}")
    @PreAuthorize("hasAnyRole('admin','lawyer','client')")
    public ResponseEntity<List<Invoice>> getInvoicesByCase(@PathVariable Long caseId) {
        return ResponseEntity.ok(invoiceService.getInvoicesByCase(caseId));
    }

    // ─── SINGLE ──────────────────────────────────────────────

    @GetMapping("/{id}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<Invoice> getInvoiceById(@PathVariable String id) {
        return ResponseEntity.ok(invoiceService.getInvoiceById(id));
    }

    // ─── CREATE ──────────────────────────────────────────────

    @PostMapping
    @PreAuthorize("hasAnyRole('admin','lawyer')")
    public ResponseEntity<Invoice> createInvoice(@RequestBody Map<String, Object> body) {
        Long caseId = Long.parseLong(body.get("caseId").toString());
        Integer amount = ((Number) body.get("amount")).intValue();
        Integer paid = body.containsKey("paid") ? ((Number) body.get("paid")).intValue() : null;
        String status = body.containsKey("status") ? (String) body.get("status") : null;
        LocalDate issuedOn = body.containsKey("issuedOn") && body.get("issuedOn") != null
                ? LocalDate.parse((String) body.get("issuedOn")) : null;
        LocalDate dueOn = body.containsKey("dueOn") && body.get("dueOn") != null
                ? LocalDate.parse((String) body.get("dueOn")) : null;
        Double hours = body.containsKey("hours")
                ? ((Number) body.get("hours")).doubleValue() : null;

        Invoice invoice = invoiceService.createInvoice(caseId, amount, paid, status, issuedOn, dueOn, hours);
        return ResponseEntity.status(HttpStatus.CREATED).body(invoice);
    }

    // ─── UPDATE ──────────────────────────────────────────────

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('admin','lawyer')")
    public ResponseEntity<Invoice> updateInvoice(@PathVariable String id,
                                                 @RequestBody Map<String, Object> updates) {
        return ResponseEntity.ok(invoiceService.updateInvoice(id, updates));
    }

    // ─── MARK PAID ───────────────────────────────────────────

    @PatchMapping("/{id}/pay")
    @PreAuthorize("hasAnyRole('admin','lawyer')")
    public ResponseEntity<Invoice> markAsPaid(@PathVariable String id) {
        return ResponseEntity.ok(invoiceService.markAsPaid(id));
    }

    // ─── DELETE ──────────────────────────────────────────────

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('admin')")
    public ResponseEntity<Map<String, String>> deleteInvoice(@PathVariable String id) {
        invoiceService.deleteInvoice(id);
        return ResponseEntity.ok(Map.of("message", "Invoice deleted successfully"));
    }
}