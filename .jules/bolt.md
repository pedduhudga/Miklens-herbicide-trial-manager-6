## 2024-06-23 - [Optimized Trial Search Filtering]
**Learning:** In React list views dealing with potentially thousands of items (like Trials in this codebase), placing heavy string manipulation like `.toLowerCase().trim().split()` inside the `Array.filter()` callback creates massive main-thread bottlenecks, as it causes N allocations on every keystroke.
**Action:** When filtering lists using fuzzy match logic, always parse and pre-tokenize the search query string *outside* the filter loop (O(1)) and pass the tokenized array to the matching function to prevent O(N) redundant allocations.
