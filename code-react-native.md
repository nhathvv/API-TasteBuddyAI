---
trigger: always_on
description: React Native Expo development rules and best practices
globs: src/**/*.{ts,tsx}, app/**/*.{ts,tsx}
---

# React Native + Expo Development Rules

## 🎯 Core Principles

### 1. Component Architecture

- **MUST** use functional components with hooks
- **AVOID** class components (unless absolutely necessary for error boundaries)
- **FOLLOW** Single Responsibility Principle for components
- **SPLIT** large components into smaller, reusable pieces

### 2. TypeScript Usage

- **ALWAYS** use TypeScript for type safety
- **DEFINE** proper interfaces for props and state
- **AVOID** `any` type - use `unknown` or proper types
- **EXPORT** types from dedicated `types/` folder

Example:
```typescript
// ✅ Good
interface SelectableCardProps {
  title: string;
  subtitle?: string;
  selected: boolean;
  onPress: () => void;
}

export const SelectableCard: React.FC<SelectableCardProps> = ({ ... }) => { ... };

// ❌ Bad
export const SelectableCard = (props: any) => { ... };
```

### 3. Styling Rules

- **MUST** use StyleSheet API for all styling
- **AVOID** inline styles (except for dynamic values)
- **USE** theme system from `src/theme/` for consistency
- **FOLLOW** design tokens: colors, spacing, typography

Example:
```typescript
// ✅ Good
const styles = StyleSheet.create({
  container: {
    padding: spacing.md,
    backgroundColor: colors.backgroundWhite,
  },
});

// ❌ Bad
<View style={{ padding: 12, backgroundColor: '#fff' }}>
```

### 4. Navigation

- **USE** Expo Router for file-based routing
- **STRUCTURE** routes in `app/` directory
- **FOLLOW** grouping with (parentheses) for layouts
- **TYPE** navigation params properly

### 5. State Management

- **USE** Zustand for global state (lightweight, simple)
- **USE** React hooks for local state (useState, useReducer)
- **AVOID** prop drilling - lift state up or use global store
- **PERSIST** important state using SecureStorage or AsyncStorage

Example:
```typescript
// ✅ Good - Zustand store
export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  login: async (email, password) => { ... },
  logout: async () => { ... },
}));

// ✅ Good - Local state
const [selected, setSelected] = useState<string[]>([]);
```

### 6. Data Fetching & API Calls

- **SEARCH** MCP context7 for existing API clients BEFORE creating new ones
- **USE** existing `apiClient` from `src/shared/services/api/client.ts`
- **IMPLEMENT** proper error handling with try/catch
- **SHOW** loading states during async operations
- **HANDLE** offline scenarios gracefully

Example:
```typescript
// ✅ Good - Reuse existing client
import { apiClient } from '@/shared/services/api/client';

const fetchProfile = async () => {
  try {
    const response = await apiClient.get('/user/profile');
    return response.data;
  } catch (error) {
    logger.error('Failed to fetch profile', error);
    throw error;
  }
};
```

### 7. Storage

- **SEARCH** MCP context7 for existing storage utilities
- **USE** `secureStorage` for tokens and sensitive data
- **USE** `asyncStorage` for non-sensitive data
- **NEVER** store sensitive data unencrypted

Example:
```typescript
// ✅ Good - Use existing service
import { secureStorage } from '@/shared/services/storage/secureStorage';

await secureStorage.saveTokens(accessToken, refreshToken);
const { accessToken } = await secureStorage.getTokens();
```

### 8. Permissions

- **REQUEST** permissions before using features
- **HANDLE** denial gracefully with fallbacks
- **EXPLAIN** why permission is needed (UI/UX)
- **TEST** on both iOS and Android

Example:
```typescript
// ✅ Good
const requestCameraPermission = async () => {
  const { status } = await Camera.requestCameraPermissionsAsync();
  if (status !== 'granted') {
    // Show explanation to user
    Alert.alert('Camera access is needed to scan food items');
    return false;
  }
  return true;
};
```

### 9. Performance

- **USE** `React.memo` for expensive components
- **USE** `useMemo` and `useCallback` for expensive computations
- **AVOID** unnecessary re-renders
- **OPTIMIZE** FlatList with proper keys and `getItemLayout`
- **LAZY LOAD** heavy components

Example:
```typescript
// ✅ Good
const MemoizedCard = React.memo(SelectableCard);

const handlePress = useCallback(() => {
  navigation.navigate('Details');
}, [navigation]);
```

### 10. Error Handling

- **ALWAYS** wrap async operations in try/catch
- **USE** error boundaries for React component errors
- **LOG** errors with proper context
- **SHOW** user-friendly error messages

Example:
```typescript
// ✅ Good
try {
  await saveProfile(data);
  showSuccess('Profile saved');
} catch (error) {
  logger.error('Failed to save profile', error);
  showError('Failed to save profile. Please try again.');
}
```

## 📁 Project Structure

