package com.common.chat.controller;

import com.common.chat.auth.UserPrincipal;
import com.common.chat.dto.*;
import com.common.chat.service.ConversationService;
import com.common.chat.service.MessageService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/conversations")
public class ConversationController {

    private final ConversationService conversationService;
    private final MessageService messageService;

    public ConversationController(ConversationService conversationService, MessageService messageService) {
        this.conversationService = conversationService;
        this.messageService = messageService;
    }

    @GetMapping
    public ResponseEntity<List<ConversationDto>> listConversations(@AuthenticationPrincipal UserPrincipal principal) {
        List<ConversationDto> conversations = conversationService.listUserConversations(principal.getId());
        return ResponseEntity.ok(conversations);
    }

    @PostMapping("/direct")
    public ResponseEntity<ConversationDto> getOrCreateDirect(
            @Valid @RequestBody CreateDirectRequest request,
            @AuthenticationPrincipal UserPrincipal principal) {
        ConversationDto conv = conversationService.getOrCreateDirectConversation(principal.getId(), request.getTargetUserId());
        return ResponseEntity.ok(conv);
    }

    @GetMapping("/{id}/members")
    public ResponseEntity<List<MemberDto>> getMembers(
            @PathVariable String id,
            @AuthenticationPrincipal UserPrincipal principal) {
        List<MemberDto> members = conversationService.getConversationMembers(principal.getId(), id);
        return ResponseEntity.ok(members);
    }

    @GetMapping("/{id}/messages")
    public ResponseEntity<MessagesPageResponse> getMessages(
            @PathVariable String id,
            @RequestParam(required = false) Long cursor,
            @RequestParam(required = false, defaultValue = "older") String direction,
            @RequestParam(required = false, defaultValue = "50") int limit,
            @AuthenticationPrincipal UserPrincipal principal) {

        MessagesPageResponse response;
        if (cursor == null) {
            response = messageService.getLatestMessages(principal.getId(), id, limit);
        } else if ("newer".equalsIgnoreCase(direction)) {
            response = messageService.getNewerMessages(principal.getId(), id, cursor, limit);
        } else {
            response = messageService.getOlderMessages(principal.getId(), id, cursor, limit);
        }
        return ResponseEntity.ok(response);
    }

    @GetMapping("/{id}/messages/search")
    public ResponseEntity<List<MessageDto>> searchMessages(
            @PathVariable String id,
            @RequestParam(required = false, defaultValue = "") String query,
            @RequestParam(required = false, defaultValue = "50") int limit,
            @AuthenticationPrincipal UserPrincipal principal) {
        List<MessageDto> results = messageService.searchMessages(principal.getId(), id, query, limit);
        return ResponseEntity.ok(results);
    }

    @PostMapping("/{id}/read")
    public ResponseEntity<Map<String, String>> markRead(
            @PathVariable String id,
            @Valid @RequestBody ReadUpdateRequest request,
            @AuthenticationPrincipal UserPrincipal principal) {
        conversationService.updateLastRead(principal.getId(), id, request.getSequenceNum());
        return ResponseEntity.ok(Map.of("message", "Read position updated"));
    }
}
