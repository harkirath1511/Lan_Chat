package com.common.chat;

import com.common.chat.auth.SessionToken;
import com.common.chat.domain.UserEntity;
import com.common.chat.dto.*;
import com.common.chat.repository.ConversationRepository;
import com.common.chat.repository.MessageRepository;
import com.common.chat.repository.SessionRepository;
import com.common.chat.repository.UserRepository;
import com.common.chat.service.AuthService;
import com.common.chat.service.ConversationService;
import com.common.chat.service.MessageService;
import com.common.chat.service.PresenceService;
import com.common.chat.service.UserService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
public class CommonChatApplicationTests {

    @Autowired
    private AuthService authService;

    @Autowired
    private UserService userService;

    @Autowired
    private ConversationService conversationService;

    @Autowired
    private MessageService messageService;

    @Autowired
    private PresenceService presenceService;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private ConversationRepository conversationRepository;

    @Autowired
    private MessageRepository messageRepository;

    @Autowired
    private SessionRepository sessionRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Test
    void contextLoads() {
        assertNotNull(authService);
        assertNotNull(conversationService);
        assertNotNull(messageService);
        assertNotNull(presenceService);
    }

    @Test
    @DisplayName("User registration, BCrypt hashing, and login flow")
    void testRegistrationAndLogin() {
        String username = "student_" + System.currentTimeMillis();
        RegisterRequest registerReq = new RegisterRequest(
                username,
                "Student Tester",
                "Password123!",
                "Password123!"
        );

        AuthResponse regResponse = authService.register(registerReq);
        assertNotNull(regResponse.getToken());
        assertEquals("Student Tester", regResponse.getUser().getDisplayName());

        // Verify password is not plaintext in database
        UserEntity userEntity = userRepository.findById(regResponse.getUser().getId()).orElseThrow();
        assertNotEquals("Password123!", userEntity.getPasswordHash());
        assertTrue(passwordEncoder.matches("Password123!", userEntity.getPasswordHash()));

        // Verify auto-joined the 3 default channels
        List<ConversationDto> convs = conversationService.listUserConversations(userEntity.getId());
        assertTrue(convs.stream().anyMatch(c -> "general".equals(c.getName())));
        assertTrue(convs.stream().anyMatch(c -> "project-team".equals(c.getName())));
        assertTrue(convs.stream().anyMatch(c -> "study-room".equals(c.getName())));

        // Test login
        LoginRequest loginReq = new LoginRequest(username, "Password123!");
        AuthResponse loginResponse = authService.login(loginReq, "127.0.0.1");
        assertNotNull(loginResponse.getToken());
        assertEquals(userEntity.getId(), loginResponse.getUser().getId());

        // Test logout revokes token
        String tokenHash = SessionToken.hashToken(loginResponse.getToken());
        authService.logout(tokenHash);
        Optional<UserEntity> validated = authService.validateRawToken(loginResponse.getToken());
        assertTrue(validated.isEmpty(), "Revoked token must not validate");
    }

    @Test
    @DisplayName("Message persistence, sequence ordering, and idempotent retry")
    void testMessagePersistenceAndIdempotency() {
        String user1Name = "user_a_" + System.currentTimeMillis();
        AuthResponse userA = authService.register(new RegisterRequest(user1Name, "Alice", "secret123", "secret123"));

        String clientMsgId = "client_msg_" + System.currentTimeMillis();

        // Send message in general channel
        MessageDto msg1 = messageService.sendMessage(userA.getUser().getId(), "chan_general", clientMsgId, "First LAN broadcast");
        assertNotNull(msg1.getId());
        assertTrue(msg1.getSequenceNum() > 0);
        assertEquals("First LAN broadcast", msg1.getContent());

        // Retry same message send with identical clientMessageId (idempotency requirement)
        MessageDto msgRetry = messageService.sendMessage(userA.getUser().getId(), "chan_general", clientMsgId, "First LAN broadcast");
        assertEquals(msg1.getId(), msgRetry.getId(), "Retried message must return original message without duplicating");
        assertEquals(msg1.getSequenceNum(), msgRetry.getSequenceNum());

        // Fetch latest messages
        MessagesPageResponse page = messageService.getLatestMessages(userA.getUser().getId(), "chan_general", 10);
        assertFalse(page.getMessages().isEmpty());
        assertTrue(page.getMessages().stream().anyMatch(m -> m.getId().equals(msg1.getId())));
    }

