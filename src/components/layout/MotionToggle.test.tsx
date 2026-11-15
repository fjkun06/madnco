import { act, fireEvent, render, screen } from "@testing-library/react";
import { setPaused } from "@/lib/motion/pause";
import { MotionToggle } from "./MotionToggle";

describe("MotionToggle", () => {
  afterEach(() => act(() => setPaused(false)));

  it("says what it will do and flips the page's motion setting", async () => {
    render(<MotionToggle pause="Pause animations" play="Play animations" />);
    const button = screen.getByRole("button", { name: "Pause animations" });

    await act(async () => {
      fireEvent.click(button);
    });

    expect(document.documentElement.dataset.motion).toBe("paused");
    expect(screen.getByRole("button", { name: "Play animations" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
  });
});
