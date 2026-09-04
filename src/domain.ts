export type QuestType = 'steps' | 'move' | 'circuit';
export type Level = 'beginner' | 'regular';
export type Focus = 'full body' | 'upper' | 'core' | 'legs';
export type Exercise = { id: string; name: string; target: string; reps?: number; seconds?: number };
export type Quest = { id: string; type: QuestType; title: string; subtitle: string; points: number; durationMin: number; exercises?: Exercise[] };

const catalog: Record<Focus, Exercise[]> = {
  'full body': [{id:'squat',name:'Bodyweight squat',target:'8 reps',reps:8},{id:'knee-pushup',name:'Knee push-up',target:'6 reps',reps:6},{id:'plank',name:'Plank',target:'20 sec',seconds:20},{id:'bridge',name:'Glute bridge',target:'8 reps',reps:8}],
  upper: [{id:'knee-pushup',name:'Knee push-up',target:'6 reps',reps:6},{id:'plank',name:'Plank',target:'20 sec',seconds:20},{id:'superman',name:'Superman',target:'8 reps',reps:8},{id:'jack',name:'Jumping jack',target:'20 reps',reps:20}],
  core: [{id:'plank',name:'Plank',target:'20 sec',seconds:20},{id:'dead-bug',name:'Dead bug',target:'8 reps',reps:8},{id:'mountain-climber',name:'Mountain climber',target:'16 reps',reps:16},{id:'bridge',name:'Glute bridge',target:'8 reps',reps:8}],
  legs: [{id:'squat',name:'Bodyweight squat',target:'8 reps',reps:8},{id:'lunge',name:'Reverse lunge',target:'8 reps',reps:8},{id:'wall-sit',name:'Wall sit',target:'20 sec',seconds:20},{id:'calf-raise',name:'Calf raise',target:'12 reps',reps:12}]
};
export function generateCircuit(level: Level = 'beginner', focus: Focus = 'full body'): Exercise[] {
  const base = catalog[focus];
  return base.map((exercise) => level === 'regular' && exercise.reps ? {...exercise, reps: exercise.reps + 2, target: `${exercise.reps + 2} reps`} : exercise);
}
export function canCompleteQuest(quest: Quest, progress: number): boolean { return Number.isFinite(progress) && progress >= (quest.type === 'circuit' ? 100 : quest.durationMin * 60); }
export function formatTime(seconds: number): string { const safe = Math.max(0, Math.floor(seconds)); return `${String(Math.floor(safe / 60)).padStart(2,'0')}:${String(safe % 60).padStart(2,'0')}`; }
export const todayQuests = (level: Level = 'beginner'): Quest[] => [
  {id:'steps-today',type:'steps',title:'Daily steps',subtitle:'6,000 steps · timed fallback',points:8,durationMin:5},
  {id:'move-today',type:'move',title:'Move session',subtitle:'10 minute brisk walk or run',points:8,durationMin:10},
  {id:'circuit-today',type:'circuit',title:'Home circuit',subtitle:'4 moves · 2 rounds · no equipment',points:10,durationMin:8,exercises:generateCircuit(level)}
];
