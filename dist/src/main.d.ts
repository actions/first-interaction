import * as github from '@actions/github';
/**
 * The main function for the action.
 *
 * @returns {Promise<void>} Resolves when the action is complete.
 */
export declare function run(): Promise<void>;
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
export declare function isFirstIssue(client: ReturnType<typeof github.getOctokit>, owner: string, repo: string, issueNumber: number, actor: string): Promise<boolean>;
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
export declare function isFirstPullRequest(client: ReturnType<typeof github.getOctokit>, owner: string, repo: string, pullNumber: number, actor: string, cursor?: string | null): Promise<boolean>;
