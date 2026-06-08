import { v } from "convex/values";
import { query } from "./_generated/server";

export const getMe = query({
  args: {
    sessionToken: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    if (!args.sessionToken) return null;

    const user = await ctx.db
      .query("users")
      .withIndex("by_sessionToken", (q) => q.eq("sessionToken", args.sessionToken as string))
      .first();

    if (!user) return null;

    return {
      ...user,
      institution: user.school,
      isVerified: user.approved === true || user.verificationStatus === "approved",
    };
  },
});
