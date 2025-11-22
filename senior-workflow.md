---
trigger: always_on
description: Senior-level workflow for fast, quality code generation and commits
priority: high
---

# 🚀 Senior Developer Workflow Rules

**Goal:** Write production-ready code fast with senior-level quality and proper git practices.

---

## 📋 Table of Contents

1. [Speed + Quality Principles](#speed--quality-principles)
2. [Code Generation Workflow](#code-generation-workflow)
3. [Senior-Level Code Standards](#senior-level-code-standards)
4. [Git Commit Practices](#git-commit-practices)
5. [Code Review Self-Checklist](#code-review-self-checklist)
6. [Quick Reference](#quick-reference)

---

## ⚡ Speed + Quality Principles

### The Senior Developer Mindset

```markdown
FAST ≠ SLOPPY
FAST = EFFICIENT + EXPERIENCED + PATTERNS

Senior developers are fast because they:
✓ Know patterns → Apply immediately
✓ Search first → Avoid reinventing
✓ Think ahead → Prevent rework
✓ Write tests → Catch bugs early
✓ Document clear → Save time later
```

### Core Rules

1. **Search Before Creating** (MCP context7)
   - 30 seconds searching > 10 minutes rewriting

2. **Use Existing Patterns**
   - Don't reinvent the wheel
   - Follow established conventions

3. **Think in Components**
   - Small, reusable pieces
   - Single responsibility

4. **Test While Building**
   - Not after, WHILE
   - Catch issues immediately

5. **Commit Frequently**
   - Small, atomic commits
   - Clear, descriptive messages

---

## 🔄 Code Generation Workflow

### Phase 1: Research (2-5 minutes)

```markdown
1. Search MCP context7
   → Existing implementations?
   → Similar patterns?
   → Reusable utilities?

2. Check project structure
   → Where should this live?
   → What dependencies exist?
   → What patterns to follow?

3. Review requirements
   → What's the exact scope?
   → What are edge cases?
   → What needs testing?
```

**Time Investment:** 2-5 minutes
**Time Saved:** Hours of rework

---

### Phase 2: Plan (2-3 minutes)

```markdown
1. Define interfaces/types FIRST
   → TypeScript interfaces
   → Function signatures
   → Component props

2. Identify dependencies
   → What needs to be imported?
   → What services to use?
   → What state is needed?

3. Plan test cases
   → Happy path
   → Edge cases
   → Error scenarios
```

**Output:** Clear mental model before writing code

---

### Phase 3: Implement (Fast + Focused)

```markdown
1. Start with skeleton
   → Types/interfaces
   → Function signatures
   → Component structure

2. Implement core logic
   → Business logic first
   → Error handling
   → Loading states

3. Add polish
   → Styling
   → Animations
   → Accessibility

4. Write tests WHILE coding
   → Not after
   → Test each function as you write it
```

**Key:** Write code in layers, test incrementally

---

### Phase 4: Review (Self QA - 3 minutes)

```markdown
✓ Does it follow SOLID principles?
✓ Are types properly defined?
✓ Is error handling present?
✓ Are loading states handled?
✓ Do tests cover edge cases?
✓ Is it DRY (Don't Repeat Yourself)?
✓ Is it readable (clear names)?
✓ Is it documented (if complex)?
```

---

### Phase 5: Commit (Atomic + Clear)

```markdown
1. Stage related changes
   git add [specific files]

2. Write clear commit message
   git commit -m "feat(onboarding): add language selection screen"

3. Verify before push
   npm test
   npm run lint
```

---

## 💎 Senior-Level Code Standards

### 1. Type Safety (TypeScript)

```typescript
// ❌ Junior Level
const handleSubmit = (data: any) => {
  console.log(data);
};

// ✅ Senior Level
interface FormData {
  email: string;
  password: string;
}

const handleSubmit = (data: FormData): Promise<void> => {
  logger.info('Form submitted', { email: data.email });
  // Implementation
};
```

### 2. Error Handling

```typescript
// ❌ Junior Level
const fetchData = async () => {
  const data = await api.get('/data');
  return data;
};

// ✅ Senior Level
const fetchData = async (): Promise<Data | null> => {
  try {
    const response = await apiClient.get<Data>('/data');
    return response.data;
  } catch (error) {
    logger.error('Failed to fetch data', { error });

    if (error instanceof NetworkError) {
      showToast('No internet connection', 'error');
    } else {
      showToast('Failed to load data. Please try again.', 'error');
    }

    return null;
  }
};
```

### 3. Component Structure

```typescript
// ❌ Junior Level
export default function MyComponent(props: any) {
  const [data, setData] = useState();

  useEffect(() => {
    fetch('/api/data').then(r => r.json()).then(d => setData(d));
  }, []);

  return <div>{data?.map(...)}</div>;
}

// ✅ Senior Level
interface MyComponentProps {
  userId: string;
  onDataLoaded?: (data: Data[]) => void;
}

export const MyComponent: React.FC<MyComponentProps> = ({
  userId,
  onDataLoaded,
}) => {
  const { data, loading, error } = useData(userId);

  useEffect(() => {
    if (data) {
      onDataLoaded?.(data);
    }
  }, [data, onDataLoaded]);

  if (loading) return <Loading />;
  if (error) return <ErrorView error={error} />;
  if (!data?.length) return <EmptyState />;

  return (
    <View style={styles.container}>
      {data.map((item) => (
        <DataCard key={item.id} data={item} />
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: spacing.md,
  },
});
```

### 4. Business Logic Separation

```typescript
// ❌ Junior Level - Business logic in component
const NutritionScreen = () => {
  const [calories, setCalories] = useState(0);

  const calculate = (weight, height, age) => {
    const bmr = 10 * weight + 6.25 * height - 5 * age + 5;
    const tdee = bmr * 1.55;
    setCalories(tdee);
  };

  return <View>...</View>;
};

// ✅ Senior Level - Business logic in separate module
// utils/nutrition.ts
export const calculateBMR = (
  weight: number,
  height: number,
  age: number,
  gender: Gender
): number => {
  if (gender === 'male') {
    return 10 * weight + 6.25 * height - 5 * age + 5;
  }
  return 10 * weight + 6.25 * height - 5 * age - 161;
};

export const calculateTDEE = (bmr: number, activityLevel: ActivityLevel): number => {
  const multipliers: Record<ActivityLevel, number> = {
    sedentary: 1.2,
    light: 1.375,
    moderate: 1.55,
    active: 1.725,
    'very-active': 1.9,
  };
  return bmr * multipliers[activityLevel];
};

// Component
const NutritionScreen = () => {
  const { weight, height, age, gender, activityLevel } = useProfile();

  const calories = useMemo(() => {
    const bmr = calculateBMR(weight, height, age, gender);
    return calculateTDEE(bmr, activityLevel);
  }, [weight, height, age, gender, activityLevel]);

  return <View>...</View>;
};
```

### 5. Consistent Naming

```typescript
// ✅ Senior Level Naming Conventions

// Booleans: is, has, can, should
const isLoading = true;
const hasError = false;
const canEdit = user.role === 'admin';
const shouldShowModal = isFirstTime && !dismissed;

// Functions: verb + noun
const fetchUserProfile = async () => { ... };
const calculateDailyTargets = (goals: Goals) => { ... };
const handleSubmit = (event: Event) => { ... };
const validateEmail = (email: string): boolean => { ... };

// Components: PascalCase
export const SelectableCard: React.FC<Props> = () => { ... };
export const OnboardingScreen: React.FC = () => { ... };

// Constants: UPPER_SNAKE_CASE
const API_TIMEOUT = 30000;
const MAX_RETRY_ATTEMPTS = 3;

// Types/Interfaces: PascalCase
interface UserProfile { ... }
type ActivityLevel = 'sedentary' | 'light' | 'moderate';

// Files:
// - Components: SelectableCard.tsx
// - Screens: LanguageSelectionScreen.tsx
// - Utils: calculations.ts
// - Hooks: useOnboarding.ts
// - Stores: onboardingStore.ts
```

### 6. DRY (Don't Repeat Yourself)

```typescript
// ❌ Junior Level - Repetition
const saveUserName = async (name: string) => {
  try {
    await api.post('/user/name', { name });
    showToast('Saved successfully');
  } catch (error) {
    showToast('Failed to save');
  }
};

const saveUserEmail = async (email: string) => {
  try {
    await api.post('/user/email', { email });
    showToast('Saved successfully');
  } catch (error) {
    showToast('Failed to save');
  }
};

// ✅ Senior Level - Abstraction
const updateUserField = async <T extends keyof UserProfile>(
  field: T,
  value: UserProfile[T]
): Promise<boolean> => {
  try {
    await apiClient.post(`/user/${field}`, { [field]: value });
    showToast('Saved successfully', 'success');
    return true;
  } catch (error) {
    logger.error(`Failed to update ${field}`, { error, value });
    showToast('Failed to save. Please try again.', 'error');
    return false;
  }
};

// Usage
await updateUserField('name', 'John');
await updateUserField('email', 'john@example.com');
```

---

## 📝 Git Commit Practices

### Commit Message Format (Conventional Commits)

```bash
<type>(<scope>): <subject>

<body>

<footer>
```

### Types

```bash
feat:     New feature
fix:      Bug fix
docs:     Documentation only
style:    Code style (formatting, no logic change)
refactor: Code refactoring (no feature/bug change)
perf:     Performance improvement
test:     Adding/updating tests
chore:    Build process, dependencies, tooling
```

### Examples

```bash
# ✅ Good Commits

feat(onboarding): add language selection screen

- Implement language selection with 6 languages
- Add language store with persistence
- Add i18n integration
- Tests: 87% coverage

---

fix(auth): resolve token refresh race condition

The token refresh was being called multiple times simultaneously
causing 401 errors. Added mutex lock to ensure single refresh.

Fixes #123

---

refactor(storage): migrate to new secureStorage API

- Replace direct expo-secure-store usage
- Use new secureStorage service
- Update all consumers (12 files)
- All tests passing

---

test(onboarding): add integration tests for full flow

- Test complete onboarding flow
- Test data persistence
- Test navigation between steps
- Coverage increased from 78% to 92%

---

chore(deps): upgrade expo to 54.0.0

- Update expo packages
- Fix breaking changes in expo-router
- Update documentation
```

### Commit Frequency

```markdown
✅ DO: Commit frequently (small, atomic changes)
- After implementing one feature
- After fixing one bug
- After writing tests for one module
- After refactoring one component

❌ DON'T: Large, monolithic commits
- "Updated everything"
- "WIP" (work in progress)
- "Fixed bugs" (which bugs?)
- "Changes" (what changes?)
```

### Atomic Commits

```bash
# ✅ Good: Atomic commits
git add src/features/onboarding/types/index.ts
git commit -m "feat(onboarding): add TypeScript types"

git add src/features/onboarding/stores/onboardingStore.ts
git commit -m "feat(onboarding): add Zustand store with BMR calculations"

git add src/features/onboarding/components/SelectableCard.tsx
git add src/features/onboarding/components/__tests__/SelectableCard.test.tsx
git commit -m "feat(onboarding): add SelectableCard component with tests"

# ❌ Bad: Everything at once
git add .
git commit -m "Added onboarding"
```

### Pre-Commit Checklist

```bash
# Before EVERY commit:

1. Run tests
   npm test

2. Check types
   npm run type-check

3. Lint code
   npm run lint

4. Review changes
   git diff --staged

5. Verify commit message
   - Clear and descriptive?
   - Follows format?
   - References issue if applicable?

6. Commit
   git commit -m "feat(scope): clear description"
```

---

## ✅ Code Review Self-Checklist

Before considering code "done":

### Functionality
- [ ] Feature works as expected
- [ ] Edge cases handled
- [ ] Error states handled
- [ ] Loading states handled
- [ ] Offline support (if applicable)

### Code Quality
- [ ] Follows SOLID principles
- [ ] DRY (no duplication)
- [ ] Clear, descriptive names
- [ ] TypeScript types defined
- [ ] No `any` types
- [ ] No hardcoded values
- [ ] Uses theme system

### Performance
- [ ] No unnecessary re-renders
- [ ] Memoization where needed
- [ ] Lazy loading (if applicable)
- [ ] Optimized list rendering
- [ ] No memory leaks

### Testing
- [ ] Unit tests written
- [ ] Component tests written
- [ ] Integration tests (if needed)
- [ ] All tests passing
- [ ] Coverage ≥ 80%

### Documentation
- [ ] JSDoc for public APIs
- [ ] README updated
- [ ] Complex logic commented
- [ ] Examples provided

### Git
- [ ] Atomic commits
- [ ] Clear commit messages
- [ ] No console.logs
- [ ] No commented code
- [ ] No TODO comments (or tracked)

---

## 🎯 Quick Reference

### Fast Development Checklist

```markdown
□ Searched MCP context7 for existing code
□ Planned types/interfaces first
□ Implemented in layers (skeleton → logic → polish)
□ Wrote tests while coding
□ Used theme system (colors, spacing, typography)
□ Handled errors and loading states
□ Self-reviewed code
□ Made atomic commits
□ All tests passing
```

### Senior-Level Code Indicators

```markdown
✓ Type-safe (no any types)
✓ Error boundaries and handling
✓ Loading and empty states
✓ Consistent naming conventions
✓ Separation of concerns
✓ DRY (no duplication)
✓ Testable (pure functions, small components)
✓ Documented (complex logic explained)
✓ Accessible (proper a11y)
✓ Performant (memoization, optimization)
```

### Common Mistakes to Avoid

```markdown
❌ Writing code without searching existing patterns
❌ Ignoring TypeScript errors
❌ Not handling loading/error states
❌ Large, monolithic components
❌ Business logic in components
❌ Hardcoded values
❌ Missing tests
❌ Vague commit messages
❌ Committing console.logs
❌ Not running tests before commit
```

---

## 🚀 Speed Tips

### 1. Use Code Snippets

Create snippets for common patterns:

```typescript
// Snippet: rfce (React Functional Component with Export)
interface Props {

}

export const ComponentName: React.FC<Props> = ({}) => {
  return (
    <View style={styles.container}>

    </View>
  );
};

const styles = StyleSheet.create({
  container: {},
});
```

### 2. Keyboard Shortcuts

```bash
# Essential shortcuts
Cmd+P     # Quick file open
Cmd+Shift+P   # Command palette
Cmd+D     # Select next occurrence
Cmd+/     # Toggle comment
Cmd+Shift+K   # Delete line
Cmd+Shift+F   # Search in files
```

### 3. Terminal Aliases

```bash
# .zshrc or .bashrc
alias gst="git status"
alias gco="git checkout"
alias gcm="git commit -m"
alias gps="git push"
alias gpl="git pull"
alias glog="git log --oneline --graph"

alias nt="npm test"
alias ntw="npm test -- --watch"
alias ntc="npm test -- --coverage"

alias rns="npm start"
alias rna="npm run android"
alias rni="npm run ios"
```

### 4. AI-Assisted Development

```markdown
✓ Use AI for boilerplate code
✓ Use AI for test generation
✓ Use AI for documentation
✓ Use AI for refactoring suggestions

BUT ALWAYS:
✓ Review AI-generated code
✓ Ensure it follows project standards
✓ Add context-specific logic
✓ Test thoroughly
```

---

## 💡 Senior Developer Habits

### Daily Practices

```markdown
1. Start with Tests
   - Read failing tests
   - Write new tests for today's work
   - Keep them green

2. Refactor as You Go
   - See duplication? Extract it
   - See complexity? Simplify it
   - See poor naming? Improve it

3. Document Decisions
   - Why did you choose this approach?
   - What alternatives were considered?
   - What are the trade-offs?

4. Share Knowledge
   - Code reviews with clear explanations
   - Pair programming when stuck
   - Document patterns for team

5. Continuous Learning
   - Read others' code
   - Learn new patterns
   - Stay updated on best practices
```

### Code Review Mindset

```markdown
When reviewing your own code:

1. Is it production-ready?
   - Would I be proud to show this?
   - Would I be comfortable maintaining this in 6 months?

2. Is it clear?
   - Can junior dev understand it?
   - Are names self-explanatory?

3. Is it tested?
   - What happens if API fails?
   - What if user does something unexpected?

4. Is it efficient?
   - Are there unnecessary operations?
   - Can it be optimized?

If answer is NO to any → Fix before committing
```

---

## 📊 Metrics for Success

### Speed Metrics

```markdown
✓ Time to first commit: < 30 min (for medium feature)
✓ Commits per day: 8-12 (small, atomic)
✓ PR merge time: < 2 hours (self-review first)
```

### Quality Metrics

```markdown
✓ Test coverage: ≥ 80%
✓ Type safety: 100% (no any)
✓ Bugs found in PR: 0-1
✓ Bugs in production: 0
✓ Code review comments: < 5 (means code is clear)
```

### Balance

```markdown
Fast + Quality = Senior Level

NOT:
- Fast but buggy ❌
- Slow but perfect ❌

YES:
- Fast AND quality ✅
```

---

## 🎓 Level Progression

### Junior → Mid → Senior

```typescript
// Junior Level
const getData = () => {
  fetch('/api/data').then(r => r.json()).then(console.log);
};

// Mid Level
const getData = async (): Promise<Data[]> => {
  try {
    const response = await fetch('/api/data');
    const data = await response.json();
    return data;
  } catch (error) {
    console.error(error);
    return [];
  }
};

// Senior Level
interface DataFetchOptions {
  retry?: number;
  timeout?: number;
  cache?: boolean;
}

const getData = async (
  options: DataFetchOptions = {}
): Promise<Result<Data[], FetchError>> => {
  const { retry = 3, timeout = 30000, cache = true } = options;

  try {
    const response = await apiClient.get<Data[]>('/data', {
      timeout,
      retry,
      cache,
    });

    logger.info('Data fetched successfully', {
      count: response.data.length,
    });

    return { success: true, data: response.data };
  } catch (error) {
    logger.error('Failed to fetch data', {
      error,
      options,
      timestamp: Date.now(),
    });

    return {
      success: false,
      error: {
        code: error.code,
        message: error.message,
        retryable: error.retryable,
      },
    };
  }
};

// Usage with proper error handling
const result = await getData({ cache: false });

if (result.success) {
  setData(result.data);
} else {
  showError(result.error.message);
  if (result.error.retryable) {
    scheduleRetry();
  }
}
```

---

## 🏆 Summary

### The Senior Developer Formula

```markdown
SPEED + QUALITY = Senior Level

WHERE:
SPEED comes from:
  ✓ Experience (patterns)
  ✓ Tools (shortcuts, snippets)
  ✓ Search first (MCP context7)
  ✓ Plan before code

QUALITY comes from:
  ✓ SOLID principles
  ✓ Type safety
  ✓ Error handling
  ✓ Tests
  ✓ Code review
  ✓ Documentation
```

### Remember

> "Fast code that works is better than slow code that's perfect. But fast code with bugs is worse than both."

**The Goal:**
- Write code quickly ✅
- With senior-level quality ✅
- That passes review first time ✅
- And is maintainable long-term ✅

---

**Last Updated:** 2025-11-22
**Version:** 1.0.0
**Level:** Senior
