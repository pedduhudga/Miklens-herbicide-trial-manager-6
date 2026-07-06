## 2026-07-06 - O(N² log N) Render Bottleneck in Map
**Learning:** Found a severe performance bottleneck where an entire array was being copied, sorted, and searched (using findIndex) inside a React map() render loop, causing O(N² log N) complexity on every render.
**Action:** Always extract sorting logic and array traversal out of render loops into a useMemo hook. Build a Map for O(1) lookups to pass down to the render components.
