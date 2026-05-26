package com.deepti.legalintake.controller;

import com.deepti.legalintake.service.RazorpayService;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/payment")
@RequiredArgsConstructor
@Tag(name = "Razorpay Payments")
public class RazorpayController {

    private final RazorpayService razorpayService;

    /**
     * POST /api/payment/create-order
     * Body: { "invoiceId": "abc-123" }
     * Returns: orderId, amount, keyId for frontend checkout
     */
    @PostMapping("/create-order")
    @PreAuthorize("hasAnyRole('client','admin','lawyer')")
    public ResponseEntity<Map<String, Object>> createOrder(@RequestBody Map<String, String> body) {
        return ResponseEntity.ok(razorpayService.createOrder(body.get("invoiceId")));
    }

    /**
     * POST /api/payment/verify
     * Body: { invoiceId, razorpay_order_id, razorpay_payment_id, razorpay_signature }
     * Verifies signature and marks invoice paid if valid.
     */
    @PostMapping("/verify")
    @PreAuthorize("hasAnyRole('client','admin','lawyer')")
    public ResponseEntity<Map<String, Object>> verifyPayment(@RequestBody Map<String, String> body) {
        return ResponseEntity.ok(razorpayService.verifyPayment(
                body.get("invoiceId"),
                body.get("razorpay_order_id"),
                body.get("razorpay_payment_id"),
                body.get("razorpay_signature")
        ));
    }
}