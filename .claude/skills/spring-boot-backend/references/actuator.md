# Health Checks - Spring Boot Actuator

## Configuration

### Dependency (pom.xml)

```xml
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-actuator</artifactId>
</dependency>
```

### Application Properties

```properties
# Actuator configuration
management.endpoints.web.base-path=/actuator
management.endpoints.web.exposure.include=health,info,metrics
management.endpoint.health.show-details=when-authorized

# Info endpoint
info.app.name=Photo Map MVP
info.app.version=@project.version@
info.app.description=Photo management with geolocation
```

---

## Security Configuration

```java
@Configuration
@EnableWebSecurity
public class SecurityConfig {

    @Bean
    public SecurityFilterChain securityFilterChain(final HttpSecurity http) throws Exception {
        http
            .authorizeHttpRequests(auth -> auth
                .requestMatchers("/api/auth/**").permitAll()
                .requestMatchers("/actuator/health").permitAll() // Public health check
                .requestMatchers("/actuator/**").hasRole("ADMIN") // Admin-only endpoints
                .anyRequest().authenticated()
            );
        return http.build();
    }
}
```

---

## Available Endpoints

| Endpoint | Description | Access |
|----------|-------------|--------|
| `/actuator/health` | Application health status | Public |
| `/actuator/info` | Application info (name, version) | Admin |
| `/actuator/metrics` | Application metrics (memory, CPU) | Admin |

---

## Health Check Response

```json
{
  "status": "UP",
  "components": {
    "db": {
      "status": "UP",
      "details": {
        "database": "PostgreSQL",
        "validationQuery": "isValid()"
      }
    },
    "diskSpace": {
      "status": "UP",
      "details": {
        "total": 536870912000,
        "free": 321234567890,
        "threshold": 10485760
      }
    }
  }
}
```

---

## Use Cases

- ✅ **Monitoring:** Check if app is running (for Nginx, systemd)
- ✅ **Debugging:** Check database connectivity
- ✅ **Deployment:** Health check before marking service as ready

---

## Key Reminders

- ✅ Public: `/actuator/health`
- ✅ Admin-only: `/actuator/info`, `/actuator/metrics`
- ✅ Use for monitoring and health checks
- ✅ Never expose sensitive endpoints publicly
