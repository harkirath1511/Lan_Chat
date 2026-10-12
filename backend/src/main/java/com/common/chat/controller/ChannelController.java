package com.common.chat.controller;

import com.common.chat.auth.UserPrincipal;
import com.common.chat.dto.ConversationDto;
import com.common.chat.dto.CreateChannelRequest;
import com.common.chat.service.ConversationService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/channels")
public class ChannelController {

    private final ConversationService conversationService;

    public ChannelController(ConversationService conversationService) {
        this.conversationService = conversationService;
    }

    @GetMapping
    public ResponseEntity<List<ConversationDto>> listChannels(@AuthenticationPrincipal UserPrincipal principal) {
        List<ConversationDto> channels = conversationService.listPublicChannels(principal.getId());
        return ResponseEntity.ok(channels);
    }

    @PostMapping
    public ResponseEntity<ConversationDto> createChannel(
            @Valid @RequestBody CreateChannelRequest request,
            @AuthenticationPrincipal UserPrincipal principal) {
        ConversationDto created = conversationService.createChannel(principal.getId(), request);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    @PostMapping("/{id}/join")
    public ResponseEntity<Map<String, String>> joinChannel(
            @PathVariable String id,
            @AuthenticationPrincipal UserPrincipal principal) {
        conversationService.joinChannel(principal.getId(), id);
        return ResponseEntity.ok(Map.of("message", "Joined channel successfully"));
    }

    @DeleteMapping("/{id}/membership")
    public ResponseEntity<Map<String, String>> leaveChannel(
            @PathVariable String id,
            @AuthenticationPrincipal UserPrincipal principal) {
        conversationService.leaveChannel(principal.getId(), id);
        return ResponseEntity.ok(Map.of("message", "Left channel successfully"));
    }
}
