import { readFileSync } from "node:fs";
import { join } from "node:path";

const css = readFileSync(join(__dirname, "globals.css"), "utf8");
/** Body of the first top-level rule for `selector` (indented or not). */
const rule = (selector: string) =>
  css.match(new RegExp(`^\\s*${selector} \\{([^}]*)\\}`, "m"))?.[1] ?? "";

// jsdom has no layout or cascade layers, so these guard the CSS itself.

// The tapes, the mascot split and the footer sign bleed past the screen edge on
// purpose; only a real clip keeps phones from widening the layout viewport.
describe("globals.css horizontal clip", () => {
  it("clips on html too, so body's clip isn't handed to the viewport", () => {
    expect(rule("html")).toMatch(/overflow-x:\s*clip/);
    expect(rule("body")).toMatch(/overflow-x:\s*clip/);
  });

  it("never uses hidden on html or body (it breaks scroll timelines)", () => {
    expect(rule("html") + rule("body")).not.toMatch(/overflow(-x)?:\s*hidden/);
  });
});

// Unlayered rules beat every Tailwind utility: an unlayered `a { color: inherit }`
// erased the text colour of every link button (black on black in the case file).
describe("globals.css base layer", () => {
  const base = css.slice(css.indexOf("@layer base {"));

  it("keeps the element defaults inside @layer base", () => {
    expect(css).toContain("@layer base {");
    for (const selector of ["html", "body", "a", "button"]) {
      expect(css.indexOf(`\n${selector} {`)).toBe(-1);
      expect(base).toMatch(new RegExp(`\\n {2}${selector} \\{`));
    }
  });
});
