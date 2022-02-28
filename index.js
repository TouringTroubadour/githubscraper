import fetch from "node-fetch";
import https from "https";
import fs from "fs";
import { release } from "os";

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
  * Check if GitHub USERNAME/REPOSITORY exists.
  * @param {String} repo USERNAME/REPOSITORY
  * @returns {Boolean} Returns True if GitHub USERNAME/REPOSITORY exists.
  */
  async validateRepo(repo) {
    let length = repo.split("/").length;
    console.log(`Length: ${length}`)
    if (length == 2) {
        let url = `https://api.github.com/repos/${repo}`
        const firstResponse = await fetchResponse(url);
        if (firstResponse.data.message == "Not Found") {
            return false
        } else {
            return true;
        }
    } else {
        return false;
    }
  }

  /**
   * Check to see whether URL is a valid and contains the words 'api.github.com'.
   * @param {String} url GitHub API URL
   * @returns {Boolean} Returns True if URL is a valid GitHub API URL.
   */
  async validateURL(url) {
    if (typeof url == 'string' | url instanceof String) {
      if (url.includes('https://api.github.com/')) {
        return true;
      } else {
        return false;
      }
    } else {
      return false;
    }
  }

  async validateResponse(response) {
    if (response.data.message == "Not Found") {
      return "Response Not Found"
    } else if (response.data.message == "Validation Failed") {
      return "Validation Failed" + response.data.errors;
    } else {
      return true;
    }
  }

  /**
   * Return Response Result from GitHubAPI
   * @param {string} url URL required to fetch Response Promise from GitHub API
   * @returns {results} Data, Ratelimit Information and Links
   */
  async fetchResults(url) {
    if (this.validateURL(url)) {
      const results = await this.fetchResponse(url);
      this.setExternalRatelimitInformation(
        results.ratelimit_used,
        results.ratelimit_limit,
        results.ratelimit_remaining,
        results.ratelimit_reset
      );
      return results;
    } else {
      return undefined
    }
  }

  /**
   * Fetch Response from GitHub API
   *
   * @param {string} url URL required to fetch Response Promise from GitHub API
   * @returns {result} Data, Ratelimit Information and Links
   */
  async fetchResponse(url) {
    if (this.validateURL(url)) {
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
    } else {
      return undefined;
    }
  }

  /**
   * 
   * @param {String} dest 
   * @param {String} id 
   * @param {String} repo 
   * @param {String} name 
   * @param {String} url 
   */
  async fetchDownload(dest, id, repo, name, url) {
    if (this.validateURL) {
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
    } else {
      return undefined;
    }
  }

  /**
   * Returns an Integer Value representing the total number of data responses from a URL.
   * Can be used for example to see how many releases a repository has.
   *
   * @param {string} url GitHub API Query
   * @returns {Integer} Total Number of Data Responses from a given URL.
   */
  async fetchTotalData(url, query) {
    if (this.validateURL(url)) {
      let firstURL = `${url}?q=${query}&per_page=100&page=${0}`;
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
          let newURL = `${url}?q=${query}&per_page=100&page=${i}`;
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
    } else {
      return undefined;
    }
  }
  /**
   *
   * @param {String} repo
   * @param {Integer} idNum Number of Specific Release (Latest is 0)
   * @returns
   */
  async getLatestRelease(repo, idNum) {
    if (this.validateRepository(repo)) {
      let firstURL = `https://api.github.com/repos/${repo}/tags`;
      console.log(firstURL);
      const repoResponse = await this.fetchResponse(firstURL);
      this.setInternalRatelimitInformation(
        repoResponse.ratelimit_used,
        repoResponse.ratelimit_limit,
        repoResponse.ratelimit_remaining,
        repoResponse.ratelimit_reset
      );
      if (repoResponse.links == undefined) {
        if (repoResponse.data.length != undefined) {
          let value = {
            repo: repo,
            id: repoResponse.data[idNum].id,
            name: repoResponse.data[idNum].name,
            url: repoResponse.data[idNum].zipball_url,
          };
          return value;
        } else {
          return 0;
        }
      }
    } else {
      return undefined;
    }
  }

  /**
   * 
   * @param {String} repo GitHub USERNAME/REPOSITORY
   * @param {Integer} pageNum Number of Specific Page (Default is 0) 
   * @param {Integer} idNum Number of Specific Release (Default is 0 (Latest)) 
   * @returns 
   */
  async getRelease(repo, pageNum, releaseNum) {
    if (pageNum == undefined | pageNum > 0) {
      pageNum = 0;
    }
    if (releaseNum == undefined | releaseNum > 0) {
      releaseNum = 0
    }
    if (this.validateRepo(repo)) {
      let firstURL = `https://api.github.com/repos/${repo}/releases?q=&per_page=100&page=${pageNum}`;
      console.log(firstURL);
      const repoResponse = await this.fetchResponse(firstURL);
      this.setInternalRatelimitInformation(
        repoResponse.ratelimit_used,
        repoResponse.ratelimit_limit,
        repoResponse.ratelimit_remaining,
        repoResponse.ratelimit_reset
      );
      if (repoResponse.links == undefined) {
        if (repoResponse.data.length != undefined) {
            let value = {
              repo: repo,
              id: repoResponse.data[releaseNum].id,
              name: repoResponse.data[releaseNum].name,
              url: repoResponse.data[releaseNum].zipball_url,
            };
          return value;
        } else {
          return 0;
        }
      }
    } else {
      return undefined;
    }
  }

  /**
   * Returns List of Releases
   * @param {String} repo Github USERNAME/REPOSITORY
   * @returns {resultsList} List of Releases
   */
  async fetchReleasesList(repo) {
    if (this.validateRepository(repo)) {
      let firstURL = `https://api.github.com/repos/${repo}/tags?q=&per_page=100&page=${0}`;
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
          if (this.validateResponse(newResponse)) {
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
          } else {
            return undefined;
          }
        }
        return resultsList;
      }
    }
  }

  /**
   * Downloads a List of Repositories locally.
   *
   * @param {Object} list List of Repositories
   * @param {String} dest Download Directory
   */
  async downloadList(dest, list) {
    if (list == undefined | list.length == 0) {
      return undefined;
    } else {
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

  /**
   * Returns the total Number of Releases of a given GitHub Repository.
   * @param {String} repo GitHub USERNAME/REPOSITORY
   * @returns 
   */
  async fetchReleasesCount(repo) {
    if (this.validateRepository(repo)) {
      let url = `https://api.github.com/repos/${repo}/releases`;
      let firstURL = `${url}` + `?q=&per_page=100&page=${0}`;
      console.log(firstURL);
      const firstResponse = await fetchResponse(firstURL);
      if (this.validateResponse(firstResponse)) {
        if (firstResponse.links == undefined) {
          if (firstResponse.data.length != undefined) {
              let releaseCount = firstResponse.data.length;
              return releaseCount;
          }
        } else {
            const lastLink = firstResponse.links.last.value;
            let releaseCount = 0;
            for (let i = 0; i < lastLink; i++) {
                let newURL = `${url}` + `?q=&per_page=100&page=${i}`;
                const newResponse = await fetchResponse(newURL);
                releaseCount += newResponse.data.length;
            }
            return releaseCount;
        }
      } else {
        return undefined;
      }
    } else {
      return undefined;
    }  
  }

  /**
   * Return total Number of Downloads of a Release
   * @param {String} repo GitHub USERNAME/REPOSITORY
   * @param {Integer} id Number of Release (0 = Latest Release)
   * @returns {}
   */
  async fetchDownloadCount(repo, id) {
    if (id = undefined) {
        id = 0;
    } else {
        if (validateRepository(repo)) {
          let firstURL = `https://api.github.com/repos/${repo}/releases`;
          console.log(firstURL);
          const repoResponse = await fetchResponse(firstURL);
          if (this.validateResponse(repoResponse)) {
            if (firstResponse.links == undefined) {
              if (firstResponse.data.length != undefined) {
                if (id <= firstResponse.data.length) {
                  console.log(repoResponse.data[id].assets.length);
                  let totalDownloads = 0;
                  for (let i = 0; i < repoResponse.data[id].assets.length; i++) {
                      totalDownloads+=repoResponse.data[id].assets[i].download_count;
                  }
                  return totalDownloads;
                } else {
                  return undefined;
                }
              } else {
                  return undefined;
              }
            } else {
                return undefined;
            }
          } else {
            return undefined;
          }
        } else {
            return undefined;
        }
    }
  }

  async fetchFileCount(repo, extension) {
    if (this.validateRepository(repo)) {
      let firstURL = `https://api.github.com/search/code?q=extension:${extension} repo:${repo}`;
      const repoResponse = await fetchResponse(firstURL);
      if (this.validateResponse(repoResponse)){
          return repoResponse.total_count;
      } else {
        return undefined;
      }
    } else {
      return undefined;
    }  
  }
}