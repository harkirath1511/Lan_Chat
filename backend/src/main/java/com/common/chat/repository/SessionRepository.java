package com.common.chat.repository;

import com.common.chat.domain.SessionEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.Optional;

@Repository
public interface SessionRepository extends JpaRepository<SessionEntity, String> {
    Optional<SessionEntity> findByTokenHash(String tokenHash);

    @Modifying
    @Query("UPDATE SessionEntity s SET s.revoked = true WHERE s.tokenHash = :tokenHash")
    int revokeByTokenHash(@Param("tokenHash") String tokenHash);

    @Modifying
    @Query("UPDATE SessionEntity s SET s.revoked = true WHERE s.userId = :userId")
    int revokeAllForUser(@Param("userId") String userId);

    @Modifying
    @Query("DELETE FROM SessionEntity s WHERE s.expiresAt < :now OR s.revoked = true")
    int cleanupExpired(@Param("now") Instant now);
}
