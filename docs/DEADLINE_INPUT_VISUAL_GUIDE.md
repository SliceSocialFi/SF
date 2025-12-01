# DeadlineInput Component - Visual Guide

## Component Preview

### Mode Toggle Buttons
```
┌──────────────────────────────────────────────────────────────┐
│  Deadline                     When should this task be...    │
│                                                               │
│  ┌───────────────────────────┬───────────────────────────┐  │
│  │ 📅 Specific Date & Time   │   🕐 Duration             │  │
│  │    [ACTIVE - Dark]        │   [Inactive - Light]      │  │
│  └───────────────────────────┴───────────────────────────┘  │
└──────────────────────────────────────────────────────────────┘
```

## Mode 1: Specific Date & Time (Datetime Picker)

### Light Mode
```
┌──────────────────────────────────────────────────────────────┐
│  Deadline                     When should this task be...    │
│                                                               │
│  ┌───────────────────────────┬───────────────────────────┐  │
│  │ ● Specific Date & Time    │   ○ Duration             │  │
│  └───────────────────────────┴───────────────────────────┘  │
│                                                               │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  2024-11-27    ▼    15:30    ▼         📅 🕒         │ │
│  └────────────────────────────────────────────────────────┘ │
│                                                               │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  Deadline: Nov 27, 2024, 3:30 PM                       │ │
│  └────────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────────┘
```

### Dark Mode
```
┌──────────────────────────────────────────────────────────────┐
│  Deadline                     When should this task be...    │
│  [White text on dark background]                             │
│                                                               │
│  ┌───────────────────────────┬───────────────────────────┐  │
│  │ ● Specific Date & Time    │   ○ Duration             │  │
│  │ [Black bg, white text]    │   [Gray bg, gray text]   │  │
│  └───────────────────────────┴───────────────────────────┘  │
│                                                               │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  2024-11-27    ▼    15:30    ▼         📅 🕒         │ │
│  │  [Dark gray bg, white text]                            │ │
│  └────────────────────────────────────────────────────────┘ │
│                                                               │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  Deadline: Nov 27, 2024, 3:30 PM                       │ │
│  │  [Darker gray bg with subtle border]                   │ │
│  └────────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────────┘
```

## Mode 2: Duration (Minutes/Hours/Days)

### Light Mode
```
┌──────────────────────────────────────────────────────────────┐
│  Deadline                     When should this task be...    │
│                                                               │
│  ┌───────────────────────────┬───────────────────────────┐  │
│  │   ○ Specific Date & Time  │ ● Duration               │  │
│  └───────────────────────────┴───────────────────────────┘  │
│                                                               │
│  ┌──────────────────────────────────┬────────────────────┐ │
│  │  7                               │  Days      ▼       │ │
│  │                                  │  (Minutes/Hours)   │ │
│  └──────────────────────────────────┴────────────────────┘ │
│                                                               │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  Deadline: Dec 4, 2024, 10:25 AM                       │ │
│  └────────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────────┘
```

### Duration Unit Options
```
┌──────────────────────┐
│  Minutes             │  ← Select option 1
├──────────────────────┤
│  Hours               │  ← Select option 2
├──────────────────────┤
│  Days        ✓       │  ← Select option 3 (selected)
└──────────────────────┘
```

## Use Cases & Examples

### Use Case 1: Very Urgent Task (30 Minutes)
**User Action:** Switch to Duration mode → Input "30" → Select "Minutes"

**Result:**
```
┌────────────────────────────────────────────────────────┐
│  ┌──────────────────┬────────────┐                     │
│  │  30              │  Minutes▼  │                     │
│  └──────────────────┴────────────┘                     │
│  ┌─────────────────────────────────────────────────┐  │
│  │  Deadline: Nov 27, 2024, 10:55 AM               │  │
│  └─────────────────────────────────────────────────┘  │
└────────────────────────────────────────────────────────┘
```

**Sent to Backend:**
```json
{
  "deadline": "2024-11-27T10:55:30.456Z"
}
```

### Use Case 1b: Urgent Task (24 Hours)
**User Action:** Switch to Duration mode → Input "24" → Select "Hours"

