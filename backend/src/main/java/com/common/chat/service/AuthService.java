package com.common.chat.service;

import com.common.chat.auth.SessionToken;
import com.common.chat.config.AppProperties;
import com.common.chat.domain.ConversationMemberEntity;
import com.common.chat.domain.SessionEntity;
import com.common.chat.domain.UserEntity;
import com.common.chat.dto.AuthResponse;
import com.common.chat.dto.LoginRequest;
import com.common.chat.dto.RegisterRequest;
import com.common.chat.dto.UserDto;
import com.common.chat.repository.ConversationMemberRepository;
import com.common.chat.repository.SessionRepository;
import com.common.chat.repository.UserRepository;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Service
@Transactional
public class AuthService {

    private final UserRepository userRepository;
    private final SessionRepository sessionRepository;
    private final ConversationMemberRepository memberRepository;
    private final PasswordEncoder passwordEncoder;
    private final AppProperties appProperties;
    private final RateLimiterService rateLimiterService;
    private final UserService userService;

    public AuthService(UserRepository userRepository,
                       SessionRepository sessionRepository,
                       ConversationMemberRepository memberRepository,
                       PasswordEncoder passwordEncoder,
                       AppProperties appProperties,
                       RateLimiterService rateLimiterService,
                       UserService userService) {
        this.userRepository = userRepository;
        this.sessionRepository = sessionRepository;
        this.memberRepository = memberRepository;
        this.passwordEncoder = passwordEncoder;
        this.appProperties = appProperties;
        this.rateLimiterService = rateLimiterService;
        this.userService = userService;
    }

    public AuthResponse register(RegisterRequest request) {
        if (!request.getPassword().equals(request.getConfirmPassword())) {
            throw new IllegalArgumentException("Passwords do not match");
        }

        String username = request.getUsername().trim();
        String normalized = username.toLowerCase();

        if (userRepository.existsByNormalizedUsername(normalized)) {
            throw new IllegalArgumentException("Username '" + username + "' is already taken");
        }

        String userId = "usr_" + UUID.randomUUID().toString().replace("-", "").substring(0, 16);
        String passwordHash = passwordEncoder.encode(request.getPassword());
        Instant now = Instant.now();

        UserEntity user = new UserEntity(
                userId,
                username,
                normalized,
                request.getDisplayName().trim(),
                passwordHash,
                now
        );
        userRepository.save(user);

        // Auto-join default public channels
        List<String> defaultChannels = List.of("chan_general", "chan_project", "chan_study");
        for (String chanId : defaultChannels) {
            String memberId = "cm_" + UUID.randomUUID().toString().replace("-", "").substring(0, 16);
            ConversationMemberEntity member = new ConversationMemberEntity(memberId, chanId, userId, now, 0L);
            memberRepository.save(member);
        }

        // Generate session
        return createSessionResponse(user);
    }

    public AuthResponse login(LoginRequest request, String clientIp) {
        String username = request.getUsername() != null ? request.getUsername().trim() : "";
        if (!rateLimiterService.allowLoginAttempt(clientIp + ":" + username)) {
            throw new IllegalStateException("Too many login attempts. Please wait a moment before trying again.");
        }

        String normalized = username.toLowerCase();
        UserEntity user = userRepository.findByNormalizedUsername(normalized)
                .orElseThrow(() -> new BadCredentialsException("Invalid username or password"));

        if (!passwordEncoder.matches(request.getPassword(), user.getPasswordHash())) {
            throw new BadCredentialsException("Invalid username or password");
        }

        return createSessionResponse(user);
    }

    public void logout(String tokenHash) {
        if (tokenHash != null && !tokenHash.isBlank()) {
            sessionRepository.revokeByTokenHash(tokenHash);
        }
    }

    @Transactional(readOnly = true)
    public UserDto getMe(String userId) {
        return userService.getUserDto(userId)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));
    }

    @Transactional(readOnly = true)
    public Optional<UserEntity> validateRawToken(String rawToken) {
        if (rawToken == null || rawToken.isBlank()) {
            return Optional.empty();
        }
        String hash = SessionToken.hashToken(rawToken);
        Optional<SessionEntity> sessionOpt = sessionRepository.findByTokenHash(hash);
        if (sessionOpt.isPresent() && sessionOpt.get().isValid()) {
            return userRepository.findById(sessionOpt.get().getUserId());
        }
        return Optional.empty();
    }

    private AuthResponse createSessionResponse(UserEntity user) {
        String rawToken = SessionToken.generateRawToken();
        String tokenHash = SessionToken.hashToken(rawToken);
        Instant now = Instant.now();
        Instant expiresAt = now.plus(appProperties.getSessionTokenValidityHours(), ChronoUnit.HOURS);

        SessionEntity session = new SessionEntity(tokenHash, user.getId(), now, expiresAt, false);
        sessionRepository.save(session);

        UserDto userDto = userService.toDto(user);
        return new AuthResponse(rawToken, expiresAt, userDto);
    }
}
