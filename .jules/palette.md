## 2024-05-18 - A11y & Focus on Icon-Only Buttons
**Learning:** Icon-only buttons (like password toggles and modal close icons) frequently lack `aria-label` attributes and keyboard focus indicators. Furthermore, `tabIndex="-1"` is often incorrectly used on interactive elements inside form controls.
**Action:** Always verify `aria-label` and `focus-visible` states on icon-only buttons (`lucide-react`) and remove restrictive `tabIndex` values that hinder keyboard accessibility.
