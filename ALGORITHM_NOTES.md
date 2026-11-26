# AVL algorithm notes

## Data model and invariants

Each `Node` stores a complete student record, `left`, `right`, and stored `height`. Student ID is the unique key. The AVL tree is the only in-memory record index; there is no sorted-list or dictionary substitute for search/insertion/deletion.

```text
height(null) = 0
height(leaf) = 1
height(node) = 1 + max(height(node.left), height(node.right))
BF(node) = height(node.left) - height(node.right)
```

Every key in the left subtree is smaller than the current key, and every key in the right subtree is larger. After an operation completes, stored heights must be exact and every balance factor must be in {−1, 0, +1}.

During insertion/deletion playback, an ancestor's stored height can be stale until its explicit height-update event. This is intentional: snapshots show the algorithm in progress. Each node label uses its stored height, and its BF uses its children's current stored heights. The top-level Tree height statistic is computed from the displayed tree's topology. Final snapshots satisfy all invariants.

## Search and update

```text
SEARCH(root, key):
    node = root
    while node != null:
        record comparison and visited node
        if key == node.key: return node
        if key < node.key: node = node.left
        else: node = node.right
    return NOT_FOUND

UPDATE(root, key, newRecord):
    reject if newRecord.id != key
    node = SEARCH(root, key)
    reject if node == null
    node.student = copy(newRecord)
```

Update preserves node identity, links, heights, and key. It does not rebalance because no structural change occurred.

## Insertion

```text
INSERT(node, record):
    if node == null:
        attach new leaf containing copy(record), height = 1
        record insertion snapshot
        return leaf
    record comparison
    if record.id == node.key: reject duplicate
    if record.id < node.key: node.left = INSERT(node.left, record)
    else: node.right = INSERT(node.right, record)
    return REBALANCE(node)
```

The implementation carries a constant-time attachment callback down the recursion: it sets `parent.left`, `parent.right`, or the tree root. This ensures each rotation's after-snapshot sees the new subtree connected to the complete tree. It does not search for parents or add a secondary index.

## Rebalancing and the four cases

```text
REBALANCE(node):
    node.height = 1 + max(height(node.left), height(node.right))
    record height-update snapshot
    if BF(node) > 1:
        record imbalance
        if BF(node.left) < 0:          // LR
            node.left = ROTATE_LEFT(node.left)
        return ROTATE_RIGHT(node)      // LL or second half of LR
    if BF(node) < -1:
        record imbalance
        if BF(node.right) > 0:         // RL
            node.right = ROTATE_RIGHT(node.right)
        return ROTATE_LEFT(node)       // RR or second half of RL
    return node
```

| Case | Shape | Repair | Prepared insertion sequence |
| --- | --- | --- | --- |
| LL | Left-heavy node, left child BF ≥ 0 | Right rotation | 30, 20, 10 |
| RR | Right-heavy node, right child BF ≤ 0 | Left rotation | 10, 20, 30 |
| LR | Left-heavy node, left child BF < 0 | Left at child, right at node | 30, 10, 20 |
| RL | Right-heavy node, right child BF > 0 | Right at child, left at node | 10, 30, 20 |

The child-balance tests also handle deletion, particularly the BF = 0 child case. After deletion, rebalancing can continue at multiple ancestors; do not stop after the first repair.

```text
ROTATE_RIGHT(y):
    record before-rotation snapshot
    x = y.left
    middle = x.right
    y.left = middle
    x.right = y
    update height(y)                   // old root first
    update height(x)                   // new root second
    attach x at y's previous parent link (or tree.root)
    increment single-rotation counter
    record after-rotation snapshot
    return x

ROTATE_LEFT(x):
    record before-rotation snapshot
    y = x.right
    middle = y.left
    x.right = middle
    y.left = x
    update height(x)
    update height(y)
    attach y at x's previous parent link (or tree.root)
    increment single-rotation counter
    record after-rotation snapshot
    return y
```

Rotations preserve inorder: for a right rotation, `A < x < middle < y < C` both before and after. Only a fixed number of pointers and stored heights changes.

## Deletion