```
src/
├── features/              # Feature-based modules
│   └── [feature]/
│       ├── components/    # Feature components
│       ├── screens/       # Screen components
│       ├── stores/        # State management
│       ├── hooks/         # Custom hooks
│       ├── types/         # TypeScript types
│       └── utils/         # Utilities
│
├── shared/               # Shared code
│   ├── components/       # Reusable components
│   │   ├── base/        # Base UI (Button, Input)
│   │   ├── layout/      # Layouts (Screen, Container)
│   │   └── feedback/    # Feedback (Loading, Toast)
│   ├── services/        # API, storage, etc.
│   ├── hooks/           # Shared hooks
│   ├── utils/           # Utilities
│   └── stores/          # Global stores
│
└── theme/               # Design system
    ├── colors.ts
    ├── typography.ts
    ├── spacing.ts
    └── index.ts
```

## 🔧 Expo SDK Features

### Must Use

- **expo-router** - File-based navigation
- **expo-secure-store** - Secure storage
- **expo-camera** - Camera access
- **expo-location** - Location services
- **expo-notifications** - Push notifications
- **expo-image-picker** - Image selection
- **expo-constants** - App constants
- **expo-font** - Custom fonts

### Configuration

```json
// app.json
{
  "expo": {
    "name": "TastebuddyAI",
    "slug": "tastebuddy-ai",
    "scheme": "tastebuddy",
    "platforms": ["ios", "android"],
    "ios": {
      "bundleIdentifier": "com.tastebuddy.ai",
      "supportsTablet": true
    },
    "android": {
      "package": "com.tastebuddy.ai",
      "permissions": [
        "CAMERA",
        "READ_EXTERNAL_STORAGE",
        "WRITE_EXTERNAL_STORAGE"
      ]
    }
  }
}
```

## 🎨 Design System Usage

### Colors

```typescript
import { colors } from '@/theme';

// ✅ Use theme colors
backgroundColor: colors.primary
color: colors.textPrimary

// ❌ Avoid hardcoded colors
backgroundColor: '#017bff'
```

### Typography

```typescript
import { typography } from '@/theme';

// ✅ Use theme typography
<Text style={typography.styles.h1}>Title</Text>
<Text style={typography.styles.bodyRegular}>Body</Text>

// ❌ Avoid hardcoded styles
<Text style={{ fontSize: 28, fontWeight: '700' }}>Title</Text>
```

### Spacing

```typescript
import { spacing } from '@/theme';

// ✅ Use theme spacing
marginBottom: spacing.lg
padding: spacing.md

// ❌ Avoid hardcoded spacing
marginBottom: 16
padding: 12
```

## 🧪 Testing Requirements

### Component Tests

```typescript
// SelectableCard.test.tsx
import { render, fireEvent } from '@testing-library/react-native';

describe('SelectableCard', () => {
  it('should render title and subtitle', () => {
    const { getByText } = render(
      <SelectableCard
        title="Test"
        subtitle="Description"
        selected={false}
        onPress={() => {}}
      />
    );
    expect(getByText('Test')).toBeTruthy();
  });

  it('should call onPress when tapped', () => {
    const mockOnPress = jest.fn();
    const { getByTestId } = render(
      <SelectableCard
        title="Test"
        selected={false}
        onPress={mockOnPress}
        testID="card"
      />
    );
    fireEvent.press(getByTestId('card'));
    expect(mockOnPress).toHaveBeenCalled();
  });
});
```

### Integration Tests

```typescript
// onboardingFlow.test.tsx
describe('Onboarding Flow', () => {
  it('should complete full onboarding', async () => {
    // Test navigation through all steps
    // Test data persistence
    // Test completion status
  });
});
```

## 🚨 Common Pitfalls to Avoid

### ❌ Don't

```typescript
// Don't use inline styles everywhere
<View style={{ padding: 10, margin: 5, backgroundColor: '#fff' }}>

// Don't ignore TypeScript errors
// @ts-ignore
const data = fetchData();

// Don't create new services without checking existing
const saveData = (data) => AsyncStorage.setItem('key', data);

// Don't forget to handle loading states
const data = await fetchData();
return <View>{data.map(...)}</View>;

// Don't use var
var name = 'test';
```

### ✅ Do

```typescript
// Use StyleSheet
const styles = StyleSheet.create({
  container: { padding: spacing.md, backgroundColor: colors.card }
});

// Fix TypeScript errors properly
const data = await fetchData() as UserData;

// Search and reuse existing services
import { asyncStorage } from '@/shared/services/storage/asyncStorage';
await asyncStorage.setItem('key', data);

// Handle loading states
const [loading, setLoading] = useState(false);
if (loading) return <Loading />;

// Use const/let
const name = 'test';
```

## 📝 Code Review Checklist

Before submitting code:

- [ ] TypeScript errors resolved
- [ ] Follows project structure
- [ ] Uses theme system (colors, spacing, typography)
- [ ] Searched MCP context7 for existing implementations
- [ ] Tests written and passing
- [ ] Error handling implemented
- [ ] Loading states handled
- [ ] Permissions requested properly
- [ ] No hardcoded values
- [ ] Documentation updated

## 🔗 Quick Links

- [Expo Documentation](https://docs.expo.dev/)
- [React Native Documentation](https://reactnative.dev/)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- Project Theme System: `src/theme/`
- Project Services: `src/shared/services/`
- Project Components: `src/shared/components/`

---

**Remember:** Always check GLOBAL_RULES.md for MCP context7, Byterover, and testing requirements!