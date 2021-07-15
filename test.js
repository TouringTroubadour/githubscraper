import GitHubScraper from "./js/GitHubScraper.js";

getGithubData();

async function getGithubData() {
  const GitHubAPI = new GitHubScraper(
    "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"
  );

  let url = "https://api.github.com/search/repositories?";
  let q = "q=" + encodeURIComponent("language:Java");
  let urlq = url + q + `&per_page=1&page=0`;
  console.log(urlq);

  // const result = await GitHubAPI.getResults(urlq);
  // const result = await GitHubAPI.getFirstExternalResult(urlq);
  // await Promise.all(
  //   result.data.map(async (i) => {
  //     console.log(i.full_name + "" + i.language);
  //   })
  // );

  const results = await GitHubAPI.getList(
    "https://api.github.com/repos/alipay/alipay-easysdk/tags"
  );
  console.log(results);

  GitHubAPI.downloadList(results, "./results/");

  // await Promise.all(
  //   result.data.items.map(async (i) => {
  //     await GitHubAPI.getTotal(i.tags_url).then((tagCount) => {
  //       console.log(i.full_name + " " + tagCount);
  //     });
  //   })
  // );

  // console.log("External Ratelimit Information:");
  // console.log(GitHubAPI.getExternalRateLimitInformation());

  // console.log("Internal Ratelimit Information:");
  // console.log(GitHubAPI.getInternalRateLimitInformation());
}
