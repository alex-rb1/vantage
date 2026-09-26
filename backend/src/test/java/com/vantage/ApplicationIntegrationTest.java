package com.vantage;

import static org.assertj.core.api.Assertions.assertThat;

import org.flywaydb.core.Flyway;
import org.flywaydb.core.api.MigrationInfo;
import org.flywaydb.core.api.MigrationState;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.context.annotation.Import;
import org.springframework.http.HttpStatus;
import org.springframework.test.web.servlet.assertj.MockMvcTester;

@SpringBootTest
@AutoConfigureMockMvc
@Import(TestcontainersConfiguration.class)
class ApplicationIntegrationTest {

	private final MockMvcTester mvc;
	private final Flyway flyway;

	// Constructor injection, as everywhere else in the codebase. JUnit hands
	// the parameters to Spring because of @Autowired on the constructor.
	@Autowired
	ApplicationIntegrationTest(MockMvcTester mvc, Flyway flyway) {
		this.mvc = mvc;
		this.flyway = flyway;
	}

	@Test
	void healthEndpointReportsUpIncludingDatabase() {
		assertThat(mvc.get().uri("/actuator/health"))
				.hasStatus(HttpStatus.OK)
				.bodyJson()
				.satisfies(json -> {
					json.assertThat().extractingPath("$.status").isEqualTo("UP");
					json.assertThat().extractingPath("$.components.db.status").isEqualTo("UP");
				});
	}

	@Test
	void appliesBaselineMigrationOnStartup() {
		MigrationInfo current = flyway.info().current();

		assertThat(current).isNotNull();
		assertThat(current.getVersion().getVersion()).isEqualTo("1");
		assertThat(current.getDescription()).isEqualTo("baseline");
		assertThat(current.getState()).isEqualTo(MigrationState.SUCCESS);
	}

}
