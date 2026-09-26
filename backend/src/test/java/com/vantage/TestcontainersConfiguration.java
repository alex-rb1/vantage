package com.vantage;

import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.boot.testcontainers.service.connection.ServiceConnection;
import org.springframework.context.annotation.Bean;
import org.testcontainers.postgresql.PostgreSQLContainer;
import org.testcontainers.utility.DockerImageName;

@TestConfiguration(proxyBeanMethods = false)
class TestcontainersConfiguration {

	// The single place the test database image is defined on the Java side.
	// Must equal the image in docker-compose.yml so tests run against the same
	// PostgreSQL release we develop against; PostgresImageConsistencyTest
	// enforces this.
	static final String POSTGRES_IMAGE = "postgres:18.6-alpine";

	// @ServiceConnection points Spring's DataSource at this container,
	// overriding the spring.datasource.* settings.
	@Bean
	@ServiceConnection
	PostgreSQLContainer postgresContainer() {
		return new PostgreSQLContainer(DockerImageName.parse(POSTGRES_IMAGE));
	}

}
