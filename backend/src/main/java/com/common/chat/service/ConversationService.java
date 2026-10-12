package com.common.chat.service;

import com.common.chat.domain.ConversationEntity;
import com.common.chat.domain.ConversationMemberEntity;
import com.common.chat.domain.ConversationType;
import com.common.chat.domain.UserEntity;
import com.common.chat.dto.ConversationDto;
import com.common.chat.dto.CreateChannelRequest;
import com.common.chat.dto.MemberDto;
import com.common.chat.dto.UserDto;
import com.common.chat.repository.ConversationMemberRepository;
import com.common.chat.repository.ConversationRepository;
import com.common.chat.repository.MessageRepository;
import com.common.chat.repository.UserRepository;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.*;

@Service
@Transactional
public class ConversationService {

    private final ConversationRepository conversationRepository;
    private final ConversationMemberRepository memberRepository;
    private final MessageRepository messageRepository;
    private final UserRepository userRepository;
    private final UserService userService;
    private final PresenceService presenceService;

    private static final Set<String> DEFAULT_CHANNELS = Set.of("chan_general", "chan_project", "chan_study");

    public ConversationService(ConversationRepository conversationRepository,
                               ConversationMemberRepository memberRepository,
                               MessageRepository messageRepository,
                               UserRepository userRepository,
                               UserService userService,
                               PresenceService presenceService) {
        this.conversationRepository = conversationRepository;
        this.memberRepository = memberRepository;
        this.messageRepository = messageRepository;
        this.userRepository = userRepository;
        this.userService = userService;
        this.presenceService = presenceService;
    }

    @Transactional(readOnly = true)
    public List<ConversationDto> listUserConversations(String userId) {
        List<ConversationEntity> conversations = conversationRepository.findByUserId(userId);
        List<ConversationDto> result = new ArrayList<>();

        for (ConversationEntity entity : conversations) {
            result.add(mapToDto(entity, userId));
        }
        return result;
    }

    @Transactional(readOnly = true)
    public List<ConversationDto> listPublicChannels(String userId) {
        List<ConversationEntity> channels = conversationRepository.findByType(ConversationType.CHANNEL);
        List<ConversationDto> result = new ArrayList<>();
        for (ConversationEntity entity : channels) {
            result.add(mapToDto(entity, userId));
        }
        return result;
    }

    public ConversationDto createChannel(String userId, CreateChannelRequest request) {
        String cleanName = request.getName().trim().toLowerCase().replaceAll("[^a-z0-9_-]", "-");
        if (cleanName.length() < 2) {
            throw new IllegalArgumentException("Channel name must be at least 2 characters");
        }

        if (conversationRepository.existsByNameIgnoreCaseAndType(cleanName, ConversationType.CHANNEL)) {
            throw new IllegalArgumentException("Channel with name '" + cleanName + "' already exists");
        }

        String channelId = "chan_" + UUID.randomUUID().toString().replace("-", "").substring(0, 16);
        Instant now = Instant.now();

        ConversationEntity entity = new ConversationEntity(
                channelId,
                ConversationType.CHANNEL,
                cleanName,
                request.getDescription() != null ? request.getDescription().trim() : "",
                userId,
                now
        );
        conversationRepository.save(entity);

        // Add creator as member
        String memberId = "cm_" + UUID.randomUUID().toString().replace("-", "").substring(0, 16);
        ConversationMemberEntity member = new ConversationMemberEntity(memberId, channelId, userId, now, 0L);
        memberRepository.save(member);

        return mapToDto(entity, userId);
    }

    public synchronized ConversationDto getOrCreateDirectConversation(String userId, String targetUserId) {
        if (userId.equals(targetUserId)) {
            throw new IllegalArgumentException("Cannot open direct conversation with yourself");
        }

        UserEntity targetUser = userRepository.findById(targetUserId)
                .orElseThrow(() -> new IllegalArgumentException("Target user not found"));

        Optional<ConversationEntity> existing = conversationRepository.findDirectBetween(userId, targetUserId);
        if (existing.isPresent()) {
            return mapToDto(existing.get(), userId);
        }

        String convId = "dm_" + UUID.randomUUID().toString().replace("-", "").substring(0, 16);
        Instant now = Instant.now();

        ConversationEntity entity = new ConversationEntity(
                convId,
                ConversationType.DIRECT,
                targetUser.getDisplayName(),
                "Direct conversation",
                userId,
                now
        );
        conversationRepository.save(entity);

        // Add both members
        String m1 = "cm_" + UUID.randomUUID().toString().replace("-", "").substring(0, 16);
        String m2 = "cm_" + UUID.randomUUID().toString().replace("-", "").substring(0, 16);
        memberRepository.save(new ConversationMemberEntity(m1, convId, userId, now, 0L));
        memberRepository.save(new ConversationMemberEntity(m2, convId, targetUserId, now, 0L));

        return mapToDto(entity, userId);
    }

