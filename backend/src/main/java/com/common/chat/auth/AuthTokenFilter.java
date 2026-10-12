package com.common.chat.auth;

import com.common.chat.domain.SessionEntity;
import com.common.chat.domain.UserEntity;
import com.common.chat.repository.SessionRepository;
import com.common.chat.repository.UserRepository;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.Optional;

@Component
public class AuthTokenFilter extends OncePerRequestFilter {

    private final SessionRepository sessionRepository;
    private final UserRepository userRepository;

    public AuthTokenFilter(SessionRepository sessionRepository, UserRepository userRepository) {
        this.sessionRepository = sessionRepository;
        this.userRepository = userRepository;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {

        String authHeader = request.getHeader("Authorization");
        if (authHeader != null && authHeader.startsWith("Bearer ")) {
            String rawToken = authHeader.substring(7).trim();
            if (!rawToken.isEmpty()) {
                String tokenHash = SessionToken.hashToken(rawToken);
                Optional<SessionEntity> sessionOpt = sessionRepository.findByTokenHash(tokenHash);

                if (sessionOpt.isPresent()) {
                    SessionEntity session = sessionOpt.get();
                    if (session.isValid()) {
                        Optional<UserEntity> userOpt = userRepository.findById(session.getUserId());
                        if (userOpt.isPresent()) {
                            UserPrincipal principal = new UserPrincipal(userOpt.get(), tokenHash);
                            UsernamePasswordAuthenticationToken authentication =
                                    new UsernamePasswordAuthenticationToken(principal, null, principal.getAuthorities());
                            authentication.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
                            SecurityContextHolder.getContext().setAuthentication(authentication);
                        }
                    }
                }
            }
        }

        filterChain.doFilter(request, response);
    }
}
