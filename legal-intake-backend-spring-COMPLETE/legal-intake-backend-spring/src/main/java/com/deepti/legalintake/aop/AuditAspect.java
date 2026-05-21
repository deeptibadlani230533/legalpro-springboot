package com.deepti.legalintake.aop;

import com.deepti.legalintake.service.AuditService;
import com.deepti.legalintake.security.SecurityUtils;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.aspectj.lang.ProceedingJoinPoint;
import org.aspectj.lang.annotation.Around;
import org.aspectj.lang.annotation.Aspect;
import org.aspectj.lang.annotation.Pointcut;
import org.springframework.stereotype.Component;

import java.util.Map;

/**
 * AUDIT ASPECT (NEW FEATURE - not in Node version)
 *
 * AOP = Aspect Oriented Programming.
 * This is one of the most important Java/Spring concepts interviewers ask about.
 *
 * The Problem it solves:
 * In your Node code, you had to manually call logActivity() in EVERY service method.
 * That's repetitive (DRY violation) and easy to forget.
 *
 * The AOP Solution:
 * Instead of scattering logActivity() calls everywhere, you define an "Aspect" - a
 * class that INTERCEPTS method calls across the whole app.
 * The method being intercepted doesn't even know it's being audited.
 *
 * Key concepts:
 * - @Aspect          = this class is an interceptor
 * - @Pointcut        = expression defining WHICH methods to intercept
 *                      (like a regex for method signatures)
 * - @Around          = run code BEFORE and AFTER the intercepted method
 * - JoinPoint        = the actual method call being intercepted
 * - ProceedingJoinPoint.proceed() = actually call the original method
 *
 * In your case: intercept all @Service methods tagged with @Audited annotation
 *
 * Interview question you'll get: "What is AOP and where have you used it?"
 * Answer: "I used Spring AOP to implement automatic audit logging. Instead of
 * manually calling logActivity() in every service method, I created an @Aspect
 * that intercepts annotated methods and logs them automatically. This keeps
 * audit logic in one place (separation of concerns)."
 */
@Aspect
@Component
@RequiredArgsConstructor
@Slf4j
public class AuditAspect {

    private final AuditService auditService;
    private final SecurityUtils securityUtils;

    /**
     * POINTCUT: matches any method annotated with @Audited
     * Think of it as: "intercept any method wearing the @Audited badge"
     */
    @Pointcut("@annotation(audited)")
    public void auditedMethods(Audited audited) {}

    /**
     * AROUND ADVICE: runs around the intercepted method
     * - Before: log that we're entering
     * - After success: log the audit entry
     * - After exception: log the failure
     *
     * pjp.proceed() = "go ahead and run the actual method now"
     */
    @Around("auditedMethods(audited)")
    public Object auditMethod(ProceedingJoinPoint pjp, Audited audited) throws Throwable {
        String methodName = pjp.getSignature().getName();
        String className  = pjp.getTarget().getClass().getSimpleName();

        log.debug("Auditing: {}.{}", className, methodName);

        try {
            // Run the actual service method
            Object result = pjp.proceed();

            // After success: log the audit entry
            try {
                Long userId = securityUtils.getCurrentUserId();
                auditService.log(
                        userId,
                        audited.action().isEmpty() ? methodName.toUpperCase() : audited.action(),
                        audited.entity(),
                        null,   // entityId not available generically; services log specific entityId manually
                        Map.of("class", className, "method", methodName)
                );
            } catch (Exception auditEx) {
                // Audit failure must never crash the main operation
                log.warn("Audit log failed for {}.{}: {}", className, methodName, auditEx.getMessage());
            }

            return result;

        } catch (Throwable ex) {
            // Log failed operations too (great for security analysis)
            log.warn("Method {}.{} failed: {}", className, methodName, ex.getMessage());
            throw ex;  // re-throw so the exception still propagates normally
        }
    }
}