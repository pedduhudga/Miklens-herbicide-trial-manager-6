## 2024-05-18 - Client-side JSON Parsing in Sorting
**Learning:** Found a major performance anti-pattern in `src/pages/Trials.jsx` where `JSON.parse()` (via `safeJsonParse`) and `new Date()` were being executed inside a sort callback (O(N log N)). For large data sets like Trials, this causes massive CPU spikes.
**Action:** Always use the Schwartzian transform (decorate-sort-undecorate) for expensive property access during sorting to ensure parsing/evaluation only runs O(N) times instead of O(N log N) times.
