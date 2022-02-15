import fetch from "node-fetch";
import https from "https";
import fs from "fs";

export default class githubscraper {
  /**
   * Initialise instance of GitHubScraper
   * @constructor
   * @param {string} API_KEY - Token Required to make authenticated requests to GitHub API
   */
  constructor(API_KEY) {
    this.API_KEY = API_KEY;
    this.internalRatelimitUsed = undefined;
    this.internalRatelimitLimit = undefined;
    this.internalRatelimitRemaining = undefined;
    this.internalRatelimitReset = undefined;
    this.externalRatelimitUsed = undefined;
    this.externalRatelimitLimit = undefined;
    this.externalRatelimitRemaining = undefined;
    this.externalRatelimitReset = undefined;
  }

  /**
   * getResults
   * @param {string} url - URL required to fetch Response Promise from GitHub API
   * @returns {Object} - Data, Ratelimit Information and Links
   */
  async getResults(url) {
    const results = await this.fetchResponse(url);
    this.setExternalRatelimitInformation(
      results.ratelimit_used,
      results.ratelimit_limit,
      results.ratelimit_remaining,
      results.ratelimit_reset
    );
    return results;
  }

  /**
   * fetchResponse
   * @param {string} url - URL required to fetch Response Promise from GitHub API
   * @returns {Object} - Data, Ratelimit Information and Links
   */
  async fetchResponse(url) {
    const response = await fetch(url, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/vnd.github.v3+json",
        Authorization: `Token ${this.API_KEY}`,
      },
    });
    const result = {
      data: await response.json(),
      ratelimit_used: response.headers.get("x-ratelimit-used") || undefined,
      ratelimit_limit: response.headers.get("x-ratelimit-limit") || undefined,
      ratelimit_remaining:
        response.headers.get("x-ratelimit-remaining") || undefined,
      ratelimit_reset: response.headers.get("x-ratelimit-reset") || undefined,
      links: (() => {
        const link = response.headers.get("link");
        if (link != null) {
          let _links = {};
          link.split(",").forEach((a) => {
            _links[a.split(";")[1].replace(' rel="', "").replace('"', "")] = {
              url: a.split(";")[0].replace(">", "").replace("<", ""),
              value: a
                .split(";")[0]
                .replace(">", "")
                .replace("<", "")
                .split("&page=")[1],
            };
          });
          return _links;
        } else {
          return undefined;
        }
      })(),
    };
    return result;
  }

  /**
   * Returns an Integer Value representing the total number of data responses from a URL.
   * Can be used for example to see how many releases a repository has.
   * @param {string} url
   * @returns {number}
   */
  async getTotal(url) {
    let firstURL = `${url}` + `?q=&per_page=100&page=${0}`;
    const firstResponse = await this.fetchResponse(firstURL);
    this.setInternalRatelimitInformation(
      firstResponse.ratelimit_used,
      firstResponse.ratelimit_limit,
      firstResponse.ratelimit_remaining,
      firstResponse.ratelimit_reset
    );
    if (firstResponse.links == undefined) {
      if (firstResponse.data.length != undefined) {
        return firstResponse.data.length;
      } else {
        return 0;
      }
    } else {
      let totalCounter = 0;
      const lastLink = firstResponse.links.last.value;
      for (let i = 0; i < lastLink; i++) {
        let newURL = `${url}` + `?q=&per_page=100&page=${i}`;
        const newResponse = await this.fetchResponse(newURL);
        this.setInternalRatelimitInformation(
          newResponse.ratelimit_used,
          newResponse.ratelimit_limit,
          newResponse.ratelimit_remaining,
          newResponse.ratelimit_reset
        );
        totalCounter += newResponse.data.length;
      }
      return totalCounter;
    }
  }

  async getList(url) {
    let firstURL = `${url}` + `?q=&per_page=100&page=${0}`;
    let resultsList = new Array();
    const firstResponse = await this.fetchResponse(firstURL);
    this.setInternalRatelimitInformation(
      firstResponse.ratelimit_used,
      firstResponse.ratelimit_limit,
      firstResponse.ratelimit_remaining,
      firstResponse.ratelimit_reset
    );
    // console.log(firstResponse);
    if (firstResponse.links == undefined) {
      if (firstResponse.data.length != undefined) {
        for (let i = 0; i < firstResponse.data.length; i++) {
          let value = {
            name: firstResponse.data[i].name,
            url: firstResponse.data[i].zipball_url,
          };
          resultsList.push(value);
        }
        return resultsList;
      } else {
        return 0;
      }
    } else {
      const lastLink = firstResponse.links.last.value;
      for (let i = 0; i < lastLink; i++) {
        let newURL = `${url}` + `?q=&per_page=100&page=${i}`;
        const newResponse = await this.fetchResponse(newURL);
        this.setInternalRatelimitInformation(
          newResponse.ratelimit_used,
          newResponse.ratelimit_limit,
          newResponse.ratelimit_remaining,
          newResponse.ratelimit_reset
        );
        for (let j = 0; j < firstResponse.data.length; j++) {
          let value = {
            name: firstResponse.data[j].name,
            url: firstResponse.data[j].zipball_url,
          };
          resultsList.push(value);
        }
      }
      return resultsList;
    }
  }

  async downloadList(list, dest) {
    for (let i = 0; i < list.length; i++) {
      const file = fs.createWriteStream(dest + `${list[i].name}`);
      const request = https
        .get(list[i].url, function (response) {
          response.pipe(file);
          file.on("finish", function () {
            file.close(); // close() is async, call cb after close completes.
          });
        })
        .on("error", function (err) {
          // Handle errors
          fs.unlink(dest); // Delete the file async. (But we don't check the result)
          console.error(err);
        });
    }
  }

  /**
   * Update Internal Ratelimit Information
   * @param {number} used
   * @param {number} limit
   * @param {number} remaining
   * @param {number} reset
   */
  setInternalRatelimitInformation(used, limit, remaining, reset) {
    this.internalRatelimitUsed = used;
    this.internalRatelimitLimit = limit;
    this.internalRatelimitRemaining = remaining;
    this.internalRatelimitReset = reset;
  }

  /**
   * Return Internal Ratelimit Information
   * @returns {Object}
   */
  getInternalRateLimitInformation() {
    const internalRatelimitInformation = {
      ratelimit_used: this.internalRatelimitUsed || undefined,
      ratelimit_limit: this.internalRatelimitLimit || undefined,
      ratelimit_remaining: this.internalRatelimitRemaining || undefined,
      ratelimit_reset: this.internalRatelimitReset || undefined,
    };
    return internalRatelimitInformation;
  }

  /**
   * Update External Ratelimit Information
   * @param {number} used
   * @param {number} limit
   * @param {number} remaining
   * @param {number} reset
   */
  setExternalRatelimitInformation(used, limit, remaining, reset) {
    this.externalRatelimitUsed = used;
    this.externalRatelimitLimit = limit;
    this.externalRatelimitRemaining = remaining;
    this.externalRatelimitReset = reset;
  }

  /**
   * Returns External Ratelimit Information
   * @returns {Object}
   */
  getExternalRateLimitInformation() {
    const externalRatelimitInformation = {
      ratelimit_used: this.externalRatelimitUsed || undefined,
      ratelimit_limit: this.externalRatelimitLimit || undefined,
      ratelimit_remaining: this.externalRatelimitRemaining || undefined,
      ratelimit_reset: this.externalRatelimitReset || undefined,
    };
    return externalRatelimitInformation;
  }
}
