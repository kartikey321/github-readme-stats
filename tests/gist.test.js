// @ts-check

import { afterEach, describe, expect, it, jest } from "@jest/globals";
import "@testing-library/jest-dom";
import gist from "../api/gist.js";
import { renderGistCard } from "../src/cards/gist.js";
import { renderError } from "../src/common/render.js";
import { CACHE_TTL, DURATIONS } from "../src/common/cache.js";

const gist_data = {
  data: {
    viewer: {
      gist: {
        description:
          "List of countries and territories in English and Spanish: name, continent, capital, dial code, country codes, TLD, and area in sq km. Lista de países y territorios en Inglés y Español: nombre, continente, capital, código de teléfono, códigos de país, dominio y área en km cuadrados. Updated 2023",
        owner: {
          login: "Yizack",
        },
        stargazerCount: 33,
        forks: {
          totalCount: 11,
        },
        files: [
          {
            name: "countries.json",
            language: {
              name: "JSON",
            },
            size: 85858,
          },
        ],
      },
    },
  },
};

const gist_not_found_data = {
  data: {
    viewer: {
      gist: null,
    },
  },
};

afterEach(() => {
  jest.restoreAllMocks();
});

describe("Test /api/gist", () => {
  it("should test the request", async () => {
    const query = {
      id: "bbfce31e0217a3689c8d961a356cb10d",
    };
    const url = new URL("http://localhost/api");
    for (const [k, v] of Object.entries(query)) {
      url.searchParams.append(k, String(v));
    }
    const request = new Request(url.toString());
    const env = {};

    jest.spyOn(global, "fetch").mockImplementation(async () => ({
      json: async () => gist_data,
      status: 200,
    }));

    const response = await gist(request, env);

    expect(response.headers.get("Content-Type")).toBe("image/svg+xml");
    expect(await response.text()).toBe(
      renderGistCard({
        name: gist_data.data.viewer.gist.files[0].name,
        nameWithOwner: `${gist_data.data.viewer.gist.owner.login}/${gist_data.data.viewer.gist.files[0].name}`,
        description: gist_data.data.viewer.gist.description,
        language: gist_data.data.viewer.gist.files[0].language.name,
        starsCount: gist_data.data.viewer.gist.stargazerCount,
        forksCount: gist_data.data.viewer.gist.forks.totalCount,
      }),
    );
  });

  it("should get the query options", async () => {
    const query = {
      id: "bbfce31e0217a3689c8d961a356cb10d",
      title_color: "fff",
      icon_color: "fff",
      text_color: "fff",
      bg_color: "fff",
      show_owner: true,
    };
    const url = new URL("http://localhost/api");
    for (const [k, v] of Object.entries(query)) {
      url.searchParams.append(k, String(v));
    }
    const request = new Request(url.toString());
    const env = {};

    jest.spyOn(global, "fetch").mockImplementation(async () => ({
      json: async () => gist_data,
      status: 200,
    }));

    const response = await gist(request, env);

    expect(response.headers.get("Content-Type")).toBe("image/svg+xml");
    expect(await response.text()).toBe(
      renderGistCard(
        {
          name: gist_data.data.viewer.gist.files[0].name,
          nameWithOwner: `${gist_data.data.viewer.gist.owner.login}/${gist_data.data.viewer.gist.files[0].name}`,
          description: gist_data.data.viewer.gist.description,
          language: gist_data.data.viewer.gist.files[0].language.name,
          starsCount: gist_data.data.viewer.gist.stargazerCount,
          forksCount: gist_data.data.viewer.gist.forks.totalCount,
        },
        { ...query },
      ),
    );
  });

  it("should render error if id is not provided", async () => {
    const query = {};
    const url = new URL("http://localhost/api");
    for (const [k, v] of Object.entries(query)) {
      url.searchParams.append(k, String(v));
    }
    const request = new Request(url.toString());
    const env = {};

    const response = await gist(request, env);

    expect(response.headers.get("Content-Type")).toBe("image/svg+xml");
    expect(await response.text()).toBe(
      renderError({
        message: 'Missing params "id" make sure you pass the parameters in URL',
        secondaryMessage: "/api/gist?id=GIST_ID",
        renderOptions: { show_repo_link: false },
      }),
    );
  });

  it("should render error if gist is not found", async () => {
    const query = {
      id: "bbfce31e0217a3689c8d961a356cb10d",
    };
    const url = new URL("http://localhost/api");
    for (const [k, v] of Object.entries(query)) {
      url.searchParams.append(k, String(v));
    }
    const request = new Request(url.toString());
    const env = {};

    jest.spyOn(global, "fetch").mockImplementation(async () => ({
      json: async () => gist_not_found_data,
      status: 200,
    }));

    const response = await gist(request, env);

    expect(response.headers.get("Content-Type")).toBe("image/svg+xml");
    expect(await response.text()).toBe(
      renderError({ message: "Gist not found" }),
    );
  });

  it("should render error if wrong locale is provided", async () => {
    const query = {
      id: "bbfce31e0217a3689c8d961a356cb10d",
      locale: "asdf",
    };
    const url = new URL("http://localhost/api");
    for (const [k, v] of Object.entries(query)) {
      url.searchParams.append(k, String(v));
    }
    const request = new Request(url.toString());
    const env = {};

    const response = await gist(request, env);

    expect(response.headers.get("Content-Type")).toBe("image/svg+xml");
    expect(await response.text()).toBe(
      renderError({
        message: "Something went wrong",
        secondaryMessage: "Language not found",
      }),
    );
  });

  it("should have proper cache", async () => {
    const query = {
      id: "bbfce31e0217a3689c8d961a356cb10d",
    };
    const url = new URL("http://localhost/api");
    for (const [k, v] of Object.entries(query)) {
      url.searchParams.append(k, String(v));
    }
    const request = new Request(url.toString());
    const env = {};

    jest.spyOn(global, "fetch").mockImplementation(async () => ({
      json: async () => gist_data,
      status: 200,
    }));

    const response = await gist(request, env);

    expect(response.headers.get("Content-Type")).toBe("image/svg+xml");
    expect(response.headers.get("Cache-Control")).toBe(
      `max-age=${CACHE_TTL.GIST_CARD.DEFAULT}, ` +
        `s-maxage=${CACHE_TTL.GIST_CARD.DEFAULT}, ` +
        `stale-while-revalidate=${DURATIONS.ONE_DAY}`,
    );
  });
});
