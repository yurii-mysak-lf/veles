import { describe, it, expect } from "vitest";
import { detectTicketPatterns, formatTagsWithTickets } from "../src/utils/tickets.js";

describe("detectTicketPatterns", () => {
  it("detects JIRA-style ticket numbers", () => {
    expect(detectTicketPatterns("Related to PROJ-1234")).toEqual(["PROJ-1234"]);
  });

  it("detects multiple tickets", () => {
    expect(detectTicketPatterns("See PROJ-1234 and BUG-42")).toEqual(["PROJ-1234", "BUG-42"]);
  });

  it("returns empty array for no tickets", () => {
    expect(detectTicketPatterns("No tickets here")).toEqual([]);
  });

  it("deduplicates tickets", () => {
    expect(detectTicketPatterns("PROJ-1234 and PROJ-1234 again")).toEqual(["PROJ-1234"]);
  });

  it("handles various formats", () => {
    expect(detectTicketPatterns("ABC-1 DEF-99999")).toEqual(["ABC-1", "DEF-99999"]);
  });
});

describe("formatTagsWithTickets", () => {
  it("highlights ticket-pattern tags", () => {
    const result = formatTagsWithTickets(["architecture", "PROJ-1234", "design"]);
    expect(result).toBe("architecture, [PROJ-1234], design");
  });

  it("handles no ticket tags", () => {
    const result = formatTagsWithTickets(["architecture", "design"]);
    expect(result).toBe("architecture, design");
  });

  it("handles empty tags", () => {
    const result = formatTagsWithTickets([]);
    expect(result).toBe("(none)");
  });
});
