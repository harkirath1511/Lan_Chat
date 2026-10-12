package com.common.chat.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public class CreateChannelRequest {

    @NotBlank(message = "Channel name is required")
    @Size(min = 2, max = 64, message = "Channel name must be between 2 and 64 characters")
    @Pattern(regexp = "^[a-z0-9_-]+$", message = "Channel name can only contain lowercase letters, numbers, hyphens, and underscores")
    private String name;

    @Size(max = 512, message = "Description cannot exceed 512 characters")
    private String description;

    public CreateChannelRequest() {
    }

    public CreateChannelRequest(String name, String description) {
        this.name = name;
        this.description = description;
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
}
