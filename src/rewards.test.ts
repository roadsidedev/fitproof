import { describe, expect, it } from 'vitest';
import { claimReward, streakFor } from './rewards';
const item={id:'nim',type:'nim' as const,label:'2 NIM',stock:1,costPoints:10};
describe('reward claims',()=>{it('rejects insufficient points',()=>expect(claimReward('NQx',9,item)).toBe('insufficient-points'));it('rejects empty stock',()=>expect(claimReward('NQx',10,{...item,stock:0})).toBe('out-of-stock'));it('keeps NIM claims pending for treasury payout',()=>expect(claimReward('NQx',10,item)).toMatchObject({status:'pending'}));});
describe('streaks',()=>{it('increments on consecutive UTC days',()=>expect(streakFor('2026-09-03','2026-09-04',2)).toBe(3));it('resets after a gap',()=>expect(streakFor('2026-09-01','2026-09-04',2)).toBe(1));});
