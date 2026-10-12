package com.common.chat.domain;

import jakarta.persistence.*;
import org.hibernate.annotations.Generated;
import org.hibernate.generator.EventType;
import java.time.Instant;

@Entity
@Table(name = "messages", uniqueConstraints = {
    @UniqueConstraint(columnNames = {"sender_id", "client_message_id"})
})
public class MessageEntity {

    @Id
    @Column(name = "id", length = 64, nullable = false)
    private String id;

    @Generated(event = EventType.INSERT)
    @Column(name = "sequence_num", nullable = false, insertable = false, updatable = false)
    private Long sequenceNum;

    @Column(name = "conversation_id", length = 64, nullable = false)
    private String conversationId;

    @Column(name = "sender_id", length = 64, nullable = false)
    private String senderId;

    @Column(name = "client_message_id", length = 128, nullable = false)
    private String clientMessageId;

    @Column(name = "content", length = 4000, nullable = false)
    private String content;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    public MessageEntity() {
    }

    public MessageEntity(String id, String conversationId, String senderId, String clientMessageId, String content, Instant createdAt) {
        this.id = id;
        this.conversationId = conversationId;
        this.senderId = senderId;
        this.clientMessageId = clientMessageId;
        this.content = content;
        this.createdAt = createdAt;
    }

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public Long getSequenceNum() {
        return sequenceNum;
    }

    public void setSequenceNum(Long sequenceNum) {
        this.sequenceNum = sequenceNum;
    }

    public String getConversationId() {
        return conversationId;
    }

    public void setConversationId(String conversationId) {
        this.conversationId = conversationId;
    }

    public String getSenderId() {
        return senderId;
    }

    public void setSenderId(String senderId) {
        this.senderId = senderId;
    }

    public String getClientMessageId() {
        return clientMessageId;
    }

    public void setClientMessageId(String clientMessageId) {
        this.clientMessageId = clientMessageId;
    }

    public String getContent() {
        return content;
    }

    public void setContent(String content) {
        this.content = content;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(Instant createdAt) {
        this.createdAt = createdAt;
    }
}
