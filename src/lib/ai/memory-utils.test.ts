import { describe, it, expect } from "vitest";
import { isMemoryWorthyExchange } from "./memory-utils";

describe("isMemoryWorthyExchange", () => {
  it("returns false for a short acknowledgement", () => {
    expect(isMemoryWorthyExchange("ok thanks", "You're welcome!")).toBe(false);
  });

  it("returns false for both messages under 20 words combined", () => {
    expect(isMemoryWorthyExchange("got it", "Great!")).toBe(false);
  });

  it("returns true for a substantive exchange", () => {
    const user =
      "Can you explain how photosynthesis works in simple terms for a student?";
    const assistant =
      "Photosynthesis is the process plants use to convert sunlight into food using carbon dioxide and water.";
    expect(isMemoryWorthyExchange(user, assistant)).toBe(true);
  });

  it("returns true when exchange is exactly 20 words", () => {
    const words = Array.from({ length: 20 }, () => "word").join(" ");
    expect(isMemoryWorthyExchange(words, "")).toBe(true);
  });

  it("returns false for empty strings", () => {
    expect(isMemoryWorthyExchange("", "")).toBe(false);
  });
});
