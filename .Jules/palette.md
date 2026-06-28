## 2024-05-14 - Accessibility Pass: Icon-only buttons
**Learning:** Found multiple instances where core navigational and modal close buttons (e.g., `TopBar`, `Modal`, `QRScanner`) relied solely on Lucide React icons (`<X />`, `<Menu />`) without `aria-label`s, rendering them unannounced to screen readers.
**Action:** Always verify that buttons containing only icons receive an appropriate `aria-label` attribute (e.g., "Close modal", "Toggle menu") for improved accessibility.
## 2026-06-11 - [Added ARIA Labels to CropperModal]
**Learning:** Found several icon-only buttons lacking ARIA labels and clear focus states. This is a common accessibility issue across modal components.
**Action:** Adding `aria-label` attributes and `focus-visible` classes ensures that components are screen reader friendly and keyboard navigable.
## 2024-05-15 - Additional ARIA Labels on Icon-only buttons
**Learning:** Encountered additional complex components (`TrialCard`, `CameraCapture`) with inline actions (like "More actions", "Edit", "Toggle flash", "Capture") that used `<button>` tags with `title` attributes but no `aria-label` attributes for screen readers. The usage of Lucide icons inside interactive components easily leads to inaccessible buttons if ARIA isn't explicitly handled.
**Action:** When adding or modifying interactive controls (especially icon-only buttons) for complex tools and cards, always mirror any `title` tooltips into `aria-label`s so screen readers correctly identify their function.
