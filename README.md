
# Github-Asana action

This action integrates asana with github.

### Prerequisites

- Asana account with the permission on the particular project you want to integrate with.
- For creating tasks in Asana, you must provide the Asana project where the issues will be added to.
- For adding PR link to Asana, you must provide the task url in the PR description.

## Required Inputs

### `asana-pat`

**Required** Your public access token of asana, you can find it in [asana docs](https://developers.asana.com/docs/#authentication-basics).

### `action`

**required** The action to be performed. Possible values are
* `create-issue-task` to create a task based on the Github Issue
* `add-pr-comment` to add the PR comment in the Asana task
* `complete-pr-task` to complete the Asana task when a PR has been merged

### Create Asana task from Github Issue
When a Github Issue has been added, it will create an Asana task with the Issue title, description and link.
### `asana-project`

**Required** The Asana project ID where the new task will be added i.e ASANA PROJECT: https://app.asana.com/0/1174433894299346

#### Example Usage

```yaml
on:
  issues:
    types: [opened, reopened]

jobs:
  sync:
    runs-on: ubuntu-latest
    steps:
      - uses: malmstein/github-asana-action@v0.4.0
        with:
          asana-pat: 'Your PAT'
          asana-project: 'Asana Project Id'
          action: 'create-issue-task'
```

### Add PR link as comment in Asana task
When a Github Pull Request has been opened, it will look for an Asana task in the PR description and comment there the PR link.
### `trigger-phrase`

**Required** Prefix before the task i.e ASANA TASK: https://app.asana.com/1/2/3/.
### `is-pinned`
**optional** Pinned the PR comment when set to `true`

#### Sample PR Description
``
Asana Task: https://app.asana.com/0/1/2

#### Example Usage

```yaml
on:
  pull_request:
    types: [opened, reopened]

jobs:
  sync:
    runs-on: ubuntu-latest
    steps:
      - uses: malmstein/github-asana-action@v0.4.0
        with:
          asana-pat: 'Your PAT'
          trigger-phrase: 'Asana Task:'
          action: 'add-pr-comment'
          is-pinned: true
```

### Complete Asana task when Github PR merged
When a Github Pull Request has been closed, it will look for an Asana task in the PR description and close it.
### `is-complete`
**optional** Close the Asana task after Github PR merged when set to `true`
#### Example Usage

```yaml
on:
  pull_request:
    types: [closed]

jobs:
  sync:
    runs-on: ubuntu-latest
    steps:
      - uses: malmstein/github-asana-action@v0.4.0
        with:
          asana-pat: 'Your PAT'
          trigger-phrase: 'Asana Task:'
          action: 'complete-pr-task'
          is-complete: true
```