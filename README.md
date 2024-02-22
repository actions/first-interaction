# First Interaction

An action for filtering pull requests and issues from first-time contributors.

# Usage

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
        issue-message: 'Message that will be displayed on users first issue'
        pr-message: 'Message that will be displayed on users first pr'
```

# License

The scripts and documentation in this project are released under the [MIT License](LICENSE)
