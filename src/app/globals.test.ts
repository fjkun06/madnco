import { readFileSync } from "node:fs";
import { join } from "node:path";

const css = readFileSync(join(__dirname, "globals.css"), "utf8");
const rule = (selector: string) =>
  css.match(new RegExp(`^${selector} \\{([^}]*)\\}`, "m"))?.[1] ?? "";

// jsdom has no layout, so this guards the CSS itself. The tapes, the mascot
// split and the footer sign bleed past the screen edge on purpose; only a real
// clip keeps phones from widening the layout viewport and zooming out.
describe("globals.css horizontal clip", () => {
  it("clips on html too, so body's clip isn't handed to the viewport", () => {
    expect(rule("html")).toMatch(/overflow-x:\s*clip/);
    expect(rule("body")).toMatch(/overflow-x:\s*clip/);
  });

  it("never uses hidden on html or body (it breaks scroll timelines)", () => {
    expect(rule("html") + rule("body")).not.toMatch(/overflow(-x)?:\s*hidden/);
  });
});
