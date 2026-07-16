import { ConvexError, v } from "convex/values";
import { mutation, query } from "./_generated/server";
import type { Doc, Id } from "./_generated/dataModel";
import type { MutationCtx, QueryCtx } from "./_generated/server";

const DEFAULT_ROOM_PREVIEW = "Start a secure academic conversation.";

const getUserBySessionToken = async (
  ctx: QueryCtx | MutationCtx,
  sessionToken: string,
) => {
  return await ctx.db
    .query("users")
    .withIndex("by_sessionToken", (q) => q.eq("sessionToken", sessionToken))
    .first();
};

const requireUser = async (ctx: MutationCtx, sessionToken: string) => {
  const user = await getUserBySessionToken(ctx, sessionToken);
  if (!user) {
    throw new Error("You must be logged in to continue.");
  }
  return user;
};

const roomKeyFor = (a: Id<"users">, b: Id<"users">) => {
  return [a, b].sort().join(":");
};

const passwordHashFor = (password: string) => {
  let hash = 2166136261;
  for (let i = 0; i < password.length; i += 1) {
    hash ^= password.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return `qchat_${(hash >>> 0).toString(16)}`;
};

const publicUser = (user: Doc<"users">) => {
  const verificationStatus = user.approved === true ? "approved" : user.verificationStatus;
  const approved = user.approved === true || verificationStatus === "approved";

  return {
    _id: user._id,
    firstName: user.firstName,
    lastName: user.lastName,
    fullName: user.fullName,
    email: user.email,
    role: user.role,
    school: user.school,
    institution: user.school,
    idNumber: user.idNumber,
    bio: user.bio ?? "",
    avatarStorageId: user.avatarStorageId,
    avatarUrl: user.avatarUrl ?? "",
    sessionToken: user.sessionToken,
    verificationStatus,
    approved,
    isVerified: approved,
  };
};

const questionPreview = (body: string) => {
  const trimmed = body.trim().replace(/\s+/g, " ");
  return trimmed.length > 180 ? `${trimmed.slice(0, 177)}...` : trimmed;
};

const normalizeHashtags = (hashtags: string[]) => {
  const unique = new Set<string>();
  for (const tag of hashtags) {
    const normalized = tag.trim().replace(/^#+/, "").replace(/\s+/g, "");
    if (!normalized) continue;
    unique.add(`#${normalized.slice(0, 40)}`);
  }
  return [...unique].slice(0, 8);
};

const attachmentFields = async (
  ctx: MutationCtx,
  attachmentStorageId?: Id<"_storage">,
  attachmentName?: string,
  attachmentType?: string,
  attachmentSize?: number,
) => {
  const attachmentUrl = attachmentStorageId
    ? (await ctx.storage.getUrl(attachmentStorageId)) ?? undefined
    : undefined;

  return {
    ...(attachmentStorageId ? { attachmentStorageId } : {}),
    ...(attachmentUrl ? { attachmentUrl } : {}),
    ...(attachmentName ? { attachmentName } : {}),
    ...(attachmentType ? { attachmentType } : {}),
    ...(attachmentSize ? { attachmentSize } : {}),
  };
};

const ensureRoomMember = async (
  ctx: MutationCtx,
  roomId: Id<"chatRooms">,
  userId: Id<"users">,
  otherUserId: Id<"users">,
  now: number,
) => {
  const existingMember = await ctx.db
    .query("chatRoomMembers")
    .withIndex("by_roomId_and_userId", (q) =>
      q.eq("roomId", roomId).eq("userId", userId),
    )
    .first();

  if (existingMember) return existingMember._id;

  return await ctx.db.insert("chatRoomMembers", {
    roomId,
    userId,
    otherUserId,
    unreadCount: 0,
    lastReadAt: now,
    createdAt: now,
    updatedAt: now,
  });
};

const ensureRoomMembers = async (
  ctx: MutationCtx,
  room: Doc<"chatRooms">,
  now: number,
) => {
  const [firstUserId, secondUserId] = room.participantIds;
  if (!firstUserId || !secondUserId) return;

  await ensureRoomMember(ctx, room._id, firstUserId, secondUserId, now);
  await ensureRoomMember(ctx, room._id, secondUserId, firstUserId, now);
};

const getMembership = async (
  ctx: QueryCtx | MutationCtx,
  roomId: Id<"chatRooms">,
  userId: Id<"users">,
) => {
  return await ctx.db
    .query("chatRoomMembers")
    .withIndex("by_roomId_and_userId", (q) =>
      q.eq("roomId", roomId).eq("userId", userId),
    )
    .first();
};

export const registerUser = mutation({
  args: {
    firstName: v.string(),
    lastName: v.string(),
    email: v.string(),
    role: v.union(v.literal("student"), v.literal("lecturer")),
    school: v.string(),
    idNumber: v.string(),
    password: v.string(),
    publicKey: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const email = args.email.trim().toLowerCase();
    const existingUser = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", email))
      .first();

    if (existingUser) {
      throw new Error("An account with this email address already exists.");
    }

    const firstName = args.firstName.trim();
    const lastName = args.lastName.trim();
    const fullName = `${firstName} ${lastName}`.trim();
    const school = args.school.trim();
    const now = Date.now();
    const sessionToken = `session:${email}:${crypto.randomUUID()}`;

    const userId = await ctx.db.insert("users", {
      firstName,
      lastName,
      fullName,
      email,
      role: args.role,
      school,
      idNumber: args.idNumber.trim().toUpperCase(),
      bio: "",
      avatarUrl: "",
      passwordHash: passwordHashFor(args.password),
      sessionToken,
      verificationStatus: "unverified",
      approved: false,
      publicKey: args.publicKey,
      updatedAt: now,
    });

    const user = await ctx.db.get(userId);
    if (!user) throw new Error("Could not create user.");
    return { ...publicUser(user), messageCount: 0 };
  },
});

export const loginUser = mutation({
  args: {
    email: v.string(),
    password: v.string(),
    role: v.union(v.literal("student"), v.literal("lecturer")),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", args.email.trim().toLowerCase()))
      .first();

    if (!user) {
      throw new ConvexError("EMAIL_NOT_FOUND");
    }

    if (user.role !== args.role) {
      throw new ConvexError("WRONG_ROLE");
    }

    if (user.passwordHash !== passwordHashFor(args.password)) {
      throw new ConvexError("INVALID_PASSWORD");
    }

    const sessionToken = `session:${user.email}:${crypto.randomUUID()}`;
    await ctx.db.patch(user._id, {
      sessionToken,
      updatedAt: Date.now(),
    });

    return publicUser({ ...user, sessionToken });
  },
});

export const resetPasswordWithIdentity = mutation({
  args: {
    email: v.string(),
    idNumber: v.string(),
    password: v.string(),
  },
  handler: async (ctx, args) => {
    const email = args.email.trim().toLowerCase();
    const user = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", email))
      .first();

    if (!user) {
      throw new ConvexError("EMAIL_NOT_FOUND");
    }

    const submittedIdNumber = args.idNumber.trim().toUpperCase();
    const accountIdNumber = (user.idNumber ?? "").trim().toUpperCase();
    if (!submittedIdNumber || submittedIdNumber !== accountIdNumber) {
      throw new ConvexError("INDEX_MISMATCH");
    }

    if (args.password.length < 8) {
      throw new ConvexError("PASSWORD_TOO_SHORT");
    }

    await ctx.db.patch(user._id, {
      passwordHash: passwordHashFor(args.password),
      updatedAt: Date.now(),
    });

    return { ok: true };
  },
});

export const generateUploadUrl = mutation({
  args: {},
  handler: async (ctx) => {
    return await ctx.storage.generateUploadUrl();
  },
});

export const getExploreUsers = query({
  args: {
    sessionToken: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const currentUser = args.sessionToken
      ? await getUserBySessionToken(ctx, args.sessionToken)
      : null;

    const users = await ctx.db.query("users").order("desc").take(100);
    return users
      .filter((user) => user._id !== currentUser?._id)
      .map((user) => ({
        _id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        fullName: user.fullName,
        email: user.email,
        role: user.role,
        school: user.school,
        institution: user.school,
        bio: user.bio ?? "",
        avatarUrl: user.avatarUrl ?? "",
        verificationStatus: user.approved === true ? "approved" : user.verificationStatus,
        isVerified: user.approved === true || user.verificationStatus === "approved",
      }))
      .sort((a, b) => a.fullName.localeCompare(b.fullName));
  },
});

export const getOrCreateRoom = mutation({
  args: {
    sessionToken: v.string(),
    targetUserId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const currentUser = await requireUser(ctx, args.sessionToken);

    if (currentUser._id === args.targetUserId) {
      throw new Error("You cannot create a chat room with yourself.");
    }

    const targetUser = await ctx.db.get(args.targetUserId);
    if (!targetUser) {
      throw new Error("The selected user no longer exists.");
    }

    const participantKey = roomKeyFor(currentUser._id, targetUser._id);
    const existingRoom = await ctx.db
      .query("chatRooms")
      .withIndex("by_participantKey", (q) => q.eq("participantKey", participantKey))
      .first();

    const now = Date.now();
    if (existingRoom) {
      await ensureRoomMembers(ctx, existingRoom, now);
      return { roomId: existingRoom._id };
    }

    const roomId = await ctx.db.insert("chatRooms", {
      participantIds: [currentUser._id, targetUser._id],
      participantKey,
      title: `${currentUser.fullName}, ${targetUser.fullName}`,
      lastMessageText: DEFAULT_ROOM_PREVIEW,
      lastMessageAt: now,
      createdAt: now,
      updatedAt: now,
    });

    await ensureRoomMember(ctx, roomId, currentUser._id, targetUser._id, now);
    await ensureRoomMember(ctx, roomId, targetUser._id, currentUser._id, now);

    return { roomId };
  },
});

export const getRooms = query({
  args: {
    sessionToken: v.string(),
  },
  handler: async (ctx, args) => {
    const currentUser = await getUserBySessionToken(ctx, args.sessionToken);
    if (!currentUser) return [];

    const memberships = await ctx.db
      .query("chatRoomMembers")
      .withIndex("by_userId_and_updatedAt", (q) => q.eq("userId", currentUser._id))
      .order("desc")
      .take(50);

    const rooms = [];
    for (const member of memberships) {
      const room = await ctx.db.get(member.roomId);
      const otherUser = await ctx.db.get(member.otherUserId);
      if (!room || !otherUser) continue;

      rooms.push({
        _id: room._id,
        otherUser: publicUser(otherUser),
        preview: room.lastMessageText ?? DEFAULT_ROOM_PREVIEW,
        lastMessageAt: room.lastMessageAt ?? room.createdAt,
        unread: member.unreadCount,
      });
    }

    return rooms;
  },
});

export const getMessages = query({
  args: {
    sessionToken: v.string(),
    roomId: v.id("chatRooms"),
  },
  handler: async (ctx, args) => {
    const currentUser = await getUserBySessionToken(ctx, args.sessionToken);
    if (!currentUser) return [];

    const membership = await getMembership(ctx, args.roomId, currentUser._id);
    if (!membership) return [];

    const messages = await ctx.db
      .query("messages")
      .withIndex("by_roomId_and_createdAt", (q) => q.eq("roomId", args.roomId))
      .order("asc")
      .take(100);

    return messages
      .filter((message) => !message.deletedAt)
      .map((message) => ({
        _id: message._id,
        text: message.text,
        createdAt: message.createdAt,
        senderId: message.senderId,
        isMine: message.senderId === currentUser._id,
        readBy: message.readBy,
        attachmentUrl: message.attachmentUrl,
        attachmentName: message.attachmentName,
        attachmentType: message.attachmentType,
        attachmentSize: message.attachmentSize,
        editedAt: message.editedAt,
        blockchainTxHash: message.blockchainTxHash,
      }));
  },
});

export const getQuestions = query({
  args: {
    sessionToken: v.optional(v.string()),
  },
  handler: async (ctx) => {
    const questions = await ctx.db
      .query("questions")
      .withIndex("by_createdAt")
      .order("desc")
      .take(75);

    const rows = [];
    for (const question of questions) {
      const author = await ctx.db.get(question.authorId);
      if (!author) continue;

      rows.push({
        _id: question._id,
        title: question.title,
        preview: questionPreview(question.body),
        hashtags: question.hashtags,
        author: publicUser(author),
        date: question.createdAt,
        answerCount: question.answerCount,
        answered: question.answered,
        attachmentName: question.attachmentName,
        attachmentType: question.attachmentType,
        attachmentSize: question.attachmentSize,
      });
    }

    return rows;
  },
});

export const getQuestionThread = query({
  args: {
    sessionToken: v.string(),
    questionId: v.id("questions"),
  },
  handler: async (ctx, args) => {
    const currentUser = await getUserBySessionToken(ctx, args.sessionToken);
    if (!currentUser) return null;

    const question = await ctx.db.get(args.questionId);
    if (!question) return null;

    const author = await ctx.db.get(question.authorId);
    if (!author) return null;

    const answers = await ctx.db
      .query("answers")
      .withIndex("by_questionId_and_createdAt", (q) => q.eq("questionId", args.questionId))
      .order("asc")
      .take(150);

    const renderedAnswers = [];
    for (const answer of answers) {
      const answerAuthor = await ctx.db.get(answer.authorId);
      if (!answerAuthor) continue;
      renderedAnswers.push({
        _id: answer._id,
        body: answer.body,
        author: publicUser(answerAuthor),
        createdAt: answer.createdAt,
        isMine: answer.authorId === currentUser._id,
        attachmentUrl: answer.attachmentUrl,
        attachmentName: answer.attachmentName,
        attachmentType: answer.attachmentType,
        attachmentSize: answer.attachmentSize,
      });
    }

    return {
      question: {
        _id: question._id,
        title: question.title,
        body: question.body,
        hashtags: question.hashtags,
        author: publicUser(author),
        createdAt: question.createdAt,
        updatedAt: question.updatedAt,
        answered: question.answered,
        answerCount: question.answerCount,
        isMine: question.authorId === currentUser._id,
        attachmentUrl: question.attachmentUrl,
        attachmentName: question.attachmentName,
        attachmentType: question.attachmentType,
        attachmentSize: question.attachmentSize,
      },
      answers: renderedAnswers,
    };
  },
});

export const getNotifications = query({
  args: {
    sessionToken: v.string(),
  },
  handler: async (ctx, args) => {
    const currentUser = await getUserBySessionToken(ctx, args.sessionToken);
    if (!currentUser) return [];

    const notifications = await ctx.db
      .query("notifications")
      .withIndex("by_userId_and_createdAt", (q) => q.eq("userId", currentUser._id))
      .order("desc")
      .take(25);

    const rows = [];
    for (const notification of notifications) {
      const actor = await ctx.db.get(notification.actorId);
      rows.push({
        _id: notification._id,
        type: notification.type,
        title: notification.title,
        body: notification.body,
        read: notification.read,
        createdAt: notification.createdAt,
        questionId: notification.questionId,
        actorName: actor?.fullName ?? "Someone",
      });
    }

    return rows;
  },
});

export const sendMessage = mutation({
  args: {
    sessionToken: v.string(),
    roomId: v.id("chatRooms"),
    text: v.string(),
    attachmentStorageId: v.optional(v.id("_storage")),
    attachmentName: v.optional(v.string()),
    attachmentType: v.optional(v.string()),
    attachmentSize: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const currentUser = await requireUser(ctx, args.sessionToken);
    const room = await ctx.db.get(args.roomId);
    const membership = await getMembership(ctx, args.roomId, currentUser._id);
    if (!room || !membership) {
      throw new Error("You do not have access to this room.");
    }

    const text = args.text.trim();
    if (!text && !args.attachmentStorageId) {
      throw new Error("Message cannot be empty.");
    }

    const attachmentUrl = args.attachmentStorageId
      ? (await ctx.storage.getUrl(args.attachmentStorageId)) ?? undefined
      : undefined;
    const createdAt = Date.now();
    const preview = text || (args.attachmentName ? `Sent ${args.attachmentName}` : "Sent an attachment");
    const messageId = await ctx.db.insert("messages", {
      roomId: args.roomId,
      senderId: currentUser._id,
      text,
      ...(args.attachmentStorageId ? { attachmentStorageId: args.attachmentStorageId } : {}),
      ...(attachmentUrl ? { attachmentUrl } : {}),
      ...(args.attachmentName ? { attachmentName: args.attachmentName } : {}),
      ...(args.attachmentType ? { attachmentType: args.attachmentType } : {}),
      ...(args.attachmentSize ? { attachmentSize: args.attachmentSize } : {}),
      readBy: [currentUser._id],
      createdAt,
    });

    await ctx.db.patch(args.roomId, {
      lastMessageText: preview,
      lastMessageAt: createdAt,
      updatedAt: createdAt,
    });

    for (const participantId of room.participantIds) {
      const participantMember = await getMembership(ctx, args.roomId, participantId);
      if (!participantMember) continue;

      await ctx.db.patch(participantMember._id, {
        unreadCount:
          participantId === currentUser._id
            ? 0
            : participantMember.unreadCount + 1,
        updatedAt: createdAt,
      });
    }

    return { messageId };
  },
});

export const askQuestion = mutation({
  args: {
    sessionToken: v.string(),
    title: v.string(),
    body: v.string(),
    hashtags: v.array(v.string()),
    attachmentStorageId: v.optional(v.id("_storage")),
    attachmentName: v.optional(v.string()),
    attachmentType: v.optional(v.string()),
    attachmentSize: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const currentUser = await requireUser(ctx, args.sessionToken);
    const title = args.title.trim().replace(/\s+/g, " ");
    const body = args.body.trim();
    if (title.length < 6) {
      throw new Error("Question title must be at least 6 characters.");
    }
    if (body.length < 12) {
      throw new Error("Question details must be at least 12 characters.");
    }

    const now = Date.now();
    const questionId = await ctx.db.insert("questions", {
      authorId: currentUser._id,
      title,
      body,
      hashtags: normalizeHashtags(args.hashtags),
      ...(await attachmentFields(
        ctx,
        args.attachmentStorageId,
        args.attachmentName,
        args.attachmentType,
        args.attachmentSize,
      )),
      answerCount: 0,
      answered: false,
      createdAt: now,
      updatedAt: now,
    });

    return { questionId };
  },
});

export const addAnswer = mutation({
  args: {
    sessionToken: v.string(),
    questionId: v.id("questions"),
    body: v.string(),
    attachmentStorageId: v.optional(v.id("_storage")),
    attachmentName: v.optional(v.string()),
    attachmentType: v.optional(v.string()),
    attachmentSize: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const currentUser = await requireUser(ctx, args.sessionToken);
    const question = await ctx.db.get(args.questionId);
    if (!question) {
      throw new Error("Question not found.");
    }

    const body = args.body.trim();
    if (!body && !args.attachmentStorageId) {
      throw new Error("Reply cannot be empty.");
    }

    const now = Date.now();
    const answerId = await ctx.db.insert("answers", {
      questionId: args.questionId,
      authorId: currentUser._id,
      body,
      ...(await attachmentFields(
        ctx,
        args.attachmentStorageId,
        args.attachmentName,
        args.attachmentType,
        args.attachmentSize,
      )),
      createdAt: now,
    });

    await ctx.db.patch(args.questionId, {
      answerCount: question.answerCount + 1,
      updatedAt: now,
    });

    if (question.authorId !== currentUser._id) {
      await ctx.db.insert("notifications", {
        userId: question.authorId,
        actorId: currentUser._id,
        questionId: args.questionId,
        answerId,
        type: "question_reply",
        title: "New answer on your question",
        body: `${currentUser.fullName} replied to "${question.title}"`,
        read: false,
        createdAt: now,
      });
    }

    return { answerId };
  },
});

export const markQuestionAnswered = mutation({
  args: {
    sessionToken: v.string(),
    questionId: v.id("questions"),
  },
  handler: async (ctx, args) => {
    const currentUser = await requireUser(ctx, args.sessionToken);
    const question = await ctx.db.get(args.questionId);
    if (!question) {
      throw new Error("Question not found.");
    }
    if (question.authorId !== currentUser._id) {
      throw new Error("Only the original poster can mark this answered.");
    }

    await ctx.db.patch(args.questionId, {
      answered: true,
      updatedAt: Date.now(),
    });

    return { ok: true };
  },
});

export const getUnreadCount = query({
  args: {
    sessionToken: v.string(),
    roomId: v.id("chatRooms"),
  },
  handler: async (ctx, args) => {
    const currentUser = await getUserBySessionToken(ctx, args.sessionToken);
    if (!currentUser) return 0;

    const membership = await getMembership(ctx, args.roomId, currentUser._id);
    return membership?.unreadCount ?? 0;
  },
});

export const markAsRead = mutation({
  args: {
    sessionToken: v.string(),
    roomId: v.id("chatRooms"),
  },
  handler: async (ctx, args) => {
    const currentUser = await requireUser(ctx, args.sessionToken);
    const membership = await getMembership(ctx, args.roomId, currentUser._id);
    if (!membership) {
      throw new Error("You do not have access to this room.");
    }

    const now = Date.now();
    await ctx.db.patch(membership._id, {
      unreadCount: 0,
      lastReadAt: now,
      updatedAt: now,
    });

    return { updated: true };
  },
});

export const updateProfile = mutation({
  args: {
    sessionToken: v.string(),
    fullName: v.string(),
    bio: v.optional(v.string()),
    school: v.string(),
    avatarStorageId: v.optional(v.id("_storage")),
  },
  handler: async (ctx, args) => {
    const currentUser = await requireUser(ctx, args.sessionToken);
    const cleanedName = args.fullName.trim().replace(/\s+/g, " ");
    if (!cleanedName) {
      throw new Error("Full name is required.");
    }

    const [firstName, ...remainingName] = cleanedName.split(" ");
    const lastName = remainingName.join(" ") || currentUser.lastName;
    const avatarUrl = args.avatarStorageId
      ? (await ctx.storage.getUrl(args.avatarStorageId)) ?? undefined
      : undefined;

    await ctx.db.patch(currentUser._id, {
      firstName,
      lastName,
      fullName: cleanedName,
      bio: args.bio?.trim() ?? "",
      school: args.school.trim(),
      ...(args.avatarStorageId ? { avatarStorageId: args.avatarStorageId } : {}),
      ...(avatarUrl ? { avatarUrl } : {}),
      updatedAt: Date.now(),
    });

    return { ok: true };
  },
});

export const submitAcademicVerification = mutation({
  args: {
    sessionToken: v.string(),
    storageId: v.id("_storage"),
    school: v.string(),
    idNumber: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const currentUser = await requireUser(ctx, args.sessionToken);
    const evidenceUrl = (await ctx.storage.getUrl(args.storageId)) ?? undefined;
    const now = Date.now();

    await ctx.db.insert("verificationRequests", {
      userId: currentUser._id,
      school: args.school,
      ...(args.idNumber ? { idNumber: args.idNumber } : {}),
      evidenceStorageId: args.storageId,
      ...(evidenceUrl ? { evidenceUrl } : {}),
      approved: false,
      status: "pending",
      submittedAt: now,
    });

    await ctx.db.patch(currentUser._id, {
      school: args.school,
      ...(args.idNumber ? { idNumber: args.idNumber } : {}),
      verificationStatus: "pending",
      approved: false,
      verificationEvidenceStorageId: args.storageId,
      ...(evidenceUrl ? { verificationEvidenceUrl: evidenceUrl } : {}),
      verificationSubmittedAt: now,
      updatedAt: now,
    });

    return { ok: true, evidenceUrl };
  },
});

export const deleteMessage = mutation({
  args: {
    sessionToken: v.string(),
    messageId: v.id("messages"),
  },
  handler: async (ctx, args) => {
    const currentUser = await requireUser(ctx, args.sessionToken);
    const message = await ctx.db.get(args.messageId);
    if (!message) {
      throw new Error("Message not found.");
    }
    if (message.senderId !== currentUser._id) {
      throw new Error("You can only delete your own messages.");
    }
    await ctx.db.patch(args.messageId, { deletedAt: Date.now() });
    return { ok: true };
  },
});

export const editMessage = mutation({
  args: {
    sessionToken: v.string(),
    messageId: v.id("messages"),
    text: v.string(),
  },
  handler: async (ctx, args) => {
    const currentUser = await requireUser(ctx, args.sessionToken);
    const message = await ctx.db.get(args.messageId);
    if (!message) {
      throw new Error("Message not found.");
    }
    if (message.senderId !== currentUser._id) {
      throw new Error("You can only edit your own messages.");
    }
    if (message.attachmentStorageId) {
      throw new Error("File messages cannot be edited.");
    }
    const newText = args.text.trim();
    if (!newText) {
      throw new Error("Message text cannot be empty.");
    }
    await ctx.db.patch(args.messageId, {
      text: newText,
      editedAt: Date.now(),
    });
    return { ok: true };
  },
});

export const deleteAccount = mutation({
  args: {
    sessionToken: v.string(),
  },
  handler: async (ctx, args) => {
    const currentUser = await requireUser(ctx, args.sessionToken);
    await ctx.db.delete(currentUser._id);
    return { ok: true };
  },
});

export const updateMessageTxHash = mutation({
  args: {
    sessionToken: v.string(),
    messageId: v.id("messages"),
    txHash: v.string(),
  },
  handler: async (ctx, args) => {
    const currentUser = await requireUser(ctx, args.sessionToken);
    const message = await ctx.db.get(args.messageId);
    if (!message) {
      throw new Error("Message not found.");
    }
    if (message.senderId !== currentUser._id) {
      throw new Error("You can only update your own messages.");
    }
    await ctx.db.patch(args.messageId, {
      blockchainTxHash: args.txHash,
    });
    return { ok: true };
  },
});
