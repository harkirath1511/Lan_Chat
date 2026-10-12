package com.common.chat.repository;

import com.common.chat.domain.ConversationMemberEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ConversationMemberRepository extends JpaRepository<ConversationMemberEntity, String> {
    List<ConversationMemberEntity> findByConversationId(String conversationId);
    List<ConversationMemberEntity> findByUserId(String userId);
    Optional<ConversationMemberEntity> findByConversationIdAndUserId(String conversationId, String userId);
    boolean existsByConversationIdAndUserId(String conversationId, String userId);

    @Query("SELECT cm.userId FROM ConversationMemberEntity cm WHERE cm.conversationId = :conversationId")
    List<String> findUserIdsByConversationId(@Param("conversationId") String conversationId);

    long countByConversationId(String conversationId);

    void deleteByConversationIdAndUserId(String conversationId, String userId);

    @Modifying
    @Query("UPDATE ConversationMemberEntity cm SET cm.lastReadSeq = :seq WHERE cm.conversationId = :conversationId AND cm.userId = :userId AND cm.lastReadSeq < :seq")
    int updateLastReadSeq(@Param("conversationId") String conversationId, @Param("userId") String userId, @Param("seq") long seq);
}
