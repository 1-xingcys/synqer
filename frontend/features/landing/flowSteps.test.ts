import { LOCALES } from "@/i18n/locales";
import {
  FLOW_MEDIA,
  FLOW_MEDIA_BASE,
  FLOW_MODES,
  FLOW_STEPS,
  FLOW_THEMES,
  flowMediaSrc,
  type FlowStep,
  type FlowVariant,
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

  // A typo in a declared variant — "zh-tw/dark", "dark/zh-TW" — would type
  // check against the template literal only loosely and then silently resolve
  // to a 404, so the declared data is checked against the real lists. Vacuous
  // while nothing has been shot; the point is to catch the first typo.
  it("only declares variants that name a real locale and theme", () => {
    const legal: string[] = LOCALES.flatMap((locale) =>
      FLOW_THEMES.map((theme) => `${locale}/${theme}`),
    );

    FLOW_MODES.forEach((mode) => {
      FLOW_STEPS[mode].forEach((declared) => {
        declared.captured.forEach((variant) => {
          expect(legal).toContain(variant);
        });
      });
    });
  });
});

describe("flowMediaSrc", () => {
  const step = (captured: FlowVariant[]): FlowStep => ({
    key: "create",
    file: "line-step-1.png",
    captured,
  });

  it("prefers the reader's own locale and theme", () => {
    const everything = step([
      "zh-TW/light",
      "zh-TW/dark",
      "en/light",
      "en/dark",
    ]);

    expect(flowMediaSrc(everything, "dark", "en")).toBe(
      `${FLOW_MEDIA_BASE}/landing/en/dark/line-step-1.png`,
    );
  });

  // Locale outranks theme: a light capture on a dark page is merely out of
  // place, while a Chinese one is unreadable to an English reader.
  it("gives up the theme before the locale", () => {
    const wrongTheme = step(["en/light", "zh-TW/dark"]);

    expect(flowMediaSrc(wrongTheme, "dark", "en")).toBe(
      `${FLOW_MEDIA_BASE}/landing/en/light/line-step-1.png`,
    );
  });

  it("falls back to the default locale, keeping the theme where it can", () => {
    const noEnglish = step(["zh-TW/light", "zh-TW/dark"]);

    expect(flowMediaSrc(noEnglish, "dark", "en")).toBe(
      `${FLOW_MEDIA_BASE}/landing/zh-TW/dark/line-step-1.png`,
    );
  });

  it("falls back to the default locale in the other theme as a last resort", () => {
    const onlyOne = step(["zh-TW/light"]);

    expect(flowMediaSrc(onlyOne, "dark", "en")).toBe(
      `${FLOW_MEDIA_BASE}/landing/zh-TW/light/line-step-1.png`,
    );
  });

  it("resolves to nothing when the step has not been shot", () => {
    expect(flowMediaSrc(step([]), "light", "zh-TW")).toBeNull();
  });

  // StepMedia leans on this: it treats one null as meaning there is no capture
  // at all, and renders both themes unconditionally otherwise.
  it("resolves both themes together or not at all", () => {
    const cases: FlowVariant[][] = [
      [],
      ["zh-TW/light"],
      ["en/dark"],
      ["zh-TW/light", "en/dark"],
    ];

    cases.forEach((captured) => {
      const light = flowMediaSrc(step(captured), "light", "en");
      const dark = flowMediaSrc(step(captured), "dark", "en");

      expect(light === null).toBe(dark === null);
    });
  });
});
