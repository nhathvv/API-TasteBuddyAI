---
trigger: always_on
description: Comprehensive testing standards and requirements
priority: critical
---

# 🧪 Testing Standards for TastebuddyAI

**Status:** MANDATORY - No feature is complete without tests

---

## 📋 Table of Contents

1. [Testing Philosophy](#testing-philosophy)
2. [Test Types](#test-types)
3. [File Structure](#file-structure)
4. [Writing Tests](#writing-tests)
5. [Running Tests](#running-tests)
6. [Coverage Requirements](#coverage-requirements)
7. [Examples](#examples)

---

## 🎯 Testing Philosophy

### Core Principles

1. **Tests are NOT optional** - Every feature requires tests
2. **Tests are written ALONGSIDE code** - Not after
3. **Tests document behavior** - They serve as living documentation
4. **Tests prevent regressions** - Catch bugs before production
5. **Tests enable refactoring** - Safe to change implementation

### The Testing Pyramid

```
        /\
       /  \
      / E2E \         ← Few (Critical user flows)
     /______\
    /        \
   /Integration\      ← Some (Feature workflows)
  /____________\
 /              \
/   Unit Tests   \    ← Many (Business logic, utils)
/________________\
```

---

## 🔬 Test Types

### 1. Unit Tests (Most Common)

Test individual functions, utilities, and logic in isolation.

**What to test:**
- Business logic functions
- Utility functions
- Calculations
- Validators
- Formatters
- Store actions (Zustand)

**Example:**
```typescript
// calculateBMR.test.ts
describe('calculateBMR', () => {
  it('should calculate BMR for male correctly', () => {
    const result = calculateBMR(70, 175, 30, 'male');
    expect(result).toBeCloseTo(1656.25, 1);
  });
});
```

### 2. Component Tests

Test React components in isolation.

**What to test:**
- Component renders correctly
- Props are handled properly
- User interactions work
- State changes update UI
- Conditional rendering

**Example:**
```typescript
// SelectableCard.test.tsx
describe('SelectableCard', () => {
  it('should render with title', () => {
    const { getByText } = render(
      <SelectableCard title="Test" selected={false} onPress={() => {}} />
    );
    expect(getByText('Test')).toBeTruthy();
  });
});
```

### 3. Integration Tests

Test how multiple components/modules work together.

**What to test:**
- Complete user flows
- Navigation between screens
- State management across components
- API integration with stores

**Example:**
```typescript
// onboardingFlow.test.tsx
describe('Onboarding Flow', () => {
  it('should save data and navigate through all steps', async () => {
    // Test complete onboarding flow
  });
});
```

### 4. E2E Tests (Detox)

Test complete user journeys in a real app environment.

**What to test:**
- Critical user paths
- Cross-platform behavior
- Real API interactions
- Device-specific features

---

## 📁 File Structure

### Location Pattern

```
src/
└── features/
    └── onboarding/
        ├── components/
        │   ├── SelectableCard.tsx
        │   └── __tests__/
        │       └── SelectableCard.test.tsx
        ├── stores/
        │   ├── onboardingStore.ts
        │   └── __tests__/
        │       └── onboardingStore.test.ts
        ├── utils/
        │   ├── calculations.ts
        │   └── __tests__/
        │       └── calculations.test.ts
        └── screens/
            ├── LanguageSelectionScreen.tsx
            └── __tests__/
                └── LanguageSelectionScreen.test.tsx
```

### Naming Convention

- Test files: `[ComponentName].test.tsx` or `[fileName].test.ts`
- Test folders: `__tests__/`
- Mock files: `__mocks__/`

---

## ✍️ Writing Tests

### Test Structure (AAA Pattern)

```typescript
describe('Feature/Component Name', () => {
  // Arrange - Setup
  beforeEach(() => {
    // Setup code
  });

  it('should [expected behavior] when [condition]', () => {
    // Arrange - Prepare test data
    const input = { ... };

    // Act - Execute the function/interaction
    const result = myFunction(input);

    // Assert - Verify the outcome
    expect(result).toBe(expected);
  });
});
```

### Test Naming Convention

Use descriptive names that explain:
- What is being tested
- Under what conditions
- What the expected outcome is

```typescript
// ✅ Good test names
it('should calculate BMR correctly for male')
it('should show error message when email is invalid')
it('should navigate to next screen when Next button is pressed')
it('should display allergen warning when severe allergen is detected')

// ❌ Bad test names
it('works')
it('test1')
it('should pass')
```

### What to Test

#### ✅ DO Test

- **Public API** - Functions and methods users of your code interact with
- **User interactions** - Button clicks, input changes, gestures
- **Edge cases** - Boundary values, empty arrays, null/undefined
- **Error conditions** - Invalid inputs, API failures, network errors
- **State changes** - Redux/Zustand actions, React state updates
- **Conditional logic** - If/else branches, switch statements

#### ❌ DON'T Test

- **Third-party libraries** - Assume they work (test your usage, not the library)
- **Implementation details** - Test behavior, not how it's implemented
- **Trivial code** - Simple getters/setters with no logic
- **Constants** - Static values that never change

---

## 🚀 Running Tests

### Commands

```bash
# Run all tests
npm test

# Run specific test file
npm test SelectableCard

# Run tests in watch mode
npm test -- --watch

# Run tests with coverage
npm test -- --coverage

# Run tests for specific folder
npm test src/features/onboarding

# Update snapshots
npm test -- -u

# Run only failed tests
npm test -- --onlyFailures
```

### CI/CD Integration

Tests MUST pass before:
- Merging PRs
- Deploying to staging
- Releasing to production

---

## 📊 Coverage Requirements

### Minimum Coverage

- **Overall:** 80%
- **Business Logic:** 90%+
- **Utilities:** 95%+
- **Components:** 70%+
- **Critical Paths:** 100%

### Coverage Report

```bash
npm test -- --coverage
```

View coverage in: `coverage/lcov-report/index.html`

### Critical Code (100% Coverage Required)

- Authentication logic
- Payment processing
- Data calculations (BMR, TDEE, macros)
- Allergen safety checks
- Permission handling

---

## 📚 Examples

### Example 1: Testing Utility Function

```typescript
// src/features/onboarding/utils/__tests__/calculations.test.ts

import { calculateBMR, calculateTDEE, calculateMacros } from '../calculations';

describe('Nutrition Calculations', () => {
  describe('calculateBMR', () => {
    it('should calculate BMR correctly for male', () => {
      const result = calculateBMR(70, 175, 30, 'male');
      // BMR = 10 × 70 + 6.25 × 175 - 5 × 30 + 5 = 1656.25
      expect(result).toBeCloseTo(1656.25, 1);
    });

    it('should calculate BMR correctly for female', () => {
      const result = calculateBMR(60, 165, 25, 'female');
      // BMR = 10 × 60 + 6.25 × 165 - 5 × 25 - 161 = 1376.25
      expect(result).toBeCloseTo(1376.25, 1);
    });

    it('should handle edge case of age 0', () => {
      const result = calculateBMR(70, 175, 0, 'male');
      expect(result).toBeGreaterThan(0);
    });
  });

  describe('calculateTDEE', () => {
    it('should apply activity multiplier correctly', () => {
      const bmr = 1656.25;
      const result = calculateTDEE(bmr, 'moderate');
      // TDEE = 1656.25 × 1.55 = 2567
      expect(result).toBeCloseTo(2567, 0);
    });
  });

  describe('calculateMacros', () => {
    it('should distribute macros for weight loss', () => {
      const macros = calculateMacros(2000, 'lose-weight');

      expect(macros.protein).toBe(175); // 35% of 2000 / 4
      expect(macros.carbs).toBe(200);   // 40% of 2000 / 4
      expect(macros.fats).toBe(56);     // 25% of 2000 / 9
    });
  });
});
```

### Example 2: Testing React Component

```typescript
// src/features/onboarding/components/__tests__/SelectableCard.test.tsx

import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { SelectableCard } from '../SelectableCard';

describe('SelectableCard', () => {
  const mockOnPress = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render title and subtitle', () => {
    const { getByText } = render(
      <SelectableCard
        title="Vegan"
        subtitle="No animal products"
        selected={false}
        onPress={mockOnPress}
      />
    );

    expect(getByText('Vegan')).toBeTruthy();
    expect(getByText('No animal products')).toBeTruthy();
  });

  it('should show selected state', () => {
    const { getByTestId } = render(
      <SelectableCard
        title="Vegan"
        selected={true}
        onPress={mockOnPress}
        testID="card"
      />
    );

    const card = getByTestId('card');
    expect(card.props.style).toContainEqual(
      expect.objectContaining({ borderColor: '#017bff' })
    );
  });

  it('should call onPress when tapped', () => {
    const { getByTestId } = render(
      <SelectableCard
        title="Vegan"
        selected={false}
        onPress={mockOnPress}
        testID="card"
      />
    );

    fireEvent.press(getByTestId('card'));
    expect(mockOnPress).toHaveBeenCalledTimes(1);
  });

  it('should render icon when provided', () => {
    const { getByText } = render(
      <SelectableCard
        title="Vegan"
        icon={<>🌱</>}
        selected={false}
        onPress={mockOnPress}
      />
    );

    expect(getByText('🌱')).toBeTruthy();
  });

  it('should not call onPress when disabled', () => {
    const { getByTestId } = render(
      <SelectableCard
        title="Vegan"
        selected={false}
        onPress={mockOnPress}
        disabled={true}
        testID="card"
      />
    );

    fireEvent.press(getByTestId('card'));
    expect(mockOnPress).not.toHaveBeenCalled();
  });
});
```

### Example 3: Testing Zustand Store

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

  describe('Dietary Preferences', () => {
    it('should add dietary preference', () => {
      const { result } = renderHook(() => useOnboardingStore());

      act(() => {
        result.current.setDietaryPreferences(['vegan', 'halal']);
      });

      expect(result.current.dietaryPreferences).toEqual(['vegan', 'halal']);
    });
  });

  describe('Allergen Management', () => {
    it('should add allergen with severity', () => {
      const { result } = renderHook(() => useOnboardingStore());

      act(() => {
        result.current.addAllergen({ type: 'peanuts', severity: 'severe' });
      });

      expect(result.current.allergens).toContainEqual({
        type: 'peanuts',
        severity: 'severe',
      });
    });

    it('should update allergen severity', () => {
      const { result } = renderHook(() => useOnboardingStore());

      act(() => {
        result.current.addAllergen({ type: 'peanuts', severity: 'mild' });
        result.current.updateAllergenSeverity('peanuts', 'severe');
      });

      const allergen = result.current.allergens.find(a => a.type === 'peanuts');
      expect(allergen?.severity).toBe('severe');
    });

    it('should remove allergen', () => {
      const { result } = renderHook(() => useOnboardingStore());

      act(() => {
        result.current.addAllergen({ type: 'peanuts', severity: 'mild' });
        result.current.removeAllergen('peanuts');
      });

      expect(result.current.allergens).toHaveLength(0);
    });
  });

  describe('Daily Targets Calculation', () => {
    it('should calculate targets correctly', () => {
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

      expect(result.current.dailyTargets.calories).toBeCloseTo(2567, 0);
      expect(result.current.dailyTargets.protein).toBeGreaterThan(0);
      expect(result.current.dailyTargets.carbs).toBeGreaterThan(0);
      expect(result.current.dailyTargets.fats).toBeGreaterThan(0);
    });
  });

  describe('Onboarding Completion', () => {
    it('should mark onboarding as complete', async () => {
      const { result } = renderHook(() => useOnboardingStore());

      await act(async () => {
        await result.current.completeOnboarding();
      });

      expect(result.current.completed).toBe(true);
    });
  });
});
```

### Example 4: Testing Navigation Flow

```typescript
// src/features/onboarding/__tests__/onboardingFlow.test.tsx

import { renderRouter, screen } from 'expo-router/testing-library';
import { act } from '@testing-library/react-native';

describe('Onboarding Flow', () => {
  it('should navigate through all onboarding steps', async () => {
    const { getByText, getByTestId } = renderRouter('/(onboarding)/language');

    // Step 1: Language Selection
    expect(getByText('Choose your language')).toBeTruthy();

    const englishOption = getByTestId('language-en');
    await act(async () => {
      fireEvent.press(englishOption);
    });

    const nextButton = getByText('Next');
    await act(async () => {
      fireEvent.press(nextButton);
    });

    // Step 2: Dietary Preferences
    expect(getByText('Dietary preferences')).toBeTruthy();
    // ... continue testing flow
  });
});
```

---

## ✅ Test Checklist

Before marking a feature as complete:

- [ ] Unit tests written for all business logic
- [ ] Component tests written for UI components
- [ ] Integration tests for critical flows
- [ ] Edge cases covered
- [ ] Error scenarios tested
- [ ] All tests passing locally
- [ ] Coverage meets minimum threshold (80%+)
- [ ] Test commands documented in README
- [ ] Mock data and fixtures created if needed
- [ ] Async operations properly tested

---

## 🚫 Common Testing Mistakes

### ❌ Testing Implementation Details

```typescript
// ❌ Bad - Testing internal state
it('should set loading to true', () => {
  const { result } = renderHook(() => useMyHook());
  act(() => result.current.fetchData());
  expect(result.current.loading).toBe(true);
});

// ✅ Good - Testing behavior
it('should show loading indicator while fetching', () => {
  const { getByTestId } = render(<MyComponent />);
  expect(getByTestId('loading')).toBeTruthy();
});
```

### ❌ Not Testing Edge Cases

```typescript
// ❌ Only testing happy path
it('should calculate BMR', () => {
  expect(calculateBMR(70, 175, 30, 'male')).toBe(1656.25);
});

// ✅ Testing edge cases too
it('should handle zero age', () => { ... });
it('should handle negative weight', () => { ... });
it('should handle null gender', () => { ... });
```

### ❌ Flaky Tests

```typescript
// ❌ Using setTimeout without proper awaits
it('should update after delay', () => {
  setTimeout(() => {
    expect(value).toBe('updated');
  }, 1000);
});

// ✅ Using proper async/await
it('should update after delay', async () => {
  await waitFor(() => {
    expect(value).toBe('updated');
  });
});
```

---

## 📖 Resources

- [Jest Documentation](https://jestjs.io/)
- [React Native Testing Library](https://callstack.github.io/react-native-testing-library/)
- [Testing Best Practices](https://kentcdodds.com/blog/common-mistakes-with-react-testing-library)

---

**Remember:** Tests are not overhead - they are an investment in code quality and maintainability!