```text
DELETE(node, key):
    if node == null: reject missing key
    record comparison
    if key < node.key: node.left = DELETE(node.left, key)
    else if key > node.key: node.right = DELETE(node.right, key)
    else:
        if node.left == null or node.right == null:
            child = the nonempty child, or null for a leaf
            reconnect parent's link (or root) to child
            record removal snapshot
            return child
        successor = minimum(node.right)
        record actual comparisons while locating successor
        replacement = copy(successor.student)
        node.right = DELETE(node.right, successor.key)
        node.student = replacement
        record successor replacement snapshot
    return REBALANCE(node)
```

The right-subtree successor is removed before publishing the target's replacement, avoiding duplicate-key frames. The minimum lookup and recursive successor deletion each perform comparisons; both count toward Nodes checked because both really execute. This is still O(log n). Root deletion uses the same attachment logic as all other deletions. **Not every deletion needs a rotation.** Deleting 10 from {10, 20, 30} rooted at 20 requires zero rotations.

## Inorder traversal

```text
INORDER(node):
    if node != null:
        INORDER(node.left)
        append copy(node.student) to output
        INORDER(node.right)
```

This generates the directory/export in ascending ID order. It is traversal, not sorting an alternate in-memory database.

## Snapshots, counters, and transactions

Algorithm events include start, compare, leaf insertion/removal, height update, imbalance, before rotation, after rotation, successor selection/replacement, found/not found, and completion. Each event captures a fresh nested serialization of the full current tree and a copied search path. Student records are deep copied. Later tree or snapshot changes cannot modify earlier frames.

Nodes checked counts comparisons in the current operation, including successor work during deletion. Rotations counts primitive rotations: LL/RR count 1; LR/RL count 2. The prepared examples accumulate counters across all three insertions. Each frame includes cumulative counters so the metrics match the replay position. A successful ordinary operation resets counters at its beginning.

The API clones the AVL nodes before a request, executes the algorithm on that candidate, and then writes its inorder records to a temporary file, flushes it, and atomically replaces `data/students.json`. Only after persistence succeeds does the committed in-memory root change. Invalid import, duplicate keys, invalid records, and write failures leave the previous committed tree and file untouched. Imports first build and validate a separate AVL tree without recording per-insertion snapshots.

The frontend replays the returned frames and derives the directory from the displayed frame. Changes are disabled while playback is running or paused. On completion it renders the final backend tree. Requests are serialized with a server lock; version checks catch stale-tab mutations. This is a single-process local demonstration, not a distributed transaction system.

## Complexity: core algorithm versus demonstration overhead

For n nodes and tree height h = O(log n):

| Component | Time | Extra space |
| --- | --- | --- |
| Core search | O(log n) | O(1), iterative, excluding recorded path |
| Core insertion | O(log n) | O(log n) recursion |
| Core deletion | O(log n) | O(log n) recursion |
| Core record update by ID | O(log n) | O(1), excluding record size |
| One primitive rotation | O(1) | O(1) |
| Inorder traversal | O(n) | O(n) output + O(log n) recursion |
| AVL node storage | — | O(n) |
| Transactional tree clone | O(n) | O(n) |
| One full snapshot | O(n) | O(n) |
| k recorded snapshots | O(kn) | O(kn) |
| Final inorder serialization and JSON persistence | O(n) | O(n), excluding output bytes |
| Build an imported AVL tree from n records | O(n log n) | O(n) |

Student text length is bounded, so record copying is treated as constant per record in this table. Search/insertion/deletion generate O(log n) algorithm events for one operation. Consequently full tracing can cost **O(n log n)** time and space per operation; the full API request does **not** run in O(log n). Cloning, counting records for validation, export serialization, and file writes also cost O(n) separately. A snapshot recorded before/after a rotation is O(n), although the rotation's pointer manipulation remains O(1).

The current SVG implementation uses inorder positions and constructs a nested traversal output for the directory. Layout itself visits n nodes; repeated JavaScript array concatenations and path-highlight checks can bring a balanced-tree frame to O(n log n). There are O(n) SVG nodes and edges, plus O(n) directory rows. Browser rendering cost is separate from AVL operations. Coordinates allocate a distinct inorder column for every node, with depth determining the row, and the viewport offers zoom/scroll. Full snapshots are intentionally limited to a 250-record demonstration scale.

