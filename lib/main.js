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
            const client = new github.GitHub(core.getInput('repoToken', { required: true }));
            const context = github.context;
            if (context.payload.action !== 'opened') {
                console.log('Nothing was opened');
                return;
            }
            // Do nothing if its not a pr or issue
            const isIssue = !!context.payload.issue;
            if (!isIssue && !context.payload.pull_request) {
                console.log('Not a pull request or issue');
                return;
            }
            // Do nothing if its not their first contribution
            console.log('Checking if its the users first contribution');
            const sender = context.payload.sender.login;
            const issue = context.issue;
            const firstContribution = isIssue ? yield isFirstIssue(client, issue.owner, issue.repo, issue.number, sender) : yield isFirstPull(client, issue.owner, issue.repo, issue.number, sender);
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
            console.log(`Adding message: ${message}`);
            if (isIssue) {
                yield client.issues.createComment({ owner: issue.owner, repo: issue.repo, issue_number: issue.number, body: message });
            }
            else {
                yield client.pulls.createReview({ owner: issue.owner, repo: issue.repo, pull_number: issue.number, body: message, event: 'COMMENT' });
            }
        }
        catch (error) {
            core.setFailed(error.message);
            return;
        }
    });
}
function isFirstIssue(client, owner, repo, sender, number) {
    return __awaiter(this, void 0, void 0, function* () {
        console.log(`owner ${owner}, repo ${repo}, creator: ${sender}`);
        const { status, data: issues } = yield client.issues.listForRepo({ owner: owner, repo: repo, creator: sender, state: 'all' });
        if (status !== 200) {
            throw new Error(`Received API status code ${status}`);
        }
        if (issues.length === 0) {
            return true;
        }
        for (const issue of issues) {
            const issueNumber = issue.number;
            console.log(issueNumber, number);
            if (issueNumber < number) {
                return false;
            }
        }
        return true;
    });
}
// No way to filter pulls by creator
function isFirstPull(client, owner, repo, sender, number, page = 1) {
    return __awaiter(this, void 0, void 0, function* () {
        console.log('Checking...');
        const { status, data: pulls } = yield client.pulls.list({ owner: owner, repo: repo, per_page: 100, page: page, state: 'all' });
        if (status !== 200) {
            throw new Error(`Received API status code ${status}`);
        }
        if (pulls.length === 0) {
            return true;
        }
        for (const pull of pulls) {
            const login = pull.user.login;
            const pullNumber = pull.number;
            if (login === sender && pullNumber < number) {
                return false;
            }
        }
        return yield isFirstPull(client, owner, repo, sender, number, page + 1);
    });
}
run();
