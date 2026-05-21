package com.deepti.legalintake.aop;

import java.lang.annotation.*;

/**
 * @Audited ANNOTATION
 *
 * Custom annotations in Java let you attach metadata to methods, classes, or fields.
 * This one marks a method as "should be recorded in the audit log".
 *
 * Usage example in a service:
 *   @Audited(action = "CASE_CREATED", entity = "CASE")
 *   public Case createCase(...) { ... }
 *
 * @Retention(RUNTIME) = the annotation is available at runtime (needed for AOP to read it)
 * @Target(METHOD)     = can only be placed on methods
 * @Documented         = shows up in JavaDoc
 */
@Retention(RetentionPolicy.RUNTIME)
@Target(ElementType.METHOD)
@Documented
public @interface Audited {
    /** The audit action label e.g. "CASE_CREATED". Defaults to method name if empty. */
    String action() default "";

    /** The entity type e.g. "CASE", "DOCUMENT", "USER" */
    String entity() default "UNKNOWN";
}