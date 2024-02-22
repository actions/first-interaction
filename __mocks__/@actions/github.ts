import { mocktokit } from '../../__fixtures__/mocktokit'

export const getOctokit = () => mocktokit

export const context = {
  actor: 'mona',
  eventName: 'issues',
  issue: {},
  payload: {
    action: 'opened'
  }
}
