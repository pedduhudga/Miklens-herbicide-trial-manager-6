## 2024-05-14 - Accessibility Pass: Icon-only buttons
**Learning:** Found multiple instances where core navigational and modal close buttons (e.g., `TopBar`, `Modal`, `QRScanner`) relied solely on Lucide React icons (`<X />`, `<Menu />`) without `aria-label`s, rendering them unannounced to screen readers.
**Action:** Always verify that buttons containing only icons receive an appropriate `aria-label` attribute (e.g., "Close modal", "Toggle menu") for improved accessibility.
## 2026-06-11 - [Added ARIA Labels to CropperModal]
**Learning:** Found several icon-only buttons lacking ARIA labels and clear focus states. This is a common accessibility issue across modal components.
**Action:** Adding `aria-label` attributes and `focus-visible` classes ensures that components are screen reader friendly and keyboard navigable.
## 2026-06-21 - Added ARIA Labels to Change Password Modal
**Learning:** Found that the Change Password modal within Sidebar.jsx lacked ARIA labels on its icon-only buttons (Close and Password Visibility Toggles). This prevents screen reader users from understanding what these buttons do.
**Action:** Always verify that every icon-only button inside dynamic modals has an explicit `aria-label`, and use dynamic ARIA labels (e.g. `aria-label={show ? "Hide" : "Show"}`) for toggle buttons.
