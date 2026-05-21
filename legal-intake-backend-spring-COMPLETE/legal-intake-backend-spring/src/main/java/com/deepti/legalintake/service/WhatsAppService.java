package com.deepti.legalintake.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import com.twilio.Twilio;
import com.twilio.rest.api.v2010.account.Message;
import com.twilio.type.PhoneNumber;

import jakarta.annotation.PostConstruct;

/**
 * WHATSAPP SERVICE
 * ─────────────────────────────────────────────────────────────────────────────
 * Sends WhatsApp notifications via Twilio Sandbox.
 *
 * Covers 3 modules:
 *   1. PAYMENTS  — invoice created, payment received, payment failed, overdue
 *   2. CASES     — case received, lawyer assigned, case accepted, case closed
 *   3. HEARINGS  — hearing scheduled, 24-hour reminder
 *
 * HOW TO USE in other services:
 *   @Autowired WhatsAppService whatsApp;
 *   whatsApp.sendInvoiceCreated(phone, clientName, caseTitle, amount, dueDate);
 *
 * PHONE FORMAT: always pass numbers with country code, no spaces/dashes
 *   e.g.  "919876543210"  for Indian number +91 98765 43210
 * ─────────────────────────────────────────────────────────────────────────────
 */
@Service
@Slf4j
public class WhatsAppService {

    @Value("${twilio.account.sid}")
    private String accountSid;

    @Value("${twilio.auth.token}")
    private String authToken;

    @Value("${twilio.whatsapp.from}")
    private String fromNumber;   // "whatsapp:+14155238886"

