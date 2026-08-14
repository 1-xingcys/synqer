import { PALETTE, RAMP } from "./palette";

/**
 * The results grid, as a motif. Darker means more people free.
 *
 * It stands in for the brand card's illustration when that cannot be fetched,
 * which is the only place it is drawn. The event cards are type alone.
 *
 * The steps are fixed. Real vote counts sit behind the session guard, and a
 * card is an image anyone can fetch — this is a pattern, not a reading.
 */
const COLUMNS = [
  [0, 1, 0, 2, 1],
  [1, 2, 3, 3, 2],
  [0, 1, 1, 2, 0],
  [2, 3, 4, 4, 3],
  [1, 2, 2, 3, 2],
];

export function Heatmap() {
  return (
    <div style={{ display: "flex", gap: 12 }}>
      {COLUMNS.map((column, columnIndex) => (
        <div
          key={columnIndex}
          style={{ display: "flex", flexDirection: "column", gap: 12 }}
        >
          {column.map((step, rowIndex) => (
            <div
              key={rowIndex}
              style={{
                width: 62,
                height: 62,
                borderRadius: 10,
                background: step === 0 ? PALETTE.emptyCell : RAMP[step],
              }}
            />
          ))}
        </div>
      ))}
    </div>
  );
}
