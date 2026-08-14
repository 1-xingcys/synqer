import robots from "./robots";
import { LOCALES } from "@/i18n/locales";

function group(userAgent: string) {
  const rules = robots().rules;
  const all = Array.isArray(rules) ? rules : [rules];

  return all.find((rule) =>
    Array.isArray(rule.userAgent)
      ? rule.userAgent.includes(userAgent)
      : rule.userAgent === userAgent,
  );
}

function disallowed(userAgent: string): string[] {
  const rule = group(userAgent)?.disallow ?? [];
  return Array.isArray(rule) ? rule : [rule];
}

describe("robots", () => {
  // Letting the preview fetchers past the middleware is not enough on its own:
  // most of them read robots.txt first and decline a disallowed path outright.
  it("opens the event pages to the link preview fetchers", () => {
    for (const agent of ["Slackbot", "facebookexternalhit", "Discordbot"]) {
      for (const locale of LOCALES) {
        expect(disallowed(agent)).not.toContain(`/${locale}/events`);
      }
    }
  });

  // An event is public to whoever holds the link, which is not the same as
  // public to whoever searches.
  it("keeps the event pages out of the search index", () => {
    for (const locale of LOCALES) {
      expect(disallowed("*")).toContain(`/${locale}/events`);
    }
  });

  it("closes /new and /login to everybody, previews included", () => {
    for (const agent of ["*", "Slackbot", "facebookexternalhit"]) {
      for (const locale of LOCALES) {
        expect(disallowed(agent)).toContain(`/${locale}/new`);
        expect(disallowed(agent)).toContain(`/${locale}/login`);
      }
    }
  });

  it("still points at the sitemap", () => {
    expect(robots().sitemap).toMatch(/\/sitemap\.xml$/);
  });
});
