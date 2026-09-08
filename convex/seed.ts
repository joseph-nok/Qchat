import { mutation } from "./_generated/server";
import type { Id } from "./_generated/dataModel";

const passwordHashFor = (password: string) => {
  let hash = 2166136261;
  for (let i = 0; i < password.length; i += 1) {
    hash ^= password.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return `qchat_${(hash >>> 0).toString(16)}`;
};

const now = () => Date.now();

const testUsers = [
  {
    firstName: "Osei Nana",
    lastName: "Kwaku",
    fullName: "Osei Nana Kwaku",
    email: "osei@uenr.edu.gh",
    role: "student" as const,
    school: "University of Energy and Natural Resources (UENR)",
    idNumber: "UEB3509022",
    indexNumber: "UEB3509022",
    walletAddress: "0xf789Beaa2ee7cB2c5Af877C38A18e1acD7550a05",
    bio: "Level 400 Computer Science student. Submitted cryptography & security assignment.",
    avatarUrl: "",
    passwordHash: "qchat_a9e63a98",
    sessionToken: "demo:osei@uenr.edu.gh",
    verificationStatus: "approved" as const,
    approved: true,
  },
  {
    firstName: "Peter",
    lastName: "Nimbe",
    fullName: "Dr. Peter Nimbe",
    email: "peter.nimbe@uenr.edu.gh",
    role: "lecturer" as const,
    school: "University of Energy and Natural Resources (UENR)",
    idNumber: "PS001",
    staffId: "PS001",
    walletAddress: "0xabcd1234ef567890123456789012345678901234",
    bio: "Head of Computer Science & Informatics. Reviewer for academic submissions.",
    avatarUrl: "",
    passwordHash: "qchat_a9e63a98",
    sessionToken: "demo:peter.nimbe@uenr.edu.gh",
    verificationStatus: "approved" as const,
    approved: true,
  },
  {
    firstName: "Kwame",
    lastName: "Mensah",
    fullName: "Kwame Mensah",
    email: "kwame.mensah@uenr.edu.gh",
    role: "student" as const,
    school: "University of Energy and Natural Resources (UENR)",
    idNumber: "UEB1234567",
    indexNumber: "UEB1234567",
    walletAddress: "0x1111222233334444555566667777888899990000",
    bio: "Computer science student focused on secure academic credential exchange.",
    avatarUrl: "",
    passwordHash: "qchat_a9e63a98",
    sessionToken: "demo:kwame.mensah@uenr.edu.gh",
    verificationStatus: "pending" as const,
    approved: false,
  },
  {
    firstName: "Abena",
    lastName: "Ansah",
    fullName: "Prof. Abena Ansah",
    email: "abena.ansah@ug.edu.gh",
    role: "lecturer" as const,
    school: "University of Ghana",
    idNumber: "PS002",
    staffId: "PS002",
    walletAddress: "0x9999888877776666555544443333222211110000",
    bio: "Lecturer and registrar reviewer for postgraduate engineering credentials.",
    avatarUrl: "",
    passwordHash: "qchat_a9e63a98",
    sessionToken: "demo:abena.ansah@ug.edu.gh",
    verificationStatus: "approved" as const,
    approved: true,
  },
  {
    firstName: "Kofi",
    lastName: "Owusu",
    fullName: "Dr. Kofi Owusu",
    email: "kofi.owusu@knust.edu.gh",
    role: "lecturer" as const,
    school: "KNUST",
    idNumber: "PS003",
    staffId: "PS003",
    walletAddress: "0x5555444433332222111100009999888877776666",
    bio: "Academic advisor coordinating scholarship and fellowship document reviews.",
    avatarUrl: "",
    passwordHash: "qchat_a9e63a98",
    sessionToken: "demo:kofi.owusu@knust.edu.gh",
    verificationStatus: "approved" as const,
    approved: true,
  },
  {
    firstName: "Esi",
    lastName: "Boateng",
    fullName: "Esi Boateng",
    email: "esi.boateng@ug.edu.gh",
    role: "student" as const,
    school: "University of Ghana",
    idNumber: "UEB8899001",
    indexNumber: "UEB8899001",
    bio: "Undergraduate researcher preparing institutional profile verification.",
    avatarUrl: "",
    passwordHash: "qchat_a9e63a98",
    sessionToken: "demo:esi.boateng@ug.edu.gh",
    verificationStatus: "pending" as const,
    approved: false,
  },
];

const reviewStatusFor = (approved: boolean): "approved" | "pending" | "rejected" =>
  approved ? "approved" : "pending";

export const run = mutation({
  args: {},
  handler: async (ctx) => {
    const timestamp = now();
    const adminEmail = "admin@qchat.local";
    const existingAdmin = await ctx.db
      .query("admins")
      .withIndex("by_email", (q) => q.eq("email", adminEmail))
      .first();
    if (existingAdmin) {
      await ctx.db.patch(existingAdmin._id, {
        displayName: "Qchat Administrator",
        passwordHash: passwordHashFor("Admin@12345"),
        updatedAt: timestamp,
      });
    } else {
      await ctx.db.insert("admins", {
        email: adminEmail,
        displayName: "Qchat Administrator",
        passwordHash: passwordHashFor("Admin@12345"),
        sessionToken: `admin-seed:${crypto.randomUUID()}`,
        createdAt: timestamp,
        updatedAt: timestamp,
      });
    }
    const userIds = [];
    let usersInserted = 0;
    let usersUpdated = 0;
    let requestsInserted = 0;
    let requestsUpdated = 0;

    for (const user of testUsers) {
      const existingUser = await ctx.db
        .query("users")
        .withIndex("by_email", (q) => q.eq("email", user.email))
        .first();

      if (existingUser) {
        await ctx.db.patch(existingUser._id, {
          ...user,
          updatedAt: timestamp,
        });
        userIds.push(existingUser._id);
        usersUpdated += 1;
      } else {
        const userId = await ctx.db.insert("users", {
          ...user,
          updatedAt: timestamp,
        });
        userIds.push(userId);
        usersInserted += 1;
      }
    }

    for (const [index, userId] of userIds.entries()) {
      const user = testUsers[index];
      const submittedAt = timestamp - (index + 1) * 1000 * 60 * 60 * 3;
      const evidenceUrl =
        `https://qchat-demo.local/verification/${user.email.replaceAll("@", "-at-")}.pdf`;

      const existingRequest = await ctx.db
        .query("verificationRequests")
        .withIndex("by_userId", (q) => q.eq("userId", userId))
        .first();

      const requestPatch = {
        userId,
        school: user.school,
        idNumber: user.idNumber,
        evidenceUrl,
        approved: user.approved,
        status: reviewStatusFor(user.approved),
        submittedAt,
        ...(user.approved ? { reviewedAt: submittedAt + 1000 * 60 * 40 } : {}),
      };

      if (existingRequest) {
        await ctx.db.patch(existingRequest._id, requestPatch);
        requestsUpdated += 1;
      } else {
        await ctx.db.insert("verificationRequests", requestPatch);
        requestsInserted += 1;
      }
    }

    const [oseiId, peterId, kwameId, abenaId, kofiId] = userIds;
    if (!oseiId || !peterId || !kwameId || !abenaId || !kofiId) {
      throw new Error("Seed users were not created correctly.");
    }

    let roomsInserted = 0;
    let messagesInserted = 0;

    const ensureRoomMember = async (
      roomId: Id<"chatRooms">,
      userId: Id<"users">,
      otherUserId: Id<"users">,
      unreadCount: number,
      updatedAt: number,
    ) => {
      const existingMember = await ctx.db
        .query("chatRoomMembers")
        .withIndex("by_roomId_and_userId", (q) =>
          q.eq("roomId", roomId).eq("userId", userId),
        )
        .first();

      if (existingMember) {
        await ctx.db.patch(existingMember._id, {
          otherUserId,
          unreadCount,
          updatedAt,
        });
        return;
      }

      await ctx.db.insert("chatRoomMembers", {
        roomId,
        userId,
        otherUserId,
        unreadCount,
        lastReadAt: updatedAt,
        createdAt: updatedAt,
        updatedAt,
      });
    };

    // Room 0: Osei Nana Kwaku & Dr. Peter Nimbe
    const roomZeroKey = [oseiId, peterId].sort().join(":");
    const existingRoomZero = await ctx.db
      .query("chatRooms")
      .withIndex("by_participantKey", (q) => q.eq("participantKey", roomZeroKey))
      .first();

    if (!existingRoomZero) {
      const roomZeroCreatedAt = timestamp - 1000 * 60 * 60 * 5;
      const roomZeroId = await ctx.db.insert("chatRooms", {
        participantIds: [oseiId, peterId],
        participantKey: roomZeroKey,
        title: "Osei Nana Kwaku, Dr. Peter Nimbe",
        lastMessageText: "Submitted assignment.pdf for Cryptography & Network Security.",
        lastMessageAt: roomZeroCreatedAt + 1000 * 60 * 30,
        createdAt: roomZeroCreatedAt,
        updatedAt: roomZeroCreatedAt + 1000 * 60 * 30,
      });

      await ctx.db.insert("messages", {
        roomId: roomZeroId,
        senderId: peterId,
        text: "Hello Osei, please remember to submit your assignment.pdf before 14:30 PM today.",
        readBy: [peterId, oseiId],
        createdAt: roomZeroCreatedAt,
      });

      await ctx.db.insert("messages", {
        roomId: roomZeroId,
        senderId: oseiId,
        text: "Good afternoon Dr. Peter, here is my completed assignment submission file.",
        attachmentName: "assignment.pdf",
        attachmentType: "application/pdf",
        attachmentSize: 1048576,
        attachmentUrl: "https://qchat-demo.local/submissions/assignment.pdf",
        blockchainTxHash: "0x5c16c49d32067cc9f506a8eb2e94e76d35d0cf2c9fe1ee8bb58791248f3a91c5",
        readBy: [oseiId, peterId],
        createdAt: roomZeroCreatedAt + 1000 * 60 * 20,
      });

      await ctx.db.insert("messages", {
        roomId: roomZeroId,
        senderId: oseiId,
        text: "I have also attached the raw lab data log file as reference.",
        attachmentName: "lab_data_logs.csv",
        attachmentType: "text/csv",
        attachmentSize: 45020,
        attachmentUrl: "https://qchat-demo.local/submissions/lab_data_logs.csv",
        blockchainTxHash: "0x8a92b31f7c8d9e0a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4",
        readBy: [oseiId, peterId],
        createdAt: roomZeroCreatedAt + 1000 * 60 * 30,
      });

      await ensureRoomMember(roomZeroId, oseiId, peterId, 0, roomZeroCreatedAt + 1000 * 60 * 30);
      await ensureRoomMember(roomZeroId, peterId, oseiId, 2, roomZeroCreatedAt + 1000 * 60 * 30);
      roomsInserted += 1;
      messagesInserted += 3;
    }

    const roomOneKey = [kwameId, abenaId].sort().join(":");
    const existingRoomOne = await ctx.db
      .query("chatRooms")
      .withIndex("by_participantKey", (q) => q.eq("participantKey", roomOneKey))
      .first();

    if (!existingRoomOne) {
      const roomOneCreatedAt = timestamp - 1000 * 60 * 60;
      const roomOneId = await ctx.db.insert("chatRooms", {
        participantIds: [kwameId, abenaId],
        participantKey: roomOneKey,
        title: "Kwame Mensah, Prof. Abena Ansah",
        lastMessageText:
          "Your MSc Engineering credential has been successfully cross-verified by our registrar office.",
        lastMessageAt: roomOneCreatedAt + 1000 * 60 * 15,
        createdAt: roomOneCreatedAt,
        updatedAt: roomOneCreatedAt + 1000 * 60 * 15,
      });

      await ctx.db.insert("messages", {
        roomId: roomOneId,
        senderId: abenaId,
        text: "Good morning. I am reviewing your MSc Engineering application details.",
        readBy: [abenaId],
        createdAt: roomOneCreatedAt,
      });
      await ctx.db.insert("messages", {
        roomId: roomOneId,
        senderId: kwameId,
        text: "Thank you, Professor. Please let me know if there are any issues with my academic credentials.",
        readBy: [kwameId, abenaId],
        createdAt: roomOneCreatedAt + 1000 * 60 * 6,
      });
      await ctx.db.insert("messages", {
        roomId: roomOneId,
        senderId: abenaId,
        text: "Your MSc Engineering credential has been successfully cross-verified by our registrar office.",
        readBy: [abenaId],
        createdAt: roomOneCreatedAt + 1000 * 60 * 15,
      });
      await ensureRoomMember(roomOneId, kwameId, abenaId, 2, roomOneCreatedAt + 1000 * 60 * 15);
      await ensureRoomMember(roomOneId, abenaId, kwameId, 0, roomOneCreatedAt + 1000 * 60 * 15);
      roomsInserted += 1;
      messagesInserted += 3;
    } else {
      await ensureRoomMember(existingRoomOne._id, kwameId, abenaId, 2, timestamp);
      await ensureRoomMember(existingRoomOne._id, abenaId, kwameId, 0, timestamp);
    }

    const roomTwoKey = [kwameId, kofiId].sort().join(":");
    const existingRoomTwo = await ctx.db
      .query("chatRooms")
      .withIndex("by_participantKey", (q) => q.eq("participantKey", roomTwoKey))
      .first();

    if (!existingRoomTwo) {
      const roomTwoCreatedAt = timestamp - 1000 * 60 * 60 * 24;
      const roomTwoId = await ctx.db.insert("chatRooms", {
        participantIds: [kwameId, kofiId],
        participantKey: roomTwoKey,
        title: "Kwame Mensah, Dr. Kofi Owusu",
        lastMessageText:
          "The document you uploaded for the fellowship application is missing the digital seal.",
        lastMessageAt: roomTwoCreatedAt + 1000 * 60 * 12,
        createdAt: roomTwoCreatedAt,
        updatedAt: roomTwoCreatedAt + 1000 * 60 * 12,
      });

      await ctx.db.insert("messages", {
        roomId: roomTwoId,
        senderId: kofiId,
        text: "Hello Kwame. I noticed a small issue with your fellowship application.",
        readBy: [kofiId, kwameId],
        createdAt: roomTwoCreatedAt,
      });
      await ctx.db.insert("messages", {
        roomId: roomTwoId,
        senderId: kwameId,
        text: "What seems to be the problem, Dr. Kofi?",
        readBy: [kwameId, kofiId],
        createdAt: roomTwoCreatedAt + 1000 * 60 * 5,
      });
      await ctx.db.insert("messages", {
        roomId: roomTwoId,
        senderId: kofiId,
        text: "The document you uploaded for the fellowship application is missing the digital seal. Please re-upload via the portal.",
        readBy: [kofiId],
        createdAt: roomTwoCreatedAt + 1000 * 60 * 12,
      });
      await ensureRoomMember(roomTwoId, kwameId, kofiId, 1, roomTwoCreatedAt + 1000 * 60 * 12);
      await ensureRoomMember(roomTwoId, kofiId, kwameId, 0, roomTwoCreatedAt + 1000 * 60 * 12);
      roomsInserted += 1;
      messagesInserted += 3;
    } else {
      await ensureRoomMember(existingRoomTwo._id, kwameId, kofiId, 1, timestamp);
      await ensureRoomMember(existingRoomTwo._id, kofiId, kwameId, 0, timestamp);
    }

    return {
      usersInserted,
      usersUpdated,
      verificationRequestsInserted: requestsInserted,
      verificationRequestsUpdated: requestsUpdated,
      roomsInserted,
      messagesInserted,
    };
  },
});
