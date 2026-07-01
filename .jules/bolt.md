## 2024-05-18 - Schwartzian Transform for O(N log N) bottlenecks
**Learning:** React `useMemo` filtering and sorting logic often processes large arrays of trials where the sorting callback repeatedly executes expensive JSON parsing and Date instantiation for every O(N log N) comparison.
**Action:** Always refactor complex list sorting to use a Schwartzian transform (decorate-sort-undecorate) to pre-calculate expensive derivations into O(N) complexity before sorting. Also, extract invariant processing, like tokenizing string inputs, outside of filter loops.
