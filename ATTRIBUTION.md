# Attribution

FitProof is an original MIT-licensed implementation. It reimplements the product behavior described in the PRD and does not vendor AGPL application code.

## Bundled exercise assets

The following six exercise records and first instructional images are bundled under `public/exercises/` from [yuhonas/free-exercise-db](https://github.com/yuhonas/free-exercise-db), revision `main`, retrieved 5 September 2026:

- `Bodyweight_Squat`
- `Incline_Push-Up` (used as the beginner push-up visual)
- `Plank`
- `Butt_Lift_Bridge`
- `Bodyweight_Walking_Lunge`
- `Superman`

The source repository identifies its dataset and imagery as **Unlicense / public domain**. The original JSON metadata is retained next to each image, and `public/exercises/manifest.json` records the import source and license. These assets are served locally so production users do not depend on GitHub raw URLs.

## Other references

| Source | Use | License / note |
|---|---|---|
| [workout.cool](https://github.com/Snouzy/workout-cool) | Product inspiration for equipment-free session UX | MIT; no source copied |
| [NimQuest](https://github.com/mystiquemide/nimquest) | Reference for challenge, signature, receipt, and masked leaderboard flow | Reimplemented; no source copied |
| [Ballast](https://github.com/N-O-P-E/Ballast) | Reference for bodyweight progression and streak concepts | Ideas only; no source copied |
| [lift1.5](https://github.com/xarvy/lift1.5) | Reference for session grading and completion feedback | Ideas only; no source copied |

## Privacy

FitProof discloses collection of wallet address and workout session summaries. Device identifier and coarse location are optional and only relevant to their respective features. FitProof does not collect heart rate, contacts, or photos. The app is not medical advice.
