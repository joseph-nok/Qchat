import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// Existing query – left unchanged
export const getMe = query({
  args: {
    sessionToken: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    if (!args.sessionToken) return null;

    const user = await ctx.db
      .query("users")
      .withIndex("by_sessionToken", (q) =>
        q.eq("sessionToken", args.sessionToken as string),
      )
      .first();

    if (!user) return null;

    const verificationStatus =
      user.approved === true ? "approved" : user.verificationStatus;

    return {
      ...user,
      institution: user.school,
      verificationStatus,
      isVerified: user.approved === true || verificationStatus === "approved",
    };
  },
});

// 1. Fetch a user by their Convex document ID
export const getById = query({
  args: { id: v.id("users") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

// 2. Store the Web Crypto public key + hasKeypair flag
export const updateProfileKeys = mutation({
  args: {
    id: v.id("users"),
    publicKey: v.string(),
    hasKeypair: v.boolean(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, {
      publicKey: args.publicKey,
      hasKeypair: args.hasKeypair,
    });

    console.log(
      `🔒 Secure identity parameters successfully bound to user: ${args.id}`,
    );
  },
});

// 3. Lookup user by Email
export const getByEmail = query({
  args: { email: v.string() },
  handler: async (ctx, args) => {
    const cleanEmail = args.email.trim().toLowerCase();
    return await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", cleanEmail))
      .first();
  },
});

// 4. Lookup student user by Index Number (e.g. UEB3509022)
export const getByIndexNumber = query({
  args: { indexNumber: v.string() },
  handler: async (ctx, args) => {
    const cleanIndex = args.indexNumber.trim().toUpperCase();
    const byIndex = await ctx.db
      .query("users")
      .withIndex("by_indexNumber", (q) => q.eq("indexNumber", cleanIndex))
      .first();

    if (byIndex) return byIndex;

    // Fallback: search by idNumber
    return await ctx.db
      .query("users")
      .withIndex("by_idNumber", (q) => q.eq("idNumber", cleanIndex))
      .first();
  },
});

// 5. Lookup lecturer user by Staff ID (e.g. PS001, PS123)
export const getByStaffId = query({
  args: { staffId: v.string() },
  handler: async (ctx, args) => {
    const cleanStaffId = args.staffId.trim().toUpperCase();
    const byStaff = await ctx.db
      .query("users")
      .withIndex("by_staffId", (q) => q.eq("staffId", cleanStaffId))
      .first();

    if (byStaff) return byStaff;

    // Fallback: search by idNumber
    return await ctx.db
      .query("users")
      .withIndex("by_idNumber", (q) => q.eq("idNumber", cleanStaffId))
      .first();
  },
});

// 6. Generic lookup by ID Number (student index or lecturer staffId)
export const getByIdNumber = query({
  args: { idNumber: v.string() },
  handler: async (ctx, args) => {
    const cleanId = args.idNumber.trim().toUpperCase();
    return await ctx.db
      .query("users")
      .withIndex("by_idNumber", (q) => q.eq("idNumber", cleanId))
      .first();
  },
});
