export const mocktokit = {
  graphql: jest.fn(),
  paginate: jest.fn(),
  rest: {
    issues: {
      createComment: jest.fn()
    }
  }
}
