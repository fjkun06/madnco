import { render } from "@testing-library/react";
import { RANGE, ScrollProgress } from "./ScrollProgress";

describe("ScrollProgress", () => {
  it("renders the requested element around its children", () => {
    const { container } = render(
      <ScrollProgress as="section" className="band" range={RANGE.arriving}>
        <p>inside</p>
      </ScrollProgress>,
    );
    const el = container.querySelector("section.band");
    expect(el).not.toBeNull();
    expect(el?.textContent).toBe("inside");
  });

  it("puts the scroll progress on the element as --p", () => {
    const { container } = render(<ScrollProgress className="x" />);
    const el = container.querySelector<HTMLElement>(".x");
    // Starts at rest: 0 before any scrolling.
    expect(el?.style.getPropertyValue("--p")).toBe("0");
  });
});
