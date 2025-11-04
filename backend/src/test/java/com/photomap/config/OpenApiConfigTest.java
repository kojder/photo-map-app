package com.photomap.config;

import io.swagger.v3.oas.annotations.OpenAPIDefinition;
import io.swagger.v3.oas.annotations.enums.SecuritySchemeType;
import io.swagger.v3.oas.annotations.security.SecurityScheme;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.ApplicationContext;
import org.springframework.test.context.ActiveProfiles;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest
@ActiveProfiles("test")
class OpenApiConfigTest {

    @Autowired
    private ApplicationContext applicationContext;

    @Test
    void shouldLoadOpenApiConfigBean() {
        OpenApiConfig config = applicationContext.getBean(OpenApiConfig.class);
        assertThat(config).isNotNull();
    }

    @Test
    void shouldHaveOpenAPIDefinitionAnnotation() {
        OpenAPIDefinition annotation = OpenApiConfig.class.getAnnotation(OpenAPIDefinition.class);
        assertThat(annotation).isNotNull();
        assertThat(annotation.info().title()).isEqualTo("Photo Map API");
        assertThat(annotation.info().version()).isEqualTo("1.0");
        assertThat(annotation.info().description()).contains("REST API for Photo Map MVP");
    }

    @Test
    void shouldHaveSecuritySchemeAnnotation() {
        SecurityScheme annotation = OpenApiConfig.class.getAnnotation(SecurityScheme.class);
        assertThat(annotation).isNotNull();
        assertThat(annotation.name()).isEqualTo("bearerAuth");
        assertThat(annotation.type()).isEqualTo(SecuritySchemeType.HTTP);
        assertThat(annotation.scheme()).isEqualTo("bearer");
        assertThat(annotation.bearerFormat()).isEqualTo("JWT");
    }
}
