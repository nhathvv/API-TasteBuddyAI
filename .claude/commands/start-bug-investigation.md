---
description: Create a new fix branch and start investigating a bug
---

You are helping the user create a new fix branch to investigate and fix a bug following this workflow:

1. **Get bug description**: Ask the user for a short description of the bug
2. **Fetch latest**: Run `git fetch origin/develop` to get the latest changes
3. **Create fix branch**: Run `git checkout -b fix/<description> origin/develop` based on the description provided
4. **Confirm**: Show the user which branch they're now on
5. **Ready to investigate**: Tell them they're ready to start investigating

## Important Notes

- Ask the user for a short bug description (kebab-case will be applied)
- Convert the description to kebab-case if needed (e.g., "user profile bug" → "user-profile-bug")
- Branch name format: `fix/<short-description>`
- Fetch from origin/develop to ensure you have the latest code
- If any step fails, stop and report the error clearly
- After successful branch creation, remind the user they can now start investigating

## Example

User provides: "handle null response in payment"
Result branch: `fix/handle-null-response-in-payment`

## Workflow Steps

Execute these steps in sequence:

1. Ask the user for a brief description of the bug they want to investigate
2. Validate and format the description to kebab-case
3. Fetch from origin/develop
4. Create and checkout the new fix branch
5. Confirm the branch creation with `git branch --show-current`
6. Tell the user they're ready to start investigating
