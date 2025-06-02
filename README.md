# First Interaction

An action for filtering pull requests and issues from first-time contributors.

### Note

Thank you for your interest in this GitHub action, however, right now we are not taking contributions. Add commentMore actions

We continue to focus our resources on strategic areas that help our customers be successful while making developers' lives easier. While GitHub Actions remains a key part of this vision, we are allocating resources towards other areas of Actions and are not taking contributions to this repository at this time. The GitHub public roadmap is the best place to follow along for any updates on features we’re working on and what stage they’re in.

We are taking the following steps to better direct requests related to GitHub Actions, including:

#1 We will be directing questions and support requests to our Community Discussions area

#2 High Priority bugs can be reported through Community Discussions or you can report these to our support team https://support.github.com/contact/bug-report.

#3 Security Issues should be handled as per our security.md 

We will still provide security updates for this project and fix major breaking changes during this time.

You are welcome to still raise bugs in this repo.

## Usage

See [action.yml](action.yml)

```yaml
name: Greetings

on: [pull_request, issues]

jobs:
  greeting:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/first-interaction@v1
      with:
        repo-token: ${{ secrets.GITHUB_TOKEN }}
        issue-message: |
          # Message with markdown.
          This is the message that will be displayed on users' first issue.
        pr-message: |
          Message that will be displayed on users' first pr.
          Look, a `code block` for markdown.
```

## License

The scripts and documentation in this project are released under the [MIT License](LICENSE)
