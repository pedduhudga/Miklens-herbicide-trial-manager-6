## 2024-05-14 - Accessibility Pass: Icon-only buttons
**Learning:** Found multiple instances where core navigational and modal close buttons (e.g., `TopBar`, `Modal`, `QRScanner`) relied solely on Lucide React icons (`<X />`, `<Menu />`) without `aria-label`s, rendering them unannounced to screen readers.
**Action:** Always verify that buttons containing only icons receive an appropriate `aria-label` attribute (e.g., "Close modal", "Toggle menu") for improved accessibility.
## 2026-06-11 - [Added ARIA Labels to CropperModal]
**Learning:** Found several icon-only buttons lacking ARIA labels and clear focus states. This is a common accessibility issue across modal components.
**Action:** Adding `aria-label` attributes and `focus-visible` classes ensures that components are screen reader friendly and keyboard navigable.
## 2026-06-24 - Added ARIA labels and focus states to Sidebar Change Password Modal\n**Learning:** This application extensively uses icon-only buttons for toggling visibility (e.g., Eye/EyeOff for passwords) and modal controls (e.g., X for close) that lacked semantic ARIA labels and keyboard focus indicators.\n**Action:** Ensure all interactive elements, especially icon-only utility buttons within modals, are annotated with dynamic `aria-label`s and visible focus states (`focus-visible:ring-2`) for keyboard accessibility.
