import { ConvexError, v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { authComponent } from "./auth";

// --- Queries ---

export const getMyHousehold = query({
  args: {},
  handler: async (ctx) => {
    const user = await authComponent.getAuthUser(ctx);

    const membership = await ctx.db
      .query("householdMember")
      .withIndex("by_userId", (q) => q.eq("userId", user._id))
      .first();

    if (!membership) {
      return null;
    }

    const household = await ctx.db.get(membership.householdId);
    if (!household) {
      return null;
    }

    return { _id: household._id, name: household.name };
  },
});

export const getHouseholdMembers = query({
  args: { householdId: v.id("household") },
  handler: async (ctx, { householdId }) => {
    await authComponent.getAuthUser(ctx);

    const members = await ctx.db
      .query("householdMember")
      .withIndex("by_householdId", (q) => q.eq("householdId", householdId))
      .collect();

    const result = [];
    for (const member of members) {
      const user = await authComponent.getAnyUserById(ctx, member.userId);
      result.push({
        _id: member._id,
        userId: member.userId,
        name: user?.name ?? "",
        email: user?.email ?? "",
        image: (user?.image as string | null) ?? null,
      });
    }

    return result;
  },
});

export const listHouseholds = query({
  args: {},
  handler: async (ctx) => {
    await authComponent.getAuthUser(ctx);

    const households = await ctx.db.query("household").collect();

    const result = [];
    for (const household of households) {
      const members = await ctx.db
        .query("householdMember")
        .withIndex("by_householdId", (q) => q.eq("householdId", household._id))
        .collect();

      result.push({
        _id: household._id,
        name: household.name,
        memberCount: members.length,
      });
    }

    return result;
  },
});

// --- Mutations ---

export const createHousehold = mutation({
  args: { name: v.string() },
  handler: async (ctx, { name }) => {
    const user = await authComponent.getAuthUser(ctx);

    const trimmedName = name.trim();
    if (trimmedName.length < 1 || trimmedName.length > 100) {
      throw new ConvexError("Household name must be between 1 and 100 characters");
    }

    const existingMembership = await ctx.db
      .query("householdMember")
      .withIndex("by_userId", (q) => q.eq("userId", user._id))
      .first();

    if (existingMembership) {
      throw new ConvexError("You already belong to a household");
    }

    const householdId = await ctx.db.insert("household", {
      name: trimmedName,
    });

    await ctx.db.insert("householdMember", {
      userId: user._id,
      householdId,
    });

    return householdId;
  },
});

export const joinHousehold = mutation({
  args: { householdId: v.id("household") },
  handler: async (ctx, { householdId }) => {
    const user = await authComponent.getAuthUser(ctx);

    const existingMembership = await ctx.db
      .query("householdMember")
      .withIndex("by_userId", (q) => q.eq("userId", user._id))
      .first();

    if (existingMembership) {
      throw new ConvexError("You already belong to a household");
    }

    const household = await ctx.db.get(householdId);
    if (!household) {
      throw new ConvexError("Household not found");
    }

    await ctx.db.insert("householdMember", {
      userId: user._id,
      householdId,
    });
  },
});

export const leaveHousehold = mutation({
  args: {},
  handler: async (ctx) => {
    const user = await authComponent.getAuthUser(ctx);

    const membership = await ctx.db
      .query("householdMember")
      .withIndex("by_userId", (q) => q.eq("userId", user._id))
      .first();

    if (!membership) {
      throw new ConvexError("You don't belong to any household");
    }

    const householdId = membership.householdId;

    await ctx.db.delete(membership._id);

    const remainingMembers = await ctx.db
      .query("householdMember")
      .withIndex("by_householdId", (q) => q.eq("householdId", householdId))
      .collect();

    if (remainingMembers.length === 0) {
      await ctx.db.delete(householdId);
    }
  },
});

export const updateHousehold = mutation({
  args: { name: v.string() },
  handler: async (ctx, { name }) => {
    const user = await authComponent.getAuthUser(ctx);

    const trimmedName = name.trim();
    if (trimmedName.length < 1 || trimmedName.length > 100) {
      throw new ConvexError("Household name must be between 1 and 100 characters");
    }

    const membership = await ctx.db
      .query("householdMember")
      .withIndex("by_userId", (q) => q.eq("userId", user._id))
      .first();

    if (!membership) {
      throw new ConvexError("You don't belong to any household");
    }

    await ctx.db.patch(membership.householdId, { name: trimmedName });
  },
});
