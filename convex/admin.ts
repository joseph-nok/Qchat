import { ConvexError, v } from "convex/values";
import { mutation, query } from "./_generated/server";
import type { Doc } from "./_generated/dataModel";
import type { MutationCtx, QueryCtx } from "./_generated/server";

const passwordHashFor = (password: string) => {
  let hash = 2166136261;
  for (let i = 0; i < password.length; i += 1) {
    hash ^= password.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return `qchat_${(hash >>> 0).toString(16)}`;
};

const getAdminBySessionToken = async (ctx: QueryCtx | MutationCtx, sessionToken: string) =>
  await ctx.db
    .query("admins")
    .withIndex("by_sessionToken", (q) => q.eq("sessionToken", sessionToken))
    .first();

const requireAdmin = async (ctx: MutationCtx | QueryCtx, sessionToken: string) => {
  const admin = await getAdminBySessionToken(ctx, sessionToken);
  if (!admin) throw new ConvexError("ADMIN_AUTH_REQUIRED");
  return admin;
};

export const login = mutation({
  args: { email: v.string(), password: v.string() },
  handler: async (ctx, args) => {
    const admin = await ctx.db
      .query("admins")
      .withIndex("by_email", (q) => q.eq("email", args.email.trim().toLowerCase()))
      .first();

    if (!admin) throw new ConvexError("ADMIN_NOT_FOUND");
    if (admin.passwordHash !== passwordHashFor(args.password)) {
      throw new ConvexError("INVALID_ADMIN_PASSWORD");
    }

    const sessionToken = `admin-session:${admin.email}:${crypto.randomUUID()}`;
    await ctx.db.patch(admin._id, { sessionToken, updatedAt: Date.now() });
    return { sessionToken, displayName: admin.displayName, email: admin.email };
  },
});

export const getMe = query({
  args: { sessionToken: v.optional(v.string()) },
  handler: async (ctx, args) => {
    if (!args.sessionToken) return null;
    const admin = await getAdminBySessionToken(ctx, args.sessionToken);
    return admin ? { displayName: admin.displayName, email: admin.email } : null;
  },
});

export const getVerificationRequests = query({
  args: { sessionToken: v.string() },
  handler: async (ctx, args) => {
    await requireAdmin(ctx, args.sessionToken);
    const requests = await ctx.db.query("verificationRequests").order("desc").collect();
    const result = [];

    for (const request of requests) {
      const user = await ctx.db.get(request.userId);
      if (!user) continue;
      result.push({
        requestId: request._id,
        userId: user._id,
        fullName: user.fullName,
        email: user.email,
        role: user.role,
        school: request.school,
        idNumber: request.idNumber,
        avatarUrl: user.avatarUrl ?? "",
        evidenceUrl: request.evidenceUrl ?? user.verificationEvidenceUrl ?? "",
        verificationStatus: request.status,
        verificationSubmittedAt: request.submittedAt,
      });
    }

    return result;
  },
});

export const reviewVerificationRequest = mutation({
  args: {
    sessionToken: v.string(),
    requestId: v.id("verificationRequests"),
    status: v.union(v.literal("approved"), v.literal("rejected")),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx, args.sessionToken);
    const request = await ctx.db.get(args.requestId);
    if (!request) throw new ConvexError("VERIFICATION_REQUEST_NOT_FOUND");

    const now = Date.now();
    const approved = args.status === "approved";
    await ctx.db.patch(request._id, { status: args.status, approved, reviewedAt: now });
    await ctx.db.patch(request.userId, {
      verificationStatus: approved ? "approved" : "unverified",
      approved,
      updatedAt: now,
    });

    return { ok: true };
  },
});
