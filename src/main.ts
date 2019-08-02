const core = require('@actions/core');
const github = require('@actions/github');
const fs = require('fs');

async function run() {
  try {
    // Get client and context
    const client = new github.GitHub(core.getInput('repoToken', { required: true }));
    const context = github.context;
    console.log(fs.readFileSync(process.env['GITHUB_EVENT_PATH'], { encoding: 'utf8' }));

    // Do nothing if its not a pr or issue
    const isIssue = !!context.payload.issue;
    if (!isIssue && !context.payload.pull_request) {
      console.log('Not a pull request or issue');
      return;
    }

    // Do nothing if its not their first contribution
    console.log('Checking if its the users first contribution');
    const sender = context.payload.sender.login;
    const repo = context.repo;
    const firstContribution = isIssue ? await isFirstIssue(client, repo.owner, repo.repo, sender) : await isFirstPull(client, repo.owner, repo.repo, sender);
    if (!firstContribution) {
      console.log('Not the users first contribution');
      return;
    }
    
    // Do nothing if no message set for this type of contribution
    const message = isIssue ? core.getInput('issueMessage') : core.getInput('prMessage');
    if (!message) {
      console.log('No message provided for this type of contribution');
      return;
    }

    // Add a comment to the appropriate place
    console.log('Adding a comment in the issue or PR');
    const issue = context.issue;
    await client.issues.createComment(issue.owner, issue.repo, issue.number, message);

  } catch (error) {
    core.setFailed(error.message);
    return;
  }
}

async function isFirstIssue(client, owner, repo, sender): Promise<boolean> {
  const {status, data: issues} = await client.issues.listForRepo({owner: owner, repo: repo, creator: sender, state: 'all'});

  if (status !== 200) {
    throw new Error(`Received API status code ${status}`);
  }

  return issues.length === 0;
}

// No way to filter pulls by creator
async function isFirstPull(client, owner, repo, sender, page = 1): Promise<boolean> {
  console.log(`Checking owner: ${owner}, repo: ${repo}, per_page: 100, page: ${page}`);
  const {status, data: pulls} = await client.pulls.list({owner: owner, repo: repo, per_page: 100, page: page, state: 'all'});

  if (status !== 200) {
    throw new Error(`Received API status code ${status}`);
  }

  if (pulls.length === 0) {
    return true;
  }

  for (const pull of pulls) {
    const login = pull.user.login;
    if (login === sender) {
      return false;
    }
  }

  return await isFirstPull(client, owner, repo, sender, page+1);
}

run();
