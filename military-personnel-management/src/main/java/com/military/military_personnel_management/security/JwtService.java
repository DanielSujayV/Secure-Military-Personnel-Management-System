package com.military.military_personnel_management.security;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Service;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.util.Date;
import java.util.HashMap;
import java.util.Map;
import java.util.function.Function;

@Service
public class JwtService {

    @Value("${jwt.secret}")
    private String secretKey;

    @Value("${jwt.expiration-ms}")
    private long expirationMs;

    private SecretKey getSigningKey() {
        return Keys.hmacShaKeyFor(
                secretKey.getBytes(StandardCharsets.UTF_8)
        );
    }

    /**
     * Generates a short-lived pre-authentication token.
     *
     * Password authentication has succeeded,
     * but TPM and TOTP have not yet been completed.
     */
    public String generatePreAuthToken(
            UserDetails userDetails) {

        Map<String, Object> claims = new HashMap<>();

        claims.put("tpmVerified", false);
        claims.put("totpVerified", false);

        return buildToken(
                claims,
                userDetails.getUsername(),
                5 * 60 * 1000L
        );
    }

    /**
     * Generates a short-lived token after successful TPM verification.
     *
     * TPM authentication has succeeded,
     * but TOTP has not yet been completed.
     */
    public String generateTpmVerifiedToken(
            UserDetails userDetails) {

        Map<String, Object> claims = new HashMap<>();

        claims.put("tpmVerified", true);
        claims.put("totpVerified", false);

        return buildToken(
                claims,
                userDetails.getUsername(),
                5 * 60 * 1000L
        );
    }

    /**
     * Generates the final fully authenticated token.
     *
     * Both TPM and TOTP verification have succeeded.
     */
    public String generateToken(
            UserDetails userDetails) {

        Map<String, Object> claims = new HashMap<>();

        claims.put("tpmVerified", true);
        claims.put("totpVerified", true);

        return buildToken(
                claims,
                userDetails.getUsername(),
                expirationMs
        );
    }

    private String buildToken(
            Map<String, Object> claims,
            String subject,
            long ttlMs) {

        return Jwts.builder()
                .claims(claims)
                .subject(subject)
                .issuedAt(new Date())
                .expiration(
                        new Date(
                                System.currentTimeMillis()
                                        + ttlMs
                        )
                )
                .signWith(getSigningKey())
                .compact();
    }

    public String extractUsername(String token) {
        return extractClaim(
                token,
                Claims::getSubject
        );
    }

    public Date extractExpiration(String token) {
        return extractClaim(
                token,
                Claims::getExpiration
        );
    }

    public boolean isTpmVerified(String token) {

        Object val =
                extractAllClaims(token)
                        .get("tpmVerified");

        return Boolean.TRUE.equals(val);
    }

    public boolean isTotpVerified(String token) {

        Object val =
                extractAllClaims(token)
                        .get("totpVerified");

        return Boolean.TRUE.equals(val);
    }

    public <T> T extractClaim(
            String token,
            Function<Claims, T> claimsResolver) {

        return claimsResolver.apply(
                extractAllClaims(token)
        );
    }

    private Claims extractAllClaims(String token) {

        return Jwts.parser()
                .verifyWith(getSigningKey())
                .build()
                .parseSignedClaims(token)
                .getPayload();
    }

    public boolean isTokenExpired(String token) {

        return extractExpiration(token)
                .before(new Date());
    }

    public boolean isTokenValid(
            String token,
            UserDetails userDetails) {

        String username =
                extractUsername(token);

        return username.equals(
                userDetails.getUsername()
        ) && !isTokenExpired(token);
    }
}