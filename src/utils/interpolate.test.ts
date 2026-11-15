import { interpolate } from "./interpolate";

describe("interpolate", () => {
  it("fills every slot it has a value for", () => {
    expect(
      interpolate("Follow {handle} to {goal}", { handle: "@madnco8", goal: 50 }),
    ).toBe("Follow @madnco8 to 50");
  });

  it("keeps unknown slots visible", () => {
    expect(interpolate("Lives on {handle}", {})).toBe("Lives on {handle}");
  });
});
