import {
  isHiddenFromAssistiveTech,
  nextSidebarOpenState,
  resolveSidebarPresentation,
} from "./sidebarState";

describe("resolveSidebarPresentation", () => {
  describe("尚未操作 (null)", () => {
    const presentation = resolveSidebarPresentation(null);

    // These assertions are the hydration-consistency guarantee: correct for
    // both viewport sizes without ever reading window
    it("桌面維持展開寬度", () => {
      expect(presentation.widthClass).toBe("lg:w-64");
      expect(presentation.isCollapsed).toBe(false);
    });

    it("手機移出畫面，桌面靠 lg: 覆寫留在原位", () => {
      expect(presentation.visibilityClass).toContain("-translate-x-full");
      expect(presentation.visibilityClass).toContain("lg:translate-x-0");
      expect(presentation.visibilityClass).toContain("lg:opacity-100");
    });

    it("不顯示手機版遮罩", () => {
      expect(presentation.showOverlay).toBe(false);
    });
  });

  describe("明確展開 (true)", () => {
    const presentation = resolveSidebarPresentation(true);

    it("完全可見並顯示遮罩", () => {
      expect(presentation.visibilityClass).toBe(
        "translate-x-0 opacity-100 pointer-events-auto",
      );
      expect(presentation.showOverlay).toBe(true);
      expect(presentation.widthClass).toBe("lg:w-64");
      expect(presentation.isCollapsed).toBe(false);
    });
  });

  describe("明確收合 (false)", () => {
    const presentation = resolveSidebarPresentation(false);

    it("桌面縮成圖示列，手機收起且不顯示遮罩", () => {
      expect(presentation.widthClass).toBe("lg:w-20");
      expect(presentation.isCollapsed).toBe(true);
      expect(presentation.showOverlay).toBe(false);
      expect(presentation.visibilityClass).toContain("-translate-x-full");
      expect(presentation.visibilityClass).toContain("lg:translate-x-0");
    });
  });

  it("null 與 false 只差在寬度與收合，都不顯示遮罩", () => {
    const untouched = resolveSidebarPresentation(null);
    const closed = resolveSidebarPresentation(false);

    expect(untouched.visibilityClass).toBe(closed.visibilityClass);
    expect(untouched.showOverlay).toBe(closed.showOverlay);
    expect(untouched.widthClass).not.toBe(closed.widthClass);
  });
});

describe("nextSidebarOpenState", () => {
  it("手機從未操作時按下開關會展開", () => {
    expect(nextSidebarOpenState(null, false)).toBe(true);
  });

  it("桌面從未操作時按下開關會收合", () => {
    expect(nextSidebarOpenState(null, true)).toBe(false);
  });

  it("已有明確狀態時單純反轉，與視窗無關", () => {
    expect(nextSidebarOpenState(true, true)).toBe(false);
    expect(nextSidebarOpenState(true, false)).toBe(false);
    expect(nextSidebarOpenState(false, true)).toBe(true);
    expect(nextSidebarOpenState(false, false)).toBe(true);
  });
});

describe("isHiddenFromAssistiveTech", () => {
  it("桌面永遠留在無障礙樹上", () => {
    expect(isHiddenFromAssistiveTech(null, true)).toBe(false);
    expect(isHiddenFromAssistiveTech(false, true)).toBe(false);
    expect(isHiddenFromAssistiveTech(true, true)).toBe(false);
  });

  it("手機只有展開時才在無障礙樹上", () => {
    expect(isHiddenFromAssistiveTech(null, false)).toBe(true);
    expect(isHiddenFromAssistiveTech(false, false)).toBe(true);
    expect(isHiddenFromAssistiveTech(true, false)).toBe(false);
  });
});
