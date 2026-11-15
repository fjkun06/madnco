import { render, screen } from "@testing-library/react";
import { ExternalLink } from "./ExternalLink";

describe("ExternalLink", () => {
  it("opens in a new tab without exposing this page", () => {
    render(
      <ExternalLink href="https://www.tiktok.com/@madnco8" className="x">
        TikTok
      </ExternalLink>,
    );
    const link = screen.getByRole("link", { name: "TikTok (opens in a new tab)" });
    expect(link).toHaveAttribute("target", "_blank");
    expect(link).toHaveAttribute("rel", "noopener noreferrer");
    expect(link).toHaveClass("x");
  });
});
