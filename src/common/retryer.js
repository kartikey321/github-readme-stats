// @ts-check

import { CustomError } from "./error.js";
import { logger } from "./log.js";

/**
 * @typedef {{ data: any, headers: any, status?: number, statusText?: string }} FetchResponse Fetch response.
 * @typedef {(variables: any, token: string, retriesForTests?: number) => Promise<FetchResponse>} FetcherFunction Fetcher function.
 */

/**
 * Try to execute the fetcher function until it succeeds or the max number of retries is reached.
 *
 * @param {FetcherFunction} fetcher The fetcher function.
 * @param {any} variables Object with arguments to pass to the fetcher function.
 * @param {number} retries How many times to retry.
 * @param {Record<string, any>} [env] Environment variables.
 * @returns {Promise<any>} The response from the fetcher function.
 */
const retryer = async (fetcher, variables, retries = 0, env = {}) => {
  // Fall back to process.env if no env is provided (backward compat during migration)
  const resolvedEnv =
    Object.keys(env).length > 0
      ? env
      : typeof process !== "undefined"
        ? process.env
        : {};
  // Count the number of GitHub API tokens available.
  let PATs = 0;
  while (resolvedEnv[`PAT_${PATs + 1}`]) {
    PATs++;
  }

  const RETRIES = resolvedEnv.NODE_ENV === "test" ? 7 : PATs;

  if (!RETRIES) {
    throw new CustomError("No GitHub API tokens found", CustomError.NO_TOKENS);
  }

  if (retries > RETRIES) {
    throw new CustomError(
      "Downtime due to GitHub API rate limiting",
      CustomError.MAX_RETRY,
    );
  }

  try {
    // try to fetch with the first token since RETRIES is 0 index i'm adding +1
    let response = await fetcher(
      variables,
      env[`PAT_${retries + 1}`],
      // used in tests for faking rate limit
      retries,
    );

    // react on both type and message-based rate-limit signals.
    // https://github.com/kartikey321/github-readme-stats/issues/4425
    const errors = response?.data?.errors;
    const errorType = errors?.[0]?.type;
    const errorMsg = errors?.[0]?.message || "";
    const isRateLimited =
      (errors && errorType === "RATE_LIMITED") || /rate limit/i.test(errorMsg);

    // if rate limit is hit increase the RETRIES and recursively call the retryer
    if (isRateLimited) {
      logger.log(`PAT_${retries + 1} Failed`);
      retries++;
      // directly return from the function
      return retryer(fetcher, variables, retries, env);
    }

    // With native fetch, 401/404 bad credentials comes back as a response, not a thrown error
    const responseMsg = response?.data?.message || "";
    const isBadCredentialResponse = responseMsg === "Bad credentials";
    const isAccountSuspendedResponse =
      responseMsg === "Sorry. Your account was suspended.";
    if (isBadCredentialResponse || isAccountSuspendedResponse) {
      logger.log(`PAT_${retries + 1} Failed`);
      retries++;
      return retryer(fetcher, variables, retries, env);
    }

    // finally return the response
    return response;
  } catch (err) {
    /** @type {any} */
    const e = err;

    // network/unexpected error → let caller treat as failure
    if (!e?.status && !e?.response) {
      throw e;
    }

    // prettier-ignore
    // also checking for bad credentials if any tokens gets invalidated
    // (with fetch, response structure is different, handle both)
    const isBadCredential =
      e?.data?.message === "Bad credentials" || e?.response?.data?.message === "Bad credentials";
    const isAccountSuspended =
      e?.data?.message === "Sorry. Your account was suspended." ||
      e?.response?.data?.message === "Sorry. Your account was suspended.";

    if (isBadCredential || isAccountSuspended) {
      logger.log(`PAT_${retries + 1} Failed`);
      retries++;
      // directly return from the function
      return retryer(fetcher, variables, retries, env);
    }

    // HTTP error with a response → return it for caller-side handling
    return e.response || e;
  }
};

export { retryer };
export default retryer;
