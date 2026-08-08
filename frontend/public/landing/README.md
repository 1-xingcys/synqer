# Landing page walkthrough captures

One capture per step of each flow, referenced from
`features/landing/flowSteps.ts`. Until a file lands here its step renders a
placeholder of exactly the right size, so adding the capture later does not
reflow the page.

| File | Step | Shape |
|---|---|---|
| `line-1-create.gif` | Create the event from the LINE menu, share the card | phone, 9:16, 1170 × 2080 |
| `line-2-collect.gif` | Tap the card in the group, vote on the grid | phone, 9:16, 1170 × 2080 |
| `line-3-inspect.gif` | Tap and drag the results grid | phone, 9:16, 1170 × 2080 |
| `line-4-confirm.gif` | Pick the slot, share the result to the group | phone, 9:16, 1170 × 2080 |
| `web-1-create.gif` | Create the event on the site, get the link | desktop, 16:10, 1600 × 1000 |
| `web-2-collect.gif` | Open the link, vote on the grid | desktop, 16:10, 1600 × 1000 |
| `web-3-inspect.gif` | Tap and drag the results grid | desktop, 16:10, 1600 × 1000 |
| `web-4-confirm.gif` | Pick the slot, send the link out | desktop, 16:10, 1600 × 1000 |

After adding a file, flip that step's `ready` to `true` in
`features/landing/flowSteps.ts`. A still `.png` works as well as a `.gif`;
only the filename in `flowSteps.ts` has to match.

`next/image` renders these with `unoptimized`, because putting a GIF through
the optimizer drops its animation. Keep the files small by hand.
