## 2024-05-14 - Accessibility Pass: Icon-only buttons
**Learning:** Found multiple instances where core navigational and modal close buttons (e.g., `TopBar`, `Modal`, `QRScanner`) relied solely on Lucide React icons (`<X />`, `<Menu />`) without `aria-label`s, rendering them unannounced to screen readers.
**Action:** Always verify that buttons containing only icons receive an appropriate `aria-label` attribute (e.g., "Close modal", "Toggle menu") for improved accessibility.
## 2026-06-11 - [Added ARIA Labels to CropperModal]
**Learning:** Found several icon-only buttons lacking ARIA labels and clear focus states. This is a common accessibility issue across modal components.
**Action:** Adding `aria-label` attributes and `focus-visible` classes ensures that components are screen reader friendly and keyboard navigable.

## 2024-06-15 - Added a11y attributes to Camera Capture
**Learning:** Found several floating interactive elements (like the custom capture button, flash toggle) that had hover styles but entirely lacked keyboard focus styles or ARIA labels, rendering them inaccessible to screen readers.
**Action:** Always verify floating action-like buttons or interactive visual components contain `aria-label` and `focus-visible:ring-2 focus-visible:outline-none` style extensions.
