# 📚 Development Rules for TastebuddyAI

This directory contains all coding standards, best practices, and development rules for the TastebuddyAI project.

---

## 📋 Rules Files

### 1. **GLOBAL_RULES.md** (CRITICAL - Always Read First) 🌟

**Priority:** Critical
**Scope:** All code in the repository

Contains mandatory rules that apply to EVERY development task:

- ✅ **MCP Context 7 Usage** - Search before creating
- 🧠 **Byterover** - Track complex flows
- ✅ **Testing Policy** - Tests are mandatory
- 📁 **Code Organization**
- 📚 **Documentation Requirements**

**When to reference:** Before starting ANY task

---

### 2. **code-react-native.md**

**Priority:** High
**Scope:** All React Native / Expo code

React Native and Expo-specific rules:

- Component architecture
- TypeScript usage
- Styling with StyleSheet
- Navigation with Expo Router
- State management (Zustand)
- API calls and storage
- Permissions handling
- Performance optimization
- Common pitfalls to avoid

**When to reference:** When writing React Native components, screens, or hooks

---

### 3. **testing-standards.md**

**Priority:** High
**Scope:** All test files

Comprehensive testing guidelines:

- Testing philosophy
- Test types (unit, component, integration, E2E)
- File structure for tests
- Writing effective tests
- Running tests
- Coverage requirements
- Examples for all test types

**When to reference:** When writing or updating tests

---

### 4. **senior-workflow.md** 🚀

**Priority:** High
**Scope:** All development work

Senior-level workflow for fast, quality code:

- Testing philosophy
- Test types (unit, component, integration, E2E)
- File structure for tests
- Writing effective tests
- Running tests
- Coverage requirements
- Examples for all test types

**When to reference:** When writing or updating tests

---

## 🚀 Quick Start Guide

### For AI Assistants

Before implementing ANY feature:

```markdown
1. Read GLOBAL_RULES.md
   - Check MCP context7 for existing implementations
   - Use Byterover if task is complex
   - Plan tests alongside implementation

2. Read relevant specific rules
   - code-react-native.md for RN/Expo code
   - testing-standards.md for test implementation

3. Follow the workflow
   - Search → Plan → Implement → Test → Document
```

### For Developers

```bash
# 1. Read the rules
ls .agent/rules/

# 2. Check before coding
- Search for existing patterns (MCP context7)
- Follow project structure
- Write tests alongside code

# 3. Verify before committing
- Run tests: npm test
- Check coverage: npm test -- --coverage
- Lint: npm run lint
```

---

## 📖 Rule Hierarchy

```
GLOBAL_RULES.md (ALWAYS - Foundation)
    ↓
senior-workflow.md (Speed + Quality)
    ↓
code-react-native.md (React Native specifics)
    ↓
testing-standards.md (Testing details)
```

If rules conflict, **GLOBAL_RULES.md takes precedence**.

---

## ✅ Enforcement Checklist

Every PR must pass this checklist:

### Before Implementation
- [ ] Read GLOBAL_RULES.md
- [ ] Searched MCP context7 for existing code
- [ ] Used Byterover for complex tasks
- [ ] Planned test cases

### During Implementation
- [ ] Followed React Native rules
- [ ] Used TypeScript properly
- [ ] Followed project structure
- [ ] Used theme system (colors, spacing, typography)
- [ ] Handled errors and loading states

### After Implementation
- [ ] Tests written and passing
- [ ] Coverage meets 80%+ threshold
- [ ] Documentation updated
- [ ] Code reviewed
- [ ] No TypeScript errors
- [ ] No ESLint warnings

---

## 🔍 Search Before Creating

### Always Use MCP Context7

Before implementing:

```typescript
// ❌ Wrong - Creating without searching
import * as SecureStore from 'expo-secure-store';
const saveToken = async (token) => {
  await SecureStore.setItemAsync('token', token);
};

// ✅ Right - Search and reuse
// 1. Search MCP context7: "secure storage, save token"
// 2. Found: src/shared/services/storage/secureStorage.ts
// 3. Reuse it:
import { secureStorage } from '@/shared/services/storage/secureStorage';
await secureStorage.saveTokens(token, refreshToken);
```

