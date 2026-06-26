## 2024-05-14 - Accessibility Pass: Icon-only buttons
**Learning:** Found multiple instances where core navigational and modal close buttons (e.g., `TopBar`, `Modal`, `QRScanner`) relied solely on Lucide React icons (`<X />`, `<Menu />`) without `aria-label`s, rendering them unannounced to screen readers.
**Action:** Always verify that buttons containing only icons receive an appropriate `aria-label` attribute (e.g., "Close modal", "Toggle menu") for improved accessibility.
## 2026-06-11 - [Added ARIA Labels to CropperModal]
**Learning:** Found several icon-only buttons lacking ARIA labels and clear focus states. This is a common accessibility issue across modal components.
**Action:** Adding `aria-label` attributes and `focus-visible` classes ensures that components are screen reader friendly and keyboard navigable.
## 2026-06-26 - [Added ARIA Labels to Sidebar Password Toggles]
**Learning:** The password toggle buttons (Eye/EyeOff icons) inside the 'Change Password' modal in `Sidebar.jsx` lacked ARIA labels and keyboard focus states. This is a common accessibility issue for icon-only toggle buttons in this codebase.
**Action:** Add dynamic `aria-label` attributes and `focus-visible:ring-2` styling to ensure these buttons are properly announced by screen readers and navigable via keyboard.
