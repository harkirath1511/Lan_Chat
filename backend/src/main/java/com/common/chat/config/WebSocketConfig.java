package com.common.chat.config;

import com.common.chat.websocket.ChatWebSocketHandler;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.socket.config.annotation.EnableWebSocket;
import org.springframework.web.socket.config.annotation.WebSocketConfigurer;
import org.springframework.web.socket.config.annotation.WebSocketHandlerRegistry;

import java.util.List;

@Configuration
@EnableWebSocket
public class WebSocketConfig implements WebSocketConfigurer {

    private final ChatWebSocketHandler chatWebSocketHandler;
    private final AppProperties appProperties;

    public WebSocketConfig(ChatWebSocketHandler chatWebSocketHandler, AppProperties appProperties) {
        this.chatWebSocketHandler = chatWebSocketHandler;
        this.appProperties = appProperties;
    }

    @Override
    public void registerWebSocketHandlers(WebSocketHandlerRegistry registry) {
        List<String> origins = appProperties.getAllowedOriginsList();
        String[] allowed = origins.isEmpty() ? new String[]{"*"} : origins.toArray(new String[0]);

        registry.addHandler(chatWebSocketHandler, "/ws/chat")
                .setAllowedOrigins(allowed);
    }
}
