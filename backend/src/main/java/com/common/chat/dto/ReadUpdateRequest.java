package com.common.chat.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

public class ReadUpdateRequest {

    @NotNull(message = "Sequence number is required")
    @Min(value = 0, message = "Sequence number must be non-negative")
    private Long sequenceNum;

    public ReadUpdateRequest() {
    }

    public ReadUpdateRequest(Long sequenceNum) {
        this.sequenceNum = sequenceNum;
    }

    public Long getSequenceNum() {
        return sequenceNum;
    }

    public void setSequenceNum(Long sequenceNum) {
        this.sequenceNum = sequenceNum;
    }
}
