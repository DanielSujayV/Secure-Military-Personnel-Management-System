package com.military.military_personnel_management.dto;

import com.military.military_personnel_management.entity.Role;

public class UserResponse {

    private Long id;
    private String username;
    private Role role;
    private boolean enabled;

    public UserResponse() {
    }

    public UserResponse(Long id, String username, Role role, boolean enabled) {
        this.id = id;
        this.username = username;
        this.role = role;
        this.enabled = enabled;
    }

    public Long getId() {
        return id;
    }

    public String getUsername() {
        return username;
    }

    public Role getRole() {
        return role;
    }

    public boolean isEnabled() {
        return enabled;
    }
}