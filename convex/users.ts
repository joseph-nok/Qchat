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

    const verificationStatus = user.approved === true ? "approved" : user.verificationStatus;

    return {
      ...user,
      institution: user.school,
      verificationStatus,
      isVerified: user.approved === true || verificationStatus === "approved",
    };
  },
});
