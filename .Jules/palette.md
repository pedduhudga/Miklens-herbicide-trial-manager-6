## 2024-05-14 - Accessibility Pass: Icon-only buttons
**Learning:** Found multiple instances where core navigational and modal close buttons (e.g., `TopBar`, `Modal`, `QRScanner`) relied solely on Lucide React icons (`<X />`, `<Menu />`) without `aria-label`s, rendering them unannounced to screen readers.
**Action:** Always verify that buttons containing only icons receive an appropriate `aria-label` attribute (e.g., "Close modal", "Toggle menu") for improved accessibility.
## 2026-06-11 - [Added ARIA Labels to CropperModal]
**Learning:** Found several icon-only buttons lacking ARIA labels and clear focus states. This is a common accessibility issue across modal components.
**Action:** Adding `aria-label` attributes and `focus-visible` classes ensures that components are screen reader friendly and keyboard navigable.

## 2026-06-15 - [Login Form Accessibility Improvements]
**Learning:** Found critical form fields in the Login page missing explicit label associations (`htmlFor` and `id`), making it difficult for screen reader users to identify the inputs. Additionally, the password visibility toggle button was incorrectly hidden from keyboard users via `tabIndex="-1"` and lacked an `aria-label` or focus styling, violating interaction standards for interactive elements.
**Action:** Ensure all form labels are strictly bound to their respective inputs using `htmlFor` and `id` attributes. Avoid using `tabIndex="-1"` on functional buttons that should be reachable via keyboard navigation. All icon-only buttons must include an `aria-label` and a clear `focus-visible` style to maintain keyboard and screen reader accessibility.
