import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { validateDatabaseReview } from '../lib/database-review-validation.mjs';
const review=JSON.parse(readFileSync(new URL('../data/db3k-expansion-review.json',import.meta.url),'utf8'));
const record=(build,table,id,data=review)=>data.builds.find(b=>b.buildLabel===build).records.find(r=>r.table===table&&r.componentId===id);
test('expansion preserves variant/build identity and absence rather than borrowing a later record',()=>{
  assert.deepEqual(validateDatabaseReview(review),{ok:true,errors:[]});
  for(const build of review.builds)assert.equal(build.records.length,58);
  for(const [t,id]of[['DataWeapon',4281],['DataMount',3980],['DataSensor',7378]]){
    assert.equal(record(496,t,id).present,false);assert.equal(record(496,t,id).rawFields,null);
    assert.equal(record(515,t,id).present,true);
  }
  assert.equal(record(515,'DataWeapon',4075).rawFields.Name,'RB 70 NG');
  assert.equal(record(515,'DataWeapon',1154).rawFields.Name,'SA-18 Grouse [9M39]');
  assert.ok(review.builds.flatMap(b=>b.records).every(r=>r.normalizedPhysicalParameters===null&&r.runtimeEnabled===false));
});
test('Pantsir aggregate includes cannon bursts; total capacity cannot become missile count',()=>{
  const pantsir=record(515,'DataMount',2282);assert.equal(pantsir.rawFields.Capacity,40);
  assert.deepEqual(pantsir.weaponRecords.map(r=>[r.weaponId,r.DefaultLoad]),[[2739,28],[2740,12]]);
  assert.equal(pantsir.realLauncherCompatibility,null);
  const fake=structuredClone(review);record(515,'DataMount',2282,fake).realLauncherCompatibility={missiles:40};
  assert.equal(validateDatabaseReview(fake).ok,false);
});
test('game seeker labels and pulse classifications remain raw, not equivalent guidance or integration gains',()=>{
  assert.equal(record(515,'DataWeapon',1324).seekerSensors[0].Name,'SALH Seeker');
  assert.equal(record(515,'DataWeapon',1154).seekerSensors[0].Name,'IR Seeker');
  const radar=record(515,'DataSensor',960);assert.ok(radar.sensorCodes.some(c=>c.CodeID===3002));
  assert.equal(radar.normalizedPhysicalParameters,null);
  const fake=structuredClone(review);record(515,'DataSensor',960,fake).sensorCodes.push(radar.sensorCodes[0]);
  assert.equal(validateDatabaseReview(fake).ok,false);
});
