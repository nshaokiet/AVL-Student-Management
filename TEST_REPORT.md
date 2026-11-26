# AVL Academic Studio V2.0 — test report

Run date: 26 November 2026. Scope: self-contained index.html and local verification only.

## Automated verification

Command: `node --test tests/test_standalone.cjs`

**40 passed, 0 failed, 0 skipped** (34 existing regressions and 6 new tests).

- 1,800 seeded randomized ID AVL operations, plus 600 seeded dual-index insert/update/delete operations checked against sorted-array reference results after each operation.
- Strict ordering, both AVL height/balance invariants, ranking subtree sizes, consistency, ties, rank/select, top K, inclusive bounds, range count, threshold count, 250-record capacity, precision, JSON round-trip, persisted restore and rejection atomicity.
- Height-bounded select and prefix-count visit checks and equal results for all three new algorithm comparisons.
- Guided Demo 1: 12 stages; Demo 2: 27 stages; Demo 3: 22 stages with all specified expected results, real mutation events, restart and isolation.
- Embedded JavaScript syntax and absence of external runtime assets verified.

## Browser verification

Headless Chrome opened the actual local HTML with an isolated temporary profile. No external dependencies were installed.

- PASS: overview health, ranking Top 3/rank/select, scholarship count and shortlist, ID AVL and range visualization, GPA edit through the student form, rank change, ranking mutation trace, advanced comparison.
- PASS: all 12/27/22 guided stages, dual-index view, academic pseudocode, restart and management/localStorage isolation.
- PASS: no unintended document-wide horizontal overflow across the six workspace views at 1366×768, 1920×1080 and 390×844 emulated CSS viewports; no uncaught JavaScript exceptions during the run.

## Limitations

Physical projector/fullscreen rehearsal and subjective visual quality were not verified. CSV download, all file-picker interactions and every individual browser control were not separately exercised. The original Flask implementation was outside the standalone test scope. Node-visit counts measure algorithm operations, not elapsed-time performance. V2.0 is locally verified and has not been deployed.
