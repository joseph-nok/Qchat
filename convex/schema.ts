import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  users: defineTable({
    firstName: v.string(),
    lastName: v.string(),
    fullName: v.string(),
    email: v.string(),
    role: v.union(v.literal("student"), v.literal("lecturer")),
    school: v.string(),
    idNumber: v.optional(v.string()),
    bio: v.optional(v.string()),
    avatarStorageId: v.optional(v.id("_storage")),
    avatarUrl: v.optional(v.string()),
    passwordHash: v.string(),
    sessionToken: v.string(),
    verificationStatus: v.union(
      v.literal("unverified"),
      v.literal("pending"),
      v.literal("approved"),
    ),
    approved: v.optional(v.boolean()),
    verificationEvidenceStorageId: v.optional(v.id("_storage")),
    verificationEvidenceUrl: v.optional(v.string()),
    verificationSubmittedAt: v.optional(v.number()),
    publicKey: v.optional(v.string()),
    updatedAt: v.number(),
  })
    .index("by_email", ["email"])
    .index("by_sessionToken", ["sessionToken"])
    .index("by_school", ["school"])
    .index("by_verificationStatus", ["verificationStatus"]),

  chatRooms: defineTable({
    participantIds: v.array(v.id("users")),
    participantKey: v.string(),
    title: v.optional(v.string()),
    lastMessageText: v.optional(v.string()),
    lastMessageAt: v.optional(v.number()),
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("by_participantKey", ["participantKey"]),

  chatRoomMembers: defineTable({
    roomId: v.id("chatRooms"),
    userId: v.id("users"),
    otherUserId: v.id("users"),
    unreadCount: v.number(),
    lastReadAt: v.optional(v.number()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_userId_and_updatedAt", ["userId", "updatedAt"])
    .index("by_roomId_and_userId", ["roomId", "userId"]),

  messages: defineTable({
    roomId: v.id("chatRooms"),
    senderId: v.id("users"),
    text: v.string(),
    attachmentStorageId: v.optional(v.id("_storage")),
    attachmentUrl: v.optional(v.string()),
    attachmentName: v.optional(v.string()),
    attachmentType: v.optional(v.string()),
    attachmentSize: v.optional(v.number()),
    readBy: v.array(v.id("users")),
    createdAt: v.number(),
    editedAt: v.optional(v.number()),
    deletedAt: v.optional(v.number()),
  })
    .index("by_roomId_and_createdAt", ["roomId", "createdAt"])
    .index("by_senderId", ["senderId"]),

  questions: defineTable({
    authorId: v.id("users"),
    title: v.string(),
    body: v.string(),
    hashtags: v.array(v.string()),
    attachmentStorageId: v.optional(v.id("_storage")),
    attachmentUrl: v.optional(v.string()),
    attachmentName: v.optional(v.string()),
    attachmentType: v.optional(v.string()),
    attachmentSize: v.optional(v.number()),
    answerCount: v.number(),
    answered: v.boolean(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_createdAt", ["createdAt"])
    .index("by_authorId_and_createdAt", ["authorId", "createdAt"]),

  answers: defineTable({
    questionId: v.id("questions"),
    authorId: v.id("users"),
    body: v.string(),
    attachmentStorageId: v.optional(v.id("_storage")),
    attachmentUrl: v.optional(v.string()),
    attachmentName: v.optional(v.string()),
    attachmentType: v.optional(v.string()),
    attachmentSize: v.optional(v.number()),
    createdAt: v.number(),
  })
    .index("by_questionId_and_createdAt", ["questionId", "createdAt"])
    .index("by_authorId_and_createdAt", ["authorId", "createdAt"]),

  notifications: defineTable({
    userId: v.id("users"),
    actorId: v.id("users"),
    questionId: v.id("questions"),
    answerId: v.optional(v.id("answers")),
    type: v.union(v.literal("question_reply")),
    title: v.string(),
    body: v.string(),
    read: v.boolean(),
    createdAt: v.number(),
  })
    .index("by_userId_and_createdAt", ["userId", "createdAt"])
    .index("by_userId_and_read_and_createdAt", ["userId", "read", "createdAt"]),

  verificationRequests: defineTable({
    userId: v.id("users"),
    school: v.string(),
    idNumber: v.optional(v.string()),
    evidenceStorageId: v.optional(v.id("_storage")),
    evidenceUrl: v.optional(v.string()),
    approved: v.boolean(),
    status: v.union(v.literal("pending"), v.literal("approved"), v.literal("rejected")),
    submittedAt: v.number(),
    reviewedAt: v.optional(v.number()),
  }).index("by_userId", ["userId"]),
});
