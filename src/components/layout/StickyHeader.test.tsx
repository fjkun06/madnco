import { act, fireEvent, render, screen } from "@testing-library/react";
import { StickyHeader, nextVisible } from "./StickyHeader";

describe("nextVisible", () => {
  it("always shows the bar near the top", () => {
    expect(nextVisible(300, 40, false)).toBe(true);
  });

  it("shows it while scrolling down and hides it while scrolling up", () => {
    expect(nextVisible(400, 500, false)).toBe(true);
    expect(nextVisible(500, 400, true)).toBe(false);
  });

  it("ignores tiny movements", () => {
    expect(nextVisible(500, 503, false)).toBe(false);
    expect(nextVisible(500, 497, true)).toBe(true);
  });
});

describe("StickyHeader", () => {
  beforeEach(() => {
    jest.spyOn(window, "requestAnimationFrame").mockImplementation((cb) => {
      cb(0);
      return 1;
    });
  });
  afterEach(() => jest.restoreAllMocks());

  function scrollTo(y: number) {
    act(() => {
      Object.defineProperty(window, "scrollY", { value: y, configurable: true });
      fireEvent.scroll(window);
    });
  }

  it("slides away on scroll up and comes back on scroll down", () => {
    render(
      <StickyHeader>
        <a href="/">home</a>
      </StickyHeader>,
    );
    const bar = screen.getByRole("link").parentElement as HTMLElement;
    scrollTo(600);
    expect(bar).toHaveAttribute("data-visible", "true");
    scrollTo(450);
    expect(bar).toHaveAttribute("data-visible", "false");
    scrollTo(700);
    expect(bar).toHaveAttribute("data-visible", "true");
  });

  it("comes back when something inside gets keyboard focus", () => {
    render(
      <StickyHeader>
        <a href="/">home</a>
      </StickyHeader>,
    );
    const link = screen.getByRole("link");
    scrollTo(600);
    scrollTo(450);
    act(() => link.focus());
    expect(link.parentElement).toHaveAttribute("data-visible", "true");
  });
});
