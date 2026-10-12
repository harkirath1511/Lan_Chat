package com.common.chat.repository;

import com.common.chat.domain.ConversationEntity;
import com.common.chat.domain.ConversationType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ConversationRepository extends JpaRepository<ConversationEntity, String> {
    List<ConversationEntity> findByType(ConversationType type);

    @Query("SELECT c FROM ConversationEntity c JOIN ConversationMemberEntity cm ON c.id = cm.conversationId WHERE cm.userId = :userId ORDER BY c.createdAt DESC")
    List<ConversationEntity> findByUserId(@Param("userId") String userId);

    @Query("SELECT c FROM ConversationEntity c WHERE c.type = 'DIRECT' AND c.id IN (" +
           "SELECT cm1.conversationId FROM ConversationMemberEntity cm1 JOIN ConversationMemberEntity cm2 ON cm1.conversationId = cm2.conversationId " +
           "WHERE cm1.userId = :user1 AND cm2.userId = :user2)")
    Optional<ConversationEntity> findDirectBetween(@Param("user1") String user1, @Param("user2") String user2);

    boolean existsByNameIgnoreCaseAndType(String name, ConversationType type);
}
