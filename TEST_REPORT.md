# AVL Studio V1.3 — test report

Run date: 26 November 2026. Deliverable: one offline, self-contained index.html using vanilla HTML/CSS/JavaScript/SVG. Existing Flask files were left in place.

## Automated verification

Command: node --test tests/test_standalone.cjs

**34 passed, 0 failed** (31 existing tests plus 3 guided-demo regressions).

- Existing core AVL rotations, deletion, search, CRUD, validation, comparison, JSON import/export, persistence, and 250-record capacity.
- 1,800 seeded randomized AVL operations, including invariant verification and draining the tree to empty.
- Both embedded JavaScript blocks pass syntax validation; no external runtime assets.
- Demo 1: all 12 stages, RR BF −2, actual left rotation, root 20, search path, GPA update, duplicate rejection and final deletion.
- Demo 2: actual LR intermediate snapshots, deletion BF +2 and root 2, AVL/BST heights 3/7, visits 3/7 and calculated 57.1% reduction.
- Both demos reset, repeat deterministically and preserve normal management records and persisted data.

## Browser verification

Chrome headless was attempted at window sizes 1366×768 and 1920×1080. The initial process failed during GPU startup in the command sandbox. Retrying with a temporary profile outside that sandbox succeeded at actual inner viewports 1348×672 and 1902×984.

Both browser runs passed the guided UI checks: launch, previous/next keyboard navigation, select shortcut exclusion, before/after SVG and rotation arrow, demo switching, actual comparison metrics, restart, autoplay, pause, Escape, presentation fitting the viewport, and management-data isolation. Browser tests used an instrumented temporary copy of the standalone page; the instrumentation is not shipped.

## Limitations

Physical fullscreen, subjective motion quality, projector readability and the full manual management workflow were not rehearsed interactively. Verify these on the presentation laptop. No execution-time improvement is inferred from the node-visit comparison.
