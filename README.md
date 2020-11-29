# First Interaction

An action for filtering pull requests and issues from first-time contributors.

# Usage

See [action.yml](action.yml)

```yaml
steps:
- uses: actions/first-interaction@v1
  with:
    repo-token: ${{ secrets.GITHUB_TOKEN }}
    issue-message: '# Message with markdown.\nThis is the message that will be displayed on users' first issue.'
    pr-message: 'Message that will be displayed on users' first pr. Look, a `code block` for markdown.'
```
Note that `secrets.GITHUB_TOKEN` will be available by default in your workflow. You can read more in the [GitHub Docs](https://docs.github.com/en/free-pro-team@latest/actions/reference/authentication-in-a-workflow). 

# License

The scripts and documentation in this project are released under the [MIT License](LICENSE)
