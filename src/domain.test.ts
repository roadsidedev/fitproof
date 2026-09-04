import { describe, expect, it } from 'vitest';
import { canCompleteQuest, formatTime, generateCircuit, todayQuests } from './domain';
describe('circuit generator', () => { it('returns four bodyweight moves', () => expect(generateCircuit()).toHaveLength(4)); it('scales regular targets', () => expect(generateCircuit('regular')[0].reps).toBe(10)); });
describe('quest completion', () => { it('does not complete an unfinished quest', () => expect(canCompleteQuest(todayQuests()[2], 99)).toBe(false)); it('completes a circuit at full progress', () => expect(canCompleteQuest(todayQuests()[2], 100)).toBe(true)); it('requires the full timed duration', () => expect(canCompleteQuest(todayQuests()[1], 599)).toBe(false)); });
describe('time formatting', () => { it('clamps negative values and pads output', () => expect(formatTime(-1)).toBe('00:00')); expect(formatTime(605)).toBe('10:05'); });
