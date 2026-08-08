import {
  FLOW_MEDIA,
  FLOW_MEDIA_DIR,
  FLOW_MODES,
  FLOW_STEPS,
  flowMediaSrc,
} from "./flowSteps";

describe("FLOW_STEPS", () => {
  it("describes every mode", () => {
    FLOW_MODES.forEach((mode) => {
      expect(FLOW_STEPS[mode]).toHaveLength(4);
      expect(FLOW_MEDIA[mode]).toBeDefined();
    });
  });

  // The tabs are two routes through one process. If the steps diverged, the
  // headings would change under the reader as they switch tabs.
  it("uses the same four step keys in both modes", () => {
    expect(FLOW_STEPS.web.map((step) => step.key)).toEqual(
      FLOW_STEPS.line.map((step) => step.key),
    );
  });

  it("keeps the steps in the order they happen", () => {
    expect(FLOW_STEPS.line.map((step) => step.key)).toEqual([
      "create",
      "collect",
      "inspect",
      "confirm",
    ]);
  });

  it("gives every step its own capture file", () => {
    const files = FLOW_MODES.flatMap((mode) =>
      FLOW_STEPS[mode].map((step) => step.file),
    );

    expect(new Set(files).size).toBe(files.length);
  });
});

describe("flowMediaSrc", () => {
  it("resolves to a path under the public media directory", () => {
    expect(flowMediaSrc(FLOW_STEPS.line[0])).toBe(
      `${FLOW_MEDIA_DIR}/line-1-create.gif`,
    );
  });

  it("builds a root-relative path for every step", () => {
    FLOW_MODES.forEach((mode) => {
      FLOW_STEPS[mode].forEach((step) => {
        expect(flowMediaSrc(step)).toMatch(
          /^\/landing\/[a-z0-9-]+\.(gif|png)$/,
        );
      });
    });
  });
});
