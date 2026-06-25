## 2024-05-14 - Accessibility Pass: Icon-only buttons
**Learning:** Found multiple instances where core navigational and modal close buttons (e.g., `TopBar`, `Modal`, `QRScanner`) relied solely on Lucide React icons (`<X />`, `<Menu />`) without `aria-label`s, rendering them unannounced to screen readers.
**Action:** Always verify that buttons containing only icons receive an appropriate `aria-label` attribute (e.g., "Close modal", "Toggle menu") for improved accessibility.
## 2026-06-11 - [Added ARIA Labels to CropperModal]
**Learning:** Found several icon-only buttons lacking ARIA labels and clear focus states. This is a common accessibility issue across modal components.
**Action:** Adding `aria-label` attributes and `focus-visible` classes ensures that components are screen reader friendly and keyboard navigable.
## 2024-05-18 - Missing ARIA Labels in Password Modals
**Learning:** The application frequently uses Lucide React icons for interactive elements without accompanying text or ARIA labels, creating significant accessibility barriers for screen reader users, especially in critical flows like password changes where icon-only buttons toggle visibility.
**Action:** Always verify that standalone interactive icons (like X for close, Eye/EyeOff for visibility) have context-aware `aria-label`s, and that state-toggling buttons dynamically update their labels to reflect the current state (e.g., "Show password" vs. "Hide password").
