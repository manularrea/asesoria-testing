package edu.testing.asesoria.config;

import java.nio.file.Path;
import java.nio.file.Paths;

/** Configuración de la ejecución: se lee de propiedades del sistema (-D) con valores por defecto. */
public final class TestConfig {

  public static final String BASE_URL = System.getProperty("sut.baseUrl",
      System.getenv().getOrDefault("SUT_BASE_URL", "http://localhost:8000"));
  public static final boolean HEADLESS = Boolean.parseBoolean(System.getProperty("headless", "true"));
  public static final double SLOW_MO_MS = Double.parseDouble(System.getProperty("slowMo", "0"));
  public static final boolean RECORD_VIDEO = Boolean.parseBoolean(System.getProperty("recordVideo", "true"));
  public static final Path EVIDENCE_DIR = Paths.get(System.getProperty("evidenceDir", "target/evidence"));
  public static final double DEFAULT_TIMEOUT_MS = 10_000;

  /** Credenciales de demostración definidas en el SUT (sut/app/auth.py). */
  public static final String DEMO_USER = "asesor.demo";
  public static final String DEMO_PASSWORD = "Asesor2026*";
  public static final String DEMO_DISPLAY_NAME = "Asesora Demo";

  /** Umbral de confianza configurado en el motor NLU del SUT. */
  public static final double NLU_THRESHOLD = 0.40;

  private TestConfig() {}
}
