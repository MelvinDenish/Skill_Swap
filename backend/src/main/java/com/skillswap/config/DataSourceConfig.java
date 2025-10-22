package com.skillswap.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.jdbc.DataSourceBuilder;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Primary;
import org.springframework.core.env.Environment;

import javax.sql.DataSource;
import java.net.URI;

@Configuration
public class DataSourceConfig {
    @Bean
    @Primary
    public DataSource dataSource(
            Environment env,
            @Value("${spring.datasource.url:}") String url,
            @Value("${spring.datasource.username:}") String username,
            @Value("${spring.datasource.password:}") String password
    ) {
        String databaseUrl = env.getProperty("DATABASE_URL");
        if (databaseUrl != null && !databaseUrl.isEmpty()) {
            try {
                URI uri = URI.create(databaseUrl);
                String userInfo = uri.getUserInfo();
                String user = username;
                String pass = password;
                if (userInfo != null) {
                    int i = userInfo.indexOf(":");
                    if (i > 0) {
                        user = userInfo.substring(0, i);
                        pass = userInfo.substring(i + 1);
                    } else {
                        user = userInfo;
                    }
                }
                int port = uri.getPort() == -1 ? 5432 : uri.getPort();
                String jdbc = "jdbc:postgresql://" + uri.getHost() + ":" + port + uri.getPath();
                String query = uri.getQuery();
                if (query != null && !query.isEmpty()) {
                    jdbc += "?" + query;
                }
                return DataSourceBuilder.create()
                        .url(jdbc)
                        .username(user)
                        .password(pass)
                        .build();
            } catch (Exception ignored) {}
        }
        return DataSourceBuilder.create()
                .url(url)
                .username(username)
                .password(password)
                .build();
    }
}
