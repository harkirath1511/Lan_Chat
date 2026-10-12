package com.common.chat.auth;

import com.common.chat.domain.UserEntity;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

import java.util.Collection;
import java.util.List;

public class UserPrincipal implements UserDetails {

    private final UserEntity user;
    private final String sessionTokenHash;

    public UserPrincipal(UserEntity user, String sessionTokenHash) {
        this.user = user;
        this.sessionTokenHash = sessionTokenHash;
    }

    public UserEntity getUser() {
        return user;
    }

    public String getId() {
        return user.getId();
    }

    public String getDisplayName() {
        return user.getDisplayName();
    }

    public String getSessionTokenHash() {
        return sessionTokenHash;
    }

    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {
        return List.of(new SimpleGrantedAuthority("ROLE_USER"));
    }

    @Override
    public String getPassword() {
        return user.getPasswordHash();
    }

    @Override
    public String getUsername() {
        return user.getUsername();
    }

    @Override
    public boolean isAccountNonExpired() {
        return true;
    }

    @Override
    public boolean isAccountNonLocked() {
        return true;
    }

    @Override
    public boolean isCredentialsNonExpired() {
        return true;
    }

    @Override
    public boolean isEnabled() {
        return true;
    }
}
