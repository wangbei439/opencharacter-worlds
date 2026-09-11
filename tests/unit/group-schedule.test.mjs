import test from 'node:test';import assert from 'node:assert/strict';
import {groupSchedule} from '../../src/domain/group-schedule.ts';
test('group schedule excludes absent/muted members and bounds rounds',()=>{assert.deepEqual(groupSchedule(['a','b','a','c','d'],['b'],['a','b','c'],2),['a','c','a','c']);for(const n of [0,4,1.5,NaN])assert.throws(()=>groupSchedule([],[],[],n));assert.deepEqual(groupSchedule(['a'],['a'],['a'],3),[])});
test('shuffled rounds speak once per member and avoid repeating across boundaries',()=>{const result=groupSchedule(['a','b','c'],[],['a','b','c'],3,'shuffle',()=>0.99);for(let i=0;i<3;i++)assert.deepEqual([...result.slice(i*3,i*3+3)].sort(),['a','b','c']);assert.notEqual(result[2],result[3]);assert.notEqual(result[5],result[6])});
