package com.common.chat.websocket;

public enum WsEventType {
    // Client events
    AUTHENTICATE,
    MESSAGE_SEND,
    TYPING_START,
    TYPING_STOP,
    PRESENCE_SET,
    READ_UPDATE,
    PING,

    // Server events
    AUTHENTICATED,
    MESSAGE_ACK,
    MESSAGE_CREATED,
    PRESENCE_SNAPSHOT,
    PRESENCE_UPDATED,
    TYPING_UPDATED,
    READ_UPDATED,
    CONVERSATION_UPDATED,
    ERROR,
    PONG
}
