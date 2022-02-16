import fetch from "node-fetch";
import https from "https";
import fs from "fs";

export default class GitHubScraper {
  /**
   * Initialise instance of GitHubScraper
   *
   * @constructor
   * @param {string} API_KEY Token Required to make authenticated requests to GitHub API
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
   * Return Resonse Results from GitHubAPI
   *
   * @param {string} url URL required to fetch Response Promise from GitHub API
   * @returns {results} Data, Ratelimit Information and Links
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
   * Fetch Response from GitHub API
   *
   * @param {string} url URL required to fetch Response Promise from GitHub API
   * @returns {Object} Data, Ratelimit Information and Links
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

  async fetchReleaseInformation(url) {
    const response = await fetch(url);
    const result = {
      file: response.headers.get("content-disposition").split("filename=")[1],
      size: response.headers.get("content-length"),
    };
    return result;
  }

  async fetchDownload(dest, id, repo, name, url) {
    const response = await fetch(url, {
      headers: {
        "user-agent": "node.js",
      },
    });

    let dir = `${dest}${repo.replace("/", "-")}`;
    // console.log(dir);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, {
        recursive: true,
      });
    }

    if (!fs.existsSync(`${dir}/${name}.zip`)) {
      const fileStream = fs.createWriteStream(`${dir}/${name}.zip`);
      await new Promise((resolve, reject) => {
        response.body.pipe(fileStream);
        response.body.on("error", reject);
        fileStream.on("finish", resolve);
      });
    }
  }

  /**
   * Returns an Integer Value representing the total number of data responses from a URL.
   * Can be used for example to see how many releases a repository has.
   *
   * @param {string} url
   * @returns {number} Total Number of Data Responses from a URL.
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

  /**
   * Returns List of Repositories
   *
   * @param {String} repo GitHub Repository
   * @param {String} url GitHub Repository URL
   * @returns {resultsList} List of Repositories
   */
  async getList(repo, url) {
    let firstURL = `${url}` + `?q=&per_page=100&page=${0}`;
    console.log(firstURL);
    let resultsList = new Array();
    const firstResponse = await this.fetchResponse(firstURL);
    this.setInternalRatelimitInformation(
      firstResponse.ratelimit_used,
      firstResponse.ratelimit_limit,
      firstResponse.ratelimit_remaining,
      firstResponse.ratelimit_reset
    );

    if (firstResponse.links == undefined) {
      if (firstResponse.data.length != undefined) {
        for (let i = 0; i < firstResponse.data.length; i++) {
          let value = {
            repo: repo,
            id: firstResponse.data[i].id,
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
        // console.log(newURL);
        const newResponse = await this.fetchResponse(newURL);
        // console.log(newResponse);
        this.setInternalRatelimitInformation(
          newResponse.ratelimit_used,
          newResponse.ratelimit_limit,
          newResponse.ratelimit_remaining,
          newResponse.ratelimit_reset
        );
        for (let j = 0; j < newResponse.data.length; j++) {
          let value = {
            repo: repo,
            id: newResponse.data[j].id,
            name: newResponse.data[j].name,
            url: newResponse.data[j].zipball_url,
          };
          console.log(`${value.id} ${value.name}`);
          resultsList.push(value);
        }
      }
      return resultsList;
    }
  }

  /**
   * Downloads a List of Repositories locally.
   *
   * @param {Object} list List of Repositories
   * @param {String} dest Download Directory
   */
  async downloadList(dest, list) {
    console.log("Download List: " + list.length);
    for (let i = 0; i < list.length; i++) {
      let id = list[i].id;
      let repo = list[i].repo;
      let name = list[i].name;
      let url = list[i].url;
      console.log(
        `Iter: ${i} Repo: ${repo} ID: ${id} Name: ${name}, URL: ${url}`
      );
      await this.fetchDownload(dest, id, repo, name, url);
    }
  }

  /**
   * Update Internal Ratelimit Information
   *
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
   *
   * @returns {internalRatelimitInformation}
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
   *
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
   *
   * @returns {externalRatelimitInformation} External Rate Limit Information
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
