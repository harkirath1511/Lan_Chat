package com.common.chat.service;

import com.common.chat.config.AppProperties;
import com.common.chat.domain.MessageEntity;
import com.common.chat.domain.UserEntity;
import com.common.chat.dto.MessageDto;
import com.common.chat.dto.MessagesPageResponse;
import com.common.chat.repository.MessageRepository;
import com.common.chat.repository.UserRepository;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.*;

@Service
@Transactional
public class MessageService {

    private final MessageRepository messageRepository;
    private final ConversationService conversationService;
    private final UserRepository userRepository;
    private final AppProperties appProperties;
    private final RateLimiterService rateLimiterService;

    public MessageService(MessageRepository messageRepository,
                          ConversationService conversationService,
                          UserRepository userRepository,
                          AppProperties appProperties,
                          RateLimiterService rateLimiterService) {
        this.messageRepository = messageRepository;
        this.conversationService = conversationService;
        this.userRepository = userRepository;
        this.appProperties = appProperties;
        this.rateLimiterService = rateLimiterService;
    }

    public MessageDto sendMessage(String userId, String conversationId, String clientMessageId, String content) {
        if (!rateLimiterService.allowMessageSend(userId)) {
            throw new IllegalStateException("Message sending rate limit exceeded");
        }

        if (content == null || content.trim().isEmpty()) {
            throw new IllegalArgumentException("Message content cannot be blank");
        }

        if (content.length() > appProperties.getMaxMessageLength()) {
            throw new IllegalArgumentException("Message content exceeds maximum length of " + appProperties.getMaxMessageLength() + " characters");
        }

        if (clientMessageId == null || clientMessageId.isBlank()) {
            throw new IllegalArgumentException("clientMessageId is required for deduplication");
        }

        // Verify membership
        conversationService.verifyMembership(userId, conversationId);

        // Idempotency check: if sender already sent this clientMessageId, return existing
        Optional<MessageEntity> existing = messageRepository.findBySenderIdAndClientMessageId(userId, clientMessageId);
        if (existing.isPresent()) {
            return toDto(existing.get());
        }

        String messageId = "msg_" + UUID.randomUUID().toString().replace("-", "").substring(0, 16);
        Instant now = Instant.now();

        MessageEntity entity = new MessageEntity(
                messageId,
                conversationId,
                userId,
                clientMessageId,
                content.trim(),
                now
        );

        MessageEntity saved = messageRepository.saveAndFlush(entity);

        // Update sender's lastReadSeq
        if (saved.getSequenceNum() != null) {
            conversationService.updateLastRead(userId, conversationId, saved.getSequenceNum());
        }

        return toDto(saved);
    }

    @Transactional(readOnly = true)
    public MessagesPageResponse getLatestMessages(String userId, String conversationId, int limit) {
        conversationService.verifyMembership(userId, conversationId);
        int pageSize = Math.min(Math.max(limit, 1), 100);

        List<MessageEntity> descList = messageRepository.findLatestMessages(conversationId, PageRequest.of(0, pageSize + 1));
        boolean hasMore = descList.size() > pageSize;
        if (hasMore) {
            descList = descList.subList(0, pageSize);
        }

        // Reverse so list is chronological (ascending by sequenceNum)
        List<MessageDto> dtoList = new ArrayList<>(descList.stream().map(this::toDto).toList());
        Collections.reverse(dtoList);

        Long oldestSeq = dtoList.isEmpty() ? null : dtoList.get(0).getSequenceNum();
        Long newestSeq = dtoList.isEmpty() ? null : dtoList.get(dtoList.size() - 1).getSequenceNum();

        return new MessagesPageResponse(dtoList, hasMore, oldestSeq, newestSeq);
    }

    @Transactional(readOnly = true)
    public MessagesPageResponse getOlderMessages(String userId, String conversationId, long cursor, int limit) {
        conversationService.verifyMembership(userId, conversationId);
        int pageSize = Math.min(Math.max(limit, 1), 100);

        List<MessageEntity> descList = messageRepository.findOlderMessages(conversationId, cursor, PageRequest.of(0, pageSize + 1));
        boolean hasMore = descList.size() > pageSize;
        if (hasMore) {
            descList = descList.subList(0, pageSize);
        }

        List<MessageDto> dtoList = new ArrayList<>(descList.stream().map(this::toDto).toList());
        Collections.reverse(dtoList);

        Long oldestSeq = dtoList.isEmpty() ? null : dtoList.get(0).getSequenceNum();
        Long newestSeq = dtoList.isEmpty() ? null : dtoList.get(dtoList.size() - 1).getSequenceNum();

        return new MessagesPageResponse(dtoList, hasMore, oldestSeq, newestSeq);
    }

    @Transactional(readOnly = true)
    public MessagesPageResponse getNewerMessages(String userId, String conversationId, long cursor, int limit) {
        conversationService.verifyMembership(userId, conversationId);
        int pageSize = Math.min(Math.max(limit, 1), 100);

        List<MessageEntity> ascList = messageRepository.findNewerMessages(conversationId, cursor, PageRequest.of(0, pageSize + 1));
        boolean hasMore = ascList.size() > pageSize;
        if (hasMore) {
            ascList = ascList.subList(0, pageSize);
        }

        List<MessageDto> dtoList = ascList.stream().map(this::toDto).toList();

        Long oldestSeq = dtoList.isEmpty() ? null : dtoList.get(0).getSequenceNum();
        Long newestSeq = dtoList.isEmpty() ? null : dtoList.get(dtoList.size() - 1).getSequenceNum();

        return new MessagesPageResponse(dtoList, hasMore, oldestSeq, newestSeq);
    }

    @Transactional(readOnly = true)
    public List<MessageDto> searchMessages(String userId, String conversationId, String query, int limit) {
        conversationService.verifyMembership(userId, conversationId);
        int pageSize = Math.min(Math.max(limit, 1), 100);

        List<MessageEntity> list = messageRepository.searchMessages(conversationId, query.trim(), PageRequest.of(0, pageSize));
        return list.stream().map(this::toDto).toList();
    }

    private MessageDto toDto(MessageEntity entity) {
        String senderName = userRepository.findById(entity.getSenderId())
                .map(UserEntity::getDisplayName)
                .orElse("Unknown Peer");

        return new MessageDto(
                entity.getId(),
                entity.getSequenceNum() != null ? entity.getSequenceNum() : 0L,
                entity.getConversationId(),
                entity.getSenderId(),
                senderName,
                entity.getClientMessageId(),
                entity.getContent(),
                entity.getCreatedAt()
        );
    }
}
