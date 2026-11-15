import { fireEvent, render, screen } from "@testing-library/react";
import { MobileMenu } from "./MobileMenu";

const links = [
  { href: "#crew", label: "The crew" },
  { href: "#discord", label: "Discord" },
];

function setup() {
  render(<MobileMenu links={links} openLabel="Open menu" closeLabel="Close menu" />);
  return screen.getByRole("button", { name: "Open menu" });
}

describe("MobileMenu", () => {
  it("opens and closes with the button", () => {
    const button = setup();
    expect(button).toHaveAttribute("aria-expanded", "false");

    fireEvent.click(button);
    expect(button).toHaveAttribute("aria-expanded", "true");
    expect(button).toHaveAccessibleName("Close menu");
    // Mounted on open; it animates in from opacity 0, so not toBeVisible().
    expect(screen.getByRole("link", { name: "Discord" })).toBeInTheDocument();
  });

  it("keeps the panel out of the page while closed", () => {
    setup();
    expect(screen.queryByRole("link", { name: "Discord" })).toBeNull();
  });

  it("stops the page from scrolling while open", () => {
    const button = setup();
    fireEvent.click(button);
    expect(document.documentElement.style.overflow).toBe("hidden");
    fireEvent.click(button);
    expect(document.documentElement.style.overflow).toBe("");
  });

  it("closes when tapping outside the panel", () => {
    const button = setup();
    fireEvent.click(button);
    const backdrop = document.querySelector("div.fixed.inset-0");
    expect(backdrop).not.toBeNull();
    fireEvent.click(backdrop as Element);
    expect(button).toHaveAttribute("aria-expanded", "false");
  });

  it("closes on Escape and gives focus back to the button", () => {
    const button = setup();
    fireEvent.click(button);
    fireEvent.keyDown(document, { key: "Escape" });
    expect(button).toHaveAttribute("aria-expanded", "false");
    expect(button).toHaveFocus();
  });

  it("closes when a link is picked", () => {
    const button = setup();
    fireEvent.click(button);
    fireEvent.click(screen.getByRole("link", { name: "The crew" }));
    expect(button).toHaveAttribute("aria-expanded", "false");
  });
});
