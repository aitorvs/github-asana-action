const core = require('@actions/core');
const github = require('@actions/github');
const asana = require('asana');

async function buildClient(asanaPAT) {
    return asana.Client.create({
        defaultHeaders: { 'asana-enable': 'new-sections,string_ids' },
        logAsanaChangeWarnings: false
    }).useAccessToken(asanaPAT).authorize();
}

async function addComment(client, taskId, text, isPinned) {
    try {
        return await client.tasks.addComment(taskId, {
            text: text,
            is_pinned: isPinned,
        });
    } catch (error) {
        console.error('rejecting promise', error);
    }
}

async function findAsanaTasks(){
    const
        TRIGGER_PHRASE = core.getInput('trigger-phrase'),
        PULL_REQUEST = github.context.payload.pull_request,
        REGEX_STRING = `${TRIGGER_PHRASE} https:\\/\\/app.asana.com\\/(\\d+)\\/(?<project>\\d+)\\/(?<task>\\d+).*?`,
        REGEX = new RegExp(REGEX_STRING, 'g');
 
    console.info('looking for asana task link in body', PULL_REQUEST.body, 'regex', REGEX_STRING);
    let foundTasks = [];
    while((parseAsanaUrl = REGEX.exec(PULL_REQUEST.body)) !== null) {
        const taskId = parseAsanaUrl.groups.task;
        if (!taskId) {
            core.error(`Invalid Asana task URL after trigger-phrase ${TRIGGER_PHRASE}`);
            continue;
        }
        foundTasks.push(taskId);
    }
    console.info(`found ${foundTasks.length} tasksIds:`, foundTasks.join(','));
    return foundTasks
}

async function createIssueTask(client){
    const ASANA_PAT = core.getInput('asana-pat');
    const ISSUE = github.context.payload.issue;
    const ASANA_PROJECT_ID = core.getInput('asana-project');
    const isPinned = core.getInput('is-pinned') === 'true';

    console.info('creating asana task from issue', ISSUE);

    const TASK_DESCRIPTION = `Description: ${ISSUE.body}`;
    const TASK_NAME = `Github Issue: ${ISSUE.title}`;
    const TASK_COMMENT = `Issue: ${ISSUE.html_url}`;

    const client = await buildClient(ASANA_PAT);

    if (client === null) {
        throw new Error('client authorization failed');
    } else {
        console.info('asana client created');
    }

    client.tasks.createTask({name: ISSUE.title, notes: ISSUE.body, projects: { ASANA_PROJECT_ID }})
        .then((result) => {
            console.log(result);
            // client.tasks.addComment(result.data.gid, {
            //     text: TASK_COMMENT,
            //     is_pinned: isPinned,
            // });
        });

}

async function addPRComment(client){
    const 
        PULL_REQUEST = github.context.payload.pull_request,
        TASK_COMMENT = `PR: ${PULL_REQUEST.html_url}`,
        isPinned = core.getInput('is-pinned') === 'true';

    const foundTasks = findAsanaTasks()

    const comments = [];
    for (const taskId of foundTasks) {
        const comment = addComment(client, taskId, TASK_COMMENT, isPinned)
        comments.push(comment)
    }
    return comments;
}

async function completePRTask(client){
    const isComplete = core.getInput('is-complete') === 'true';

    const foundTasks = findAsanaTasks()

    const taskIds = [];
    for(const taskId of foundTasks) {
        console.info("marking task", taskId, isComplete ? 'complete' : 'incomplete');
        try {
            await client.tasks.update(taskId, {
                completed: isComplete
            });
        } catch (error) {
            console.error('rejecting promise', error);
        }
        taskIds.push(taskId);
    }
    return taskIds;
}

async function action() {
    const
        ASANA_PAT = core.getInput('asana-pat'),
        ACTION = core.getInput('action', {required: true});

    const client = await buildClient(ASANA_PAT);

    if (client === null) {
        throw new Error('client authorization failed');
    }

    console.info('calling', ACTION);

    switch (ACTION) {
        case 'create-issue-task': {
            createIssueTask(client)
        }
        case 'add-pr-comment': {
            addPRComment(client)
        }
        case 'complete-pr-task': {
            completePRTask(client)
        }
        default:
            core.setFailed(`unexpected action ${ACTION}`);
    }
}

module.exports = {
    action,
    default: action,
};