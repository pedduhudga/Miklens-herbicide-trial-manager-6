## 2024-05-30 - [Performance Optimization in React Render Loops]
**Learning:** Found an O(N^2 log N) performance bottleneck in `LargeScaleTrials.jsx` where an O(N log N) array `.sort()` with nested Date parsing was happening inside a `.map()` array rendering loop for finding index offsets.
**Action:** Use the Schwartzian transform (decorate-sort-undecorate) inside `useMemo` to pre-compute and store sort indices in an O(1) `Map` lookup object. This pattern moves heavy Date parsing and string-to-JSON evaluation outside of sorting comparators and render loops.
