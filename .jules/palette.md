## 2025-01-28 - Removing Restrictive Tab Indexes on Interactive Elements
**Learning:** Found several standalone interactive elements (like password visibility toggle buttons) that were explicitly hidden from keyboard navigation using `tabIndex="-1"` and lacked ARIA labels. This breaks accessibility for keyboard and screen reader users.
**Action:** Always ensure interactive elements are reachable via keyboard by removing restrictive tab indexes, applying distinct visual focus indicators (`focus-visible`), and adding context-aware `aria-label` attributes for screen readers.
