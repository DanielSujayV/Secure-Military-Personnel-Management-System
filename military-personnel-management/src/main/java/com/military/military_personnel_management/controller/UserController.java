package com.military.military_personnel_management.controller;

import com.military.military_personnel_management.dto.UserResponse;
import com.military.military_personnel_management.entity.User;
import com.military.military_personnel_management.service.UserService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/users")
public class UserController {

    private final UserService userService;

    public UserController(UserService userService) {
        this.userService = userService;
    }

    @PostMapping
    public UserResponse createUser(@RequestBody User user) {
        User createdUser = userService.createUser(user);

        return new UserResponse(
                createdUser.getId(),
                createdUser.getUsername(),
                createdUser.getRole(),
                createdUser.isEnabled()
        );
    }

    @GetMapping
    public List<UserResponse> getAllUsers() {
        return userService.getAllUsers()
                .stream()
                .map(user -> new UserResponse(
                        user.getId(),
                        user.getUsername(),
                        user.getRole(),
                        user.isEnabled()
                ))
                .toList();
    }

    @GetMapping("/{id}")
    public ResponseEntity<UserResponse> getUserById(
            @PathVariable Long id) {

        return userService.getUserById(id)
                .map(user -> ResponseEntity.ok(
                        new UserResponse(
                                user.getId(),
                                user.getUsername(),
                                user.getRole(),
                                user.isEnabled()
                        )
                ))
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/username/{username}")
    public ResponseEntity<UserResponse> getUserByUsername(
            @PathVariable String username) {

        return userService.getUserByUsername(username)
                .map(user -> ResponseEntity.ok(
                        new UserResponse(
                                user.getId(),
                                user.getUsername(),
                                user.getRole(),
                                user.isEnabled()
                        )
                ))
                .orElse(ResponseEntity.notFound().build());
    }

    @PutMapping
    public UserResponse updateUser(@RequestBody User user) {

        User updatedUser = userService.updateUser(user);

        return new UserResponse(
                updatedUser.getId(),
                updatedUser.getUsername(),
                updatedUser.getRole(),
                updatedUser.isEnabled()
        );
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteUser(@PathVariable Long id) {
        userService.deleteUser(id);
        return ResponseEntity.noContent().build();
    }
}