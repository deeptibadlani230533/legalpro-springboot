package com.deepti.legalintake.service;

import com.deepti.legalintake.entity.Invoice;
import com.deepti.legalintake.exception.ApiException;
import com.deepti.legalintake.repository.InvoiceRepository;
import com.razorpay.Order;
import com.razorpay.RazorpayClient;
import com.razorpay.RazorpayException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.json.JSONObject;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.util.HexFormat;
import java.util.Map;

@Service
@Slf4j
public class RazorpayService {

    @Value("${razorpay.key.id}")
    private String keyId;

    @Value("${razorpay.key.secret}")
    private String keySecret;

    private final InvoiceRepository invoiceRepository;
    private final InvoiceService    invoiceService;

    public RazorpayService(InvoiceRepository invoiceRepository, InvoiceService invoiceService) {
        this.invoiceRepository = invoiceRepository;
        this.invoiceService    = invoiceService;
    }

    /**
     * Step 1 — Create a Razorpay order for an invoice.
     * Returns orderId + keyId to the frontend so it can open the checkout popup.
     */
    public Map<String, Object> createOrder(String invoiceId) {
        Invoice inv = invoiceRepository.findById(invoiceId)
                .orElseThrow(() -> ApiException.notFound("Invoice not found"));

        if ("paid".equals(inv.getStatus()))
            throw ApiException.badRequest("Invoice is already paid");

        int outstanding = inv.getAmount() - (inv.getPaid() == null ? 0 : inv.getPaid());
        if (outstanding <= 0)
            throw ApiException.badRequest("Nothing outstanding on this invoice");

        try {
            RazorpayClient client = new RazorpayClient(keyId, keySecret);

            JSONObject options = new JSONObject();
            // Razorpay amount is in paise (₹1 = 100 paise)
            options.put("amount",   outstanding * 100);
            options.put("currency", "INR");
            options.put("receipt",  "INV-" + invoiceId.substring(0, 8).toUpperCase());
            options.put("payment_capture", 1); // auto-capture

            Order order = client.orders.create(options);

            log.info("Razorpay order created: {} for invoice: {}", order.get("id"), invoiceId);

            return Map.of(
                    "orderId",   order.get("id").toString(),
                    "amount",    outstanding * 100,           // paise
                    "currency",  "INR",
                    "keyId",     keyId,
                    "invoiceId", invoiceId,
                    "caseName",  inv.getCaseEntity() != null
                            ? (inv.getCaseEntity().getCaseTitle() != null
                               ? inv.getCaseEntity().getCaseTitle()
                               : "Case #" + inv.getCaseId())
                            : "Case #" + inv.getCaseId()
            );
        } catch (RazorpayException e) {
            log.error("Razorpay order creation failed: {}", e.getMessage());
            throw ApiException.badRequest("Payment gateway error: " + e.getMessage());
        }
    }

    /**
     * Step 2 — Verify Razorpay signature after payment.
     * Razorpay sends: razorpay_order_id + razorpay_payment_id + razorpay_signature
     * We verify the signature using HMAC-SHA256 with our key secret.
     * If valid → mark invoice as paid.
     */
    @Transactional
    public Map<String, Object> verifyPayment(String invoiceId, String orderId,
                                             String paymentId, String signature) {
        // Verify signature: HMAC_SHA256(orderId + "|" + paymentId, keySecret)
        String payload   = orderId + "|" + paymentId;
        String generated = hmacSha256(payload, keySecret);

        if (!generated.equals(signature)) {
            log.warn("Razorpay signature mismatch for invoice: {}", invoiceId);
            throw ApiException.badRequest("Payment verification failed — invalid signature");
        }

        // Signature valid → mark invoice as paid
        Invoice paid = invoiceService.markAsPaid(invoiceId);
        log.info("Payment verified and invoice {} marked as paid. PaymentId: {}", invoiceId, paymentId);

        return Map.of(
                "success",   true,
                "message",   "Payment successful",
                "paymentId", paymentId,
                "invoice",   paid
        );
    }

    private String hmacSha256(String data, String secret) {
        try {
            Mac mac = Mac.getInstance("HmacSHA256");
            mac.init(new SecretKeySpec(secret.getBytes(), "HmacSHA256"));
            byte[] hash = mac.doFinal(data.getBytes());
            return HexFormat.of().formatHex(hash);
        } catch (Exception e) {
            throw new RuntimeException("HMAC generation failed", e);
        }
    }
}