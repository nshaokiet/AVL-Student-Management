// Verification only: Node's built-in runner; the delivered HTML needs no Node/npm.
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const {test} = require('node:test');
const html = fs.readFileSync(path.join(__dirname,'..','index.html'),'utf8');
const core = html.match(/<script id="avl-core">([\s\S]*?)<\/script>/)[1];
const ui = html.match(/<script id="app-ui">([\s\S]*?)<\/script>/)[1];
vm.runInThisContext(core,{filename:'index.html#avl-core'});
const {AVLTree,StudentStore,compare,validateStudent,parseImport,STORAGE_KEY} = globalThis.AVLStandalone;
const student = (id,gpa=3.2) => ({id,name:`Student ${id}`,age:20,major:'Computer Science',gpa});
const treeOf = (keys,trace=true) => {const tree=new AVLTree(trace);for(const id of keys) tree.insert(student(id));return tree;};
function valid(tree,keys) {
  function inspect(node,lower=-Infinity,upper=Infinity) {
    if(!node) return 0;
    assert.ok(lower<node.student.id && node.student.id<upper);
    const left=inspect(node.left,lower,node.student.id),right=inspect(node.right,node.student.id,upper);
    assert.equal(node.height,1+Math.max(left,right));assert.ok(Math.abs(left-right)<=1);return node.height;
  }
  inspect(tree.root);assert.deepEqual(tree.inorder().map(s=>s.id),[...keys].sort((a,b)=>a-b));
}
function memoryStorage() {
  const data=new Map();return {getItem:key=>data.has(key)?data.get(key):null,setItem:(key,value)=>data.set(key,value)};
}
for(const [type,keys,rotations] of [['LL',[30,20,10],1],['RR',[10,20,30],1],['LR',[30,10,20],2],['RL',[10,30,20],2]]) {
  test(`${type}: correct links, heights, BF, real before/after rotation frames`,()=>{
    const tree=treeOf(keys.slice(0,2));tree.begin();tree.insert(student(keys[2]));valid(tree,keys);
    assert.deepEqual([tree.root.student.id,tree.root.left.student.id,tree.root.right.student.id],[20,10,30]);
    assert.equal(tree.rotations,rotations);
    assert.equal(tree.steps.filter(s=>s.kind==='before_rotation').length,rotations);
    assert.equal(tree.steps.filter(s=>s.kind==='rotation').length,rotations);
    assert.equal(tree.steps.find(s=>s.kind==='imbalance').case,type);
    assert.ok(tree.steps.filter(s=>s.kind==='rotation').every(s=>s.affected.length===2));
    assert.deepEqual(tree.steps.at(-1).tree,tree.snapshot());
  });
}
test('Snapshots are independent of later changes and other frames',()=>{
  const tree=treeOf([20,10]);tree.begin();tree.insert(student(30));
  const old=JSON.parse(JSON.stringify(tree.steps)),count=tree.steps.length;
  tree.root.student.name='Changed';tree.delete(10);
  assert.deepEqual(tree.steps.slice(0,count),old);
  tree.steps[0].tree.student.name='Edited frame';assert.notEqual(tree.steps[1].tree.student.name,'Edited frame');
});
test('Search found/not found follows actual paths, including empty tree',()=>{
  const tree=treeOf([20,10,30]);tree.begin();assert.deepEqual(tree.search(30).student,student(30));assert.equal(tree.checked,2);
  assert.deepEqual(tree.steps.filter(s=>s.kind==='visit').map(s=>s.active),[20,30]);
  tree.begin();assert.equal(tree.search(99),null);assert.equal(tree.checked,2);assert.equal(tree.steps.at(-1).kind,'not_found');
  const empty=new AVLTree();assert.equal(empty.search(1),null);assert.equal(empty.checked,0);
});
test('Duplicate ID rejected without structural changes',()=>{
  const tree=treeOf([20,10,30]),before=tree.snapshot();assert.throws(()=>tree.insert(student(20)));assert.deepEqual(tree.snapshot(),before);
});
test('Update keeps key, node identity, links, and heights',()=>{
  const tree=treeOf([20,10,30]),root=tree.root,left=root.left,right=root.right;tree.begin();tree.update(30,student(30,3.8));
  assert.equal(tree.root,root);assert.equal(root.left,left);assert.equal(root.right,right);assert.equal(right.student.gpa,3.8);assert.equal(tree.rotations,0);
  valid(tree,[10,20,30]);assert.throws(()=>tree.update(30,student(99)));assert.throws(()=>tree.update(99,student(99)));
});
for(const [label,keys,id] of [['leaf',[20,10,30],10],['one child',[20,10,30,25],30],['two children',[40,20,60,10,30,50,70,45,55],40],['sole root',[20],20],['root with one child',[20,10],20],['root with two children',[20,10,30],20]]) {
  test(`Delete ${label}`,()=>{const tree=treeOf(keys);tree.begin();tree.delete(id);valid(tree,keys.filter(k=>k!==id));assert.deepEqual(tree.steps.at(-1).tree,tree.snapshot());});
}
test('Deletion rebalances with a zero-balance child',()=>{
  const tree=treeOf([4,2,5,1,3]);tree.begin();tree.delete(5);valid(tree,[1,2,3,4]);assert.equal(tree.rotations,1);assert.equal(tree.root.student.id,2);
});
test('Deletion double rotations in both directions',()=>{
  for(const [keys,id] of [[[5,2,8,1,4,7,3],7],[[5,2,8,3,6,9,7],3]]) {
    const tree=treeOf(keys);tree.begin();tree.delete(id);valid(tree,keys.filter(k=>k!==id));assert.equal(tree.rotations,2);
  }
});
test('Missing deletion leaves existing/empty tree intact',()=>{
  for(const tree of [new AVLTree(),treeOf([10])]) {const before=tree.snapshot();assert.throws(()=>tree.delete(99));assert.deepEqual(tree.snapshot(),before);}
});
test('1800 seeded random operations validate all AVL invariants; drain to empty',()=>{
  let seed=25211;const random=()=>{seed=(Math.imul(1664525,seed)+1013904223)>>>0;return seed/4294967296;};
  const tree=new AVLTree(false),expected=new Set();
  for(let i=0;i<1800;i++) {
    const id=1+Math.floor(random()*350);
    if(random()<.55) {if(expected.has(id)) assert.throws(()=>tree.insert(student(id)));else {tree.insert(student(id));expected.add(id);}}
    else if(expected.has(id)) {tree.delete(id);expected.delete(id);}else assert.throws(()=>tree.delete(id));
    valid(tree,expected);
  }
  for(const id of [...expected]) {tree.delete(id);expected.delete(id);valid(tree,expected);}
});
test('CRUD presentation flow and reset through local operations',()=>{
  const store=new StudentStore();store.operate({action:'clear'});
  for(const id of [10,20,30]) store.operate({action:'insert',student:student(id)});
  assert.equal(store.state().tree.id,20);assert.equal(store.operate({action:'search',id:30}).result.gpa,3.2);
  assert.equal(store.operate({action:'search',id:99}).result,null);
  store.operate({action:'update',id:30,student:student(30,3.8)});assert.equal(store.state().tree.right.student.gpa,3.8);
  const removed=store.operate({action:'delete',id:10});assert.equal(removed.rotations,0);assert.deepEqual(removed.students.map(s=>s.id),[20,30]);
  assert.equal(store.operate({action:'reset'}).count,7);
});
test('Strict validation of IDs, age, name, major and GPA',()=>{
  for(const value of [student(0),student(-1),student(true),student(1.5),student(9007199254740992),{...student(80),age:151},{...student(80),name:' '},{...student(80),major:[]},student(80,4.1),student(80,true),student(80,NaN),student(80,Infinity)]) assert.throws(()=>validateStudent(value));
  assert.throws(()=>validateStudent({...student(1),extra:true}));assert.throws(()=>validateStudent(null));
});
test('JSON export/import round trip and LocalStorage restore',()=>{
  const storage=memoryStorage(),store=new StudentStore(storage);
  store.importJSON(JSON.stringify([student(30),student(10),student(20)]));
  const exported=store.exportJSON();assert.deepEqual(JSON.parse(exported).map(s=>s.id),[10,20,30]);
  assert.deepEqual(new StudentStore(storage).state().students,JSON.parse(exported));
  store.operate({action:'clear'});store.importJSON(exported);assert.deepEqual(store.state().students,JSON.parse(exported));
});
test('Invalid import is fully atomic for memory and saved records',()=>{
  const storage=memoryStorage(),store=new StudentStore(storage);store.operate({action:'reset'});
  const before=store.state(),saved=storage.getItem(STORAGE_KEY);
  for(const input of ['broken','null','{}',JSON.stringify([student(1),student(1)]),JSON.stringify([student(1),student(2,8)]),JSON.stringify([student(1),{id:2}])]) {
    assert.throws(()=>store.importJSON(input));assert.deepEqual(store.state(),before);assert.equal(storage.getItem(STORAGE_KEY),saved);
  }
});
test('250-student capacity; oversized input rejected',()=>{
  const store=new StudentStore();store.importJSON(JSON.stringify(Array.from({length:250},(_,i)=>student(i+1))));valid(store.tree,Array.from({length:250},(_,i)=>i+1));
  const before=store.exportJSON();assert.throws(()=>store.operate({action:'insert',student:student(251)}));assert.equal(store.exportJSON(),before);
  assert.throws(()=>store.importJSON(JSON.stringify(Array.from({length:251},(_,i)=>student(i+1)))));
  assert.throws(()=>parseImport(' '.repeat(1024*1024+1)));assert.throws(()=>parseImport('界'.repeat(350000)));
});
test('Storage unavailable/quota failure preserves in-memory editing and JSON backup',()=>{
  const store=new StudentStore();assert.ok(store.warning);store.operate({action:'insert',student:student(99)});assert.equal(store.state().count,8);
  const storage=memoryStorage(),saved=new StudentStore(storage);saved.operate({action:'reset'});const previous=storage.getItem(STORAGE_KEY);
  storage.setItem=()=>{throw new Error('quota');};saved.operate({action:'insert',student:student(99)});
  assert.equal(saved.storage,null);assert.ok(saved.warning);assert.equal(saved.state().count,8);assert.equal(JSON.parse(saved.exportJSON()).length,8);assert.equal(storage.getItem(STORAGE_KEY),previous);
});
test('Corrupt saved data is preserved and falls back to memory',()=>{
  const storage=memoryStorage();storage.setItem(STORAGE_KEY,'broken');const store=new StudentStore(storage);
  assert.equal(store.state().count,7);assert.equal(store.storage,null);assert.ok(store.warning);store.operate({action:'reset'});assert.equal(storage.getItem(STORAGE_KEY),'broken');
});
test('Search is read-only and stale local versions are rejected',()=>{
  const storage=memoryStorage(),store=new StudentStore(storage);store.operate({action:'reset'});const saved=storage.getItem(STORAGE_KEY),before=store.state();
  store.operate({action:'search',id:30});assert.equal(storage.getItem(STORAGE_KEY),saved);assert.deepEqual(store.state(),before);
  store.operate({action:'clear',version:before.version});assert.throws(()=>store.operate({action:'insert',student:student(1),version:before.version}));
});
test('All quick scenarios use real AVL events and correct rotation totals',()=>{
  const store=new StudentStore();
  for(const [type,count] of [['LL',1],['RR',1],['LR',2],['RL',2]]) {
    const result=store.operate({action:'example',case:type});assert.equal(result.steps[0].tree,null);assert.equal(result.steps.filter(s=>s.kind==='insert').length,3);assert.equal(result.total_rotations,count);valid(store.tree,[10,20,30]);
  }
  const deleted=store.operate({action:'example',case:'DELETE'});assert.equal(deleted.tree.id,2);assert.equal(deleted.steps.find(s=>s.kind==='rotation').operation,'Delete 5');valid(store.tree,[1,2,3,4]);
  const random=store.operate({action:'example',case:'RANDOM'});assert.equal(random.count,15);assert.equal(new Set(random.students.map(s=>s.id)).size,15);valid(store.tree,random.students.map(s=>s.id));
  store.operate({action:'reset'});assert.equal(store.state().total_rotations,0);
  assert.throws(()=>store.operate({action:'example',case:'__proto__'}));
});
test('Default comparison: AVL/BST heights 3/7, visits 3/7',()=>{
  const result=compare([10,20,30,40,50,60,70],70);
  assert.deepEqual([result.avl.height,result.bst.height,result.avl.comparisons,result.bst.comparisons],[3,7,3,7]);
  assert.deepEqual(result.avl.path,[40,60,70]);assert.deepEqual(result.bst.path,[10,20,30,40,50,60,70]);assert.ok(result.avl.found && result.bst.found);
});
test('Comparison is isolated; missing keys and invalid input handled',()=>{
  const store=new StudentStore(),before=store.state(),result=compare([10,20,30],99);
  assert.equal(result.avl.found,false);assert.equal(result.bst.found,false);assert.deepEqual(store.state(),before);
  for(const sequence of [[],[10,10],[true],[0],Array.from({length:51},(_,i)=>i+1),'10,20',[1.5]]) assert.throws(()=>compare(sequence,10));
});
test('Both embedded JavaScript blocks pass syntax validation',()=>{
  new vm.Script(core,{filename:'index.html#avl-core'});new vm.Script(ui,{filename:'index.html#app-ui'});
});
test('Standalone HTML has no external runtime assets, API calls, imports, or Flask templates',()=>{
  assert.ok(!/<script[^>]+src\s*=|<link[^>]+rel=["']stylesheet|<img[^>]+src\s*=/i.test(html));
  assert.ok(!/\bfetch\s*\(|XMLHttpRequest|\bimport\s*\(|url_for\(|\{\{/.test(core+ui));
  assert.ok(!/@import|url\(\s*["']?https?:/i.test(html));
});

test('Guided demo 1 has 12 stages, actual RR, CRUD and rejection events',()=>{
  const stages=AVLStandalone.guidedDemo(1);
  assert.equal(stages.length,12);assert.equal(stages[0].frame.tree,null);
  const imbalance=stages[4].frame;
  assert.equal(imbalance.kind,'imbalance');assert.equal(imbalance.case,'RR');assert.equal(imbalance.tree.balance,-2);
  assert.equal(stages[5].before.tree.id,10);assert.equal(stages[5].frame.tree.id,20);
  assert.deepEqual(stages[7].frame.path,[20,30]);assert.equal(stages[7].frame.kind,'found');
  assert.equal(stages[8].frame.tree.student.gpa,3.8);
  assert.equal(stages[9].frame.kind,'reject');assert.deepEqual(stages[9].frame.tree,stages[8].frame.tree);
  assert.equal(stages.at(-1).frame.tree.id,20);assert.equal(stages.at(-1).frame.tree.left,null);
  assert.equal(stages.at(-1).frame.tree.right.id,30);
});
test('Guided demo 2 uses LR intermediate snapshots, deletion rebalance and actual comparison',()=>{
  const stages=AVLStandalone.guidedDemo(2);
  const rotations=stages.filter(s=>s.before);
  assert.deepEqual(rotations.map(s=>s.frame.rotation),['Left rotation','Right rotation','Right rotation']);
  assert.equal(rotations[0].before.active,10);assert.equal(rotations[0].frame.tree.left.id,20);
  assert.equal(rotations[1].before.active,30);assert.equal(rotations[1].frame.tree.id,20);
  assert.equal(rotations[2].before.tree.balance,2);assert.equal(rotations[2].frame.tree.id,2);
  const comparison=stages.at(-1).comparison;
  assert.deepEqual([comparison.avl.height,comparison.bst.height,comparison.avl.comparisons,comparison.bst.comparisons],[3,7,3,7]);
  assert.equal(comparison.reduction.toFixed(1),'57.1');
});
test('Guided demos are repeatable, reset to empty and never alter persisted management data',()=>{
  const storage=memoryStorage(),store=new StudentStore(storage);
  store.operate({action:'insert',student:student(99)});const before=store.state(),saved=storage.getItem(STORAGE_KEY);
  for(const number of [1,2]){
    const first=AVLStandalone.guidedDemo(number),second=AVLStandalone.guidedDemo(number);
    assert.deepEqual(first,second);assert.equal(second[0].frame.tree,null);
    first.at(-1).frame.tree.id=999;assert.notEqual(second.at(-1).frame.tree.id,999);
  }
  assert.deepEqual(store.state(),before);assert.equal(storage.getItem(STORAGE_KEY),saved);
});
