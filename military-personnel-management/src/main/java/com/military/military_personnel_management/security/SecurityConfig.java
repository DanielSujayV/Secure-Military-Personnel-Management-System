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
                .cors(Customizer.withDefaults())
                .formLogin(form -> form.disable())
                .httpBasic(basic -> basic.disable())
                .sessionManagement(session ->
                        session.sessionCreationPolicy(
                                SessionCreationPolicy.STATELESS
                        )
                )
                .authorizeHttpRequests(auth -> auth

                        // AUTHENTICATION
                        .requestMatchers(
                                HttpMethod.POST,
                                "/api/auth/login"
                        ).permitAll()

                        .requestMatchers("/api/auth/**").permitAll()

                        // SPRING BOOT ERROR HANDLING
                        .requestMatchers("/error").permitAll()

                        // ADMIN DASHBOARD
                        .requestMatchers(
                                HttpMethod.GET,
                                "/api/admin/dashboard"
                        ).hasAuthority("ROLE_ADMIN")

                        // ADMIN-ONLY TOTP ENROLLMENT FOR OTHER USERS
                        .requestMatchers(
                                "/api/totp/setup-for-user",
                                "/api/totp/confirm-for-user"
                        ).hasAuthority("ROLE_ADMIN")

                        // ADMIN-ONLY TPM REGISTRATION FOR OTHER USERS
                        .requestMatchers(
                                "/api/tpm/register-for-user"
                        ).hasAuthority("ROLE_ADMIN")

                        // USERS - ADMIN ONLY
                        .requestMatchers(
                                "/api/users",
                                "/api/users/**"
                        ).hasAuthority("ROLE_ADMIN")

                        // ROLES - ADMIN ONLY
                        .requestMatchers(
                                "/api/roles",
                                "/api/roles/**"
                        ).hasAuthority("ROLE_ADMIN")

                        // PERSONNEL
                        .requestMatchers(
                                "/api/personnel",
                                "/api/personnel/**"
                        ).hasAnyAuthority(
                                "ROLE_ADMIN",
                                "ROLE_COMMANDER",
                                "ROLE_OFFICER",
                                "ROLE_PERSONNEL"
                        )

                        // LEAVE APPROVAL / REJECTION - COMMANDER ONLY
                        .requestMatchers(
                                "/api/leave-requests/*/approve",
                                "/api/leave-requests/*/reject"
                        ).hasAuthority("ROLE_COMMANDER")

                        // LEAVE REQUESTS
                        .requestMatchers(
                                "/api/leave-requests",
                                "/api/leave-requests/**"
                        ).hasAnyAuthority(
                                "ROLE_ADMIN",
                                "ROLE_COMMANDER",
                                "ROLE_OFFICER",
                                "ROLE_PERSONNEL"
                        )

                        // PROMOTIONS
                        .requestMatchers(
                                "/api/promotions",
                                "/api/promotions/**"
                        ).hasAnyAuthority(
                                "ROLE_ADMIN",
                                "ROLE_COMMANDER"
                        )

                        // UNITS
                        .requestMatchers(
                                "/api/units",
                                "/api/units/**"
                        ).hasAnyAuthority(
                                "ROLE_ADMIN",
                                "ROLE_COMMANDER"
                        )

                        // AUDIT LOGS - ADMIN ONLY
                        .requestMatchers(
                                "/api/audit-logs",
                                "/api/audit-logs/**"
                        ).hasAuthority("ROLE_ADMIN")

                        // ALL OTHER ENDPOINTS REQUIRE AUTHENTICATION
                        .anyRequest().authenticated()
                )

                .addFilterBefore(
                        jwtAuthenticationFilter,
                        UsernamePasswordAuthenticationFilter.class
                );

        return http.build();
    }
}
