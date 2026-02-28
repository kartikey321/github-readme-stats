// @ts-check

import { CustomError, MissingParamError } from "../common/error.js";

/**
 * WakaTime data fetcher.
 *
 * @param {{username: string, api_domain: string }} props Fetcher props.
 * @returns {Promise<import("./types").WakaTimeData>} WakaTime data response.
 */
const fetchWakatimeStats = async ({ username, api_domain }) => {
  if (!username) {
    throw new MissingParamError(["username"]);
  }

  const response = await fetch(
    `https://${
      api_domain ? api_domain.replace(/\/$/gi, "") : "wakatime.com"
    }/api/v1/users/${username}/stats?is_including_today=true`,
  );
  const result = await response.json();

  if (!response.ok) {
    throw new CustomError(
      `Could not resolve to a User with the login of '${username}'`,
      "WAKATIME_USER_NOT_FOUND",
    );
  }

  return result.data;
};

export { fetchWakatimeStats };
export default fetchWakatimeStats;
