// @ts-check

import { afterEach, describe, expect, it, jest } from "@jest/globals";
import "@testing-library/jest-dom";
import topLangs from "../api/top-langs.js";
import { renderTopLanguages } from "../src/cards/top-languages.js";
import { renderError } from "../src/common/render.js";
import { CACHE_TTL, DURATIONS } from "../src/common/cache.js";

const data_langs = {
  data: {
    user: {
      repositories: {
        nodes: [
          {
            languages: {
              edges: [{ size: 150, node: { color: "#0f0", name: "HTML" } }],
            },
          },
          {
            languages: {
              edges: [{ size: 100, node: { color: "#0f0", name: "HTML" } }],
            },
          },
          {
            languages: {
              edges: [
                { size: 100, node: { color: "#0ff", name: "javascript" } },
              ],
            },
          },
          {
            languages: {
              edges: [
                { size: 100, node: { color: "#0ff", name: "javascript" } },
              ],
            },
          },
        ],
      },
    },
  },
};

const error = {
  errors: [
    {
      type: "NOT_FOUND",
      path: ["user"],
      locations: [],
      message: "Could not fetch user",
    },
  ],
};

const langs = {
  HTML: {
    color: "#0f0",
    name: "HTML",
    size: 250,
  },
  javascript: {
    color: "#0ff",
    name: "javascript",
    size: 200,
  },
};

afterEach(() => {
  jest.restoreAllMocks();
});

describe("Test /api/top-langs", () => {
  it("should test the request", async () => {
    const query = {
      username: "kartikey321",
    };
    const url = new URL("http://localhost/api");
    for (const [k, v] of Object.entries(query)) {
      url.searchParams.append(k, String(v));
    }
    const request = new Request(url.toString());
    const env = {};

    jest.spyOn(global, "fetch").mockImplementation(async () => ({
      json: async () => data_langs,
      status: 200,
    }));

    const response = await topLangs(request, env);

    expect(response.headers.get("Content-Type")).toBe("image/svg+xml");
    expect(await response.text()).toBe(renderTopLanguages(langs));
  });

  it("should work with the query options", async () => {
    const query = {
      username: "kartikey321",
      hide_title: true,
      card_width: 100,
      title_color: "fff",
      icon_color: "fff",
      text_color: "fff",
      bg_color: "fff",
    };
    const url = new URL("http://localhost/api");
    for (const [k, v] of Object.entries(query)) {
      url.searchParams.append(k, String(v));
    }
    const request = new Request(url.toString());
    const env = {};

    jest.spyOn(global, "fetch").mockImplementation(async () => ({
      json: async () => data_langs,
      status: 200,
    }));

    const response = await topLangs(request, env);

    expect(response.headers.get("Content-Type")).toBe("image/svg+xml");
    expect(await response.text()).toBe(
      renderTopLanguages(langs, {
        hide_title: true,
        card_width: 100,
        title_color: "fff",
        icon_color: "fff",
        text_color: "fff",
        bg_color: "fff",
      }),
    );
  });

  it("should render error card on user data fetch error", async () => {
    const query = {
      username: "kartikey321",
    };
    const url = new URL("http://localhost/api");
    for (const [k, v] of Object.entries(query)) {
      url.searchParams.append(k, String(v));
    }
    const request = new Request(url.toString());
    const env = {};

    jest.spyOn(global, "fetch").mockImplementation(async () => ({
      json: async () => error,
      status: 200,
    }));

    const response = await topLangs(request, env);

    expect(response.headers.get("Content-Type")).toBe("image/svg+xml");
    expect(await response.text()).toBe(
      renderError({
        message: error.errors[0].message,
        secondaryMessage:
          "Make sure the provided username is not an organization",
      }),
    );
  });

  it("should render error card on incorrect layout input", async () => {
    const query = {
      username: "kartikey321",
      layout: "invalid",
    };
    const url = new URL("http://localhost/api");
    for (const [k, v] of Object.entries(query)) {
      url.searchParams.append(k, String(v));
    }
    const request = new Request(url.toString());
    const env = {};

    jest.spyOn(global, "fetch").mockImplementation(async () => ({
      json: async () => data_langs,
      status: 200,
    }));

    const response = await topLangs(request, env);

    expect(response.headers.get("Content-Type")).toBe("image/svg+xml");
    expect(await response.text()).toBe(
      renderError({
        message: "Something went wrong",
        secondaryMessage: "Incorrect layout input",
      }),
    );
  });

  it("should render error card if username in blacklist", async () => {
    const query = {
      username: "renovate-bot",
    };
    const url = new URL("http://localhost/api");
    for (const [k, v] of Object.entries(query)) {
      url.searchParams.append(k, String(v));
    }
    const request = new Request(url.toString());
    const env = {};

    jest.spyOn(global, "fetch").mockImplementation(async () => ({
      json: async () => data_langs,
      status: 200,
    }));

    const response = await topLangs(request, env);

    expect(response.headers.get("Content-Type")).toBe("image/svg+xml");
    expect(await response.text()).toBe(
      renderError({
        message: "This username is blacklisted",
        secondaryMessage: "Please deploy your own instance",
        renderOptions: { show_repo_link: false },
      }),
    );
  });

  it("should render error card if wrong locale provided", async () => {
    const query = {
      username: "kartikey321",
      locale: "asdf",
    };
    const url = new URL("http://localhost/api");
    for (const [k, v] of Object.entries(query)) {
      url.searchParams.append(k, String(v));
    }
    const request = new Request(url.toString());
    const env = {};

    jest.spyOn(global, "fetch").mockImplementation(async () => ({
      json: async () => data_langs,
      status: 200,
    }));

    const response = await topLangs(request, env);

    expect(response.headers.get("Content-Type")).toBe("image/svg+xml");
    expect(await response.text()).toBe(
      renderError({
        message: "Something went wrong",
        secondaryMessage: "Locale not found",
      }),
    );
  });

  it("should have proper cache", async () => {
    const query = {
      username: "kartikey321",
    };
    const url = new URL("http://localhost/api");
    for (const [k, v] of Object.entries(query)) {
      url.searchParams.append(k, String(v));
    }
    const request = new Request(url.toString());
    const env = {};

    jest.spyOn(global, "fetch").mockImplementation(async () => ({
      json: async () => data_langs,
      status: 200,
    }));

    const response = await topLangs(request, env);

    expect(response.headers.get("Content-Type")).toBe("image/svg+xml");
    expect(response.headers.get("Cache-Control")).toBe(
      `max-age=${CACHE_TTL.TOP_LANGS_CARD.DEFAULT}, ` +
        `s-maxage=${CACHE_TTL.TOP_LANGS_CARD.DEFAULT}, ` +
        `stale-while-revalidate=${DURATIONS.ONE_DAY}`,
    );
  });
});
