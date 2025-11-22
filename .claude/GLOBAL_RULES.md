---
trigger: always_on
priority: critical
---

# 🌐 Global Development Rules for TastebuddyAI

These rules apply to **ALL** development work in this repository, regardless of file type or location.

---

## 📋 Table of Contents

1. [MCP Context 7 Usage](#mcp-context-7-usage)
2. [Byterover for Large Flows](#byterover-for-large-flows)
3. [Testing Policy (Mandatory)](#testing-policy-mandatory)
4. [Code Organization](#code-organization)
5. [Documentation](#documentation)

---

## 🔍 MCP Context 7 Usage

### Rule: Search Before Creating

**BEFORE implementing any new usage of a library, function, service, or utility:**

1. **MUST use MCP context7** to search for existing implementations
2. **MUST check** if there is already:
   - A wrapper function
   - A service
   - A hook
   - A shared utility
   - A helper method

### Implementation Steps

```markdown
1. Search in MCP context7 for:
   - Existing patterns
   - Similar implementations
   - Related utilities
   - Service wrappers

2. If found → REUSE IT
   - Follow the existing pattern
   - Extend if needed
   - Do NOT reinvent

3. If NOT found → Create new
   - Document why new implementation is needed
   - Follow project conventions
   - Add to appropriate location (services/, hooks/, utils/)
```

### Examples

#### ❌ Wrong Approach
```typescript
// Creating new storage without checking
import * as SecureStore from 'expo-secure-store';

const saveToken = async (token: string) => {
  await SecureStore.setItemAsync('token', token);
};
```

#### ✅ Correct Approach
```typescript
// First check MCP context7:
// "Search: storage service, secure storage, token storage"
// Found: src/shared/services/storage/secureStorage.ts

// Reuse existing service
import { secureStorage } from '@/shared/services/storage/secureStorage';

const saveToken = async (token: string) => {
  await secureStorage.saveTokens(token, refreshToken);
};
```

### Enforcement

- **ALWAYS search context7 first**
- **JUSTIFY** if creating new implementation when similar exists
- **UPDATE** existing services rather than duplicating
- **DOCUMENT** patterns for future reference

---

## 🧠 Byterover for Large Flows

### Rule: Use Byterover for Complex Tasks

**When working on multi-step flows or large refactors, you MUST actively use Byterover to preserve and recall important context.**

### When to Use Byterover

Use Byterover when:

1. **Many files involved** (3+ related files)
2. **Multi-step implementation** (more than 2 sequential steps)
3. **Long conversation** (context might be lost)
4. **Architecture decisions** need to be tracked
5. **Pattern consistency** across multiple modules
6. **Refactoring** large sections of code

### What to Track in Byterover

```markdown
✅ Architecture Decisions
- Why certain patterns were chosen
- Trade-offs made
- Dependencies established

✅ Module Registry
- Existing services and their purposes
- Shared utilities location
- Hook patterns used

✅ Flow State
- Current progress in multi-step tasks
- Pending tasks
- Completed changes

✅ Constraints & Requirements
- Business rules
- Technical limitations
- User requirements
- Performance considerations
```

### Example Usage

```markdown
## Byterover Context: Onboarding Flow Implementation

### Architecture Decisions
- Using Zustand for state management (lightweight, simple API)
- Expo Router for navigation (file-based routing)
- SecureStorage for persisting completion status

### Existing Patterns
- Screen components in: src/features/[feature]/screens/
- Reusable UI in: src/features/[feature]/components/
- State in: src/features/[feature]/stores/

### Current Progress
✅ Types and interfaces defined
✅ Store with BMR/TDEE calculations
✅ 8 screen components created
⏳ Testing implementation
⏳ i18n integration

### Key Constraints
- Must support offline mode
- Onboarding only for new users
- Save progress to storage + backend
```

### Enforcement

- **CREATE** Byterover context at start of large tasks
- **UPDATE** regularly as decisions are made
- **REFERENCE** before implementing new features
- **SHARE** summary when task is complete

---

## ✅ Testing Policy (Mandatory)

### Rule: No Feature is Complete Without Tests

**For every non-trivial feature, module, or function you write or modify, you MUST provide tests.**

### Testing Requirements

#### All Changes Must Include:

1. **Test Files**
   - Unit tests for business logic
   - Integration tests for workflows
   - Component tests for UI (if applicable)

2. **Test Coverage**
   - Happy path scenarios
   - Edge cases
   - Error conditions
   - Boundary conditions

3. **Test Execution**
   - Tests must run successfully
   - Provide exact command to run tests
   - Include in PR/commit description

### Test File Locations

```markdown
src/
├── features/
│   └── onboarding/
│       ├── stores/
│       │   ├── onboardingStore.ts
│       │   └── __tests__/
│       │       └── onboardingStore.test.ts
│       ├── components/
│       │   ├── SelectableCard.tsx
│       │   └── __tests__/
│       │       └── SelectableCard.test.tsx
│       └── screens/
│           ├── LanguageSelectionScreen.tsx
│           └── __tests__/
│               └── LanguageSelectionScreen.test.tsx
```

### Test Command Examples

```bash
# Run all tests
npm test

# Run specific test file
npm test onboardingStore

# Run tests for specific feature
npm test src/features/onboarding

# Run with coverage
npm test -- --coverage

# Watch mode
npm test -- --watch
```

### Minimum Test Requirements

#### For Stores (Zustand/Redux)

```typescript
describe('OnboardingStore', () => {
  it('should initialize with default values', () => {});
  it('should update language when setLanguage is called', () => {});
  it('should calculate daily targets correctly', () => {});
  it('should persist completion status', () => {});
});
```

#### For Components

```typescript
describe('SelectableCard', () => {
  it('should render with title and subtitle', () => {});
  it('should show selected state when selected prop is true', () => {});
  it('should call onPress when tapped', () => {});
  it('should display icon when provided', () => {});
});
```

#### For Business Logic

```typescript
describe('calculateBMR', () => {
  it('should calculate BMR correctly for male', () => {});
  it('should calculate BMR correctly for female', () => {});
  it('should handle edge cases (age 0, negative weight)', () => {});
});
```

### Before Considering Task "Done"

- [ ] Tests written for all new/modified code
- [ ] Tests pass locally
- [ ] Test command documented
- [ ] Coverage meets minimum threshold (80%+)
- [ ] Edge cases covered
- [ ] Error scenarios tested

### Enforcement

- **NO EXCEPTIONS**: Tests are mandatory, not optional
- **AI RESPONSIBILITY**: If developer forgets to ask for tests, AI must still propose them
- **DOCUMENTATION**: Include test commands in all feature documentation
- **REVIEW**: Tests are part of code review checklist

### Example Test Implementation

```typescript
// src/features/onboarding/stores/__tests__/onboardingStore.test.ts

import { renderHook, act } from '@testing-library/react-hooks';
import { useOnboardingStore } from '../onboardingStore';

describe('OnboardingStore', () => {
  beforeEach(() => {
    const { result } = renderHook(() => useOnboardingStore());
    act(() => {
      result.current.resetOnboarding();
    });
  });

  describe('Language Selection', () => {
    it('should set language correctly', () => {
      const { result } = renderHook(() => useOnboardingStore());

      act(() => {
        result.current.setLanguage('vi');
      });

      expect(result.current.language).toBe('vi');
    });
  });

  describe('Daily Targets Calculation', () => {
    it('should calculate BMR correctly for male', () => {
      const { result } = renderHook(() => useOnboardingStore());

      act(() => {
        result.current.setNutritionGoals({
          gender: 'male',
          age: 30,
          weight: 70,
          height: 175,
          activityLevel: 'moderate',
          goal: 'maintain',
          healthConditions: [],
        });
        result.current.calculateDailyTargets();
      });

      // BMR = 10 × 70 + 6.25 × 175 - 5 × 30 + 5 = 1656.25
      // TDEE = 1656.25 × 1.55 = 2567
      expect(result.current.dailyTargets.calories).toBeCloseTo(2567, 0);
    });

    it('should apply deficit for weight loss goal', () => {
      const { result } = renderHook(() => useOnboardingStore());

      act(() => {
        result.current.setNutritionGoals({
          gender: 'male',
          age: 30,
          weight: 70,
          height: 175,
          activityLevel: 'moderate',
          goal: 'lose-weight',
          healthConditions: [],
        });
        result.current.calculateDailyTargets();
      });

      // TDEE × 0.8 for weight loss
      const expectedCalories = Math.round(2567 * 0.8);
      expect(result.current.dailyTargets.calories).toBe(expectedCalories);
    });
  });
});
```

**Test Command:**
```bash
npm test onboardingStore
```

---

## 📁 Code Organization

### Project Structure Rules

```markdown
src/
├── features/              # Feature-based modules
│   └── [feature-name]/
│       ├── components/    # Feature-specific components
│       ├── screens/       # Screen components
│       ├── stores/        # State management
│       ├── types/         # TypeScript types
│       ├── constants/     # Constants and configs
│       ├── hooks/         # Custom hooks
│       └── utils/         # Utility functions
│
├── shared/               # Shared across features
│   ├── components/       # Reusable UI components
│   │   ├── base/        # Basic components (Button, Input, Card)
│   │   ├── layout/      # Layout components (Screen, Container)
│   │   └── feedback/    # Feedback components (Loading, Toast)
│   ├── services/        # API clients, storage, etc.
│   ├── hooks/           # Shared hooks
│   ├── utils/           # Shared utilities
│   ├── types/           # Shared types
│   └── stores/          # Global stores
│
└── theme/               # Design system
    ├── colors.ts
    ├── typography.ts
    ├── spacing.ts
    └── index.ts
```

### Naming Conventions

- **Components**: PascalCase (`SelectableCard.tsx`)
- **Hooks**: camelCase with `use` prefix (`useOnboarding.ts`)
- **Utils**: camelCase (`calculateBMR.ts`)
- **Stores**: camelCase with `Store` suffix (`onboardingStore.ts`)
- **Types**: PascalCase (`OnboardingState`)
- **Constants**: UPPER_SNAKE_CASE (`API_TIMEOUT`)

---

## 📚 Documentation

### Required Documentation

1. **README.md** in feature folders
2. **JSDoc comments** for public APIs
3. **Inline comments** for complex logic
4. **Type definitions** with descriptions
5. **Test descriptions** explaining what is tested

### Example

```typescript
/**
 * Calculate Basal Metabolic Rate using Mifflin-St Jeor Equation
 *
 * @param weight - Weight in kilograms
 * @param height - Height in centimeters
 * @param age - Age in years
 * @param gender - Biological gender ('male' | 'female' | 'other')
 * @returns BMR in calories per day
 *
 * @example
 * const bmr = calculateBMR(70, 175, 30, 'male');
 * // Returns: ~1656 calories/day
 */
export const calculateBMR = (
  weight: number,
  height: number,
  age: number,
  gender: Gender
): number => {
  // Mifflin-St Jeor Equation for males
  if (gender === 'male') {
    return 10 * weight + 6.25 * height - 5 * age + 5;
  }
  // Mifflin-St Jeor Equation for females
  return 10 * weight + 6.25 * height - 5 * age - 161;
};
```

---

## 🚀 Summary

### Quick Reference Checklist

Before implementing ANY feature:

- [ ] ✅ Search MCP context7 for existing implementations
- [ ] 🧠 Use Byterover if task is complex or multi-step
- [ ] ✅ Write tests alongside implementation
- [ ] 📁 Follow project structure conventions
- [ ] 📚 Document public APIs and complex logic
- [ ] 🔍 Run tests before considering task complete

### Violation Consequences

Breaking these rules results in:

1. **Code Review Rejection**
2. **Required Refactoring**
3. **Pattern Documentation Update**

### Rule Updates

These rules are living documents. Update them when:

- New patterns emerge
- Better practices are discovered
- Team consensus changes
- Technology updates require adaptation

---

**Last Updated:** 2025-11-22
**Version:** 1.0.0
**Enforced By:** AI Coding Assistant + Human Review
