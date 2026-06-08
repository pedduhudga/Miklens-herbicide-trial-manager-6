## 2026-06-08 - Focus & ARIA for Icon-only Buttons
**Learning:** Icon-only interactive elements lacking focus states and ARIA labels represent a common accessibility gap in standard UI components, negatively impacting screen reader and keyboard navigation users.
**Action:** Always add `aria-label` and distinct `focus-visible:ring-2` tailwind classes to any button containing only an icon.
