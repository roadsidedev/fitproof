import { describe,expect,it } from 'vitest';
import { advanceCircuit, createCircuitState, haversineMeters, isTimedMoveComplete, StepDetector } from './workout';
import { generateCircuit } from './domain';
describe('step detector',()=>{it('counts separated acceleration peaks',()=>{const d=new StepDetector();expect(d.sample({x:0,y:0,z:0,timestamp:0})).toBe(0);expect(d.sample({x:2,y:0,z:0,timestamp:300})).toBe(1);expect(d.sample({x:0,y:0,z:0,timestamp:600})).toBe(2);});it('debounces rapid peaks',()=>{const d=new StepDetector();d.sample({x:0,y:0,z:0,timestamp:0});d.sample({x:2,y:0,z:0,timestamp:300});expect(d.sample({x:0,y:0,z:0,timestamp:400})).toBe(1);});});
describe('circuit player',()=>{it('requires two complete rounds and inserts rest',()=>{const moves=generateCircuit().map(x=>({...x,reps:1}));let state=createCircuitState();for(let i=0;i<4;i++) state=advanceCircuit(state,moves,1000+i);expect(state.restUntil).toBe(31003);state=advanceCircuit(state,moves,31003);for(let i=0;i<4;i++) state=advanceCircuit(state,moves,32000+i);expect(state.complete).toBe(true);});});
it('calculates GPS distance in meters',()=>expect(haversineMeters({lat:52.52,lon:13.405},{lat:52.5201,lon:13.405})).toBeGreaterThan(10));
it('requires full move duration',()=>{expect(isTimedMoveComplete(599,10)).toBe(false);expect(isTimedMoveComplete(600,10)).toBe(true);});
