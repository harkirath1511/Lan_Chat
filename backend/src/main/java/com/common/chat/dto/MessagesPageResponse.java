package com.common.chat.dto;

import java.util.List;

public class MessagesPageResponse {
    private List<MessageDto> messages;
    private boolean hasMore;
    private Long oldestSequence;
    private Long newestSequence;

    public MessagesPageResponse() {
    }

    public MessagesPageResponse(List<MessageDto> messages, boolean hasMore, Long oldestSequence, Long newestSequence) {
        this.messages = messages;
        this.hasMore = hasMore;
        this.oldestSequence = oldestSequence;
        this.newestSequence = newestSequence;
    }

    public List<MessageDto> getMessages() {
        return messages;
    }

    public void setMessages(List<MessageDto> messages) {
        this.messages = messages;
    }

    public boolean isHasMore() {
        return hasMore;
    }

    public void setHasMore(boolean hasMore) {
        this.hasMore = hasMore;
    }

    public Long getOldestSequence() {
        return oldestSequence;
    }

    public void setOldestSequence(Long oldestSequence) {
        this.oldestSequence = oldestSequence;
    }

    public Long getNewestSequence() {
        return newestSequence;
    }

    public void setNewestSequence(Long newestSequence) {
        this.newestSequence = newestSequence;
    }
}
