import { render, screen } from "@testing-library/react";
import { FooterSign } from "./FooterSign";

describe("FooterSign", () => {
  it("is one labelled image for screen readers", () => {
    render(<FooterSign first="ENDLESS" second="MADNESS" />);
    expect(screen.getByRole("img", { name: "ENDLESS MADNESS" })).toBeInTheDocument();
  });

  it("stretches every line to the full width of its viewBox", () => {
    const { container } = render(<FooterSign first="ENDLESS" second="MADNESS" />);
    const texts = container.querySelectorAll("text");
    // outline + solid copy, each with one desktop line and two phone lines
    expect(texts).toHaveLength(6);
    for (const text of texts) {
      const width = text.closest("svg")?.getAttribute("viewBox")?.split(" ")[2];
      expect(text.getAttribute("textLength")).toBe(width);
      expect(text.getAttribute("lengthAdjust")).toBe("spacingAndGlyphs");
    }
  });
});
