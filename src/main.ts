import * as core from '@actions/core';
import * as github from '@actions/github';

async function run() {
  try {
    const issueMessage: string = core.getInput('issue-message');
    const prMessage: string = core.getInput('pr-message');
    if (!issueMessage && !prMessage) {
      throw new Error(
        'Action must have at least one of issue-message or pr-message set'
      );
    }
    // Get client and context
    const client: github.GitHub = new github.GitHub(
      core.getInput('repo-token', {required: true})
    );
    const context = github.context;

    if (context.payload.action !== 'opened') {
      console.log('No issue or PR was opened, skipping');
      return;
    }

    // Do nothing if its not a pr or issue
    const isIssue: boolean = !!context.payload.issue;
    if (!isIssue && !context.payload.pull_request) {
      console.log(
        'The event that triggered this action was not a pull request or issue, skipping.'
      );
      return;
    }

    // Do nothing if its not their first contribution
    console.log('Checking if its the users first contribution');
    if (!context.payload.sender) {
      throw new Error('Internal error, no sender provided by GitHub');
    }
    const sender: string = context.payload.sender!.login;
    const issue: {owner: string; repo: string; number: number} = context.issue;
    let firstContribution: boolean = false;
    if (isIssue) {
      firstContribution = await isFirstIssue(
        client,
        issue.owner,
        issue.repo,
        sender,
        issue.number
      );
    } else {
      firstContribution = await isFirstPull(
        client,
        issue.owner,
        issue.repo,
        sender,
        issue.number
      );
    }
    if (!firstContribution) {
      console.log('Not the users first contribution');
      return;
    }

    // Do nothing if no message set for this type of contribution
    const message: string = isIssue ? issueMessage : prMessage;
    if (!message) {
      console.log('No message provided for this type of contribution');
      return;
    }

    const issueType: string = isIssue ? 'issue' : 'pull request';
    // Add a comment to the appropriate place
    console.log(`Adding message: ${message} to ${issueType} ${issue.number}`);
    if (isIssue) {
      await client.issues.createComment({
        owner: issue.owner,
        repo: issue.repo,
        issue_number: issue.number,
        body: message
      });
    } else {
      await client.pulls.createReview({
        owner: issue.owner,
        repo: issue.repo,
        pull_number: issue.number,
        body: message,
        event: 'COMMENT'
      });
    }
  } catch (error) {
    core.setFailed(error.message);
    return;
  }
}

async function isFirstIssue(
  client: github.GitHub,
  owner: string,
  repo: string,
  sender: string,
  curIssueNumber: number
): Promise<boolean> {
  const {status, data: issues} = await client.issues.listForRepo({
    owner: owner,
    repo: repo,
    creator: sender,
    state: 'all'
  });

  if (status !== 200) {
    throw new Error(`Received unexpected API status code ${status}`);
  }

  if (issues.length === 0) {
    return true;
  }

  for (const issue of issues) {
    if (issue.number < curIssueNumber && !issue.pull_request) {
      return false;
    }
  }

  return true;
}

// No way to filter pulls by creator
async function isFirstPull(
  client: github.GitHub,
  owner: string,
  repo: string,
  sender: string,
  curPullNumber: number,
  page: number = 1
): Promise<boolean> {
  // Provide console output if we loop for a while.
  console.log('Checking...');
  const {status, data: pulls} = await client.pulls.list({
    owner: owner,
    repo: repo,
    per_page: 100,
    page: page,
    state: 'all'
  });

  if (status !== 200) {
    throw new Error(`Received unexpected API status code ${status}`);
  }

  if (pulls.length === 0) {
    return true;
  }

  for (const pull of pulls) {
    const login: string = pull.user.login;
    if (login === sender && pull.number < curPullNumber) {
      return false;
    }
  }

  return await isFirstPull(
    client,
    owner,
    repo,
    sender,
    curPullNumber,
    page + 1
  );
}

run();
