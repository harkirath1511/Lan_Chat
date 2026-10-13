package com.common.chat.service;

import com.common.chat.config.AppProperties;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicInteger;

@Service
public class RateLimiterService {

    private final AppProperties appProperties;

    // key -> (timestamp, count)
    private final ConcurrentHashMap<String, WindowCounter> loginAttempts = new ConcurrentHashMap<>();
    private final ConcurrentHashMap<String, WindowCounter> messageSends = new ConcurrentHashMap<>();

    public RateLimiterService(AppProperties appProperties) {
        this.appProperties = appProperties;
    }

    public boolean allowLoginAttempt(String ipOrUsername) {
        int maxAttempts = appProperties.getRateLimit().getLoginAttemptsPerMinute();
        return checkRate(loginAttempts, ipOrUsername, 60_000L, maxAttempts);
    }

    public boolean allowMessageSend(String userId) {
        int maxPerSec = appProperties.getRateLimit().getMessagesPerSecond();
        return checkRate(messageSends, userId, 1_000L, maxPerSec);
    }

    private boolean checkRate(ConcurrentHashMap<String, WindowCounter> map, String key, long windowMs, int maxLimit) {
        long now = System.currentTimeMillis();
        WindowCounter counter = map.compute(key, (k, existing) -> {
            if (existing == null || now - existing.windowStart > windowMs) {
                return new WindowCounter(now, 1);
            }
            existing.count.incrementAndGet();
            return existing;
        });
        return counter.count.get() <= maxLimit;
    }

    private static class WindowCounter {
        final long windowStart;
        final AtomicInteger count;

        WindowCounter(long windowStart, int initialCount) {
            this.windowStart = windowStart;
            this.count = new AtomicInteger(initialCount);
        }
    }
}
