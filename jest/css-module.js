/**
 * Test stand-in for CSS modules (`import styles from "./x.module.css"`):
 * `styles.frame` is simply "frame", so components render with readable
 * class names instead of Jest failing to parse the CSS.
 */
module.exports = new Proxy(
  {},
  {
    get: (_target, key) => (key === "__esModule" ? false : key),
  },
);
