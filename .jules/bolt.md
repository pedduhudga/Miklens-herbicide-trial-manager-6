## 2024-06-25 - Caching expensive sort keys (Schwartzian transform)
**Learning:** Found a recurring bottleneck in `src/pages/Trials.jsx` where `.sort()` callbacks inside `useMemo` execute expensive `JSON.parse` operations and `Date` instantiations $O(N \log N)$ times.
**Action:** Always extract static processing out of loop scopes when filtering or sorting large lists. Pre-computing sorting properties with a mapping cache (`Map()`) turns $O(N \log N)$ heavy parsings into an $O(N)$ initialization phase, resulting in massively faster integer sorting.
