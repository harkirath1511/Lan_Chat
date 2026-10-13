package com.common.chat.websocket;

import com.common.chat.domain.UserEntity;
import com.common.chat.dto.MessageDto;
import com.common.chat.dto.UserDto;
import com.common.chat.service.AuthService;
import com.common.chat.service.ConversationService;
import com.common.chat.service.MessageService;
import com.common.chat.service.PresenceService;
import com.common.chat.service.UserService;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.*;
import org.springframework.web.socket.handler.TextWebSocketHandler;

import java.io.IOException;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.Executors;
import java.util.concurrent.ScheduledExecutorService;
import java.util.concurrent.TimeUnit;

@Component
public class ChatWebSocketHandler extends TextWebSocketHandler {

    private static final Logger log = LoggerFactory.getLogger(ChatWebSocketHandler.class);

    private final ObjectMapper objectMapper;
    private final AuthService authService;
    private final UserService userService;
    private final ConversationService conversationService;
    private final MessageService messageService;
    private final PresenceService presenceService;
    private final WsEventPublisher eventPublisher;

    // sessionId -> UserEntity
    private final ConcurrentHashMap<String, UserEntity> authenticatedUsers = new ConcurrentHashMap<>();
    // sessionId -> ScheduledFuture for 5-second auth timeout
    private final ScheduledExecutorService authTimeoutExecutor = Executors.newSingleThreadScheduledExecutor();
    private final ConcurrentHashMap<String, java.util.concurrent.ScheduledFuture<?>> authTimeouts = new ConcurrentHashMap<>();

    public ChatWebSocketHandler(ObjectMapper objectMapper,
                                AuthService authService,
                                UserService userService,
                                ConversationService conversationService,
                                MessageService messageService,
                                PresenceService presenceService,
                                WsEventPublisher eventPublisher) {
        this.objectMapper = objectMapper;
        this.authService = authService;
        this.userService = userService;
        this.conversationService = conversationService;
        this.messageService = messageService;
        this.presenceService = presenceService;
        this.eventPublisher = eventPublisher;
    }

    @Override
    public void afterConnectionEstablished(WebSocketSession session) {
        log.info("WebSocket connection established: session {}", session.getId());
        eventPublisher.registerSession(session);

        // Schedule 5-second authentication timeout
        java.util.concurrent.ScheduledFuture<?> future = authTimeoutExecutor.schedule(() -> {
            if (!authenticatedUsers.containsKey(session.getId())) {
                log.warn("Session {} failed to authenticate within 5 seconds. Closing.", session.getId());
                try {
                    session.close(new CloseStatus(4401, "Authentication timeout"));
                } catch (IOException ignored) {
                }
            }
        }, 5, TimeUnit.SECONDS);
        authTimeouts.put(session.getId(), future);
    }

    @Override
    protected void handleTextMessage(WebSocketSession session, TextMessage message) throws Exception {
        String payload = message.getPayload();
        WsEnvelope envelope;
        try {
            envelope = objectMapper.readValue(payload, WsEnvelope.class);
        } catch (Exception e) {
            log.warn("Invalid WebSocket envelope received from session {}: {}", session.getId(), e.getMessage());
            eventPublisher.sendToSession(session.getId(), WsEnvelope.of(WsEventType.ERROR, Map.of(
                    "code", "INVALID_ENVELOPE",
                    "message", "Malformed JSON envelope"
            )));
            return;
        }

        if (envelope.getType() == null) {
            return;
        }

        // Heartbeat recording
        presenceService.recordHeartbeat(session.getId());

        // First event must be AUTHENTICATE
        if (envelope.getType() == WsEventType.AUTHENTICATE) {
            handleAuthenticate(session, envelope);
            return;
        }

        // Verify session is authenticated before handling application events
        UserEntity user = authenticatedUsers.get(session.getId());
        if (user == null) {
            eventPublisher.sendToSession(session.getId(), WsEnvelope.of(WsEventType.ERROR, envelope.getRequestId(), Map.of(
                    "code", "UNAUTHENTICATED",
                    "message", "Please authenticate first"
            )));
            return;
        }

        switch (envelope.getType()) {
            case MESSAGE_SEND -> handleMessageSend(session, user, envelope);
            case TYPING_START -> handleTyping(session, user, envelope, true);
            case TYPING_STOP -> handleTyping(session, user, envelope, false);
            case PRESENCE_SET -> handlePresenceSet(session, user, envelope);
            case READ_UPDATE -> handleReadUpdate(session, user, envelope);
            case PING -> handlePing(session, envelope);
            default -> log.debug("Unhandled event type: {}", envelope.getType());
        }
    }