    // Initialize Twilio SDK once on startup
    @PostConstruct
    public void init() {
        Twilio.init(accountSid, authToken);
        log.info("✅ Twilio WhatsApp service initialized. From: {}", fromNumber);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // CORE SENDER  (all public methods delegate here)
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * Core send method — all other methods call this.
     * If the phone is blank or Twilio throws, we log and continue (never crash the main flow).
     *
     * @param toPhone  raw phone digits with country code, e.g. "919876543210"
     * @param body     message text (plain — Twilio sandbox doesn't support templates yet)
     */
    public void send(String toPhone, String body) {
        if (toPhone == null || toPhone.isBlank()) {
            log.warn("WhatsApp: skipped — phone number is empty");
            return;
        }

        // Normalize: strip leading + or spaces, prefix whatsapp:
        String normalized = "whatsapp:+" + toPhone.replaceAll("[^0-9]", "");

        try {
            Message message = Message.creator(
                    new PhoneNumber(normalized),
                    new PhoneNumber(fromNumber),
                    body
            ).create();

            log.info("✅ WhatsApp sent → {} | SID: {}", normalized, message.getSid());
        } catch (Exception e) {
            // Never let a WhatsApp failure break the main business logic
            log.error("❌ WhatsApp failed → {} | Reason: {}", normalized, e.getMessage());
        }
    }

    // ═════════════════════════════════════════════════════════════════════════
    // MODULE 1 — PAYMENTS
    // ═════════════════════════════════════════════════════════════════════════

    /**
     * Sent to CLIENT when admin/lawyer creates a new invoice for their case.
     *
     * Trigger in: InvoiceService.createInvoice()
     */
    public void sendInvoiceCreated(String clientPhone, String clientName,
                                   String caseTitle, long amount, String dueDate) {
        String body = String.format("""
                🏛️ *LegalPro — New Invoice*

                Hello %s,

                A new invoice has been raised for your case:

                📁 *Case:* %s
                💰 *Amount:* ₹%,d
                📅 *Due Date:* %s

                Please log in to the LegalPro portal to view details and make payment.

                For queries, reply to this message or contact your assigned lawyer.

                — LegalPro Team""",
                clientName, caseTitle, amount, dueDate);

        send(clientPhone, body);
    }

    /**
     * Sent to CLIENT + ADMIN when a payment is successfully recorded.
     *
     * Trigger in: PaymentService.verifyAndRecord()  OR  InvoiceService.markAsPaid()
     */
    public void sendPaymentSuccess(String clientPhone, String clientName,
                                   String invoiceRef, long amountPaid,
                                   long remaining, String adminPhone) {
        String clientBody = String.format("""
                ✅ *LegalPro — Payment Confirmed*

                Hello %s,

                Your payment has been successfully received.

                🧾 *Invoice:* %s
                💳 *Amount Paid:* ₹%,d
                📊 *Remaining Balance:* ₹%,d

                %s

                Thank you for your prompt payment!

                — LegalPro Team""",
                clientName, invoiceRef, amountPaid, remaining,
                remaining == 0 ? "🎉 Invoice is now *fully settled*." : "⏳ Partial payment recorded.");

        send(clientPhone, clientBody);

        // Notify admin too
        if (adminPhone != null && !adminPhone.isBlank()) {
            String adminBody = String.format("""
                    💰 *LegalPro — Payment Received*

                    Invoice %s
                    Client: %s
                    Amount: ₹%,d
                    Remaining: ₹%,d""",
                    invoiceRef, clientName, amountPaid, remaining);
            send(adminPhone, adminBody);
        }
    }

    /**
     * Sent to CLIENT when a Razorpay payment attempt fails.
     *
     * Trigger in: PaymentService.handleFailure()
     */
    public void sendPaymentFailed(String clientPhone, String clientName,
                                  String invoiceRef, long amount) {
        String body = String.format("""
                ❌ *LegalPro — Payment Failed*

                Hello %s,

                Unfortunately your payment attempt was not successful.

                🧾 *Invoice:* %s
                💰 *Amount:* ₹%,d

                Please try again from the LegalPro portal or contact us for assistance.

                — LegalPro Team""",
                clientName, invoiceRef, amount);

        send(clientPhone, body);
    }

    /**
     * Sent to CLIENT when an invoice is overdue.
     * Schedule this via a @Scheduled job in InvoiceScheduler.
     *
     * Trigger in: InvoiceScheduler.checkOverdueInvoices()  (daily cron)
     */
    public void sendOverdueReminder(String clientPhone, String clientName,
                                    String invoiceRef, long outstanding, String dueDate) {
        String body = String.format("""
                ⚠️ *LegalPro — Overdue Invoice*

                Hello %s,

                This is a reminder that the following invoice is *overdue*:

                🧾 *Invoice:* %s
                💰 *Outstanding:* ₹%,d
                📅 *Was Due On:* %s

                Please make payment at the earliest to avoid any disruption to your case.

                — LegalPro Team""",
                clientName, invoiceRef, outstanding, dueDate);

        send(clientPhone, body);
    }

    // ═════════════════════════════════════════════════════════════════════════
    // MODULE 2 — CASE MANAGEMENT
    // ═════════════════════════════════════════════════════════════════════════

    /**
     * Sent to CLIENT when their intake form is received / case is created.
     *
     * Trigger in: CaseService.createCase()
     */
    public void sendCaseReceived(String clientPhone, String clientName, String caseTitle, Long caseId) {
        String body = String.format("""
                🏛️ *LegalPro — Case Received*

                Hello %s,

                Your case has been successfully registered with us.

                📁 *Case:* %s
                🔢 *Case ID:* #%d

                Our team will review your case and assign a lawyer shortly. You will receive a WhatsApp notification once a lawyer is assigned.

                — LegalPro Team""",
                clientName, caseTitle, caseId);

        send(clientPhone, body);
    }

    /**
     * Sent to CLIENT + LAWYER when a lawyer is assigned to a case.
     *
     * Trigger in: CaseService.assignLawyer()
     */
    public void sendLawyerAssigned(String clientPhone, String clientName,
                                   String caseTitle, String lawyerName,
                                   String lawyerPhone) {
        // Notify client
        String clientBody = String.format("""
                👨‍⚖️ *LegalPro — Lawyer Assigned*

                Hello %s,

                Great news! A lawyer has been assigned to your case.

                📁 *Case:* %s
                👤 *Your Lawyer:* %s

                Your lawyer will review your case and reach out to you shortly.

                — LegalPro Team""",
                clientName, caseTitle, lawyerName);

        send(clientPhone, clientBody);

        // Notify lawyer
        if (lawyerPhone != null && !lawyerPhone.isBlank()) {
            String lawyerBody = String.format("""
                    📋 *LegalPro — New Case Assigned*

                    Hello %s,

                    A new case has been assigned to you:

                    📁 *Case:* %s
                    👤 *Client:* %s

                    Please log in to the LegalPro portal to review the case details and accept it.

                    — LegalPro Admin""",
                    lawyerName, caseTitle, clientName);

            send(lawyerPhone, lawyerBody);
        }
    }

    /**
     * Sent to CLIENT when the assigned lawyer formally accepts the case.
     *
     * Trigger in: CaseService.acceptCase()
     */
    public void sendCaseAccepted(String clientPhone, String clientName,
                                 String caseTitle, String lawyerName) {
        String body = String.format("""
                ✅ *LegalPro — Case Accepted*

                Hello %s,

                Your lawyer has accepted your case and work has officially begun.

                📁 *Case:* %s
                👨‍⚖️ *Lawyer:* %s

                You will be kept updated on all developments. Feel free to reach out to your lawyer through the portal.

                — LegalPro Team""",
                clientName, caseTitle, lawyerName);

        send(clientPhone, body);
    }

    /**
     * Sent to CLIENT when a case is closed/resolved.
     *
     * Trigger in: CaseService.closeCase()
     */
    public void sendCaseClosed(String clientPhone, String clientName,
                               String caseTitle, String resolution) {
        String body = String.format("""
                🏁 *LegalPro — Case Closed*

                Hello %s,

                Your case has been officially closed.

                📁 *Case:* %s
                📝 *Resolution:* %s

                It has been our privilege to serve you. Please log in to the portal to download your case documents.

                Thank you for choosing LegalPro.

                — LegalPro Team""",
                clientName, caseTitle,
                resolution != null ? resolution : "Case resolved successfully");

        send(clientPhone, body);
    }

    // ═════════════════════════════════════════════════════════════════════════
    // MODULE 3 — HEARINGS & DEADLINES
    // ═════════════════════════════════════════════════════════════════════════

    /**
     * Sent to CLIENT + LAWYER when a hearing is scheduled.
     *
     * Trigger in: HearingService.scheduleHearing()
     */
    public void sendHearingScheduled(String clientPhone, String clientName,
                                     String caseTitle, String hearingDate,
                                     String hearingTime, String courtName,
                                     String lawyerPhone, String lawyerName) {
        String clientBody = String.format("""
                ⚖️ *LegalPro — Hearing Scheduled*

                Hello %s,

                A hearing has been scheduled for your case.

                📁 *Case:* %s
                📅 *Date:* %s
                🕐 *Time:* %s
                🏛️ *Court:* %s

                Please ensure you are present on time. Your lawyer will brief you beforehand.

                — LegalPro Team""",
                clientName, caseTitle, hearingDate, hearingTime, courtName);

        send(clientPhone, clientBody);

        if (lawyerPhone != null && !lawyerPhone.isBlank()) {
            String lawyerBody = String.format("""
                    ⚖️ *LegalPro — Hearing Scheduled*

                    %s, a hearing has been scheduled:

                    📁 *Case:* %s
                    👤 *Client:* %s
                    📅 *Date:* %s
                    🕐 *Time:* %s
                    🏛️ *Court:* %s

                    — LegalPro System""",
                    lawyerName, caseTitle, clientName, hearingDate, hearingTime, courtName);

            send(lawyerPhone, lawyerBody);
        }
    }

    /**
     * Sent to CLIENT + LAWYER 24 hours before a hearing.
     * Schedule this via @Scheduled job in HearingScheduler.
     *
     * Trigger in: HearingScheduler.sendDayBeforeReminders()  (hourly cron)
     */
    public void sendHearingReminder24h(String clientPhone, String clientName,
                                       String caseTitle, String hearingTime,
                                       String courtName, String lawyerPhone,
                                       String lawyerName) {
        String clientBody = String.format("""
                🔔 *LegalPro — Hearing Tomorrow*

                Hello %s,

                This is a reminder that your court hearing is *tomorrow*.

                📁 *Case:* %s
                🕐 *Time:* %s
                🏛️ *Court:* %s

                Please be on time and carry all required documents. Reply to this message if you have any concerns.

                — LegalPro Team""",
                clientName, caseTitle, hearingTime, courtName);

        send(clientPhone, clientBody);

        if (lawyerPhone != null && !lawyerPhone.isBlank()) {
            String lawyerBody = String.format("""
                    🔔 *LegalPro — Hearing Tomorrow*

                    %s, reminder for tomorrow's hearing:

                    📁 *Case:* %s
                    👤 *Client:* %s
                    🕐 *Time:* %s
                    🏛️ *Court:* %s

                    — LegalPro System""",
                    lawyerName, caseTitle, clientName, hearingTime, courtName);

            send(lawyerPhone, lawyerBody);
        }
    }

    /**
     * Sent to LAWYER when a document/filing deadline is approaching (2 days before).
     *
     * Trigger in: HearingScheduler.sendDeadlineReminders()
     */
    public void sendDeadlineReminder(String lawyerPhone, String lawyerName,
                                     String caseTitle, String deadlineType,
                                     String deadlineDate) {
        String body = String.format("""
                ⏰ *LegalPro — Deadline Approaching*

                Hello %s,

                A deadline is approaching for one of your cases:

                📁 *Case:* %s
                📌 *Type:* %s
                📅 *Due:* %s

                Please log in to the portal to manage this deadline.

                — LegalPro System""",
                lawyerName, caseTitle, deadlineType, deadlineDate);

        send(lawyerPhone, body);
    }
}