// @ts-check

/**
 * Send GraphQL request to GitHub API.
 *
 * @param {object} data Request data.
 * @param {HeadersInit} headers Request headers.
 * @returns {Promise<any>} Request response.
 */
const request = async (data, headers) => {
  const response = await fetch("https://api.github.com/graphql", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "User-Agent": "github-readme-stats-worker",
      ...headers,
    },
    body: JSON.stringify(data),
  });

  const responseData = await response.json();

  // Axios returns { data, headers, status, statusText }
  // We need to return an object that mimics this structure for backward compatibility
  // with the rest of the codebase (e.g., res.data).
  return {
    data: responseData,
    headers: response.headers,
    status: response.status,
    statusText: response.statusText,
  };
};

export { request };
