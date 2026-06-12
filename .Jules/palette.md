## 2024-05-14 - Accessibility Pass: Icon-only buttons
**Learning:** Found multiple instances where core navigational and modal close buttons (e.g., `TopBar`, `Modal`, `QRScanner`) relied solely on Lucide React icons (`<X />`, `<Menu />`) without `aria-label`s, rendering them unannounced to screen readers.
**Action:** Always verify that buttons containing only icons receive an appropriate `aria-label` attribute (e.g., "Close modal", "Toggle menu") for improved accessibility.
## 2026-06-11 - [Added ARIA Labels to CropperModal]
**Learning:** Found several icon-only buttons lacking ARIA labels and clear focus states. This is a common accessibility issue across modal components.
**Action:** Adding `aria-label` attributes and `focus-visible` classes ensures that components are screen reader friendly and keyboard navigable.
## 2024-06-13 - Focus Styles and ARIA labels for Icon-Only Buttons
**Learning:** Found multiple icon-only `<button>`s without `aria-label` or focus styles across the UI, particularly in `SyncStatus.jsx` and `Modal.jsx`. This makes keyboard navigation very poor since users can't visually see which button has focus, and screen reader users won't know what the button does.
**Action:** When creating new components or reviewing existing ones, make sure to add `aria-label="Descriptive action"` and `focus-visible:ring-2 focus-visible:ring-slate-400 outline-none` to improve keyboard navigation visibility.
