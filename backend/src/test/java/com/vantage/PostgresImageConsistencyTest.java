package com.vantage;

import static org.assertj.core.api.Assertions.assertThat;

import java.io.IOException;
import java.io.Reader;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.Map;

import org.junit.jupiter.api.Test;
import org.yaml.snakeyaml.Yaml;

/**
 * Guards against the test database drifting away from the development one.
 *
 * <p>Dependabot updates the image in docker-compose.yml but cannot see the
 * Testcontainers constant, so without this check a Dependabot PR would
 * silently leave tests on the old PostgreSQL version.
 */
class PostgresImageConsistencyTest {

	// Tests run with the backend module as the working directory (Maven's
	// default), so the compose file is one level up at the repository root.
	private static final Path COMPOSE_FILE = Path.of("..", "docker-compose.yml");

	@Test
	void testcontainersImageMatchesDockerCompose() throws IOException {
		String composeImage = readComposePostgresImage();

		assertThat(TestcontainersConfiguration.POSTGRES_IMAGE)
				.withFailMessage("""
						PostgreSQL image mismatch:
						  docker-compose.yml:                         %s
						  TestcontainersConfiguration.POSTGRES_IMAGE: %s
						Update both to the same tag so tests run against the database version used in development.""",
						composeImage, TestcontainersConfiguration.POSTGRES_IMAGE)
				.isEqualTo(composeImage);
	}

	// Parses the file as YAML (SnakeYAML ships with Spring Boot for reading
	// application.yml) rather than matching text, so comments or reordering
	// in docker-compose.yml can't cause a false result.
	@SuppressWarnings("unchecked")
	private static String readComposePostgresImage() throws IOException {
		try (Reader reader = Files.newBufferedReader(COMPOSE_FILE)) {
			Map<String, Object> compose = new Yaml().load(reader);
			Map<String, Object> services = (Map<String, Object>) compose.get("services");
			Map<String, Object> postgres = (Map<String, Object>) services.get("postgres");
			String image = (String) postgres.get("image");
			assertThat(image)
					.withFailMessage("No image found for services.postgres in %s", COMPOSE_FILE.toAbsolutePath())
					.isNotBlank();
			return image;
		}
	}

}
