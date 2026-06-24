## 2024-06-10 - Optimizing Search-as-you-type Performance
**Learning:** In a global search page like `SmartSearch.jsx` that indexes and filters thousands of items locally on every keystroke, synchronous `useMemo` hooks attached directly to the input state can severely block the main thread and degrade the typing experience. Furthermore, saving the search string to `localStorage` on every keystroke can cause unnecessary I/O overhead and store incomplete query fragments.
**Action:** Use `useDeferredValue` for the heavy search filtering and counting computations. This allows React to prioritize rendering the user's keystrokes while the search results are computed in the background. Use a debounced `useEffect` for the `localStorage` writes to ensure only stable and intentional search strings are saved to recent searches.
## 2024-06-12 - Optimizing Trials List Search Performance
**Learning:** Similar to the global search page, applying `useDeferredValue` to text inputs that filter large datasets prevents main thread blockage and ensures smooth user typing experience.
**Action:** Used `useDeferredValue` on the `search` input in `Trials.jsx`.
## 2024-05-18 - [Optimizing Smart Search Keystroke Latency]
**Learning:** In a `useMemo` that filters over a large array on every keystroke, performing `.join(' ').toLowerCase()` on dynamically assembled tags inside the loop drastically reduces performance, hitting ~393ms for 5k records per 100 loops.
**Action:** Pre-compute the `searchString` property exactly once when building the static search index. This reduced search times per 5k items down to ~39ms, resulting in a significantly snappier UI during live typing.
