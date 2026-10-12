package com.common.chat.dto;

import java.time.Instant;

public class MessageDto {
    private String id;
    private long sequenceNum;
    private String conversationId;
    private String senderId;
    private String senderName;
    private String clientMessageId;
    private String content;
    private Instant createdAt;

    public MessageDto() {
    }

    public MessageDto(String id, long sequenceNum, String conversationId, String senderId, String senderName, String clientMessageId, String content, Instant createdAt) {
        this.id = id;
        this.sequenceNum = sequenceNum;
        this.conversationId = conversationId;
        this.senderId = senderId;
        this.senderName = senderName;
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

    public long getSequenceNum() {
        return sequenceNum;
    }

    public void setSequenceNum(long sequenceNum) {
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

    public String getSenderName() {
        return senderName;
    }

    public void setSenderName(String senderName) {
        this.senderName = senderName;
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
