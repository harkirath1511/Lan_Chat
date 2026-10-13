package com.common.chat.config;

import org.springframework.boot.context.properties.ConfigurationProperties;
import java.util.Arrays;
import java.util.List;

@ConfigurationProperties(prefix = "common.chat")
public class AppProperties {
    private String allowedOrigins = "http://localhost:3000,http://127.0.0.1:3000,http://localhost:8080,http://127.0.0.1:8080";
    private int sessionTokenValidityHours = 72;
    private int heartbeatIntervalSeconds = 25;
    private int heartbeatTimeoutSeconds = 60;
    private int maxMessageLength = 4000;
    private RateLimit rateLimit = new RateLimit();

    public static class RateLimit {
        private int loginAttemptsPerMinute = 10;
        private int messagesPerSecond = 5;

        public int getLoginAttemptsPerMinute() {
            return loginAttemptsPerMinute;
        }

        public void setLoginAttemptsPerMinute(int loginAttemptsPerMinute) {
            this.loginAttemptsPerMinute = loginAttemptsPerMinute;
        }

        public int getMessagesPerSecond() {
            return messagesPerSecond;
        }

        public void setMessagesPerSecond(int messagesPerSecond) {
            this.messagesPerSecond = messagesPerSecond;
        }
    }

    public List<String> getAllowedOriginsList() {
        if (allowedOrigins == null || allowedOrigins.isBlank()) {
            return List.of();
        }
        return Arrays.stream(allowedOrigins.split(","))
                .map(String::trim)
                .filter(s -> !s.isEmpty())
                .toList();
    }

    public String getAllowedOrigins() {
        return allowedOrigins;
    }

    public void setAllowedOrigins(String allowedOrigins) {
        this.allowedOrigins = allowedOrigins;
    }

    public int getSessionTokenValidityHours() {
        return sessionTokenValidityHours;
    }

    public void setSessionTokenValidityHours(int sessionTokenValidityHours) {
        this.sessionTokenValidityHours = sessionTokenValidityHours;
    }

    public int getHeartbeatIntervalSeconds() {
        return heartbeatIntervalSeconds;
    }

    public void setHeartbeatIntervalSeconds(int heartbeatIntervalSeconds) {
        this.heartbeatIntervalSeconds = heartbeatIntervalSeconds;
    }

    public int getHeartbeatTimeoutSeconds() {
        return heartbeatTimeoutSeconds;
    }

    public void setHeartbeatTimeoutSeconds(int heartbeatTimeoutSeconds) {
        this.heartbeatTimeoutSeconds = heartbeatTimeoutSeconds;
    }

    public int getMaxMessageLength() {
        return maxMessageLength;
    }

    public void setMaxMessageLength(int maxMessageLength) {
        this.maxMessageLength = maxMessageLength;
    }

    public RateLimit getRateLimit() {
        return rateLimit;
    }

    public void setRateLimit(RateLimit rateLimit) {
        this.rateLimit = rateLimit;
    }
}
