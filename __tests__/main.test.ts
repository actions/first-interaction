import { jest } from '@jest/globals'
import * as core from '../__fixtures__/@actions/core.js'
import * as github from '../__fixtures__/@actions/github.js'
import * as octokit from '../__fixtures__/@octokit/rest.js'

jest.unstable_mockModule('@actions/core', () => core)
jest.unstable_mockModule('@actions/github', () => github)
jest.unstable_mockModule('@octokit/rest', async () => {
  class Octokit {
    constructor() {
      return octokit
    }
  }

  return {
    Octokit
  }
})

const main = await import('../src/main.js')

const { Octokit } = await import('@octokit/rest')
const mocktokit = jest.mocked(new Octokit())

// Mirrors @actions/core's getInput: returns '' for unset inputs, throws when
// a required input is empty (checked against the raw value, so whitespace-only
// passes the check just like in production), trims the returned value by
// default, and honors `trimWhitespace: false` to return the raw value.
function mockInputs(values: Record<string, string>): void {
  core.getInput.mockImplementation((name, options) => {
    const value = values[name] ?? ''
    if (options?.required && !value)
      throw new Error(`Input required and not supplied: ${name}`)
    return options?.trimWhitespace === false ? value : value.trim()
  })
}

describe('main.ts', () => {
  afterEach(() => {
    jest.resetAllMocks()
  })

  beforeEach(() => {
    // "Reset" the github context.
    github.context.eventName = 'pull_request'
    github.context.payload.action = 'opened'
    github.context.payload.issue = undefined as any
    github.context.payload.pull_request = {
      number: 10
    }
    github.context.payload.sender = {
      login: 'mona'
    }

    // Set the action's inputs as return values from core.getInput().
    mockInputs({
      issue_message: 'ISSUE_MESSAGE',
      pr_message: 'PR_MESSAGE',
      repo_token: 'REPO_TOKEN'
    })
  })

  describe('run()', () => {
    it('Skips invalid events', async () => {
      github.context.eventName = 'push'
      github.context.payload = {} as any

      await main.run()

      expect(core.info).toHaveBeenCalledWith('Skipping...Not an Issue/PR Event')
    })

    it('Skips invalid actions', async () => {
      github.context.payload.action = 'edited'

      await main.run()

      expect(core.info).toHaveBeenCalledWith('Skipping...Not an Opened Event')
    })

    it('Fails if no sender is present', async () => {
      github.context.payload.sender = undefined as any

      await main.run()

      expect(core.setFailed).toHaveBeenCalledWith(
        'Internal Error...No Sender Provided by GitHub'
      )
    })

    it('Fails if both PR and issue are provided', async () => {
      github.context.payload.issue = {
        number: 20
      }
      github.context.payload.pull_request = {
        number: 10
      }

      await main.run()

      expect(core.setFailed).toHaveBeenCalledWith(
        'Internal Error...Both Issue and PR Provided by GitHub'
      )
    })

    it('Skips adding a message if this is not the first contribution', async () => {
      mocktokit.paginate
        // Issues
        .mockResolvedValueOnce([
          {
            number: 10
          },
          {
            number: 5
          }
        ])
        // PRs
        .mockResolvedValueOnce([
          {
            number: 3
          }
        ])

      await main.run()

      expect(core.info).toHaveBeenCalledWith(
        'Skipping...Not First Contribution'
      )
      expect(mocktokit.rest.issues.createComment).not.toHaveBeenCalled()
    })

    it('Adds an issue message if this is the first contribution', async () => {
      github.context.payload.issue = {
        number: 10
      }
      github.context.payload.pull_request = undefined as any

      mocktokit.paginate
        // Issues
        .mockResolvedValueOnce([
          {
            number: 10
          }
        ])
        // PRs
        .mockResolvedValueOnce([])

      await main.run()

      expect(mocktokit.rest.issues.createComment).toHaveBeenCalled()
    })

    it('Adds a PR message if this is the first contribution', async () => {
      github.context.payload.issue = undefined as any
      github.context.payload.pull_request = {
        number: 10
      }

      mocktokit.paginate
        // Issues
        .mockResolvedValueOnce([])
        // PRs
        .mockResolvedValueOnce([
          {
            number: 10
          }
        ])

      await main.run()

      expect(mocktokit.rest.issues.createComment).toHaveBeenCalled()
    })

    it('Does not require pr_message on an issue event', async () => {
      github.context.payload.issue = {
        number: 10
      }
      github.context.payload.pull_request = undefined as any

      mockInputs({
        issue_message: 'ISSUE_MESSAGE',
        repo_token: 'REPO_TOKEN'
      })

      mocktokit.paginate
        // Issues
        .mockResolvedValueOnce([{ number: 10 }])
        // PRs
        .mockResolvedValueOnce([])

      await expect(main.run()).resolves.toBeUndefined()
      expect(mocktokit.rest.issues.createComment).toHaveBeenCalled()
    })

    it('Does not require issue_message on a PR event', async () => {
      github.context.payload.issue = undefined as any
      github.context.payload.pull_request = {
        number: 10
      }

      mockInputs({
        pr_message: 'PR_MESSAGE',
        repo_token: 'REPO_TOKEN'
      })

      mocktokit.paginate
        // Issues
        .mockResolvedValueOnce([])
        // PRs
        .mockResolvedValueOnce([{ number: 10 }])

      await expect(main.run()).resolves.toBeUndefined()
      expect(mocktokit.rest.issues.createComment).toHaveBeenCalled()
    })

    it('Fails if issue_message is missing on an issue event', async () => {
      github.context.payload.issue = {
        number: 10
      }
      github.context.payload.pull_request = undefined as any

      mockInputs({
        pr_message: 'PR_MESSAGE',
        repo_token: 'REPO_TOKEN'
      })

      await expect(main.run()).rejects.toThrow(
        'Input required and not supplied: issue_message'
      )
      expect(mocktokit.rest.issues.createComment).not.toHaveBeenCalled()
    })

    it('Fails if pr_message is missing on a PR event', async () => {
      github.context.payload.issue = undefined as any
      github.context.payload.pull_request = {
        number: 10
      }

      mockInputs({
        issue_message: 'ISSUE_MESSAGE',
        repo_token: 'REPO_TOKEN'
      })

      await expect(main.run()).rejects.toThrow(
        'Input required and not supplied: pr_message'
      )
      expect(mocktokit.rest.issues.createComment).not.toHaveBeenCalled()
    })
  })

  describe('isFirstIssue()', () => {
    beforeEach(() => {
      github.context.payload.issue = {
        number: 10
      }
    })

    it('Returns true if no issues are present', async () => {
      mocktokit.paginate.mockResolvedValueOnce([])

      const result = await main.isFirstIssue(mocktokit)

      expect(result).toBe(true)
    })

    it('Returns true if only the current issue is present', async () => {
      mocktokit.paginate.mockResolvedValueOnce([
        {
          number: 10
        }
      ])

      const result = await main.isFirstIssue(mocktokit)

      expect(result).toBe(true)
    })

    it('Returns false if older issues are present', async () => {
      mocktokit.paginate.mockResolvedValueOnce([
        {
          number: 10
        },
        {
          number: 5
        }
      ])

      const result = await main.isFirstIssue(mocktokit)

      expect(result).toBe(false)
    })

    it('Ignores pull requests', async () => {
      mocktokit.paginate.mockResolvedValueOnce([
        {
          number: 10
        },
        {
          number: 5,
          pull_request: {}
        }
      ])

      const result = await main.isFirstIssue(mocktokit)

      expect(result).toBe(true)
    })

    it('Returns false if there is an error', async () => {
      mocktokit.paginate.mockRejectedValueOnce(new Error('Error'))

      const result = await main.isFirstIssue(mocktokit)

      expect(result).toBe(false)
    })
  })

  describe('isFirstPullRequest()', () => {
    beforeEach(() => {
      github.context.payload.pull_request = {
        number: 10
      }
    })

    it('Returns true if no PRs are present', async () => {
      mocktokit.paginate.mockResolvedValueOnce([])

      const result = await main.isFirstPullRequest(mocktokit)

      expect(result).toBe(true)
    })

    it('Returns true if only the current PR is present', async () => {
      mocktokit.paginate.mockResolvedValueOnce([
        {
          number: 10
        }
      ])

      const result = await main.isFirstPullRequest(mocktokit)

      expect(result).toBe(true)
    })

    it('Returns false if older PRs are present', async () => {
      mocktokit.paginate.mockResolvedValueOnce([
        {
          number: 10
        },
        {
          number: 5
        }
      ])

      const result = await main.isFirstPullRequest(mocktokit)

      expect(result).toBe(false)
    })

    it('Does not ignore pull requests', async () => {
      mocktokit.paginate.mockResolvedValueOnce([
        {
          number: 10
        },
        {
          number: 5,
          pull_request: {}
        }
      ])

      const result = await main.isFirstPullRequest(mocktokit)

      expect(result).toBe(false)
    })

    it('Returns false if there is an error', async () => {
      mocktokit.paginate.mockRejectedValueOnce(new Error('Error'))

      const result = await main.isFirstPullRequest(mocktokit)

      expect(result).toBe(false)
    })
  })
})
