import * as octokit from '../@octokit/rest.js'

export const getOctokit = () => octokit

export const context = {
  eventName: 'pull_request',
  issue: {
    number: 10
  },
  payload: {
    number: 10,
    issue: {
      number: 10
    },
    pull_request: {
      number: 10
    },
    sender: {
      login: 'mona'
    }
  },
  action: 'opened',
  repo: {
    owner: 'actions',
    repo: 'first-interaction'
  }
}