---

## 🧠 Use Byterover

For complex tasks involving:
- Multiple files (3+)
- Multi-step implementation
- Architecture decisions
- Pattern consistency

**Create a Byterover context** to track:
- Decisions made
- Modules created
- Progress status
- Constraints

---

## ✅ Tests Are Mandatory

**No feature is complete without tests.**

### Test Requirements

```typescript
// For every new feature/function:
1. Write unit tests (business logic)
2. Write component tests (UI)
3. Write integration tests (workflows)
4. Ensure 80%+ coverage
5. Run tests: npm test
```

### Example

```typescript
// ❌ Not done
✓ Feature implemented
✗ No tests

// ✅ Done
✓ Feature implemented
✓ Unit tests written
✓ Component tests written
✓ All tests passing
✓ Coverage: 87%
```

---

## 📂 Project Structure

```
src/
├── features/              # Feature modules
│   └── onboarding/
│       ├── components/    # Feature components
│       ├── screens/       # Screen components
│       ├── stores/        # State (Zustand)
│       ├── types/         # TypeScript types
│       └── __tests__/     # Tests
│
├── shared/               # Shared code
│   ├── components/       # Reusable UI
│   ├── services/         # API, storage
│   ├── hooks/            # Custom hooks
│   └── utils/            # Utilities
│
└── theme/               # Design system
    ├── colors.ts
    ├── typography.ts
    └── spacing.ts
```

---

## 🎯 Common Scenarios

### Scenario 1: Adding New Feature

```markdown
1. Check GLOBAL_RULES.md
2. Search MCP context7 for similar features
3. Use Byterover to track implementation
4. Follow code-react-native.md for structure
5. Write tests per testing-standards.md
6. Document in README
```

### Scenario 2: Fixing Bug

```markdown
1. Write failing test first
2. Fix the bug
3. Ensure test passes
4. Check no regressions
5. Update documentation if needed
```

### Scenario 3: Refactoring

```markdown
1. Use Byterover to track decisions
2. Ensure tests pass before refactoring
3. Refactor incrementally
4. Keep tests green
5. Update rules if patterns change
```

---

## 🚨 Violations

### What Happens When Rules Are Broken?

1. **Code Review Rejection**
   - PR will not be approved
   - Must fix before merging

2. **Required Refactoring**
   - Rewrite to follow standards
   - Add missing tests
   - Update documentation

3. **Pattern Documentation**
   - Update rules if better pattern found
   - Share with team

---

## 📝 Updating Rules

### When to Update

- New patterns emerge
- Better practices discovered
- Technology updates
- Team consensus changes

### How to Update

1. Propose change in PR
2. Discuss with team
3. Update relevant rule file(s)
4. Add example if needed
5. Announce to team

---

## 📚 Resources

### Project Documentation
- `/docs/BRD.MD` - Business requirements
- `/docs/USER_STORI.MD` - User stories
- `/docs/COLORS.MD` - Color system
- Feature READMEs in `/src/features/*/README.md`

### External Resources
- [React Native Docs](https://reactnative.dev/)
- [Expo Docs](https://docs.expo.dev/)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Jest Documentation](https://jestjs.io/)
- [React Testing Library](https://testing-library.com/react)

---

## ❓ Questions?

If you're unsure about a rule or need clarification:

1. Check examples in the rules files
2. Search existing code for patterns
3. Ask in team chat
4. Propose rule update if unclear

---

**Last Updated:** 2025-11-22
**Version:** 1.0.0
**Maintained By:** Development Team

---

## 🎉 Remember

> "Rules are here to help, not hinder. They ensure consistency, quality, and maintainability. When in doubt, follow the rules. If the rules are wrong, update them."

**Key Principles:**
1. 🔍 Search before creating (MCP context7)
2. 🧠 Track complex work (Byterover)
3. ✅ Tests are mandatory
4. 📚 Document everything
5. 🤝 Consistency is key
