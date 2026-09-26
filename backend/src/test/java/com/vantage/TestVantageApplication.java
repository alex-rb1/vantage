package com.vantage;

import org.springframework.boot.SpringApplication;

public class TestVantageApplication {

	public static void main(String[] args) {
		SpringApplication.from(VantageApplication::main).with(TestcontainersConfiguration.class).run(args);
	}

}
