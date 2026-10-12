package com.common.chat.repository;

import com.common.chat.domain.UserEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<UserEntity, String> {
    Optional<UserEntity> findByNormalizedUsername(String normalizedUsername);
    boolean existsByNormalizedUsername(String normalizedUsername);

    @Query("SELECT u FROM UserEntity u WHERE (:query IS NULL OR :query = '' OR LOWER(u.username) LIKE LOWER(CONCAT('%', :query, '%')) OR LOWER(u.displayName) LIKE LOWER(CONCAT('%', :query, '%'))) AND u.id <> :excludeUserId ORDER BY u.displayName ASC")
    List<UserEntity> searchUsers(@Param("query") String query, @Param("excludeUserId") String excludeUserId);
}
