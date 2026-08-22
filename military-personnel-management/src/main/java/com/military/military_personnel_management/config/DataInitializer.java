package com.military.military_personnel_management.config;

import com.military.military_personnel_management.entity.Role;
import com.military.military_personnel_management.entity.User;
import com.military.military_personnel_management.repository.RoleRepository;
import com.military.military_personnel_management.repository.UserRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

@Component
public class DataInitializer implements CommandLineRunner {

    private final RoleRepository roleRepository;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    public DataInitializer(
            RoleRepository roleRepository,
            UserRepository userRepository,
            PasswordEncoder passwordEncoder) {

        this.roleRepository = roleRepository;
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    public void run(String... args) {

        if (userRepository.findByUsername("admin").isEmpty()) {

            Role adminRole = roleRepository
                    .findByRoleName("ADMIN")
                    .orElseThrow(() ->
                            new RuntimeException("ADMIN role not found"));

            User admin = new User();

            admin.setUsername("admin");
            admin.setPassword(
                    passwordEncoder.encode("Admin@123")
            );
            admin.setRole(adminRole);
            admin.setEnabled(true);

            userRepository.save(admin);

            System.out.println(
                    "Default ADMIN user created successfully."
            );
        }
    }
}