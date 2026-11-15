import { isPaused, PAUSE_KEY, setPaused, subscribePaused } from "./pause";

describe("pause animations", () => {
  afterEach(() => {
    setPaused(false);
    localStorage.clear();
  });

  it("marks <html> and remembers the choice", () => {
    setPaused(true);
    expect(isPaused()).toBe(true);
    expect(document.documentElement.dataset.motion).toBe("paused");
    expect(localStorage.getItem(PAUSE_KEY)).toBe("paused");

    setPaused(false);
    expect(isPaused()).toBe(false);
    expect(localStorage.getItem(PAUSE_KEY)).toBeNull();
  });

  it("tells subscribers when the choice changes", async () => {
    const onChange = jest.fn();
    const stop = subscribePaused(onChange);
    setPaused(true);
    await Promise.resolve();
    expect(onChange).toHaveBeenCalled();
    stop();
  });
});