## Verification

`python -m unittest discover -v` runs 20 automated tests. Structural validation recursively checks strict lower/upper BST bounds, computes true subtree heights, compares stored heights, checks |BF| ≤ 1, and compares inorder keys with the expected set after every operation in a fixed-seed randomized sequence (seed 25211, 1,800 operations), then drains the tree to empty. Separate tests cover each rotation, deletion shape, rollback, persistence, update stability, and the API presentation flow.

Browser automation could not proceed because the Windows computer-use tool could not confidently establish the active browser URL. Algorithm/API checks do not establish visual correctness; use the manual rehearsal in README before presenting.


## V2.0 — synchronized academic indexes (standalone HTML)

The preceding single-index notes describe the original ID AVL and Flask architecture. The standalone V2.0 now adds a second AVL using the composite order `(-GPA, student ID)`. Both indexes contain copies of the same validated record schema; the ID key stays unique. The ranking AVL additionally stores subtree size. Every primitive rotation refreshes the demoted node and then the promoted node, for both height and size. The final candidate indexes are checked for strict ordering, balance, height, size and record equality before publication. GPA edits stage the ID record change and remove/reinsert the ranking key in the candidate ranking AVL, then publish both together. JSON persistence stores the records only; both indexes are rebuilt on load or import. Exact numerical GPA is preserved.

```text
RANK(key):
  offset = 0
  while node exists:
    p = size(node.left) + 1
    if key == node.key: return offset + p
    if key precedes node.key: go left
    else: offset += p; go right
  return NOT_FOUND

SELECT(k):
  require 1 <= k <= size(root)
  while node exists:
    p = size(node.left) + 1
    if k == p: return node.record
    if k < p: go left
    else: k -= p; go right

RANGE(node, lo, hi):
  if node is empty: return
  if node.GPA <= hi: recurse left
  if lo <= node.GPA <= hi: emit node.record
  if node.GPA >= lo: recurse right

PREFIX(t, inclusive):
  count = 0
  while node exists:
    if GPA > t or (inclusive and GPA == t):
      count += size(node.left) + 1; go right
    else: go left
  return count

RANGE_COUNT(lo, hi) = PREFIX(lo, true) - PREFIX(hi, false)
COUNT_ABOVE(t) = PREFIX(t, true)
TOP_K(k) = inorder traversal stopped after k emitted records
```

| Core operation | Time |
| --- | --- |
| ID search, insert, delete | O(log n) |
| Rank by ID (ID lookup then ranking descent) | O(log n) |
| Select | O(log n) |
| Top K, GPA range | O(log n + k) |
| GPA range count, inclusive threshold count | O(log n) |
| GPA update (ID lookup/edit and ranking remove/insert) | O(log n) |
| Dual-index storage | O(n) |

Equal GPA requires inclusive traversal of both possible boundary branches because the ID tie-breaker may place equal GPA keys on either side. Prefix counting uses stored subtree sizes and visits at most one root-to-leaf path per prefix. Top K follows ranking order and stops after k outputs. No sorting or full record scan is used in the optimized query algorithms. The comparison baseline visits sequential ordered records or all records; metrics count actual visited nodes or examined records. A two-prefix count may visit the same node twice. Skipped roots represent bypassed subtrees, including subtrees counted in bulk. They are not a runtime benchmark.

Application overhead is separate: candidate cloning, consistency validation and JSON serialization are O(n) each. Full mutation snapshots can take O(n log n) time/space for one traced operation. Query events retain O(log n + k) entries for range/top K and O(log n) for rank/select/count. UI playback materializes prefix highlights and SVG snapshots separately, potentially adding quadratic trace-display work; table rendering computes record ranks separately. The 250-record cap keeps this teaching-oriented implementation bounded. Intermediate mutation frames may show stale ancestor metadata until recursion unwinds; final candidate trees satisfy all invariants.
