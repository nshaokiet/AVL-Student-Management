# AVL Academic Studio V2.0 — presentation rehearsal

**Student Management System Using an AVL Tree with Interactive Visualization**
Friday, 27 November 2026 · Advanced Data Structures & Algorithms

Open the local V2.0 index.html in Chrome or Edge. The deployed GitHub Pages site remains at V1.3 pending approval. Choose **Presentation Mode**, select a scenario, and optionally click **Fullscreen**. No server or installation is needed.

## Demo 1 — Student management & self-balancing (about 2 minutes)

| Stage | Presenter cue |
| --- | --- |
| 1–4 | Start empty; insert IDs 10, 20, 30. Height(empty) = 0; height(leaf) = 1. |
| 5 | Point to node 10: BF = 0 − 2 = −2, an RR imbalance. |
| 6–7 | Compare before/after the left rotation. Root 20 has children 10 and 30. |
| 8 | Search 30. The actual search path is 20 → 30. |
| 9 | Update student 20's GPA from 3.2 to 3.8. The student ID remains the key. |
| 10 | Attempt duplicate 20. The algorithm rejects it. |
| 11–12 | Delete leaf 10 and inspect the final tree with root 20 and right child 30. |

## Demo 2 — Rebalancing & AVL versus BST (about 3 minutes)

- **A — LR:** Insert 30, 10, 20. Show LR imbalance at 30; left rotation at 10; right rotation at 30; final root 20. Pause to show the intermediate snapshot.
- **B — Deletion:** Insert 4, 2, 5, 1, 3. Delete 5. Node 4 has BF +2. A right rotation produces root 2.
- **C — Comparison:** Insert 10, 20, 30, 40, 50, 60, 70; search 70. Read actual metrics: AVL height 3, BST height 7; AVL path 40 → 60 → 70, BST path 10 → 20 → 30 → 40 → 50 → 60 → 70. The reduction in node visits is 57.1%, not a benchmark of elapsed time.

## Controls

Next / Previous, Play / Pause, Restart, Slow / Normal / Fast. Keyboard: Right / Left arrow, Space, R, Escape. Keyboard shortcuts are disabled inside editing fields and selects. Restart reconstructs the selected demo from scratch. Exit presentation returns to the existing student workspace. All three demos are isolated from student records and local storage.

## Rehearsal checklist

- Open each guided scenario, advance through every stage, and restart.
- Show the before/after views, direction arrow, balance calculation, and pseudocode.
- Check fullscreen on the presentation laptop and set the desired speed.
- Exit and confirm the management workspace retains its records; try ordinary CRUD and Algorithm Comparison if time permits.


## Demo 3 — Practical academic application (3–5 minutes)

Choose Guided Demo 3. All 22 stages use an isolated seven-student fictional dataset; the management records and saved data are unaffected.

| Chapter | Presenter cue | Expected output |
| --- | --- | --- |
| A — Academic ranking | Show ID AVL and ranking AVL; explain height, BF, subtree size and ID tie-breaker. Query Top 3 and Select(5). | Top 3: 50, 20, 30; rank 5: 40 |
| B — Scholarship screening | Screen GPA ≥ 3.80. Query inclusive range [3.50, 3.80] and count using subtree sizes. Explain faded/pruned branches. | Eligible: 3; range IDs: 20, 30, 70, 40; count: 4 |
| C — Dynamic ranking | Follow actual old-key removal, new-key insertion, metadata updates and balancing events. | ID 10: GPA 3.20 → 3.95, rank 6 → 1; Top 3: 10, 50, 20; eligible: 4 |
| D — Conclusion | Read actual Select visit count versus sequential traversal; explain synchronization, O(log n) core rank/select and O(n) index storage. | Same selected record; actual visit metrics displayed |

The GPA rule is an illustrative screening criterion, not a scholarship award decision. Use Previous/Next to pause on each rotation, or play at Normal speed and explain the key stages. Restart and exit as in the previous demos.
