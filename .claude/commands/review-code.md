---
description: Review merge request with code-review skill
---

You are helping the user review a merge request (MR) or pull request using the code-review skill.

## Command Syntax

```
/review-code <branch-to-review> [vs <target-branch>]
```

### Examples

```bash
# Review current branch against develop (default)
/review-code

# Review specific branch against develop
/review-code feat/revenue-by-staff

# Review branch against custom target
/review-code feat/revenue-by-staff vs main
/review-code fix/bug-123 vs origin/develop
```

## Purpose

Use the `code-review` skill to perform a comprehensive code review that analyzes:

1. **Code Quality**: Design patterns, architecture, and best practices adherence
2. **Testing**: Test coverage, test quality, and missing test cases
3. **Security**: Potential vulnerabilities, security issues, and OWASP risks
4. **Performance**: Performance bottlenecks, optimization opportunities
5. **Best Practices**: Project-specific conventions from CLAUDE.md and `.cursor/rules/`
6. **NestJS Patterns**: Controller/service/DTO patterns, dependency injection, guards, decorators

## Workflow

When the user invokes `/review-code`:

1. **Parse command arguments**:
   - Extract `<branch-to-review>` (defaults to current branch if not provided)
   - Extract `<target-branch>` (defaults to `origin/develop` if not provided)

2. **Fetch latest changes**:

   ```bash
   git fetch origin
   ```

3. **Verify branches exist**:

   ```bash
   git branch -a | grep <branch-name>
   ```

4. **Get commit history**:

   ```bash
   git log <target-branch>..<source-branch> --oneline
   ```

5. **Get diff between branches**:

   ```bash
   git diff <target-branch>...<source-branch>
   ```

6. **Perform comprehensive analysis**:
   - Analyze modified files only (skip unchanged files)
   - Evaluate against all criteria listed in `.claude/skills/code-review/SKILL.md`
   - Check project-specific rules from `CLAUDE.md` and `.cursor/rules/`
   - Identify security, performance, and quality issues

7. **Generate review report**:
   - Create markdown file in `docs/code-reviews/`
   - Format: `YYYY-MM-DD-<branch-name>-review.md`
   - Include: High-level summary, prioritized issues (Critical/Major/Minor/Enhancement), highlights
   - Provide actionable feedback with file locations and line numbers

8. **Display summary**:
   - Show critical and major issues count
   - Provide path to full review document
   - Highlight must-fix items

## Review Categories

The review will analyze and report issues by severity:

### Critical

- Security vulnerabilities (SQL injection, XSS, authentication bypass)
- Missing authorization (@RequirePermissions)
- Missing audit logging for sensitive operations
- Data integrity issues (missing transactions, improper soft delete)
- Logic errors that break core functionality

### Major

- Missing JSDoc documentation for public APIs
- Type safety violations (use of `any`, missing types)
- Performance issues (N+1 queries, missing indexes)
- Missing error handling
- API contract inconsistencies

### Minor

- Code style violations
- Missing Swagger documentation
- Import ordering issues
- Incomplete test coverage updates

### Enhancement

- Optimization opportunities
- Code duplication that could be refactored
- Logging and observability improvements
- Accessibility and internationalization suggestions

## Important Notes

- The skill has access to all project rules in `.cursor/rules/` and `CLAUDE.md`
- Default target branch is `origin/develop` unless specified
- Review focuses on modified files with actual changes (ignores unchanged files)
- Provides specific line numbers and code examples for each issue
- Saves comprehensive review to `docs/code-reviews/` directory
- Follows the evaluation criteria from `.claude/skills/code-review/SKILL.md`

## Common Issues Checked

- ✓ Missing soft delete implementation (`isDeleted: true`)
- ✓ Improper permission guards (@RequirePermissions)
- ✓ Missing audit logging (@AuditLog)
- ✓ Hard-coded values instead of constants
- ✓ SQL injection or XSS vulnerabilities
- ✓ Missing input validation (class-validator decorators)
- ✓ Improper error handling (try/catch blocks)
- ✓ Missing transaction support for multi-document operations
- ✓ Inconsistent response format (not using ResponseUtils.success)
- ✓ Missing pagination for list endpoints
- ✓ Type safety violations (any types)
- ✓ Missing unit tests for new functionality
- ✓ Performance issues (missing indexes, N+1 queries)
- ✓ Documentation gaps (JSDoc, Swagger, README)
