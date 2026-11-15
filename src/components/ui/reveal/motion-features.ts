import { domAnimation } from "framer-motion";

/**
 * framer-motion's animation features (variants, in-view, hover/tap, exit).
 * Its own module so `MotionProvider` can load it after the page is
 * interactive, instead of shipping it in the first bundle.
 */
export default domAnimation;
