const core = require('@actions/core');
const github = require('@actions/github');
const fs = require('fs');

async function run() {
  try {
    // Get client and context
    const client = new github.GitHub(core.getInput('repoToken', { required: true }));
    const context = github.context;

    if (context.action !== 'opened') {
      console.log('Nothing was opened, event was ' + context.eventName);
      return;
    }

    // Do nothing if its not a pr or issue
    const isIssue = !!context.payload.issue;
    if (!isIssue && !context.payload.pull_request) {
      console.log('Not a pull request or issue');
      return;
    }

    // Do nothing if its not their first contribution
    console.log('Checking if its the users first contribution');
    const sender = context.payload.sender.login;
    const issue = context.issue;
    const firstContribution = isIssue ? await isFirstIssue(client, issue.owner, issue.repo, issue.number, sender) : await isFirstPull(client, issue.owner, issue.repo, issue.number, sender);
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
    console.log(`Adding message: ${message}`);
    if (isIssue) {
      await client.issues.createComment({ owner: issue.owner, repo: issue.repo, issue_number: issue.number, body: message });
    }
    else {
      await client.pulls.createReview({ owner: issue.owner, repo: issue.repo, pull_number: issue.number, body: message, event: 'COMMENT' });
    }
    

  } catch (error) {
    core.setFailed(error.message);
    return;
  }
}

async function isFirstIssue(client, owner, repo, sender, number): Promise<boolean> {
  const {status, data: issues} = await client.issues.listForRepo({owner: owner, repo: repo, creator: sender, state: 'all'});

  if (status !== 200) {
    throw new Error(`Received API status code ${status}`);
  }

  if (issues.length === 0) {
    return true;
  }

  for (const issue of issues) {
    const issueNumber = issue.number;
    if (issueNumber < number) {
      return false;
    }
  }

  return true;
}

// No way to filter pulls by creator
async function isFirstPull(client, owner, repo, sender, number, page = 1): Promise<boolean> {
  console.log('Checking...');
  const {status, data: pulls} = await client.pulls.list({owner: owner, repo: repo, per_page: 100, page: page, state: 'all'});

  if (status !== 200) {
    throw new Error(`Received API status code ${status}`);
  }

  if (pulls.length === 0) {
    return true;
  }

  for (const pull of pulls) {
    const login = pull.user.login;
    const pullNumber = pull.number;
    if (login === sender && pullNumber < number) {
      return false;
    }
  }

  return await isFirstPull(client, owner, repo, sender, number, page+1);
}

run();
