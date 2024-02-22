import * as core from '@actions/core'
import * as github from '@actions/github'
import * as main from '../src/main'
import { mocktokit } from '../__fixtures__/mocktokit'

const core_getInputSpy: jest.SpiedFunction<typeof core.getInput> = jest.spyOn(
  core,
  'getInput'
)

describe('First Interaction', () => {
  beforeEach(() => {
    core_getInputSpy
      .mockReturnValueOnce('Issue Message Body')
      .mockReturnValueOnce('Pull Request Message Body')
      .mockReturnValueOnce('github-token')

    // @ts-expect-error This is set in the mock context.
    // eslint-disable-next-line no-import-assign
    github.context = {
      actor: 'mona',
      eventName: 'issues',
      payload: {
        action: 'opened'
      }
    }
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  describe('Preflight Checks', () => {
    it('Fails if an invalid event name is provided', async () => {
      github.context.eventName = 'invalid_event'

      await main.run()

      expect(core.setFailed).toHaveBeenCalledWith(
        `Only 'issues' and 'pull_request' events are supported (received: 'invalid_event')`
      )
    })

    it('Fails if an invalid event type is provided', async () => {
      github.context.payload.action = 'invalid_type'

      await main.run()

      expect(core.setFailed).toHaveBeenCalledWith(
        `Only 'opened' event types are supported (received 'invalid_type')`
      )
    })
  })

  describe('Issue Events', () => {
    beforeEach(() => {
      // @ts-expect-error This is set in the mock context.
      // eslint-disable-next-line no-import-assign
      github.context = {
        actor: 'mona',
        eventName: 'issues',
        issue: {
          owner: 'monalisa',
          repo: 'octocat',
          number: 1
        },
        payload: {
          action: 'opened',
          issue: {
            number: 1
          }
        }
      }
    })

    it('Fails if the payload is missing', async () => {
      github.context.payload = {
        action: 'opened'
      }

      await main.run()

      expect(core.setFailed).toHaveBeenCalledWith(
        `Missing payload for 'issues' event.`
      )
    })

    it('Fails if the message is missing', async () => {
      core_getInputSpy
        .mockReset()
        .mockReturnValueOnce('')
        .mockReturnValueOnce('Pull Request Message Body')
        .mockReturnValueOnce('github-token')

      await main.run()

      expect(core.setFailed).toHaveBeenCalledWith(
        `No message provided for 'issues' contributions.`
      )
    })

    it('Adds a comment to the first interaction', async () => {
      mocktokit.graphql.mockReturnValueOnce({
        repository: {
          issues: {
            nodes: [
              {
                number: 1
              }
            ]
          }
        }
      })

      await main.run()

      expect(mocktokit.rest.issues.createComment).toHaveBeenCalledWith({
        owner: 'monalisa',
        repo: 'octocat',
        issue_number: 1,
        body: 'Issue Message Body'
      })
    })

    it('Does not add a comment if there are multiple interactions', async () => {
      mocktokit.graphql.mockReturnValueOnce({
        repository: {
          issues: {
            nodes: [
              {
                number: 1
              },
              {
                number: 2
              }
            ]
          }
        }
      })

      await main.run()

      expect(mocktokit.rest.issues.createComment).not.toHaveBeenCalled()
    })
  })

  describe('Pull Request Events', () => {
    beforeEach(() => {
      // @ts-expect-error This is set in the mock context.
      // eslint-disable-next-line no-import-assign
      github.context = {
        actor: 'mona',
        eventName: 'pull_request',
        issue: {
          owner: 'monalisa',
          repo: 'octocat',
          number: 1
        },
        payload: {
          action: 'opened',
          pull_request: {
            number: 1
          }
        }
      }
    })

    it('Fails if the payload is missing', async () => {
      github.context.payload = {
        action: 'opened'
      }

      await main.run()

      expect(core.setFailed).toHaveBeenCalledWith(
        `Missing payload for 'pull_request' event.`
      )
    })

    it('Fails if the message is missing', async () => {
      core_getInputSpy
        .mockReset()
        .mockReturnValueOnce('Issue Message Body')
        .mockReturnValueOnce('')
        .mockReturnValueOnce('github-token')

      await main.run()

      expect(core.setFailed).toHaveBeenCalledWith(
        `No message provided for 'pull_request' contributions.`
      )
    })

    it('Adds a comment to the first interaction', async () => {
      mocktokit.graphql.mockReturnValueOnce({
        repository: {
          pullRequests: {
            pageInfo: {
              hasNextPage: false,
              endCursor: null
            },
            nodes: [
              {
                number: 1,
                author: {
                  login: 'mona'
                }
              },
              {
                number: 2,
                author: {
                  login: 'not-mona'
                }
              }
            ]
          }
        }
      })

      await main.run()

      expect(mocktokit.rest.issues.createComment).toHaveBeenCalledWith({
        owner: 'monalisa',
        repo: 'octocat',
        issue_number: 1,
        body: 'Pull Request Message Body'
      })
    })

    it('Does not add a comment if there are multiple interactions', async () => {
      mocktokit.graphql
        .mockReturnValueOnce({
          repository: {
            pullRequests: {
              pageInfo: {
                hasNextPage: true,
                endCursor: 'my-cursor'
              },
              nodes: [
                {
                  number: 1,
                  author: {
                    login: 'mona'
                  }
                },
                {
                  number: 2,
                  author: {
                    login: 'not-mona'
                  }
                }
              ]
            }
          }
        })
        .mockReturnValueOnce({
          repository: {
            pullRequests: {
              pageInfo: {
                hasNextPage: false,
                endCursor: null
              },
              nodes: [
                {
                  number: 3,
                  author: {
                    login: 'mona'
                  }
                }
              ]
            }
          }
        })

      await main.run()

      expect(mocktokit.rest.issues.createComment).not.toHaveBeenCalled()
    })
  })
})
