# DUPR Rating Pill Components

A set of reusable React Native components for displaying DUPR ratings in a consistent, pill-style format throughout the app.

## Components

### 1. DUPRRatingPill

The main component for displaying DUPR ratings in a pill format.

#### Props

| Prop              | Type                               | Default     | Description                                       |
| ----------------- | ---------------------------------- | ----------- | ------------------------------------------------- |
| `singlesRating`   | `number \| null`                   | -           | User's singles rating                             |
| `doublesRating`   | `number \| null`                   | -           | User's doubles rating                             |
| `size`            | `"small" \| "medium" \| "large"`   | `"medium"`  | Size of the pill                                  |
| `showLabel`       | `boolean`                          | `false`     | Whether to show "DUPR" label                      |
| `showBoth`        | `boolean`                          | `false`     | Whether to show both ratings                      |
| `preferredRating` | `"singles" \| "doubles" \| "best"` | `"doubles"` | Which rating to prefer when showing single rating |

#### Usage Examples

```tsx
// Basic usage - shows doubles rating by default
<DUPRRatingPill
  singlesRating={3.75}
  doublesRating={4.20}
/>

// Show singles rating
<DUPRRatingPill
  singlesRating={3.75}
  doublesRating={4.20}
  preferredRating="singles"
/>

// Show best rating
<DUPRRatingPill
  singlesRating={3.75}
  doublesRating={4.20}
  preferredRating="best"
/>

// Show both ratings
<DUPRRatingPill
  singlesRating={3.75}
  doublesRating={4.20}
  showBoth={true}
/>

// Different sizes
<DUPRRatingPill
  singlesRating={3.75}
  doublesRating={4.20}
  size="small"
/>

// With DUPR label
<DUPRRatingPill
  singlesRating={3.75}
  doublesRating={4.20}
  showLabel={true}
/>
```

### 2. UserWithDUPRRating

A helper component that displays a user's name with their DUPR rating pill attached.

#### Props

| Prop              | Type                               | Default     | Description                         |
| ----------------- | ---------------------------------- | ----------- | ----------------------------------- |
| `name`            | `string`                           | -           | User's display name                 |
| `singlesRating`   | `number \| null`                   | -           | User's singles rating               |
| `doublesRating`   | `number \| null`                   | -           | User's doubles rating               |
| `size`            | `"small" \| "medium" \| "large"`   | `"medium"`  | Size of the rating pill             |
| `showLabel`       | `boolean`                          | `false`     | Whether to show "DUPR" label        |
| `showBoth`        | `boolean`                          | `false`     | Whether to show both ratings        |
| `preferredRating` | `"singles" \| "doubles" \| "best"` | `"doubles"` | Which rating to prefer              |
| `textStyle`       | `any`                              | -           | Additional styles for the name text |

#### Usage Examples

```tsx
// Basic usage
<UserWithDUPRRating
  name="John Smith"
  singlesRating={3.75}
  doublesRating={4.20}
/>

// Small size
<UserWithDUPRRating
  name="Sarah Johnson"
  singlesRating={4.50}
  doublesRating={null}
  size="small"
/>

// Show both ratings
<UserWithDUPRRating
  name="Mike Wilson"
  singlesRating={null}
  doublesRating={3.90}
  showBoth={true}
/>
```

## Design Features

### Colors

- **Background**: Uses the app's `colors.tint` (dark blue)
- **Text**: Uses the app's `colors.background` (white/light)
- **Theme-aware**: Automatically adapts to light/dark mode

### Sizes

- **Small**: 32px min-width, 10px font
- **Medium**: 40px min-width, 12px font (default)
- **Large**: 48px min-width, 14px font

### Formatting

- **Rating Format**: Always shows 2 decimal places (e.g., "4.20")
- **Type Indicator**: Shows "S:" for singles, "D:" for doubles
- **Both Ratings**: Shows "S:3.50 • D:4.20" format when `showBoth={true}`

## Use Cases

### 1. User Lists

```tsx
<UserWithDUPRRating
  name={user.name}
  singlesRating={user.dupr_rating_singles}
  doublesRating={user.dupr_rating_doubles}
  size="small"
/>
```

### 2. Message Headers

```tsx
<UserWithDUPRRating
  name={message.author.name}
  singlesRating={message.author.dupr_rating_singles}
  doublesRating={message.author.dupr_rating_doubles}
/>
```

### 3. Session Participants

```tsx
<UserWithDUPRRating
  name={participant.name}
  singlesRating={participant.dupr_rating_singles}
  doublesRating={participant.dupr_rating_doubles}
  showBoth={true}
/>
```

### 4. Standalone Rating Display

```tsx
<DUPRRatingPill
  singlesRating={user.dupr_rating_singles}
  doublesRating={user.dupr_rating_doubles}
  showLabel={true}
  size="large"
/>
```

## Edge Cases

- **No Ratings**: Component won't render if no ratings are available
- **Single Rating**: Automatically shows whichever rating is available
- **Equal Ratings**: When using `preferredRating="best"`, prefers doubles if ratings are equal
- **Null Handling**: Gracefully handles `null` or `undefined` ratings

## Integration

These components are designed to work seamlessly with:

- User profile data from the database
- DUPR API responses
- Message/chat systems
- Session management
- User lists and search results

## Styling

The components use the app's design system:

- Consistent with existing UI components
- Responsive to theme changes
- Accessible color contrast
- Proper spacing and typography
