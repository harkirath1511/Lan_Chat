package com.common.chat.dto;

import java.time.Instant;

public class MemberDto {
    private String userId;
    private String username;
    private String displayName;
    private Instant joinedAt;
    private long lastReadSeq;
    private String status;

    public MemberDto() {
    }

    public MemberDto(String userId, String username, String displayName, Instant joinedAt, long lastReadSeq, String status) {
        this.userId = userId;
        this.username = username;
        this.displayName = displayName;
        this.joinedAt = joinedAt;
        this.lastReadSeq = lastReadSeq;
        this.status = status;
    }

    public String getUserId() {
        return userId;
    }

    public void setUserId(String userId) {
        this.userId = userId;
    }

    public String getUsername() {
        return username;
    }

    public void setUsername(String username) {
        this.username = username;
    }

    public String getDisplayName() {
        return displayName;
    }

    public void setDisplayName(String displayName) {
        this.displayName = displayName;
    }

    public Instant getJoinedAt() {
        return joinedAt;
    }

    public void setJoinedAt(Instant joinedAt) {
        this.joinedAt = joinedAt;
    }

    public long getLastReadSeq() {
        return lastReadSeq;
    }

    public void setLastReadSeq(long lastReadSeq) {
        this.lastReadSeq = lastReadSeq;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }
}
