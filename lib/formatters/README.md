# Formatters - Centralized Formatting Utilities

Centralized date and number formatting utilities for consistent formatting across the application.

## Table of Contents

- [Date Formatters](#date-formatters)
- [Number Formatters](#number-formatters)
- [Migration Guide](#migration-guide)
- [Examples](#examples)

## Date Formatters

Located in `lib/formatters/date-formatters.ts`

### API

```typescript
import { dateFormat } from '@/lib/formatters/date-formatters';
```

#### `dateFormat.short(date)`
Format date as "Jan 15, 2024"

```typescript
dateFormat.short("2024-01-15") // "Jan 15, 2024"
dateFormat.short(new Date()) // "Oct 5, 2025"
dateFormat.short(null) // ""
```

#### `dateFormat.long(date)`
Format date as "January 15, 2024"

```typescript
dateFormat.long("2024-01-15") // "January 15, 2024"
```

#### `dateFormat.shortWithTime(date)`
Format date as "Jan 15, 2024 at 3:45 PM"

```typescript
dateFormat.shortWithTime("2024-01-15T15:45:00") // "Jan 15, 2024 at 3:45 PM"
```

#### `dateFormat.longWithTime(date)`
Format date as "January 15, 2024 at 3:45 PM"

```typescript
dateFormat.longWithTime("2024-01-15T15:45:00") // "January 15, 2024 at 3:45 PM"
```

#### `dateFormat.relative(date, options?)`
Format date as relative time "2 hours ago" / "3 days ago"

```typescript
dateFormat.relative("2024-01-15T12:00:00") // "2 hours ago"
dateFormat.relative("2024-01-15T12:00:00", { addSuffix: false }) // "2 hours"
```

#### `dateFormat.timeOnly(date)`
Format time only as "3:45 PM"

```typescript
dateFormat.timeOnly("2024-01-15T15:45:00") // "3:45 PM"
```

#### `dateFormat.numeric(date)`
Format date as "01/15/2024"

```typescript
dateFormat.numeric("2024-01-15") // "01/15/2024"
```

#### `dateFormat.iso(date)`
Format date as "2024-01-15" (ISO format)

```typescript
dateFormat.iso(new Date("2024-01-15")) // "2024-01-15"
```

#### `dateFormat.custom(date, formatString)`
Format date with custom format string (uses date-fns format tokens)

```typescript
dateFormat.custom("2024-01-15", "EEE, MMM d") // "Mon, Jan 15"
dateFormat.custom("2024-01-15", "MMMM do, yyyy") // "January 15th, 2024"
```

### Features

- **Null-safe**: All functions handle null/undefined gracefully, returning empty string
- **Flexible input**: Accepts both Date objects and ISO date strings
- **Consistent formatting**: Uses date-fns for reliable cross-browser formatting
- **TypeScript support**: Full type definitions included

---

## Number Formatters

Located in `lib/formatters/number-formatters.ts`

### API

```typescript
import { numberFormat } from '@/lib/formatters/number-formatters';
```

#### `numberFormat.integer(num)`
Format integer with thousands separators: "1,234"

```typescript
numberFormat.integer(1234) // "1,234"
numberFormat.integer(1234567) // "1,234,567"
numberFormat.integer(null) // "0"
```

#### `numberFormat.decimal(num, decimals?)`
Format number with decimal places: "1,234.56"

```typescript
numberFormat.decimal(1234.567) // "1,234.57" (default 2 decimals)
numberFormat.decimal(1234.567, 1) // "1,234.6"
numberFormat.decimal(1234.567, 0) // "1,235"
```

#### `numberFormat.compact(num)`
Format number in compact notation: "1.2K", "3.4M", "5.6B"

```typescript
numberFormat.compact(1234) // "1.2K"
numberFormat.compact(1234567) // "1.2M"
numberFormat.compact(1234567890) // "1.2B"
numberFormat.compact(500) // "500"
```

#### `numberFormat.currency(num, currency?)`
Format as currency: "$1,234.56"

```typescript
numberFormat.currency(1234.56) // "$1,234.56"
numberFormat.currency(1234.56, "EUR") // "€1,234.56"
numberFormat.currency(1234.56, "GBP") // "£1,234.56"
```

#### `numberFormat.percent(num, decimals?, isDecimal?)`
Format as percentage: "85%", "12.5%"

```typescript
numberFormat.percent(85) // "85%"
numberFormat.percent(0.85, 0, true) // "85%" (from decimal)
numberFormat.percent(85.5, 1) // "85.5%"
numberFormat.percent(12.345, 2) // "12.35%"
```

#### `numberFormat.fileSize(bytes)`
Format file size in bytes to human-readable format: "1.2 MB", "45 KB"

```typescript
numberFormat.fileSize(1234) // "1.21 KB"
numberFormat.fileSize(1234567) // "1.18 MB"
numberFormat.fileSize(1234567890) // "1.15 GB"
numberFormat.fileSize(0) // "0 Bytes"
```

#### `numberFormat.ordinal(num)`
Format number with ordinal suffix: "1st", "2nd", "3rd", "4th"

```typescript
numberFormat.ordinal(1) // "1st"
numberFormat.ordinal(22) // "22nd"
numberFormat.ordinal(103) // "103rd"
numberFormat.ordinal(11) // "11th" (special case)
```

### Features

- **Null-safe**: All functions handle null/undefined gracefully
- **Localization**: Uses Intl.NumberFormat for proper localization
- **TypeScript support**: Full type definitions included
- **Flexible**: Support for various number formats and use cases

---

## Migration Guide

### From old date formatting patterns:

**Before:**
```typescript
// Pattern 1: toLocaleDateString
new Date(dateString).toLocaleDateString("en-US", {
  year: "numeric",
  month: "short",
  day: "numeric",
})

// Pattern 2: date-fns format inline
import { format } from "date-fns";
format(new Date(value), "MMM d, yyyy")

// Pattern 3: toLocaleString
new Date(item.created_at).toLocaleString()

// Pattern 4: formatDistanceToNow inline
import { formatDistanceToNow } from "date-fns";
formatDistanceToNow(date, { addSuffix: true })
```

**After:**
```typescript
import { dateFormat } from '@/lib/formatters/date-formatters';

dateFormat.short(dateString)
dateFormat.short(value)
dateFormat.shortWithTime(item.created_at)
dateFormat.relative(date)
```

### From old number formatting patterns:

**Before:**
```typescript
// Pattern 1: toLocaleString
count.toLocaleString()

// Pattern 2: Manual K/M formatting
count >= 1000 ? `${(count / 1000).toFixed(1)}k` : count.toString()

// Pattern 3: File size calculation
const k = 1024;
const sizes = ["Bytes", "KB", "MB", "GB"];
const i = Math.floor(Math.log(bytes) / Math.log(k));
return `${parseFloat((bytes / k ** i).toFixed(2))} ${sizes[i]}`;
```

**After:**
```typescript
import { numberFormat } from '@/lib/formatters/number-formatters';

numberFormat.integer(count)
numberFormat.compact(count)
numberFormat.fileSize(bytes)
```

---

## Examples

### Complete Component Migration

**Before:**
```typescript
import { format, formatDistanceToNow } from "date-fns";

function MyComponent({ item }) {
  const formattedDate = new Date(item.created_at).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  const wordCount = item.word_count >= 1000
    ? `${(item.word_count / 1000).toFixed(1)}k`
    : item.word_count.toString();

  return (
    <div>
      <p>{formattedDate}</p>
      <p>{wordCount} words</p>
    </div>
  );
}
```

**After:**
```typescript
import { dateFormat } from '@/lib/formatters/date-formatters';
import { numberFormat } from '@/lib/formatters/number-formatters';

function MyComponent({ item }) {
  return (
    <div>
      <p>{dateFormat.short(item.created_at)}</p>
      <p>{numberFormat.compact(item.word_count)} words</p>
    </div>
  );
}
```

### Real-World Example: The Content Library

See `app/w/[workspaceSlug]/content/page.tsx`, whose table and phone cards use `dateFormat.short`.

**Key improvements:**
- Reduced imports from 2-3 lines to 1-2 lines
- Shorter, more readable code
- Consistent formatting across the app
- Better null handling
- Type-safe operations

### Barrel Export

For convenience, you can import everything from the formatters index:

```typescript
// Import specific formatters
import { dateFormat, numberFormat } from '@/lib/formatters';

// Use them
dateFormat.short(date)
numberFormat.compact(count)
```

---

## Benefits

### Code Reduction
- **Before**: 10-15 lines of date formatting logic per component
- **After**: 1 line function call
- **Savings**: ~10-15 lines per component × 12+ components = 120-180 lines saved

### Consistency
- All dates formatted the same way across the app
- No more mixing `toLocaleDateString`, `format`, and custom logic
- Centralized control over date/number formats

### Maintainability
- One place to update formatting logic
- Easy to add new format types
- Better testing coverage

### Developer Experience
- Autocomplete support in IDEs
- Clear, descriptive function names
- Comprehensive JSDoc documentation
- Type-safe operations

---

## Testing

All formatters include null/undefined handling and can be safely used with potentially missing data:

```typescript
// Safe to use with nullable data
dateFormat.short(user.lastLogin) // Returns "" if null
numberFormat.integer(stats.count) // Returns "0" if null
```

---

## Related

