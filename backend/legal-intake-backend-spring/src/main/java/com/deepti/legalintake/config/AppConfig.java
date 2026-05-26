package com.deepti.legalintake.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.scheduling.concurrent.ThreadPoolTaskExecutor;

import java.util.concurrent.Executor;

/**
 * APP CONFIGURATION - Async Executor
 *
 * In your Node document.service.js you had:
 *   setImmediate(async () => {
 *     const summary = await summarizeText(filePath);
 *     await document.update({ summary });
 *   });
 *
 * setImmediate() in Node = "run this after the current event loop tick" (non-blocking).
 * It lets you respond immediately to the HTTP request while background processing continues.
 *
 * In Spring (Java), this is done with @Async + a thread pool executor.
 * When DocumentService.processWithGemini() is called (annotated with @Async("asyncExecutor")):
 * 1. Spring immediately submits the work to the asyncExecutor thread pool
 * 2. The calling thread (HTTP request handler) returns immediately → response is sent
 * 3. The executor thread runs Gemini processing in the background
 * 4. When done, it updates the document record
 *
 * @EnableAsync on LegalIntakeApplication activates this mechanism.
 *
 * Thread pool settings:
 * - corePoolSize(2)  = always keep 2 threads alive for background tasks
 * - maxPoolSize(5)   = allow bursting up to 5 threads if demand is high
 * - queueCapacity(10) = queue up to 10 tasks if all threads are busy
 */
@Configuration
public class AppConfig {

    /**
     * Creates the thread pool used by @Async("asyncExecutor") methods.
     * Named "asyncExecutor" - must match the value in @Async annotation.
     */
    @Bean(name = "asyncExecutor")
    public Executor asyncExecutor() {
        ThreadPoolTaskExecutor executor = new ThreadPoolTaskExecutor();
        executor.setCorePoolSize(2);
        executor.setMaxPoolSize(5);
        executor.setQueueCapacity(10);
        executor.setThreadNamePrefix("AsyncTask-"); // thread names show in logs as "AsyncTask-1", "AsyncTask-2"
        executor.initialize();
        return executor;
    }
}
