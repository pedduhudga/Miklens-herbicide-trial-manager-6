## 2024-05-14 - Accessibility Pass: Icon-only buttons
**Learning:** Found multiple instances where core navigational and modal close buttons (e.g., `TopBar`, `Modal`, `QRScanner`) relied solely on Lucide React icons (`<X />`, `<Menu />`) without `aria-label`s, rendering them unannounced to screen readers.
**Action:** Always verify that buttons containing only icons receive an appropriate `aria-label` attribute (e.g., "Close modal", "Toggle menu") for improved accessibility.
## 2026-06-11 - [Added ARIA Labels to CropperModal]
**Learning:** Found several icon-only buttons lacking ARIA labels and clear focus states. This is a common accessibility issue across modal components.
**Action:** Adding `aria-label` attributes and `focus-visible` classes ensures that components are screen reader friendly and keyboard navigable.
## 2025-07-05 - Inconsistent Close Icons

**Learning:** Some modals and components (`PlotMap.jsx`, `CloudBackup.jsx`) were using a hardcoded text character '✕' for their close buttons instead of the standard `X` icon from the `lucide-react` library used throughout the rest of the application. These buttons also completely lacked `aria-label` attributes for accessibility.
**Action:** When auditing new or existing modal components, always verify they use the project's standard icon library (`lucide-react`) for close actions and ensure `aria-label="Close"` is applied to the interactive button element.
