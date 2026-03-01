import { Octokit } from '@octokit/rest';
export declare function run(): Promise<void>;
/**
 * Checks if this is the user's first issue.
 *
 * @param octokit Octokit instance
 * @returns true if this is the user's first issue
 */
export declare function isFirstIssue(octokit: Octokit): Promise<boolean>;
/**
 * Checks if this is the user's first pull request.
 *
 * @param octokit Octokit instance
 * @returns true if this is the user's first pull request
 */
export declare function isFirstPullRequest(octokit: Octokit): Promise<boolean>;
