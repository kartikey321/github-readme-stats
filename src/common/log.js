// @ts-check

const noop = () => {};

const isTest =
  typeof process !== "undefined" && process.env.NODE_ENV === "test";

/**
 * Return console instance based on the environment.
 *
 * @type {Console | {log: () => void, error: () => void}}
 */
const logger = isTest ? { log: noop, error: noop } : console;

export { logger };
export default logger;
