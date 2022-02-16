# @troubadour/githubscraper

![npm](https://img.shields.io/badge/npm-v1.0.0-blue)
![license](https://img.shields.io/badge/license-MIT-important)

## Install

```md
npm install @troubadour/githubscraper
```

## Usage

```javascript
const githubscraper = require("@troubadour/githubscraper");

// Downloads All Release Versions of a selected GitHub Repository
async function extractRepoVersions() {
  // Create new instance of GitHubScraper using GitHub API Key
  const ghs = new GitHubScraper(
    "API_KEY"
  );

  // Get List of Available Release Versions
  const results = await ghs.getList(
    "https://api.github.com/repos/USERNAME/REPOSITORY/tags"
  );

  // Print List of Results to console
  console.log(results);

  // Download List of Results
  ghs.downloadList(results, "OUTPUT_FOLDER");
}

extractRepoVersions();
```

## How to get a GitHub API Key

1. Go to Settings on your GitHub Profile
2. Go to Developer Settings
3. Go to Personal Access Tokens
4. Press 'Generate new token'
5. Add a Note describing the purpose of the token
![Add a Note describing the purpose of the token](https://i.imgur.com/Q7OTdkz.png)
6. Set an Expiratory Date for the token
7. Select 'repo' under Select Scopes
![Select 'repo' under Select Scopes](https://i.imgur.com/NILWKSW.png)
8. Press 'Generate token'
![Press 'Generate token'](https://i.imgur.com/WtI6uu8.png)
9. Copy your new Personal Access Token (And save a Copy too!)
![Copy your new Personal Access Token](https://i.imgur.com/ejhDjWS.png)
10. Use your new Personal Access Token in your code! (Refer to the Example Above!)

## License

### MIT License

#### Copyright (c) 2022 Troubadour

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
