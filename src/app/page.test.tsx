import { render, screen } from "@testing-library/react";
import { en } from "@/locales/en";
import HomePage from "./page";

describe("home page", () => {
  beforeEach(() => render(<HomePage />));

  it("has one h1 and a heading for every section", () => {
    expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1);
    for (const id of [
      "crew-title",
      "what-title",
      "discord-title",
      "links-title",
      "case-title",
    ]) {
      expect(document.getElementById(id)).not.toBeNull();
    }
  });

  it("never turns a [...] placeholder into a link", () => {
    for (const link of screen.getAllByRole("link")) {
      const href = link.getAttribute("href") ?? "";
      expect(href).not.toMatch(/^\[/);
      expect(href.startsWith("#") || href.startsWith("https://")).toBe(true);
    }
  });

  it("opens every outside link in a new tab", () => {
    const outside = screen
      .getAllByRole("link")
      .filter((link) => link.getAttribute("href")?.startsWith("https://"));
    expect(outside.length).toBeGreaterThan(0);
    for (const link of outside) {
      expect(link).toHaveAttribute("target", "_blank");
      expect(link).toHaveAttribute("rel", "noopener noreferrer");
    }
  });

  it("shows every activity", () => {
    for (const item of Object.values(en.what.items)) {
      expect(screen.getByRole("heading", { name: item.title })).toBeInTheDocument();
    }
  });
});
