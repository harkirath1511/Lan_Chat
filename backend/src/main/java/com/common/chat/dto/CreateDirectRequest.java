package com.common.chat.dto;

import jakarta.validation.constraints.NotBlank;

public class CreateDirectRequest {

    @NotBlank(message = "Target user ID is required")
    private String targetUserId;

    public CreateDirectRequest() {
    }

    public CreateDirectRequest(String targetUserId) {
        this.targetUserId = targetUserId;
    }

    public String getTargetUserId() {
        return targetUserId;
    }

    public void setTargetUserId(String targetUserId) {
        this.targetUserId = targetUserId;
    }
}
