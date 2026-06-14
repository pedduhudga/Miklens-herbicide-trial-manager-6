## 2024-06-10 - Optimizing Search-as-you-type Performance
**Learning:** In a global search page like `SmartSearch.jsx` that indexes and filters thousands of items locally on every keystroke, synchronous `useMemo` hooks attached directly to the input state can severely block the main thread and degrade the typing experience. Furthermore, saving the search string to `localStorage` on every keystroke can cause unnecessary I/O overhead and store incomplete query fragments.
**Action:** Use `useDeferredValue` for the heavy search filtering and counting computations. This allows React to prioritize rendering the user's keystrokes while the search results are computed in the background. Use a debounced `useEffect` for the `localStorage` writes to ensure only stable and intentional search strings are saved to recent searches.
## 2024-06-12 - Optimizing Trials List Search Performance
**Learning:** Similar to the global search page, applying `useDeferredValue` to text inputs that filter large datasets prevents main thread blockage and ensures smooth user typing experience.
**Action:** Used `useDeferredValue` on the `search` input in `Trials.jsx`.

## 2026-06-14 - Optimizing Formulations List Search Performance
**Learning:** Unmemoized array operations (`.filter()` and `.sort()`) combined with synchronous text input state updates can cause significant performance degradation when rendering lists, as the expensive operations run on every keystroke render.
**Action:** Applied `useMemo` to memoize the sorted and filtered list, and `useDeferredValue` to decouple the expensive list calculation from the immediate text input state update in `Formulations.jsx`.
