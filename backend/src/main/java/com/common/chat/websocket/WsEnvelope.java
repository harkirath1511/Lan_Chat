package com.common.chat.websocket;

import com.fasterxml.jackson.annotation.JsonInclude;

@JsonInclude(JsonInclude.Include.NON_NULL)
public class WsEnvelope {
    private WsEventType type;
    private String requestId;
    private Object payload;

    public WsEnvelope() {
    }

    public WsEnvelope(WsEventType type, Object payload) {
        this.type = type;
        this.payload = payload;
    }

    public WsEnvelope(WsEventType type, String requestId, Object payload) {
        this.type = type;
        this.requestId = requestId;
        this.payload = payload;
    }

    public static WsEnvelope of(WsEventType type, Object payload) {
        return new WsEnvelope(type, payload);
    }

    public static WsEnvelope of(WsEventType type, String requestId, Object payload) {
        return new WsEnvelope(type, requestId, payload);
    }

    public WsEventType getType() {
        return type;
    }

    public void setType(WsEventType type) {
        this.type = type;
    }

    public String getRequestId() {
        return requestId;
    }

    public void setRequestId(String requestId) {
        this.requestId = requestId;
    }

    public Object getPayload() {
        return payload;
    }

    public void setPayload(Object payload) {
        this.payload = payload;
    }
}
