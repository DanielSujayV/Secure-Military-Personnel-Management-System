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

    private static final String[] PERSONNEL_READ_ROLES = {
            "ROLE_ADMIN", "ROLE_COMMANDER", "ROLE_OFFICER", "ROLE_PERSONNEL"
    };
    private static final String[] PERSONNEL_MANAGE_ROLES = {
            "ROLE_ADMIN", "ROLE_COMMANDER"
    };

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
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
                .csrf(csrf -> csrf.disable())
                .cors(Customizer.withDefaults())
                .formLogin(form -> form.disable())
                .httpBasic(basic -> basic.disable())
                .sessionManagement(session ->
                        session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .authorizeHttpRequests(auth -> auth
                        .requestMatchers(HttpMethod.POST, "/api/auth/login").permitAll()
                        .requestMatchers("/api/auth/**").permitAll()
                        .requestMatchers("/error").permitAll()

                        // Only administrators may provision credentials/devices for other users.
                        .requestMatchers(
                                "/api/totp/setup-for-user",
                                "/api/totp/confirm-for-user",
                                "/api/tpm/register-for-user"
                        ).hasAuthority("ROLE_ADMIN")

                        .requestMatchers("/api/users", "/api/users/**")
                        .hasAuthority("ROLE_ADMIN")
                        .requestMatchers("/api/roles", "/api/roles/**")
                        .hasAuthority("ROLE_ADMIN")

                        // Personnel: all roles may read; only ADMIN and COMMANDER may mutate.
                        .requestMatchers(HttpMethod.GET, "/api/personnel", "/api/personnel/**")
                        .hasAnyAuthority(PERSONNEL_READ_ROLES)
                        .requestMatchers(
                                HttpMethod.POST, "/api/personnel", "/api/personnel/**")
                        .hasAnyAuthority(PERSONNEL_MANAGE_ROLES)
                        .requestMatchers(
                                HttpMethod.PUT, "/api/personnel", "/api/personnel/**")
                        .hasAnyAuthority(PERSONNEL_MANAGE_ROLES)
                        .requestMatchers(
                                HttpMethod.DELETE, "/api/personnel", "/api/personnel/**")
                        .hasAnyAuthority(PERSONNEL_MANAGE_ROLES)

                        // Leave: every role may view and submit. Only ADMIN/COMMANDER
                        // may change, delete, approve, or reject an existing request.
                        .requestMatchers(HttpMethod.GET, "/api/leave-requests", "/api/leave-requests/**")
                        .hasAnyAuthority(PERSONNEL_READ_ROLES)
                        .requestMatchers(HttpMethod.POST, "/api/leave-requests", "/api/leave-requests/**")
                        .hasAnyAuthority(PERSONNEL_READ_ROLES)
                        .requestMatchers(
                                HttpMethod.PUT,
                                "/api/leave-requests",
                                "/api/leave-requests/**"
                        ).hasAnyAuthority(PERSONNEL_MANAGE_ROLES)
                        .requestMatchers(
                                HttpMethod.DELETE,
                                "/api/leave-requests",
                                "/api/leave-requests/**"
                        ).hasAnyAuthority(PERSONNEL_MANAGE_ROLES)

                        .requestMatchers("/api/promotions", "/api/promotions/**")
                        .hasAnyAuthority(PERSONNEL_MANAGE_ROLES)
                        .requestMatchers("/api/units", "/api/units/**")
                        .hasAnyAuthority(PERSONNEL_MANAGE_ROLES)
                        .requestMatchers("/api/audit-logs", "/api/audit-logs/**")
                        .hasAuthority("ROLE_ADMIN")

                        .anyRequest().authenticated()
                )
                .addFilterBefore(
                        jwtAuthenticationFilter,
                        UsernamePasswordAuthenticationFilter.class
                );

        return http.build();
    }
}