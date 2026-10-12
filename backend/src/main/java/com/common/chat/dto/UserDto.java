package com.common.chat.dto;

import java.time.Instant;

public class UserDto {
    private String id;
    private String username;
    private String displayName;
    private Instant createdAt;
    private String status; // 'available', 'away', 'offline'

    public UserDto() {
    }

    public UserDto(String id, String username, String displayName, Instant createdAt, String status) {
        this.id = id;
        this.username = username;
        this.displayName = displayName;
        this.createdAt = createdAt;
        this.status = status;
    }

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
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

    public Instant getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(Instant createdAt) {
        this.createdAt = createdAt;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }
}
