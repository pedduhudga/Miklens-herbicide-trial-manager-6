## 2024-05-14 - Accessibility Pass: Icon-only buttons
**Learning:** Found multiple instances where core navigational and modal close buttons (e.g., `TopBar`, `Modal`, `QRScanner`) relied solely on Lucide React icons (`<X />`, `<Menu />`) without `aria-label`s, rendering them unannounced to screen readers.
**Action:** Always verify that buttons containing only icons receive an appropriate `aria-label` attribute (e.g., "Close modal", "Toggle menu") for improved accessibility.
## 2026-06-11 - [Added ARIA Labels to CropperModal]
**Learning:** Found several icon-only buttons lacking ARIA labels and clear focus states. This is a common accessibility issue across modal components.
**Action:** Adding `aria-label` attributes and `focus-visible` classes ensures that components are screen reader friendly and keyboard navigable.

## 2026-06-30 - Login Form Accessibility
**Learning:** Found a recurring pattern in the app where standalone icon-only buttons (like password toggles) are given `tabIndex="-1"` and lack `aria-label` attributes, breaking keyboard navigation and screen reader support. Additionally, decorative icons placed inside input containers lacked `pointer-events-none`, which can intercept user clicks meant for the input field.
**Action:** Always verify that interactive elements within forms are keyboard accessible (remove restrictive `tabIndex`, add visible `focus-visible:ring` classes) and have semantic ARIA labels when no text is present. Ensure decorative overlays use `pointer-events-none`.
