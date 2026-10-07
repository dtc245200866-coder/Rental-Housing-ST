package com.rentalhousing.backend;

import com.rentalhousing.backend.security.JwtAuthenticationFilter;
import com.rentalhousing.backend.security.PermissionAuthorizationManager;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

@Configuration
public class SecurityConfig {

    private final JwtAuthenticationFilter jwtAuthenticationFilter;
    private final PermissionAuthorizationManager permissionAuthorizationManager;

    public SecurityConfig(
            JwtAuthenticationFilter jwtAuthenticationFilter,
            PermissionAuthorizationManager permissionAuthorizationManager) {
        this.jwtAuthenticationFilter = jwtAuthenticationFilter;
        this.permissionAuthorizationManager = permissionAuthorizationManager;
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
                .cors(cors -> {})
                .csrf(csrf -> csrf.disable())
                .sessionManagement(session ->
                        session.sessionCreationPolicy(SessionCreationPolicy.STATELESS)
                )
                .authorizeHttpRequests(auth -> auth
                        .requestMatchers(
                                "/api/auth/register",
                                "/api/auth/login",
                                "/api/auth/refresh",
                                "/api/auth/logout",
                                "/api/auth/forgot-password",
                                "/api/auth/reset-password",
                                "/api/auth/reset-password/**",
                                "/api/auth/verify-email",
                                "/error"
                        ).permitAll()

                        // Trang công khai: tìm kiếm + chi tiết tin đăng
                        .requestMatchers(HttpMethod.GET, "/api/public/**").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/room-images/*").permitAll()

                        // Dữ liệu của chính tenant (kiểm tra scope trong controller)
                        .requestMatchers("/api/my/**").authenticated()

                        // Quyền kiểm tra từ DB
                        .requestMatchers("/api/admin/**").access(permissionAuthorizationManager)
                        .requestMatchers("/api/buildings/**").access(permissionAuthorizationManager)
                        .requestMatchers("/api/rooms/**").access(permissionAuthorizationManager)
                        .requestMatchers("/api/services/**").access(permissionAuthorizationManager)
                        .requestMatchers("/api/listings/**").access(permissionAuthorizationManager)
                        .requestMatchers("/api/requests/**").access(permissionAuthorizationManager)
                        .requestMatchers("/api/contracts/**").access(permissionAuthorizationManager)
                        .requestMatchers("/api/meter-readings/**").access(permissionAuthorizationManager)
                        .requestMatchers("/api/invoices/**").access(permissionAuthorizationManager)
                        .requestMatchers("/api/payments/**").access(permissionAuthorizationManager)
                        .requestMatchers("/api/debts/**").access(permissionAuthorizationManager)
                        .requestMatchers("/api/maintenance/**").access(permissionAuthorizationManager)
                        .requestMatchers("/api/reports/**").access(permissionAuthorizationManager)
                        .requestMatchers("/api/profile/**").authenticated()

                        // Audit log: chỉ ADMIN
                        .requestMatchers("/api/audit-logs/**").hasRole("ADMIN")

                        .requestMatchers("/api/auth/me").authenticated()

                        .anyRequest().authenticated()
                )
                .addFilterBefore(
                        jwtAuthenticationFilter,
                        UsernamePasswordAuthenticationFilter.class
                );

        return http.build();
    }
}
