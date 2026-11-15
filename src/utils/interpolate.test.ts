import { interpolate, interpolateParts } from "./interpolate";

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

describe("interpolateParts", () => {
  it("splits text and filled slots, keeping unknown slots as text", () => {
    expect(
      interpolateParts("Hi {handle}, {x} at {goal}.", { handle: "@m", goal: 50 }),
    ).toEqual([
      { text: "Hi " },
      { text: "@m", slot: "handle" },
      { text: ", " },
      { text: "{x}" },
      { text: " at " },
      { text: "50", slot: "goal" },
      { text: "." },
    ]);
  });

  it("joins back to the same string as interpolate", () => {
    const text = "Lives on {handle} until {goal}";
    const values = { handle: "@c", goal: 50 };
    expect(
      interpolateParts(text, values)
        .map((p) => p.text)
        .join(""),
    ).toBe(interpolate(text, values));
  });
});
