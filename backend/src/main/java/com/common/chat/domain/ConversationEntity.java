package com.common.chat.domain;

import jakarta.persistence.*;
import java.time.Instant;

@Entity
@Table(name = "conversations")
public class ConversationEntity {

    @Id
    @Column(name = "id", length = 64, nullable = false)
    private String id;

    @Enumerated(EnumType.STRING)
    @Column(name = "type", length = 32, nullable = false)
    private ConversationType type;

    @Column(name = "name", length = 128)
    private String name;

    @Column(name = "description", length = 512)
    private String description;

    @Column(name = "creator_id", length = 64)
    private String creatorId;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    public ConversationEntity() {
    }

    public ConversationEntity(String id, ConversationType type, String name, String description, String creatorId, Instant createdAt) {
        this.id = id;
        this.type = type;
        this.name = name;
        this.description = description;
        this.creatorId = creatorId;
        this.createdAt = createdAt;
    }

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public ConversationType getType() {
        return type;
    }

    public void setType(ConversationType type) {
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
}
