"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
const core = require('@actions/core');
const github = require('@actions/github');
const fs = require('fs');
function run() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            // Get client and context
            console.log(fs.readFileSync(process.env['GITHUB_EVENT_PATH'], { encoding: 'utf8' }));
            const client = new github.GitHub(core.getInput('repoToken', { required: true }));
            const context = github.context;
            // Do nothing if its not a pr or issue
            const isIssue = !!context.payload.issue;
            if (!isIssue && !context.payload.pullRequest) {
                console.log('Not a pull request or issue');
                return;
            }
            // Do nothing if its not their first contribution
            console.log('Checking if its the users first contribution');
            const sender = context.payload.sender.login;
            const firstContribution = isIssue ? yield isFirstIssue(client, context, isIssue, sender) : yield isFirstPull(client, context, isIssue, sender);
            if (!firstContribution) {
                console.log('Not the users first contribution');
                return;
            }
            // Do nothing if no message set for this type of contribution
            const message = isIssue ? core.getInput('issueMessage') : core.getInput('prMessage');
            if (!message) {
                console.log('No message provided for this type of contribution');
                return;
            }
            // Add a comment to the appropriate place
            console.log('Adding a comment in the issue or PR');
            const issue = context.issue;
            yield client.issues.createComment(issue.owner, issue.repo, issue.number, message);
        }
        catch (error) {
            core.setFailed(error.message);
            return;
        }
    });
}
function isFirstIssue(client, owner, repo, sender) {
    return __awaiter(this, void 0, void 0, function* () {
        const { status, data: issues } = yield client.issues.listForRepo({ owner: owner, repo: repo, creator: sender, state: 'all' });
        if (status !== 200) {
            throw new Error(`Received API status code ${status}`);
        }
        return issues.length === 0;
    });
}
// No way to filter pulls by creator
function isFirstPull(client, owner, repo, sender, page = 1) {
    return __awaiter(this, void 0, void 0, function* () {
        const { status, data: pulls } = yield client.pulls.list({ owner: owner, repo: repo, per_page: 100, page: page, state: 'all' });
        if (status !== 200) {
            throw new Error(`Received API status code ${status}`);
        }
        if (pulls.length === 0) {
            return true;
        }
        for (const pull of pulls) {
            const login = pull.user.login;
            if (login === sender) {
                return false;
            }
        }
        return yield isFirstPull(client, owner, repo, sender, page + 1);
    });
}
run();
