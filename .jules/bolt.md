## 2024-05-18 - Trials filtering & sorting optimisation
**Learning:** React re-renders are especially noticeable when list filtering and sorting functions perform heavy data transformation (like JSON parsing and object instantiation) inside loops.
**Action:** Always extract static operations (like string tokenization in search loops) outside the loop. Use the Schwartzian transform (decorate-sort-undecorate) to compute heavy comparison keys just once per element before a sort execution.
