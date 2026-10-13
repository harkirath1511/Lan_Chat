package com.common.chat.service;

import com.common.chat.config.AppProperties;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class PresenceService {

    private final AppProperties appProperties;

    // sessionId -> userId
    private final ConcurrentHashMap<String, String> sessionToUser = new ConcurrentHashMap<>();
    // userId -> Set<sessionId>
    private final ConcurrentHashMap<String, Set<String>> userToSessions = new ConcurrentHashMap<>();
    // sessionId -> status ('available' | 'away')
    private final ConcurrentHashMap<String, String> sessionStatus = new ConcurrentHashMap<>();
    // sessionId -> lastHeartbeatTimestamp (ms)
    private final ConcurrentHashMap<String, Long> sessionHeartbeat = new ConcurrentHashMap<>();

    // Listener callbacks for presence updates
    private final List<PresenceChangeListener> listeners = new ArrayList<>();

    public interface PresenceChangeListener {
        void onPresenceChanged(String userId, String newStatus);
    }

    public PresenceService(AppProperties appProperties) {
        this.appProperties = appProperties;
    }

    public synchronized void addListener(PresenceChangeListener listener) {
        listeners.add(listener);
    }

    public String trackSession(String userId, String sessionId) {
        sessionToUser.put(sessionId, userId);
        userToSessions.computeIfAbsent(userId, k -> ConcurrentHashMap.newKeySet()).add(sessionId);
        sessionStatus.put(sessionId, "available");
        sessionHeartbeat.put(sessionId, System.currentTimeMillis());

        String aggregateStatus = computeUserStatus(userId);
        notifyListeners(userId, aggregateStatus);
        return aggregateStatus;
    }

    public void recordHeartbeat(String sessionId) {
        sessionHeartbeat.put(sessionId, System.currentTimeMillis());
    }

    public void setSessionStatus(String sessionId, String status) {
        String normalizedStatus = "away".equalsIgnoreCase(status) ? "away" : "available";
        sessionStatus.put(sessionId, normalizedStatus);
        String userId = sessionToUser.get(sessionId);
        if (userId != null) {
            String aggregateStatus = computeUserStatus(userId);
            notifyListeners(userId, aggregateStatus);
        }
    }

    public String removeSession(String sessionId) {
        String userId = sessionToUser.remove(sessionId);
        sessionStatus.remove(sessionId);
        sessionHeartbeat.remove(sessionId);

        if (userId != null) {
            Set<String> sessions = userToSessions.get(userId);
            if (sessions != null) {
                sessions.remove(sessionId);
                if (sessions.isEmpty()) {
                    userToSessions.remove(userId);
                }
            }
            String aggregateStatus = computeUserStatus(userId);
            notifyListeners(userId, aggregateStatus);
            return aggregateStatus;
        }
        return "offline";
    }

    public String getUserStatus(String userId) {
        return computeUserStatus(userId);
    }

    public Map<String, String> getAllActivePresences() {
        Map<String, String> result = new HashMap<>();
        for (String userId : userToSessions.keySet()) {
            result.put(userId, computeUserStatus(userId));
        }
        return result;
    }

    public Set<String> getActiveSessionIdsForUser(String userId) {
        Set<String> set = userToSessions.get(userId);
        return set != null ? Collections.unmodifiableSet(set) : Collections.emptySet();
    }

    public List<String> findTimedOutSessions() {
        long now = System.currentTimeMillis();
        long timeoutMs = appProperties.getHeartbeatTimeoutSeconds() * 1000L;
        List<String> timedOut = new ArrayList<>();
        for (Map.Entry<String, Long> entry : sessionHeartbeat.entrySet()) {
            if (now - entry.getValue() > timeoutMs) {
                timedOut.add(entry.getKey());
            }
        }
        return timedOut;
    }

    private String computeUserStatus(String userId) {
        Set<String> sessions = userToSessions.get(userId);
        if (sessions == null || sessions.isEmpty()) {
            return "offline";
        }
        // If at least one tab/session is 'available', user is 'available'
        for (String sId : sessions) {
            if ("available".equals(sessionStatus.get(sId))) {
                return "available";
            }
        }
        return "away";
    }

    private void notifyListeners(String userId, String status) {
        for (PresenceChangeListener listener : listeners) {
            try {
                listener.onPresenceChanged(userId, status);
            } catch (Exception ignored) {
            }
        }
    }
}
