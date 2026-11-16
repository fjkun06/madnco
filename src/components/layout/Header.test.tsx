import { render, screen } from "@testing-library/react";
import { Header } from "./Header";

describe("Header", () => {
  it("links the logo home with a name for screen readers", () => {
    render(<Header />);
    const home = screen.getByRole("link", { name: "MadnCo. home" });
    expect(home).toHaveAttribute("href", "#top");
    const logo = home.querySelector("img");
    expect(logo).not.toBeNull();
    // Decorative: the link carries the name, so the image adds none.
    expect(logo).toHaveAttribute("alt", "");
    expect(logo?.getAttribute("src")).toContain("madnco-logo.svg");
  });
});
