package com.photomap.security;

import io.jsonwebtoken.*;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Component;

import java.util.Date;
import java.util.HashMap;
import java.util.Map;

/**
 * JWT Token Provider - Token generation and validation
 *
 * Best Practices Demonstrated:
 * - Configuration via @Value (jwt.secret, jwt.expiration)
 * - final fields for configuration values
 * - Token generation with custom claims (userId, roles)
 * - Token validation with proper exception handling
 * - Expiration checking
 */
@Component
@Slf4j
public class JwtTokenProvider {

    @Value("${jwt.secret}")
    private String jwtSecret;

    @Value("${jwt.expiration}")
    private long jwtExpirationMs; // 24 hours in milliseconds

    /**
     * Generate JWT token from UserDetails
     * Includes custom claims: userId, roles
     */
    public String generateToken(final UserDetails userDetails) {
        final Map<String, Object> claims = new HashMap<>();

        // Add custom claims
        if (userDetails instanceof CustomUserDetails customUserDetails) {
            claims.put("userId", customUserDetails.getUserId());
        }

        claims.put("roles", userDetails.getAuthorities()
            .stream()
            .map(GrantedAuthority::getAuthority)
            .toList());

        return Jwts.builder()
            .setClaims(claims)
            .setSubject(userDetails.getUsername()) // Email
            .setIssuedAt(new Date())
            .setExpiration(new Date(System.currentTimeMillis() + jwtExpirationMs))
            .signWith(SignatureAlgorithm.HS512, jwtSecret)
            .compact();
    }

    /**
     * Extract username (email) from JWT token
     */
    public String getUsernameFromToken(final String token) {
        return Jwts.parser()
            .setSigningKey(jwtSecret)
            .parseClaimsJws(token)
            .getBody()
            .getSubject();
    }

    /**
     * Extract userId from JWT token
     */
    public Long getUserIdFromToken(final String token) {
        final Claims claims = Jwts.parser()
            .setSigningKey(jwtSecret)
            .parseClaimsJws(token)
            .getBody();

        return claims.get("userId", Long.class);
    }

    /**
     * Validate JWT token
     * - Signature valid
     * - Not expired
     * - Well-formed
     */
    public boolean validateToken(final String token) {
        try {
            Jwts.parser().setSigningKey(jwtSecret).parseClaimsJws(token);
            return true;
        } catch (final SignatureException e) {
            log.error("Invalid JWT signature: {}", e.getMessage());
        } catch (final MalformedJwtException e) {
            log.error("Invalid JWT token: {}", e.getMessage());
        } catch (final ExpiredJwtException e) {
            log.error("JWT token is expired: {}", e.getMessage());
        } catch (final UnsupportedJwtException e) {
            log.error("JWT token is unsupported: {}", e.getMessage());
        } catch (final IllegalArgumentException e) {
            log.error("JWT claims string is empty: {}", e.getMessage());
        }
        return false;
    }

    /**
     * Check if token is expired
     */
    public boolean isTokenExpired(final String token) {
        final Date expiration = Jwts.parser()
            .setSigningKey(jwtSecret)
            .parseClaimsJws(token)
            .getBody()
            .getExpiration();

        return expiration.before(new Date());
    }
}
