package com.umc.study.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
public class CorsConfig implements WebMvcConfigurer {
    @Value("${app.cors.enabled:true}")
    private boolean enabled;

    @Override
    public void addCorsMappings(CorsRegistry registry) {
        if (enabled) {
            registry.addMapping("/**")
                    .allowedOrigins("http://localhost:5173", "http://127.0.0.1:5173",
                            "http://localhost:5174", "http://127.0.0.1:5174")
                    .allowedMethods("GET", "POST", "PATCH", "DELETE", "OPTIONS")
                    .allowedHeaders("Content-Type", "Authorization");
        }
    }
}