**Result:**
```
┌────────────────────────────────────────────────────────┐
│  ┌──────────────────┬────────────┐                     │
│  │  24              │  Hours  ▼  │                     │
│  └──────────────────┴────────────┘                     │
│  ┌─────────────────────────────────────────────────┐  │
│  │  Deadline: Nov 28, 2024, 10:25 AM               │  │
│  └─────────────────────────────────────────────────┘  │
└────────────────────────────────────────────────────────┘
```

**Sent to Backend:**
```json
{
  "deadline": "2024-11-28T10:25:30.456Z"
}
```

### Use Case 2: Standard Task (1 Week)
**User Action:** Keep Duration mode → Input "7" → Select "Days"

**Result:**
```
┌────────────────────────────────────────────────────────┐
│  ┌──────────────────┬────────────┐                     │
│  │  7               │  Days   ▼  │                     │
│  └──────────────────┴────────────┘                     │
│  ┌─────────────────────────────────────────────────┐  │
│  │  Deadline: Dec 4, 2024, 10:25 AM                │  │
│  └─────────────────────────────────────────────────┘  │
└────────────────────────────────────────────────────────┘
```

**Sent to Backend:**
```json
{
  "deadline": "2024-12-04T10:25:30.456Z"
}
```

### Use Case 3: Specific Meeting Time
**User Action:** Switch to Datetime mode → Select "2024-12-01" → Select "14:00"

**Result:**
```
┌────────────────────────────────────────────────────────┐
│  ┌──────────────────────────────────────────────────┐ │
│  │  2024-12-01    ▼    14:00    ▼                   │ │
│  └──────────────────────────────────────────────────┘ │
│  ┌──────────────────────────────────────────────────┐ │
│  │  Deadline: Dec 1, 2024, 2:00 PM                  │ │
│  └──────────────────────────────────────────────────┘ │
└────────────────────────────────────────────────────────┘
```

**Sent to Backend:**
```json
{
  "deadline": "2024-12-01T14:00:00.000Z"
}
```

## Error States

### Error: Past Date Selected (Datetime Mode)
```
┌──────────────────────────────────────────────────────────────┐
│  Deadline                                                     │
│                                                               │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  2024-11-20    ▼    10:00    ▼         📅 🕒         │ │
│  │  [RED BORDER]                                          │ │
│  └────────────────────────────────────────────────────────┘ │
│                                                               │
│  ❌ Deadline must be in the future                           │
└──────────────────────────────────────────────────────────────┘
```

### Error: Invalid Number (Duration Mode)
```
┌──────────────────────────────────────────────────────────────┐
│  Deadline                                                     │
│                                                               │
│  ┌──────────────────────────────────┬────────────────────┐  │
│  │  -5                              │  Days      ▼       │  │
│  │  [RED BORDER]                    │                    │  │
│  └──────────────────────────────────┴────────────────────┘  │
│                                                               │
│  ❌ Duration must be a positive number                       │
└──────────────────────────────────────────────────────────────┘
```

## Responsive Behavior

### Desktop (1024px+)
- Full width labels and inputs
- Side-by-side mode toggle buttons
- Comfortable spacing

### Tablet (768px - 1023px)
- Slightly reduced padding
- Mode buttons still side-by-side
- Input fields adjust to container

### Mobile (< 768px)
- Mode buttons stack vertically
- Full-width inputs
- Touch-friendly targets (44px minimum)

## Browser Compatibility

### Chrome/Edge (Native datetime-local)
```
┌────────────────────────────────────────────────────────┐
│  2024-11-27    ▼    15:30    ▼         📅 🕒         │
│  [Native picker with spinners]                         │
└────────────────────────────────────────────────────────┘
```

### Firefox (Native datetime-local)
```
┌────────────────────────────────────────────────────────┐
│  11/27/2024    15:30         [📅] [🕒]                │
│  [Native picker with calendar popup]                   │
└────────────────────────────────────────────────────────┘
```

### Safari 14.5+ (Native datetime-local)
```
┌────────────────────────────────────────────────────────┐
│  Nov 27, 2024    3:30 PM         [📅] [🕒]            │
│  [Native picker with iOS-style wheel]                  │
└────────────────────────────────────────────────────────┘
```

### Safari < 14.5 (Fallback to text)
```
┌────────────────────────────────────────────────────────┐
│  2024-11-27T15:30                                      │
│  [Text input - user must type in format]               │
└────────────────────────────────────────────────────────┘

💡 Recommendation: Use Duration mode for better UX
```

