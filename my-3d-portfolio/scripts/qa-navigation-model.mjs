import assert from 'node:assert/strict';
import * as THREE from 'three';
import {CharacterModel} from '../src/js/three/CharacterModel.js';
import {characterConfig} from '../src/js/data/experienceConfig.js';
const vertex=new THREE.Vector3();const results=[];
for(const scale of [0.7,0.76,0.64]){
 const model=new CharacterModel();model.root.scale.setScalar(scale);let minimum=Infinity;const poses=new Set();
 for(let frame=0;frame<300;frame++){
  const phase=frame/299;model.setLocomotion(Math.sin(Math.PI*phase)*characterConfig.travel.runSpeed,true);model.update(1/60);poses.add(model.state);model.root.updateMatrixWorld(true);
  model.root.traverse(mesh=>{const p=mesh.geometry?.attributes.position;if(p)for(let i=0;i<p.count;i++){vertex.fromBufferAttribute(p,i).applyMatrix4(mesh.matrixWorld);minimum=Math.min(minimum,vertex.y);}});
 }
 assert.ok(minimum>=-0.001);assert.ok(poses.has('walk')&&poses.has('run'));
 model.setState('sit');for(let i=0;i<180;i++)model.update(1/60);
 const seat=(model.parts.body.position.y+0.25)*scale;assert.ok(Math.abs(seat-characterConfig.studio.seatHeight)<0.002);
 model.react('wave');for(let i=0;i<60;i++)model.update(1/60);assert.equal(model.restState,'sit');
 results.push({scale,minimumVertexY:minimum,seatHeight:seat,poses:[...poses]});model.dispose();
}
console.log(JSON.stringify(results));
