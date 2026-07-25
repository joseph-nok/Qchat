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
