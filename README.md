# First Interaction

[![Super-Linter](https://github.com/actions/first-interaction/actions/workflows/linter.yml/badge.svg)](https://github.com/super-linter/super-linter)
![CI](https://github.com/actions/first-interaction/actions/workflows/ci.yml/badge.svg)
[![Check dist/](https://github.com/actions/first-interaction/actions/workflows/check-dist.yml/badge.svg)](https://github.com/actions/first-interaction/actions/workflows/check-dist.yml)
[![CodeQL](https://github.com/actions/first-interaction/actions/workflows/codeql-analysis.yml/badge.svg)](https://github.com/actions/first-interaction/actions/workflows/codeql-analysis.yml)
[![Coverage](./badges/coverage.svg)](./badges/coverage.svg)

An action for filtering pull requests (PRs) and issues from first-time
contributors.

## Breaking Changes in v3.0.0

Version 3.0.0 introduces breaking changes:

- If you're using a self-hosted runner, ensure it's on version on
  [v2.327.1](https://github.com/actions/runner/releases/tag/v2.327.1) or later

When a first-time contributor opens a PR or issue, this action will add a
comment to the PR or issue with a message of your choice. This action is useful
for welcoming first-time contributors to your project and providing them with
information about how to contribute effectively.

## Usage

See [action.yml](action.yml)

```yaml
name: Greetings

on:
  pull_request:
    types:
      - opened
  issues:
    types:
      - opened

permissions:
  issues: write
  pull-requests: write

jobs:
  greeting:
    name: Greet First-Time Contributors
    runs-on: ubuntu-latest

    steps:
      - uses: actions/first-interaction@v3
        with:
          repo_token: ${{ github.token }}
          issue_message: |
            # Issue Message with Markdown

            This is the message that will be displayed!
          pr_message: |
            # PR Message with Markdown

            This is the message that will be displayed!
```
