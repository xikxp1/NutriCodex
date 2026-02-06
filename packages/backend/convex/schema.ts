import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

// Better Auth tables (user, session, account, verification) are managed
// by the Better Auth component and do not need to be defined here.
const schema = defineSchema({
  household: defineTable({
    name: v.string(),
  }),
  householdMember: defineTable({
    userId: v.string(),
    householdId: v.id("household"),
  })
    .index("by_userId", ["userId"])
    .index("by_householdId", ["householdId"]),
});

export default schema;
