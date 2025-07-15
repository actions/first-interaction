# First Interaction

[![Super-Linter](https://github.com/actions/first-interaction/actions/workflows/linter.yml/badge.svg)](https://github.com/super-linter/super-linter)
![CI](https://github.com/actions/first-interaction/actions/workflows/ci.yml/badge.svg)
[![Check dist/](https://github.com/actions/first-interaction/actions/workflows/check-dist.yml/badge.svg)](https://github.com/actions/first-interaction/actions/workflows/check-dist.yml)
[![CodeQL](https://github.com/actions/first-interaction/actions/workflows/codeql-analysis.yml/badge.svg)](https://github.com/actions/first-interaction/actions/workflows/codeql-analysis.yml)
[![Coverage](./badges/coverage.svg)](./badges/coverage.svg)

An action for filtering pull requests (PRs) and issues from first-time
contributors.

When a first-time contributor opens a PR or issue, this action will add a
comment to the PR or issue with a message of your choice. This action is useful
for welcoming first-time contributors to your project and providing them with
information about how to contribute effectively.

### Note

Thank you for your interest in this GitHub action, however, right now we are not
taking contributions.

We continue to focus our resources on strategic areas that help our customers be
successful while making developers' lives easier. While GitHub Actions remains a
key part of this vision, we are allocating resources towards other areas of
Actions and are not taking contributions to this repository at this time. The
GitHub public roadmap is the best place to follow along for any updates on
features we’re working on and what stage they’re in.

We are taking the following steps to better direct requests related to GitHub
Actions, including:

1. We will be directing questions and support requests to our
   [Community Discussions area](https://github.com/orgs/community/discussions/categories/actions)

2. High Priority bugs can be reported through Community Discussions or you can
   report these to our support team
   https://support.github.com/contact/bug-report.

3. Security Issues should be handled as per our [security.md](security.md)

We will still provide security updates for this project and fix major breaking
changes during this time.

You are welcome to still raise bugs in this repo.

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
      - uses: actions/first-interaction@vX.Y.Z # Set this to the latest release
        with:
          issue-message: |
            # Issue Message with Markdown

            This is the message that will be displayed!
          pr-message: |
            # PR Message with Markdown

            This is the message that will be displayed!
```
