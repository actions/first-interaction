# First Interaction

[![GitHub Super-Linter](https://github.com/actions/first-interaction/actions/workflows/linter.yml/badge.svg)](https://github.com/super-linter/super-linter)
![CI](https://github.com/actions/first-interaction/actions/workflows/ci.yml/badge.svg)
[![Check dist/](https://github.com/actions/first-interaction/actions/workflows/check-dist.yml/badge.svg)](https://github.com/actions/first-interaction/actions/workflows/check-dist.yml)
[![CodeQL](https://github.com/actions/first-interaction/actions/workflows/codeql-analysis.yml/badge.svg)](https://github.com/actions/first-interaction/actions/workflows/codeql-analysis.yml)
[![Coverage](./badges/coverage.svg)](./badges/coverage.svg)

An action for responding to pull requests and issues from first-time
contributors.

## v2 Breaking Changes

The release of `v2.0.0` of this action includes several significant changes.
These are meant to bring this action to a more consistent standard.

- The `repo-token` input has been renamed to `github-token`
- The action no longer runs in a container (this should result in reduced
  duration)

## Usage

See [`action.yml`](./action.yml) for additional information.

```yaml
name: Greet Contributors

on:
  issues:
    types:
      - opened
  pull_request:
    branches:
      - main
    types:
      - opened

permissions:
  issues: write
  pull-requests: write

jobs:
  greet:
    name: Greet First-Time Contributors
    runs-on: ubuntu-latest
    steps:
      - name: First Interaction
        id: first-interaction
        uses: actions/first-interaction@vX.X.X # Replace with latest version
        with:
          github-token: ${{ secrets.GITHUB_TOKEN }}
          issue-message: |
            Hello! Thank you for filing an issue.

            If this is a bug report, please include any relevant logs.
          pr-message: |
            Hello! Thank you for your contribution.

            If you are fixing a bug, please reference the issue number.

            If you are implementing a feature request, please check with the
            maintainers that the feature will be accepted first.
```
