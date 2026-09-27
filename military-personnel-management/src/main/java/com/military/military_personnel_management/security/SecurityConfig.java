package com.military.military_personnel_management.security;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.ProviderManager;
import org.springframework.security.authentication.dao.DaoAuthenticationProvider;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

@Configuration
@EnableWebSecurity
public class SecurityConfig {

    private final JwtAuthenticationFilter jwtAuthenticationFilter;

    public SecurityConfig(JwtAuthenticationFilter jwtAuthenticationFilter) {
        this.jwtAuthenticationFilter = jwtAuthenticationFilter;
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public AuthenticationManager authenticationManager(
            CustomUserDetailsService userDetailsService,
            PasswordEncoder passwordEncoder) {

        DaoAuthenticationProvider authenticationProvider =
                new DaoAuthenticationProvider(userDetailsService);

        authenticationProvider.setPasswordEncoder(passwordEncoder);

        return new ProviderManager(authenticationProvider);
    }

    @Bean
    public SecurityFilterChain securityFilterChain(
            HttpSecurity http) throws Exception {

        http
                .csrf(csrf -> csrf.disable())

                // Enable the CORS configuration from CorsConfig.java
                .cors(Customizer.withDefaults())

                .formLogin(form -> form.disable())
                .httpBasic(basic -> basic.disable())

                .sessionManagement(session ->
                        session.sessionCreationPolicy(
                                SessionCreationPolicy.STATELESS
                        )
                )

                .authorizeHttpRequests(auth -> auth

                        // ==============================
                        // AUTHENTICATION
                        // ==============================

                        .requestMatchers(
                                HttpMethod.POST,
                                "/api/auth/login"
                        )
                        .permitAll()

                        .requestMatchers(
                                "/api/auth/**"
                        )
                        .permitAll()

                        // Allow Spring Boot error handling
                        // to return the original controller status code.
                        .requestMatchers(
                                "/error"
                        )
                        .permitAll()

                        // ==============================
                        // USERS - ADMIN ONLY
                        // ==============================

                        .requestMatchers(
                                "/api/users",
                                "/api/users/**"
                        )
                        .hasAuthority("ROLE_ADMIN")

                        // ==============================
                        // ROLES - ADMIN ONLY
                        // ==============================

                        .requestMatchers(
                                "/api/roles",
                                "/api/roles/**"
                        )
                        .hasAuthority("ROLE_ADMIN")

                        // ==============================
                        // PERSONNEL
                        // ADMIN + COMMANDER + OFFICER + PERSONNEL
                        // ==============================

                        .requestMatchers(
                                "/api/personnel",
                                "/api/personnel/**"
                        )
                        .hasAnyAuthority(
                                "ROLE_ADMIN",
                                "ROLE_COMMANDER",
                                "ROLE_OFFICER",
                                "ROLE_PERSONNEL"
                        )

                        // ==============================
                        // LEAVE APPROVAL / REJECTION
                        // COMMANDER ONLY
                        // ==============================

                        .requestMatchers(
                                "/api/leave-requests/*/approve",
                                "/api/leave-requests/*/reject"
                        )
                        .hasAuthority("ROLE_COMMANDER")

                        // ==============================
                        // LEAVE REQUESTS
                        // ADMIN + COMMANDER + OFFICER + PERSONNEL
                        // ==============================

                        .requestMatchers(
                                "/api/leave-requests",
                                "/api/leave-requests/**"
                        )
                        .hasAnyAuthority(
                                "ROLE_ADMIN",
                                "ROLE_COMMANDER",
                                "ROLE_OFFICER",
                                "ROLE_PERSONNEL"
                        )

                        // ==============================
                        // PROMOTIONS
                        // ADMIN + COMMANDER
                        // ==============================

                        .requestMatchers(
                                "/api/promotions",
                                "/api/promotions/**"
                        )
                        .hasAnyAuthority(
                                "ROLE_ADMIN",
                                "ROLE_COMMANDER"
                        )

                        // ==============================
                        // UNITS
                        // ADMIN + COMMANDER
                        // ==============================

                        .requestMatchers(
                                "/api/units",
                                "/api/units/**"
                        )
                        .hasAnyAuthority(
                                "ROLE_ADMIN",
                                "ROLE_COMMANDER"
                        )

                        // ==============================
                        // AUDIT LOGS
                        // ADMIN ONLY
                        // ==============================

                        .requestMatchers(
                                "/api/audit-logs",
                                "/api/audit-logs/**"
                        )
                        .hasAuthority("ROLE_ADMIN")

                        // ==============================
                        // EVERYTHING ELSE
                        // ==============================

                        .anyRequest()
                        .authenticated()
                )

                // JWT authentication
                .addFilterBefore(
                        jwtAuthenticationFilter,
                        UsernamePasswordAuthenticationFilter.class
                );

        return http.build();
    }
}