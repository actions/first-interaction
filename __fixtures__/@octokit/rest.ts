import { jest } from '@jest/globals'
import { Endpoints } from '@octokit/types'

export const graphql = jest.fn()
export const paginate = jest.fn()
export const rest = {
  issues: {
    createComment:
      jest.fn<
        () => Endpoints['POST /repos/{owner}/{repo}/issues/{issue_number}/comments']['response']
      >(),
    listForRepo:
      jest.fn<() => Endpoints['GET /repos/{owner}/{repo}/issues']['response']>()
  },
  pulls: {
    list: jest.fn<
      () => Endpoints['GET /repos/{owner}/{repo}/pulls']['response']
    >()
  }
}
