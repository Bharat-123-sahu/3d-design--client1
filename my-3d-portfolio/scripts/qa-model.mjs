import assert from 'node:assert/strict';
import * as THREE from 'three';
import { CharacterModel } from '../src/js/three/CharacterModel.js';
import { navigationNodes, getPath } from '../src/js/data/navigationData.js';
import { submitFeedback } from '../src/js/services/feedbackService.js';
const character = new CharacterModel();
const vertex = new THREE.Vector3();
let minimum = Infinity;
for (const state of ['idle','look','walk','run','stop','turn','sit','stand','point','wave','celebrate','thinking','curious','transition']) {
 character.setState(state);
 for(let frame=0;frame<120;frame++) {
  character.update(1/60);
  character.root.updateMatrixWorld(true);
  character.root.traverse(mesh=>{
   const positions=mesh.geometry?.attributes.position;
   if(!positions) return;
   for(let i=0;i<positions.count;i++) {vertex.fromBufferAttribute(positions,i).applyMatrix4(mesh.matrixWorld);minimum=Math.min(minimum,vertex.y);}
  });
 }
}
assert.ok(minimum >= -0.001, `Character penetrated floor by ${-minimum}`);
for(const from of Object.keys(navigationNodes)) for(const to of Object.keys(navigationNodes)) {
 const path=getPath(from,to);
 assert.ok(path[0].equals(navigationNodes[from].position));
 assert.ok(path.at(-1).equals(navigationNodes[to].position));
 assert.ok(path.every(point=>point.y===-1.6));
}
assert.deepEqual(await submitFeedback({rating:'loved',message:'Test'}),{status:'unconfigured'});
await assert.rejects(submitFeedback({rating:'invalid',message:''}));
await assert.rejects(submitFeedback({rating:'good',message:'x'.repeat(2001)}));
const abort = new AbortController();abort.abort();
await assert.rejects(submitFeedback({rating:'good',message:''},{signal:abort.signal}));
character.dispose();
console.log(JSON.stringify({states:14,minimumVertexY:minimum,destinationPairs:49,feedback:'validation and unconfigured delivery pass'}));