    private void handleAuthenticate(WebSocketSession session, WsEnvelope envelope) {
        String token = null;
        if (envelope.getPayload() != null) {
            JsonNode node = objectMapper.valueToTree(envelope.getPayload());
            if (node.has("token")) {
                token = node.get("token").asText();
            }
        }

        Optional<UserEntity> userOpt = authService.validateRawToken(token);
        if (userOpt.isEmpty()) {
            eventPublisher.sendToSession(session.getId(), WsEnvelope.of(WsEventType.ERROR, envelope.getRequestId(), Map.of(
                    "code", "INVALID_CREDENTIALS",
                    "message", "Invalid or expired session token"
            )));
            try {
                session.close(new CloseStatus(4403, "Invalid session token"));
            } catch (IOException ignored) {
            }
            return;
        }

        UserEntity user = userOpt.get();
        authenticatedUsers.put(session.getId(), user);

        // Cancel 5-second timeout
        var timeout = authTimeouts.remove(session.getId());
        if (timeout != null) {
            timeout.cancel(false);
        }

        // Track presence
        presenceService.trackSession(user.getId(), session.getId());

        // Send AUTHENTICATED
        UserDto userDto = userService.toDto(user);
        eventPublisher.sendToSession(session.getId(), WsEnvelope.of(WsEventType.AUTHENTICATED, envelope.getRequestId(), Map.of(
                "user", userDto
        )));

        // Send PRESENCE_SNAPSHOT
        Map<String, String> presences = presenceService.getAllActivePresences();
        eventPublisher.sendToSession(session.getId(), WsEnvelope.of(WsEventType.PRESENCE_SNAPSHOT, Map.of(
                "presences", presences
        )));
    }

    private void handleMessageSend(WebSocketSession session, UserEntity user, WsEnvelope envelope) {
        JsonNode node = objectMapper.valueToTree(envelope.getPayload());
        if (node == null || !node.has("conversationId") || !node.has("content") || !node.has("clientMessageId")) {
            eventPublisher.sendToSession(session.getId(), WsEnvelope.of(WsEventType.ERROR, envelope.getRequestId(), Map.of(
                    "code", "BAD_REQUEST",
                    "message", "conversationId, clientMessageId, and content are required"
            )));
            return;
        }

        String conversationId = node.get("conversationId").asText();
        String clientMessageId = node.get("clientMessageId").asText();
        String content = node.get("content").asText();

        try {
            MessageDto saved = messageService.sendMessage(user.getId(), conversationId, clientMessageId, content);

            // 1. Send MESSAGE_ACK back to sender session
            eventPublisher.sendToSession(session.getId(), WsEnvelope.of(WsEventType.MESSAGE_ACK, envelope.getRequestId(), Map.of(
                    "clientMessageId", clientMessageId,
                    "serverMessageId", saved.getId(),
                    "sequenceNum", saved.getSequenceNum(),
                    "timestamp", saved.getCreatedAt()
            )));

            // 2. Broadcast MESSAGE_CREATED to all members in conversation
            List<String> memberUserIds = conversationService.getMemberUserIds(conversationId);
            WsEnvelope createdEvent = WsEnvelope.of(WsEventType.MESSAGE_CREATED, saved);
            eventPublisher.broadcastToUsers(memberUserIds, createdEvent);

        } catch (Exception e) {
            log.warn("Error processing MESSAGE_SEND from user {}: {}", user.getId(), e.getMessage());
            eventPublisher.sendToSession(session.getId(), WsEnvelope.of(WsEventType.ERROR, envelope.getRequestId(), Map.of(
                    "code", "SEND_FAILED",
                    "message", e.getMessage()
            )));
        }
    }

