package com.common.chat.websocket;

import com.common.chat.service.PresenceService;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.TextMessage;
import org.springframework.web.socket.WebSocketSession;
import org.springframework.web.socket.handler.ConcurrentWebSocketSessionDecorator;

import java.io.IOException;
import java.util.Map;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;

@Component
public class WsEventPublisher implements PresenceService.PresenceChangeListener {

    private static final Logger log = LoggerFactory.getLogger(WsEventPublisher.class);

    private final ObjectMapper objectMapper;
    private final PresenceService presenceService;

    // sessionId -> ConcurrentWebSocketSessionDecorator
    private final ConcurrentHashMap<String, WebSocketSession> sessions = new ConcurrentHashMap<>();

    // Send limit: 5 seconds, buffer limit: 1MB
    private static final int SEND_TIME_LIMIT_MS = 5000;
    private static final int BUFFER_SIZE_LIMIT_BYTES = 1024 * 1024;

    public WsEventPublisher(ObjectMapper objectMapper, PresenceService presenceService) {
        this.objectMapper = objectMapper;
        this.presenceService = presenceService;
        this.presenceService.addListener(this);
    }

    public WebSocketSession registerSession(WebSocketSession rawSession) {
        ConcurrentWebSocketSessionDecorator decorated =
                new ConcurrentWebSocketSessionDecorator(rawSession, SEND_TIME_LIMIT_MS, BUFFER_SIZE_LIMIT_BYTES);
        sessions.put(rawSession.getId(), decorated);
        return decorated;
    }

    public void unregisterSession(String sessionId) {
        sessions.remove(sessionId);
    }

    public WebSocketSession getSession(String sessionId) {
        return sessions.get(sessionId);
    }

    public void sendToSession(String sessionId, WsEnvelope envelope) {
        WebSocketSession session = sessions.get(sessionId);
        if (session != null && session.isOpen()) {
            try {
                String json = objectMapper.writeValueAsString(envelope);
                session.sendMessage(new TextMessage(json));
            } catch (IOException e) {
                log.warn("Failed to send WebSocket message to session {}: {}", sessionId, e.getMessage());
            }
        }
    }

    public void sendToUser(String userId, WsEnvelope envelope) {
        Set<String> sessionIds = presenceService.getActiveSessionIdsForUser(userId);
        for (String sessionId : sessionIds) {
            sendToSession(sessionId, envelope);
        }
    }

    public void broadcastToUsers(Iterable<String> userIds, WsEnvelope envelope) {
        for (String userId : userIds) {
            sendToUser(userId, envelope);
        }
    }

    public void broadcastToAll(WsEnvelope envelope) {
        for (String sessionId : sessions.keySet()) {
            sendToSession(sessionId, envelope);
        }
    }

    @Override
    public void onPresenceChanged(String userId, String newStatus) {
        WsEnvelope envelope = WsEnvelope.of(
                WsEventType.PRESENCE_UPDATED,
                Map.of("userId", userId, "status", newStatus)
        );
        broadcastToAll(envelope);
    }
}
