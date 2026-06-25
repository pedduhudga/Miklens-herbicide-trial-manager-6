
## 2024-05-24 - Avoid O(N log N) overheads in sort comparators
**Learning:** Instantiating `new Date()`, running `JSON.parse()`, or performing repetitive string operations (`.split()`) inside a `.sort()` comparator creates massive overhead because the comparator runs O(N log N) times.
**Action:** Use the Schwartzian transform (decorate-sort-undecorate) to pre-compute these values once per item (O(N)), sort the decorated objects, and map them back. Similarly, pull static query tokenization completely out of `.filter()` loops.
