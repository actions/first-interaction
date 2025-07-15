import * as core from '@actions/core'
import * as github from '@actions/github'
import { Octokit } from '@octokit/rest'

export async function run() {
  core.info('Running actions/first-interaction!')

  // Skip if this is not an issue or PR event.
  if (
    github.context.eventName !== 'issues' &&
    github.context.eventName !== 'pull_request'
  )
    return core.info('Skipping...Not an Issue/PR Event')

  // Skip if this is not an issue/PR open event.
  if (github.context.action !== 'opened')
    return core.info('Skipping...Not an Opened Event')

  // Confirm the sender data is present.
  if (!github.context.payload.sender)
    return core.setFailed('Internal Error...No Sender Provided by GitHub')

  // Check if this is an issue or PR event.
  const isIssue = github.context.payload.issue !== undefined
  const isPullRequest = github.context.payload.pull_request !== undefined

  // Confirm that only one of the two is present.
  if (!isIssue && !isPullRequest)
    return core.setFailed('Internal Error...No Issue or PR Provided by GitHub')
  if (isIssue && isPullRequest)
    return core.setFailed(
      'Internal Error...Both Issue and PR Provided by GitHub'
    )

  // Get the action inputs.
  const issueMessage: string = core.getInput('issue_message', {
    required: true
  })
  const prMessage: string = core.getInput('pr_message', { required: true })

  const octokit = new Octokit({
    auth: core.getInput('repo_token', { required: true })
  })

  // Check if this is the user's first contribution.
  if (!(await isFirstIssue(octokit)) && !(await isFirstPullRequest(octokit)))
    return core.info('Skipping...Not First Contribution')

  core.info(`Adding Message to #${github.context.issue.number}`)

  await octokit.rest.issues.createComment({
    owner: github.context.repo.owner,
    repo: github.context.repo.repo,
    issue_number: github.context.issue.number,
    body: isIssue ? issueMessage : prMessage
  })
}

/**
 * Checks if this is the user's first issue.
 *
 * @param octokit Octokit instance
 * @returns true if this is the user's first issue
 */
export async function isFirstIssue(octokit: Octokit): Promise<boolean> {
  try {
    const issues = await octokit.paginate(octokit.rest.issues.listForRepo, {
      owner: github.context.repo.owner,
      repo: github.context.repo.repo,
      creator: github.context.payload.sender!.login,
      state: 'all'
    })

    return (
      issues
        // Filter out PRs.
        .filter((issue) => issue.pull_request === undefined)
        // Filter out any issue that are newer than the current issue.
        .filter((issue) => issue.number < github.context.issue.number)
        .length === 0
    )
  } catch (error) {
    core.setFailed((error as any).message)
    return false
  }
}

/**
 * Checks if this is the user's first pull request.
 *
 * @param octokit Octokit instance
 * @returns true if this is the user's first pull request
 */
export async function isFirstPullRequest(octokit: Octokit): Promise<boolean> {
  try {
    const pulls = await octokit.paginate(octokit.rest.pulls.list, {
      owner: github.context.repo.owner,
      repo: github.context.repo.repo,
      state: 'all'
    })

    return (
      // Filter out any PRs that are newer than the current one.
      pulls.filter((pull) => pull.number < github.context.issue.number)
        .length === 0
    )
  } catch (error) {
    core.setFailed((error as any).message)
    return false
  }
}
