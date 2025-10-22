# Theming Guide

This guide explains how to use the unified theming system for consistent styling and light/dark mode support.

## 🎨 **Theme System Overview**

The app uses a centralized theming system with these components:

- **`constants/Colors.ts`** - Defines color palettes for light/dark modes
- **`components/useColorScheme.ts`** - Hook that returns current theme colors
- **`components/Themed.tsx`** - Themed Text and View components
- **`components/StyledText.tsx`** - Additional styled text components

## 🚀 **How to Use Theming**

### 1. **Using the useColorScheme Hook (Recommended)**

```typescript
import { useColorScheme } from "../../components/useColorScheme"

function MyComponent() {
  const { colors, theme, isDark, isLight } = useColorScheme()

  return (
    <View
      style={{
        backgroundColor: colors.background,
        padding: 16,
      }}
    >
      <Text style={{ color: colors.text }}>Hello World!</Text>
      <Pressable
        style={{
          backgroundColor: colors.tint,
          padding: 12,
        }}
      >
        <Text style={{ color: isDark ? colors.background : colors.text }}>
          Button
        </Text>
      </Pressable>
    </View>
  )
}
```

### 2. **Using Themed Components**

```typescript
import { Text, View } from "../../components/Themed"

function MyComponent() {
  return (
    <View style={{ padding: 16 }}>
      <Text>This text automatically adapts to theme</Text>
      <Text style={{ fontSize: 18, fontWeight: "bold" }}>
        Custom styled text
      </Text>
    </View>
  )
}
```

### 3. **Using StyledText Components**

```typescript
import { StyledText, MonoText } from "../../components/StyledText"

function MyComponent() {
  return (
    <View>
      <StyledText>Regular styled text</StyledText>
      <MonoText>Monospace text</MonoText>
    </View>
  )
}
```

## 🎯 **Available Colors**

From `constants/Colors.ts`:

```typescript
{
  text: "#000" | "#fff",           // Primary text color
  background: "#fff" | "#000",     // Background color
  tint: "#2f95dc" | "#fff",        // Primary accent color
  tabIconDefault: "#ccc",          // Tab icon default
  tabIconSelected: "#2f95dc",      // Tab icon selected
  border: "#e0e0e0" | "#333",      // Border color
}
```

## 🔧 **useColorScheme Hook API**

```typescript
const {
  theme, // "light" | "dark"
  colors, // Current theme colors object
  isDark, // boolean
  isLight, // boolean
} = useColorScheme()
```

## 📱 **Best Practices**

### ✅ **Do This:**

```typescript
// Use the hook for dynamic styling
const { colors } = useColorScheme()

<View style={{ backgroundColor: colors.background }}>
  <Text style={{ color: colors.text }}>Content</Text>
</View>

// Use themed components for simple cases
<Text>This automatically adapts</Text>
<View style={{ padding: 16 }}>Container</View>
```

### ❌ **Don't Do This:**

```typescript
// Don't hardcode colors
;<View style={{ backgroundColor: "#fff" }}>
  <Text style={{ color: "#000" }}>Content</Text>
</View>

// Don't use React Native's useColorScheme directly
import { useColorScheme } from "react-native" // ❌
```

## 🎨 **Adding New Colors**

To add new colors to the theme:

1. **Update `constants/Colors.ts`:**

```typescript
export default {
  light: {
    text: "#000",
    background: "#fff",
    tint: "#2f95dc",
    // Add new colors here
    success: "#28a745",
    error: "#dc3545",
    warning: "#ffc107",
  },
  dark: {
    text: "#fff",
    background: "#000",
    tint: "#fff",
    // Add corresponding dark colors
    success: "#20c997",
    error: "#e74c3c",
    warning: "#f39c12",
  },
}
```

2. **Use in components:**

```typescript
const { colors } = useColorScheme()

<View style={{ backgroundColor: colors.success }}>
  <Text style={{ color: colors.background }}>Success!</Text>
</View>
```

## 🔄 **Theme Switching**

The theme automatically switches based on the user's system preference. To manually control theme switching, you would need to implement a theme context, but for now, it follows the system setting.

## 📝 **Migration Guide**

To migrate existing components:

1. **Replace hardcoded colors:**

   ```typescript
   // Before
   style={{ backgroundColor: "#fff", color: "#000" }}

   // After
   const { colors } = useColorScheme()
   style={{ backgroundColor: colors.background, color: colors.text }}
   ```

2. **Use themed components:**

   ```typescript
   // Before
   import { Text, View } from "react-native"

   // After
   import { Text, View } from "../../components/Themed"
   ```

3. **Update imports:**

   ```typescript
   // Before
   import { useColorScheme } from "react-native"

   // After
   import { useColorScheme } from "../../components/useColorScheme"
   ```

This theming system provides consistent styling across your app and automatic light/dark mode support! 🎉
