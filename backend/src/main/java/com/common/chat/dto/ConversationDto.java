package com.common.chat.dto;

import java.time.Instant;
import java.util.List;

public class ConversationDto {
    private String id;
    private String type; // 'CHANNEL' | 'DIRECT'
    private String name;
    private String description;
    private String creatorId;
    private Instant createdAt;
    private long memberCount;
    private List<String> memberIds;
    private long unreadCount;
    private long lastReadSeq;
    private UserDto directPartner;

    public ConversationDto() {
    }

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public String getType() {
        return type;
    }

    public void setType(String type) {
        this.type = type;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public String getCreatorId() {
        return creatorId;
    }

    public void setCreatorId(String creatorId) {
        this.creatorId = creatorId;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(Instant createdAt) {
        this.createdAt = createdAt;
    }

    public long getMemberCount() {
        return memberCount;
    }

    public void setMemberCount(long memberCount) {
        this.memberCount = memberCount;
    }

    public List<String> getMemberIds() {
        return memberIds;
    }

    public void setMemberIds(List<String> memberIds) {
        this.memberIds = memberIds;
    }

    public long getUnreadCount() {
        return unreadCount;
    }

    public void setUnreadCount(long unreadCount) {
        this.unreadCount = unreadCount;
    }

    public long getLastReadSeq() {
        return lastReadSeq;
    }

    public void setLastReadSeq(long lastReadSeq) {
        this.lastReadSeq = lastReadSeq;
    }

    public UserDto getDirectPartner() {
        return directPartner;
    }

    public void setDirectPartner(UserDto directPartner) {
        this.directPartner = directPartner;
    }
}
