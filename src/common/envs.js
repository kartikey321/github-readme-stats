const getWhitelist = (env = {}) => {
  const resolvedEnv =
    Object.keys(env).length > 0
      ? env
      : typeof process !== "undefined"
        ? process.env
        : {};
  return resolvedEnv.WHITELIST ? resolvedEnv.WHITELIST.split(",") : undefined;
};

const getGistWhitelist = (env = {}) => {
  const resolvedEnv =
    Object.keys(env).length > 0
      ? env
      : typeof process !== "undefined"
        ? process.env
        : {};
  return resolvedEnv.GIST_WHITELIST
    ? resolvedEnv.GIST_WHITELIST.split(",")
    : undefined;
};

/**
 * @param {Record<string, any>} [env]
 * @returns {string[]}
 */
const getExcludeRepositories = (env = {}) => {
  const resolvedEnv =
    Object.keys(env).length > 0
      ? env
      : typeof process !== "undefined"
        ? process.env
        : {};
  return resolvedEnv.EXCLUDE_REPO ? resolvedEnv.EXCLUDE_REPO.split(",") : [];
};

export { getWhitelist, getGistWhitelist, getExcludeRepositories };
