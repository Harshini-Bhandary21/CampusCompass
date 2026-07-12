import { describe, expect, it } from "vitest";
import { cn } from "./utils";

describe("cn", () => {
  it("joins string arguments with a space", () => {
    expect(cn("foo", "bar")).toBe("foo bar");
  });

  it("skips falsy values", () => {
    expect(cn("foo", null, undefined, false, "", "bar")).toBe("foo bar");
  });

  it("includes object keys whose value is truthy", () => {
    expect(cn({ active: true, disabled: false })).toBe("active");
  });

  it("mixes strings and conditional objects", () => {
    expect(cn("base", { active: true }, "extra")).toBe("base active extra");
  });

  it("returns an empty string when everything is falsy", () => {
    expect(cn(null, undefined, false)).toBe("");
  });
});
