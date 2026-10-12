package com.common.chat.service;

import com.common.chat.domain.UserEntity;
import com.common.chat.dto.UserDto;
import com.common.chat.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

@Service
@Transactional(readOnly = true)
public class UserService {

    private final UserRepository userRepository;
    private final PresenceService presenceService;

    public UserService(UserRepository userRepository, PresenceService presenceService) {
        this.userRepository = userRepository;
        this.presenceService = presenceService;
    }

    public List<UserDto> searchUsers(String query, String excludeUserId) {
        List<UserEntity> entities = userRepository.searchUsers(query, excludeUserId);
        return entities.stream().map(this::toDto).toList();
    }

    public Optional<UserDto> getUserDto(String id) {
        return userRepository.findById(id).map(this::toDto);
    }

    public UserDto toDto(UserEntity entity) {
        String status = presenceService.getUserStatus(entity.getId());
        return new UserDto(
                entity.getId(),
                entity.getUsername(),
                entity.getDisplayName(),
                entity.getCreatedAt(),
                status
        );
    }
}
