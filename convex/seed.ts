import { mutation } from "./_generated/server";
import type { Id } from "./_generated/dataModel";

const now = () => Date.now();

const testUsers = [
  {
    firstName: "Kwame",
    lastName: "Mensah",
    fullName: "Kwame Mensah",
    email: "kwame.mensah@uenr.edu.gh",
    role: "student" as const,
    school: "University of Energy and Natural Resources (UENR)",
    idNumber: "UEB1234567",
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
    idNumber: "UG-STF-0001",
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
    idNumber: "KNUST-STF-0002",
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
    idNumber: "UG-STU-0003",
    bio: "Undergraduate researcher preparing institutional profile verification.",
    avatarUrl: "",
    passwordHash: "qchat_a9e63a98",
    sessionToken: "demo:esi.boateng@ug.edu.gh",
    verificationStatus: "pending" as const,
    approved: false,
  },
  {
    firstName: "Peter",
    lastName: "Nimbe",
    fullName: "Prof. Peter Nimbe",
    email: "peter.nimbe@uenr.edu.gh",
    role: "lecturer" as const,
    school: "University of Energy and Natural Resources (UENR)",
    idNumber: "STF9876543",
    bio: "Lecturer supporting secure academic identity workflows in Qchat.",
    avatarUrl: "",
    passwordHash: "qchat_a9e63a98",
    sessionToken: "demo:peter.nimbe@uenr.edu.gh",
    verificationStatus: "unverified" as const,
    approved: false,
  },
  {
    firstName: "Akosua",
    lastName: "Nyarko",
    fullName: "Akosua Nyarko",
    email: "akosua.nyarko@knust.edu.gh",
    role: "student" as const,
    school: "KNUST",
    idNumber: "KNUST-STU-0004",
    bio: "Final-year information systems student awaiting verification approval.",
    avatarUrl: "",
    passwordHash: "qchat_a9e63a98",
    sessionToken: "demo:akosua.nyarko@knust.edu.gh",
    verificationStatus: "pending" as const,
    approved: false,
  },
];

const reviewStatusFor = (approved: boolean) => (approved ? "approved" : "pending");

export const run = mutation({
  args: {},
  handler: async (ctx) => {
    const timestamp = now();
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

    const [kwameId, abenaId, kofiId] = userIds;
    if (!kwameId || !abenaId || !kofiId) {
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