## Accessibility Features

### Keyboard Navigation
- **Tab:** Move between mode buttons → input → unit selector
- **Arrow Keys:** Navigate between mode buttons
- **Enter/Space:** Activate mode button
- **Number keys:** Type in duration input
- **Arrow Up/Down:** Change datetime-local values

### Screen Reader Announcements
```
"Deadline, required field"
"Switch to Duration mode, button, not pressed"
"Switch to Specific Date and Time mode, button, pressed"
"Date and time input, November 27, 2024, 3:30 PM"
"Deadline preview: November 27, 2024, 3:30 PM"
```

## Component States

### 1. Initial State (Default)
- Mode: Datetime
- Value: 7 days from now
- Preview: Visible

### 2. Loading State (Not applicable)
- This component has no async operations

### 3. Disabled State
```tsx
<DeadlineInput
  value={deadline}
  onChange={setDeadline}
  disabled={true}  // Not implemented yet
/>
```

### 4. Read-only State
```tsx
<DeadlineInput
  value={deadline}
  onChange={() => {}}  // No-op
  readonly={true}  // Not implemented yet
/>
```

## Integration Examples

### With React Hook Form (Current Implementation)
```tsx
<DeadlineInput
  value={form.watch("deadline")}
  onChange={(isoString) => {
    form.setValue("deadline", isoString, {
      shouldValidate: true,
      shouldDirty: true
    });
  }}
  error={!!form.formState.errors.deadline}
  name="deadline"
  label="Deadline"
  helper="When should this task be completed?"
/>
```

### With useState (Simple)
```tsx
const [deadline, setDeadline] = useState<string>("");

<DeadlineInput
  value={deadline}
  onChange={setDeadline}
  label="Task Deadline"
/>
```

### With Formik
```tsx
<DeadlineInput
  value={formik.values.deadline}
  onChange={(value) => formik.setFieldValue("deadline", value)}
  error={formik.touched.deadline && !!formik.errors.deadline}
  name="deadline"
/>
```

## Animation & Transitions

### Mode Switch Animation
- **Duration:** 150ms
- **Easing:** ease-out
- **Properties:** background-color, border-color, color

### Preview Update
- **No animation:** Instant update for better UX
- **Consider:** Subtle fade-in if values change significantly

## Performance Considerations

### Memoization
✅ `datetimeLocalValue` - Memoized to prevent recalculation on every render
✅ `minDatetimeLocal` - Memoized as it's static

### Event Handling
✅ `handleDatetimeChange` - No debounce needed (infrequent changes)
✅ `handleDurationChange` - Immediate update for responsive feel

### Re-renders
- Component only re-renders when `value` prop changes
- Mode switch doesn't cause parent re-render
- Duration input updates trigger parent onChange

## Testing Scenarios

### Manual Testing Checklist
```
[ ] Select future datetime → Preview updates correctly
[ ] Select past datetime → Error shown, form invalid
[ ] Input "48" Hours → Preview shows 2 days from now
[ ] Input "14" Days → Preview shows 2 weeks from now
[ ] Switch modes → Value persists
[ ] Submit form → ISO string sent to backend
[ ] Dark mode toggle → Colors correct
[ ] Narrow screen → Layout responsive
[ ] Tab through inputs → Focus order logical
[ ] Screen reader → Announcements clear
```

### Automated Testing (Future)
```typescript
describe('DeadlineInput', () => {
  it('renders datetime mode by default', () => {});
  it('switches to duration mode', () => {});
  it('calculates correct ISO string for duration', () => {});
  it('prevents past date selection', () => {});
  it('shows preview correctly', () => {});
  it('calls onChange with ISO string', () => {});
});
```

## Summary

**Key Features:**
✅ Two input modes (Datetime & Duration)
✅ Real-time preview
✅ ISO 8601 output
✅ Dark mode support
✅ Responsive design
✅ Accessible
✅ Browser compatible

**User Benefits:**
- **Flexibility:** Choose preferred input method
- **Clarity:** See exact deadline before submitting
- **Speed:** Duration mode faster for common cases
- **Accuracy:** Datetime mode precise for specific times

**Developer Benefits:**
- **Type-safe:** Full TypeScript support
- **Simple API:** Single `onChange` handler
- **Consistent:** Returns ISO strings always
- **Testable:** Pure functions, predictable behavior
