/** The expected response type for the GraphQL query to list issues. */
export type IssuesGraphQLResponse = {
  data: {
    repository: {
      issues: {
        nodes: {
          number: number
          title: string
        }[]
      }
    }
  }
}

/** The expected response type for the GraphQL query to list pull requests. */
export type PullRequestsGraphQLResponse = {
  data: {
    repository: {
      pullRequests: {
        pageInfo: {
          hasNextPage: boolean
          endCursor: string
        }
        nodes: {
          number: number
          author: {
            login: string
          }
        }[]
      }
    }
  }
}
