package com.common.chat.repository;

import com.common.chat.domain.MessageEntity;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface MessageRepository extends JpaRepository<MessageEntity, String> {

    Optional<MessageEntity> findBySenderIdAndClientMessageId(String senderId, String clientMessageId);

    // Latest messages (descending for page, client can reverse)
    @Query("SELECT m FROM MessageEntity m WHERE m.conversationId = :conversationId ORDER BY m.sequenceNum DESC")
    List<MessageEntity> findLatestMessages(@Param("conversationId") String conversationId, Pageable pageable);

    // Messages older than cursor
    @Query("SELECT m FROM MessageEntity m WHERE m.conversationId = :conversationId AND m.sequenceNum < :cursor ORDER BY m.sequenceNum DESC")
    List<MessageEntity> findOlderMessages(@Param("conversationId") String conversationId, @Param("cursor") long cursor, Pageable pageable);

    // Messages newer than cursor (for reconnect catch-up)
    @Query("SELECT m FROM MessageEntity m WHERE m.conversationId = :conversationId AND m.sequenceNum > :cursor ORDER BY m.sequenceNum ASC")
    List<MessageEntity> findNewerMessages(@Param("conversationId") String conversationId, @Param("cursor") long cursor, Pageable pageable);

    // Search messages in conversation
    @Query("SELECT m FROM MessageEntity m WHERE m.conversationId = :conversationId AND LOWER(m.content) LIKE LOWER(CONCAT('%', :query, '%')) ORDER BY m.sequenceNum DESC")
    List<MessageEntity> searchMessages(@Param("conversationId") String conversationId, @Param("query") String query, Pageable pageable);

    // Count unread messages (after last read sequence, excluding sender's own messages)
    @Query("SELECT COUNT(m) FROM MessageEntity m WHERE m.conversationId = :conversationId AND m.sequenceNum > :lastReadSeq AND m.senderId <> :userId")
    long countUnread(@Param("conversationId") String conversationId, @Param("lastReadSeq") long lastReadSeq, @Param("userId") String userId);
}
