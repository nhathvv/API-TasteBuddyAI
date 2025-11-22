---
description: Commit changes, sync with develop, push and create MR
---

You are helping the user create a merge request following this workflow:

1. **Commit changes**: Create a git commit with all staged and unstaged changes
2. **Fetch latest**: Run `git fetch origin` to get latest remote changes
3. **Rebase**: Run `git rebase origin/develop` to sync with develop branch
4. **Push with MR options**: Run `git push -u origin HEAD -o merge_request.create -o merge_request.target=develop`
5. **Extract MR URL**: Parse the git output to find the merge request URL
6. **Format URL**: Remove any port numbers from the URL (e.g., `:3001`, `:8080`, etc.)
7. **Display**: Show the clean MR URL to the user

## Important Notes

- Follow the conventional commit message format from CLAUDE.md
- The commit message should NOT include AI attribution signatures
- If there are rebase conflicts, pause and inform the user to resolve them manually
- Extract the MR URL from git push output (look for lines containing "remote:" and "merge_request")
- Remove port numbers using regex pattern `:\d+` from the URL
- If any step fails, stop and report the error clearly

## Example Git Push Output

```
remote:
remote: To create a merge request for fix/rmb-debt, visit:
remote:   http://gitlab.example.com:8080/project/repo/-/merge_requests/new?merge_request[source_branch]=fix/rmb-debt
remote:
```

The formatted URL should be: `http://gitlab.example.com/project/repo/-/merge_requests/new?merge_request[source_branch]=fix/rmb-debt`

## Workflow Steps

Execute these steps in sequence:

1. Check git status to see what will be committed
2. Create commit with conventional format message (ask user for message if needed)
3. Fetch from origin
4. Rebase onto origin/develop
5. Push with merge request creation flags
6. Parse output to extract MR URL
7. Remove port number from URL
8. Display the clean URL to user
