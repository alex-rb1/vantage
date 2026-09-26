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
	private static String readComposePostgresImage() throws IOException {
		try (Reader reader = Files.newBufferedReader(COMPOSE_FILE)) {
			Object compose = new Yaml().load(reader);
			Map<?, ?> services = requireMap(requireMap(compose, "the top level").get("services"), "services");
			Map<?, ?> postgres = requireMap(services.get("postgres"), "services.postgres");
			Object image = postgres.get("image");
			assertThat(image instanceof String s && !s.isBlank())
					.withFailMessage("Expected services.postgres.image to be a non-empty string in %s, but found: %s",
							COMPOSE_FILE.toAbsolutePath().normalize(), image)
					.isTrue();
			return (String) image;
		}
	}

	// Fails with the missing path named, instead of a NullPointerException or
	// ClassCastException, if docker-compose.yml doesn't have the expected shape.
	private static Map<?, ?> requireMap(Object value, String path) {
		assertThat(value)
				.withFailMessage("Expected '%s' to be a YAML mapping in %s, but found: %s",
						path, COMPOSE_FILE.toAbsolutePath().normalize(), value)
				.isInstanceOf(Map.class);
		return (Map<?, ?>) value;
	}

}
