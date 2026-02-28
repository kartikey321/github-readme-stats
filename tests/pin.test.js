// @ts-check

import { afterEach, describe, expect, it, jest } from "@jest/globals";
import "@testing-library/jest-dom";
import pin from "../api/pin.js";
import { renderRepoCard } from "../src/cards/repo.js";
import { renderError } from "../src/common/render.js";
import { CACHE_TTL, DURATIONS } from "../src/common/cache.js";

const data_repo = {
  repository: {
    username: "kartikey321",
    name: "convoychat",
    stargazers: {
      totalCount: 38000,
    },
    description: "Help us take over the world! React + TS + GraphQL Chat App",
    primaryLanguage: {
      color: "#2b7489",
      id: "MDg6TGFuZ3VhZ2UyODc=",
      name: "TypeScript",
    },
    forkCount: 100,
    isTemplate: false,
  },
};

const data_user = {
  data: {
    user: { repository: data_repo.repository },
    organization: null,
  },
};

afterEach(() => {
  jest.restoreAllMocks();
});

describe("Test /api/pin", () => {
  it("should test the request", async () => {
    const query = {
      username: "kartikey321",
      repo: "convoychat",
    };
    const url = new URL("http://localhost/api");
    for (const [k, v] of Object.entries(query)) {
      url.searchParams.append(k, String(v));
    }
    const request = new Request(url.toString());
    const env = {};

    jest.spyOn(global, "fetch").mockImplementation(async () => ({
      json: async () => data_user,
      status: 200,
    }));

    const response = await pin(request, env);

    expect(response.headers.get("Content-Type")).toBe("image/svg+xml");
    expect(await response.text()).toBe(
      // @ts-ignore
      renderRepoCard({
        ...data_repo.repository,
        starCount: data_repo.repository.stargazers.totalCount,
      }),
    );
  });

  it("should get the query options", async () => {
    const query = {
      username: "kartikey321",
      repo: "convoychat",
      title_color: "fff",
      icon_color: "fff",
      text_color: "fff",
      bg_color: "fff",
      full_name: "1",
    };
    const url = new URL("http://localhost/api");
    for (const [k, v] of Object.entries(query)) {
      url.searchParams.append(k, String(v));
    }
    const request = new Request(url.toString());
    const env = {};

    jest.spyOn(global, "fetch").mockImplementation(async () => ({
      json: async () => data_user,
      status: 200,
    }));

    const response = await pin(request, env);

    expect(response.headers.get("Content-Type")).toBe("image/svg+xml");
    expect(await response.text()).toBe(
      renderRepoCard(
        // @ts-ignore
        {
          ...data_repo.repository,
          starCount: data_repo.repository.stargazers.totalCount,
        },
        { ...query },
      ),
    );
  });

  it("should render error card if user repo not found", async () => {
    const query = {
      username: "kartikey321",
      repo: "convoychat",
    };
    const url = new URL("http://localhost/api");
    for (const [k, v] of Object.entries(query)) {
      url.searchParams.append(k, String(v));
    }
    const request = new Request(url.toString());
    const env = {};

    jest.spyOn(global, "fetch").mockImplementation(async () => ({
      json: async () => ({
        data: { user: { repository: null }, organization: null },
      }),
      status: 200,
    }));

    const response = await pin(request, env);

    expect(response.headers.get("Content-Type")).toBe("image/svg+xml");
    expect(await response.text()).toBe(
      renderError({ message: "User Repository Not found" }),
    );
  });

  it("should render error card if org repo not found", async () => {
    const query = {
      username: "kartikey321",
      repo: "convoychat",
    };
    const url = new URL("http://localhost/api");
    for (const [k, v] of Object.entries(query)) {
      url.searchParams.append(k, String(v));
    }
    const request = new Request(url.toString());
    const env = {};

    jest.spyOn(global, "fetch").mockImplementation(async () => ({
      json: async () => ({
        data: { user: null, organization: { repository: null } },
      }),
      status: 200,
    }));

    const response = await pin(request, env);

    expect(response.headers.get("Content-Type")).toBe("image/svg+xml");
    expect(await response.text()).toBe(
      renderError({ message: "Organization Repository Not found" }),
    );
  });

  it("should render error card if username in blacklist", async () => {
    const query = {
      username: "renovate-bot",
      repo: "convoychat",
    };
    const url = new URL("http://localhost/api");
    for (const [k, v] of Object.entries(query)) {
      url.searchParams.append(k, String(v));
    }
    const request = new Request(url.toString());
    const env = {};

    jest.spyOn(global, "fetch").mockImplementation(async () => ({
      json: async () => data_user,
      status: 200,
    }));

    const response = await pin(request, env);

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
      repo: "convoychat",
      locale: "asdf",
    };
    const url = new URL("http://localhost/api");
    for (const [k, v] of Object.entries(query)) {
      url.searchParams.append(k, String(v));
    }
    const request = new Request(url.toString());
    const env = {};

    jest.spyOn(global, "fetch").mockImplementation(async () => ({
      json: async () => data_user,
      status: 200,
    }));

    const response = await pin(request, env);

    expect(response.headers.get("Content-Type")).toBe("image/svg+xml");
    expect(await response.text()).toBe(
      renderError({
        message: "Something went wrong",
        secondaryMessage: "Language not found",
      }),
    );
  });

  it("should render error card if missing required parameters", async () => {
    const query = {};
    const url = new URL("http://localhost/api");
    for (const [k, v] of Object.entries(query)) {
      url.searchParams.append(k, String(v));
    }
    const request = new Request(url.toString());
    const env = {};

    const response = await pin(request, env);

    expect(response.headers.get("Content-Type")).toBe("image/svg+xml");
    expect(await response.text()).toBe(
      renderError({
        message:
          'Missing params "username", "repo" make sure you pass the parameters in URL',
        secondaryMessage: "/api/pin?username=USERNAME&amp;repo=REPO_NAME",
        renderOptions: { show_repo_link: false },
      }),
    );
  });

  it("should have proper cache", async () => {
    const query = {
      username: "kartikey321",
      repo: "convoychat",
    };
    const url = new URL("http://localhost/api");
    for (const [k, v] of Object.entries(query)) {
      url.searchParams.append(k, String(v));
    }
    const request = new Request(url.toString());
    const env = {};

    jest.spyOn(global, "fetch").mockImplementation(async () => ({
      json: async () => data_user,
      status: 200,
    }));

    const response = await pin(request, env);

    expect(response.headers.get("Content-Type")).toBe("image/svg+xml");
    expect(response.headers.get("Cache-Control")).toBe(
      `max-age=${CACHE_TTL.PIN_CARD.DEFAULT}, ` +
        `s-maxage=${CACHE_TTL.PIN_CARD.DEFAULT}, ` +
        `stale-while-revalidate=${DURATIONS.ONE_DAY}`,
    );
  });
});