    public void joinChannel(String userId, String channelId) {
        ConversationEntity entity = conversationRepository.findById(channelId)
                .orElseThrow(() -> new IllegalArgumentException("Channel not found"));

        if (entity.getType() != ConversationType.CHANNEL) {
            throw new IllegalArgumentException("Cannot join direct conversations as public channels");
        }

        if (memberRepository.existsByConversationIdAndUserId(channelId, userId)) {
            return;
        }

        String memberId = "cm_" + UUID.randomUUID().toString().replace("-", "").substring(0, 16);
        ConversationMemberEntity member = new ConversationMemberEntity(memberId, channelId, userId, Instant.now(), 0L);
        memberRepository.save(member);
    }

    public void leaveChannel(String userId, String channelId) {
        if (DEFAULT_CHANNELS.contains(channelId)) {
            throw new IllegalArgumentException("Cannot leave default campus channels");
        }
        memberRepository.deleteByConversationIdAndUserId(channelId, userId);
    }

    @Transactional(readOnly = true)
    public List<MemberDto> getConversationMembers(String userId, String conversationId) {
        verifyMembership(userId, conversationId);

        List<ConversationMemberEntity> members = memberRepository.findByConversationId(conversationId);
        List<MemberDto> result = new ArrayList<>();

        for (ConversationMemberEntity cm : members) {
            userRepository.findById(cm.getUserId()).ifPresent(user -> {
                String status = presenceService.getUserStatus(user.getId());
                result.add(new MemberDto(
                        user.getId(),
                        user.getUsername(),
                        user.getDisplayName(),
                        cm.getJoinedAt(),
                        cm.getLastReadSeq(),
                        status
                ));
            });
        }
        return result;
    }

    public void updateLastRead(String userId, String conversationId, long sequenceNum) {
        verifyMembership(userId, conversationId);
        memberRepository.updateLastReadSeq(conversationId, userId, sequenceNum);
    }

    public void verifyMembership(String userId, String conversationId) {
        if (!memberRepository.existsByConversationIdAndUserId(conversationId, userId)) {
            throw new AccessDeniedException("You are not a participant in this conversation");
        }
    }

    @Transactional(readOnly = true)
    public List<String> getMemberUserIds(String conversationId) {
        return memberRepository.findUserIdsByConversationId(conversationId);
    }

    public ConversationDto mapToDto(ConversationEntity entity, String currentUserId) {
        ConversationDto dto = new ConversationDto();
        dto.setId(entity.getId());
        dto.setType(entity.getType().name());
        dto.setName(entity.getName());
        dto.setDescription(entity.getDescription());
        dto.setCreatorId(entity.getCreatorId());
        dto.setCreatedAt(entity.getCreatedAt());

        long count = memberRepository.countByConversationId(entity.getId());
        dto.setMemberCount(count);
        List<String> memberIds = memberRepository.findUserIdsByConversationId(entity.getId());
        dto.setMemberIds(memberIds);

        // Get current user's membership for unread and lastReadSeq
        Optional<ConversationMemberEntity> userMemberOpt = memberRepository.findByConversationIdAndUserId(entity.getId(), currentUserId);
        long lastReadSeq = 0L;
        if (userMemberOpt.isPresent()) {
            lastReadSeq = userMemberOpt.get().getLastReadSeq();
            long unread = messageRepository.countUnread(entity.getId(), lastReadSeq, currentUserId);
            dto.setUnreadCount(unread);
        } else {
            dto.setUnreadCount(0L);
        }
        dto.setLastReadSeq(lastReadSeq);

        // If direct message, populate directPartner
        if (entity.getType() == ConversationType.DIRECT) {
            String partnerId = memberIds.stream().filter(id -> !id.equals(currentUserId)).findFirst().orElse(null);
            if (partnerId != null) {
                userService.getUserDto(partnerId).ifPresent(partner -> {
                    dto.setDirectPartner(partner);
                    dto.setName(partner.getDisplayName());
                });
            }
        }

        return dto;
    }
}