    @Test
    @DisplayName("Private direct messaging isolation and access enforcement")
    void testDirectMessageIsolation() {
        String u1 = "alice_" + System.currentTimeMillis();
        String u2 = "bob_" + System.currentTimeMillis();
        String u3 = "eve_" + System.currentTimeMillis();

        AuthResponse alice = authService.register(new RegisterRequest(u1, "Alice", "pass123", "pass123"));
        AuthResponse bob = authService.register(new RegisterRequest(u2, "Bob", "pass123", "pass123"));
        AuthResponse eve = authService.register(new RegisterRequest(u3, "Eve", "pass123", "pass123"));

        // Alice starts DM with Bob
        ConversationDto dm = conversationService.getOrCreateDirectConversation(alice.getUser().getId(), bob.getUser().getId());
        assertNotNull(dm.getId());

        // Alice sends message to Bob in DM
        messageService.sendMessage(alice.getUser().getId(), dm.getId(), "dm_msg_1", "Secret test notes between Alice and Bob");

        // Bob can read messages
        MessagesPageResponse bobView = messageService.getLatestMessages(bob.getUser().getId(), dm.getId(), 10);
        assertEquals(1, bobView.getMessages().size());

        // Eve (non-participant) attempts to read DM messages -> must throw AccessDeniedException
        assertThrows(AccessDeniedException.class, () -> {
            messageService.getLatestMessages(eve.getUser().getId(), dm.getId(), 10);
        });

        // Eve attempts to send message to DM -> must throw AccessDeniedException
        assertThrows(AccessDeniedException.class, () -> {
            messageService.sendMessage(eve.getUser().getId(), dm.getId(), "eve_msg", "I am eavesdropping");
        });
    }

    @Test
    @DisplayName("Concurrent direct conversation reuse (no duplicate DMs)")
    void testDirectConversationReused() {
        String u1 = "lead_" + System.currentTimeMillis();
        String u2 = "partner_" + System.currentTimeMillis();

        AuthResponse uA = authService.register(new RegisterRequest(u1, "Lead", "pass123", "pass123"));
        AuthResponse uB = authService.register(new RegisterRequest(u2, "Partner", "pass123", "pass123"));

        ConversationDto dm1 = conversationService.getOrCreateDirectConversation(uA.getUser().getId(), uB.getUser().getId());
        ConversationDto dm2 = conversationService.getOrCreateDirectConversation(uB.getUser().getId(), uA.getUser().getId());

        assertEquals(dm1.getId(), dm2.getId(), "DM between same pair of users must reuse existing conversation");
    }

    @Test
    @DisplayName("Multi-session presence aggregation")
    void testMultiSessionPresence() {
        String userId = "test_user_presence";
        String s1 = "session_1";
        String s2 = "session_2";

        assertEquals("offline", presenceService.getUserStatus(userId));

        // Tab 1 connects -> available
        presenceService.trackSession(userId, s1);
        assertEquals("available", presenceService.getUserStatus(userId));

        // Tab 2 connects -> available
        presenceService.trackSession(userId, s2);
        assertEquals("available", presenceService.getUserStatus(userId));

        // Tab 1 sets status to away, but Tab 2 is available -> aggregate is still available
        presenceService.setSessionStatus(s1, "away");
        assertEquals("available", presenceService.getUserStatus(userId));

        // Tab 2 sets status to away -> aggregate becomes away
        presenceService.setSessionStatus(s2, "away");
        assertEquals("away", presenceService.getUserStatus(userId));

        // Tab 1 closes -> still away (Tab 2 remains)
        presenceService.removeSession(s1);
        assertEquals("away", presenceService.getUserStatus(userId));

        // Tab 2 closes -> offline
        presenceService.removeSession(s2);
        assertEquals("offline", presenceService.getUserStatus(userId));
    }
}
