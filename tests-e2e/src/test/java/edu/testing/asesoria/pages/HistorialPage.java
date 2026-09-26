package edu.testing.asesoria.pages;

import com.microsoft.playwright.Locator;
import com.microsoft.playwright.Page;
import edu.testing.asesoria.config.TestConfig;

/** Page Object del historial de consultas de la sesión. */
public class HistorialPage {

  public static final String PATH = "/historial";

  private final Page page;

  public HistorialPage(Page page) {
    this.page = page;
  }

  public HistorialPage open() {
    page.navigate(TestConfig.BASE_URL + PATH);
    return this;
  }

  public Locator rows() { return page.getByTestId("history-row"); }
  public Locator emptyState() { return page.getByTestId("history-empty"); }
  public Locator messageOf(Locator row) { return row.getByTestId("history-message"); }
  public Locator intentOf(Locator row) { return row.getByTestId("history-intent"); }
}
