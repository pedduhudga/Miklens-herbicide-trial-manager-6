## 2024-05-14 - Accessibility Pass: Icon-only buttons
**Learning:** Found multiple instances where core navigational and modal close buttons (e.g., `TopBar`, `Modal`, `QRScanner`) relied solely on Lucide React icons (`<X />`, `<Menu />`) without `aria-label`s, rendering them unannounced to screen readers.
**Action:** Always verify that buttons containing only icons receive an appropriate `aria-label` attribute (e.g., "Close modal", "Toggle menu") for improved accessibility.
## 2026-06-11 - [Added ARIA Labels to CropperModal]
**Learning:** Found several icon-only buttons lacking ARIA labels and clear focus states. This is a common accessibility issue across modal components.
**Action:** Adding `aria-label` attributes and `focus-visible` classes ensures that components are screen reader friendly and keyboard navigable.
## 2024-05-14 - Accessibility Pass: Password Visibility Toggles
**Learning:** Found multiple password visibility toggle buttons (using Eye/EyeOff icons) in the `Sidebar` change password modal lacking `aria-label`s, native tooltips (`title`), and focus states. This makes them difficult to use for screen reader and keyboard users.
**Action:** Added dynamic `aria-label` and `title` attributes based on the toggle state, and added Tailwind `focus-visible` classes to ensure they receive a visible focus ring when navigated via keyboard.
