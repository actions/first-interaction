import * as core from '@actions/core'
import * as github from '@actions/github'
import type { WebhookPayload } from '@actions/github/lib/interfaces'
import type {
  IssuesGraphQLResponse,
  PullRequestsGraphQLResponse
} from './types'
import { EventName } from './enums'

/**
 * The main function for the action.
 *
 * @returns {Promise<void>} Resolves when the action is complete.
 */
export async function run(): Promise<void> {
  const issueMessage: string = core.getInput('issue-message')
  const prMessage: string = core.getInput('pr-message')

  const token: string = core.getInput('github-token', { required: true })
  const octokit: ReturnType<typeof github.getOctokit> = github.getOctokit(token)

  // Only 'issues' and 'pull_request' events are supported.
  if (
    github.context.eventName !== 'issues' &&
    github.context.eventName !== 'pull_request'
  )
    return core.setFailed(
      `Only '${EventName.Issues}' and '${EventName.PullRequest}' events are supported (received: '${github.context.eventName}')`
    )

  // Only 'opened' event types are supported.
  if (github.context.payload.action !== 'opened')
    return core.setFailed(
      `Only 'opened' event types are supported (received '${github.context.payload.action}')`
    )

  // Get the context information.
  const actor: string = github.context.actor
  const eventName: EventName = github.context.eventName as EventName
  const payload: WebhookPayload | undefined = github.context.payload
  const issue: { owner: string; repo: string; number: number } =
    github.context.issue

  // Event payload is required.
  if (
    (eventName === EventName.Issues && !payload.issue) ||
    (eventName === EventName.PullRequest && !payload.pull_request)
  )
    return core.setFailed(`Missing payload for '${eventName}' event.`)

  // Message is required.
  if (
    (eventName === EventName.Issues && !issueMessage) ||
    (eventName === EventName.PullRequest && !prMessage)
  )
    return core.setFailed(
      `No message provided for '${eventName}' contributions.`
    )

  core.info(`Checking if this is ${actor}'s first contribution.`)

  const isFirstContribution: boolean =
    eventName === EventName.Issues
      ? await isFirstIssue(
          octokit,
          issue.owner,
          issue.repo,
          issue.number,
          actor
        )
      : await isFirstPullRequest(
          octokit,
          issue.owner,
          issue.repo,
          issue.number,
          actor
        )

  if (!isFirstContribution)
    return core.info(`This is not ${actor}'s first contribution.`)

  core.info(`Adding message to #${issue.number}.`)
  await octokit.rest.issues.createComment({
    owner: issue.owner,
    repo: issue.repo,
    issue_number: issue.number,
    body: eventName === EventName.Issues ? issueMessage : prMessage
  })
}

/**
 * Returns `true` if this is the first issue the actor has opened.
 *
 * @param client The authenticated Octokit client.
 * @param owner The repository owner.
 * @param repo The repository name.
 * @param issueNumber The issue number.
 * @param actor The actor's username.
 * @returns Resolves to `true` if this is the first issue the actor has opened.
 */
export async function isFirstIssue(
  client: ReturnType<typeof github.getOctokit>,
  owner: string,
  repo: string,
  issueNumber: number,
  actor: string
): Promise<boolean> {
  const response: IssuesGraphQLResponse = await client.graphql(
    `
      query($owner: String!, $repo: String!, $actor: String!) {
        repository(owner: $owner, name: $repo) {
          issues(
            first: 5,
            filterBy: { createdBy: $actor },
            states: [ CLOSED, OPEN ]
          ) {
            nodes {
              number
            }
          }
        }
      }
    `,
    {
      owner,
      repo,
      actor
    }
  )

  // The GraphQL API differentiates between issues and pull requests, so the
  // response should include a single issue (the one that triggered this action)
  // if it's the actor's first issue.
  return (
    response.data.repository.issues.nodes.length === 1 &&
    response.data.repository.issues.nodes[0].number === issueNumber
  )
}

/**
 * Returns `true` if this is the first pull request the actor has opened.
 *
 * @param client The authenticated Octokit client.
 * @param owner The repository owner.
 * @param repo The repository name.
 * @param pullNumber The pull request number.
 * @param actor The actor's username.
 * @param cursor The cursor to use for pagination.
 * @returns Resolves to `true` if this is the first PR the actor has opened.
 */
export async function isFirstPullRequest(
  client: ReturnType<typeof github.getOctokit>,
  owner: string,
  repo: string,
  pullNumber: number,
  actor: string,
  cursor: string | null = null
): Promise<boolean> {
  const response: PullRequestsGraphQLResponse = await client.graphql(
    `
      query($owner: String!, $repo: String!, $cursor: String) {
        repository(owner: $owner, name: $repo) {
          pullRequests(
            first: 50,
            after: $cursor,
            states: [ CLOSED, MERGED, OPEN ]
          ) {
            pageInfo {
              hasNextPage
              endCursor
            }
            nodes {
              number
              author {
                login
              }
            }
          }
        }
      }
    `,
    {
      owner,
      repo,
      cursor
    }
  )
  core.info(JSON.stringify(response))

  // The GraphQL API doesn't support filtering PRs by creator. The response may
  // contain many PRs. This is the actor's first PR if there is only with their
  // handle as the creator (the one that triggered this action).

  // Iterate over the current page of PRs, checking for any with a matching
  // creator but not a matching number.
  for (const pull of response.data.repository.pullRequests.nodes)
    if (pull.author.login === actor && pull.number !== pullNumber) return false

  // If there is another page of PRs to check, do so.
  if (response.data.repository.pullRequests.pageInfo.hasNextPage)
    return await isFirstPullRequest(
      client,
      owner,
      repo,
      pullNumber,
      actor,
      response.data.repository.pullRequests.pageInfo.endCursor
    )

  // If there are no more pages to check, this is the actor's first PR.
  return true
}
