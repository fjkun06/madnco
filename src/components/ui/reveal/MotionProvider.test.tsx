import { render } from "@testing-library/react";
import { domAnimation } from "framer-motion";
import { MotionProvider, REVEAL_NOSCRIPT_CSS } from "./MotionProvider";

const lazyMotion = jest.fn();
jest.mock("framer-motion", () => {
  const actual = jest.requireActual("framer-motion");
  return {
    ...actual,
    LazyMotion: (props: { features: unknown; children: React.ReactNode }) => {
      lazyMotion(props.features);
      return props.children;
    },
  };
});

describe("MotionProvider", () => {
  // An async loader leaves every server-rendered reveal hidden until (or
  // forever, if) its chunk arrives; that blanked the page in next dev.
  it("hands framer-motion its features synchronously, not as a loader", () => {
    render(
      <MotionProvider>
        <p>content</p>
      </MotionProvider>,
    );
    expect(lazyMotion).toHaveBeenCalledWith(domAnimation);
    expect(typeof lazyMotion.mock.calls[0][0]).not.toBe("function");
  });
});

describe("REVEAL_NOSCRIPT_CSS", () => {
  it("undoes every hidden state a reveal can start in", () => {
    expect(REVEAL_NOSCRIPT_CSS).toMatch(/^\[data-reveal\]\{/);
    for (const rule of ["opacity:1", "transform:none", "clip-path:none"])
      expect(REVEAL_NOSCRIPT_CSS).toContain(`${rule}!important`);
  });
});
