import * as main from '../src/main'

// Mock the action's entrypoint
const runMock = jest.spyOn(main, 'run').mockImplementation()

describe('index', () => {
  it('calls run when imported', async () => {
    await require('../src/index')

    expect(runMock).toHaveBeenCalled()
  })
})