    private void handleTyping(WebSocketSession session, UserEntity user, WsEnvelope envelope, boolean isTyping) {
        JsonNode node = objectMapper.valueToTree(envelope.getPayload());
        if (node == null || !node.has("conversationId")) {
            return;
        }
        String conversationId = node.get("conversationId").asText();

        try {
            conversationService.verifyMembership(user.getId(), conversationId);
            List<String> memberUserIds = conversationService.getMemberUserIds(conversationId);

            WsEnvelope typingEvent = WsEnvelope.of(WsEventType.TYPING_UPDATED, Map.of(
                    "conversationId", conversationId,
                    "userId", user.getId(),
                    "userName", user.getDisplayName(),
                    "isTyping", isTyping
            ));

            // Broadcast to other members (exclude current user)
            for (String memberId : memberUserIds) {
                if (!memberId.equals(user.getId())) {
                    eventPublisher.sendToUser(memberId, typingEvent);
                }
            }
        } catch (Exception ignored) {
        }
    }

    private void handlePresenceSet(WebSocketSession session, UserEntity user, WsEnvelope envelope) {
        JsonNode node = objectMapper.valueToTree(envelope.getPayload());
        if (node != null && node.has("status")) {
            String status = node.get("status").asText();
            presenceService.setSessionStatus(session.getId(), status);
        }
    }

    private void handleReadUpdate(WebSocketSession session, UserEntity user, WsEnvelope envelope) {
        JsonNode node = objectMapper.valueToTree(envelope.getPayload());
        if (node != null && node.has("conversationId") && node.has("sequenceNum")) {
            String conversationId = node.get("conversationId").asText();
            long seq = node.get("sequenceNum").asLong();

            try {
                conversationService.updateLastRead(user.getId(), conversationId, seq);

                List<String> memberUserIds = conversationService.getMemberUserIds(conversationId);
                WsEnvelope readEvent = WsEnvelope.of(WsEventType.READ_UPDATED, Map.of(
                        "conversationId", conversationId,
                        "userId", user.getId(),
                        "sequenceNum", seq
                ));
                eventPublisher.broadcastToUsers(memberUserIds, readEvent);
            } catch (Exception ignored) {
            }
        }
    }

    private void handlePing(WebSocketSession session, WsEnvelope envelope) {
        eventPublisher.sendToSession(session.getId(), WsEnvelope.of(WsEventType.PONG, envelope.getRequestId(), Map.of(
                "timestamp", System.currentTimeMillis()
        )));
    }

    @Override
    public void afterConnectionClosed(WebSocketSession session, CloseStatus status) {
        log.info("WebSocket connection closed: session {}, status {}", session.getId(), status);
        cleanupSession(session.getId());
    }

    @Override
    public void handleTransportError(WebSocketSession session, Throwable exception) {
        log.warn("WebSocket transport error for session {}: {}", session.getId(), exception.getMessage());
        cleanupSession(session.getId());
    }

    private void cleanupSession(String sessionId) {
        var timeout = authTimeouts.remove(sessionId);
        if (timeout != null) {
            timeout.cancel(false);
        }
        authenticatedUsers.remove(sessionId);
        presenceService.removeSession(sessionId);
        eventPublisher.unregisterSession(sessionId);
    }

    @Scheduled(fixedRate = 15000)
    public void cleanupTimedOutSessions() {
        List<String> timedOut = presenceService.findTimedOutSessions();
        for (String sessionId : timedOut) {
            log.info("Closing timed out WebSocket session: {}", sessionId);
            WebSocketSession session = eventPublisher.getSession(sessionId);
            if (session != null && session.isOpen()) {
                try {
                    session.close(new CloseStatus(4408, "Heartbeat timeout"));
                } catch (IOException ignored) {
                }
            }
            cleanupSession(sessionId);
        }
    }
}
