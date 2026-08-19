declare const process: { env: Record<string, string | undefined> };

import { action } from "./_generated/server";
import { v, ConvexError } from "convex/values";
import { api } from "./_generated/api";

const getRecaptchaSecretKey = () => {
  return (
    process.env.VITE_RECAPTCHA_SECRET_KEY ||
    process.env.RECAPTCHA_SECRET_KEY ||
    "6LepbY4tAAAAANOk0C5UdyB-CGv9hiB84DSIyx03"
  );
};

const verifyTokenInternal = async (token: string): Promise<{ success: boolean; errorCodes?: string[] }> => {
  if (!token) {
    throw new ConvexError("reCAPTCHA token is required.");
  }

  const secretKey = getRecaptchaSecretKey();

  try {
    const response = await fetch("https://www.google.com/recaptcha/api/siteverify", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        secret: secretKey,
        response: token,
      }).toString(),
    });

    const data = await response.json();

    if (!data.success) {
      console.warn("reCAPTCHA siteverify error responses:", data["error-codes"]);
      return {
        success: false,
        errorCodes: data["error-codes"] || [],
      };
    }

    return { success: true };
  } catch (err: any) {
    console.error("Error during reCAPTCHA verification:", err);
    throw new ConvexError("reCAPTCHA verification request failed.");
  }
};

export const verifyRecaptchaToken = action({
  args: {
    token: v.string(),
  },
  handler: async (_ctx, args) => {
    return await verifyTokenInternal(args.token);
  },
});

export const loginUserWithRecaptcha = action({
  args: {
    email: v.string(),
    password: v.string(),
    role: v.union(v.literal("student"), v.literal("lecturer")),
    recaptchaToken: v.string(),
  },
  handler: async (ctx, args) => {
    if (!args.recaptchaToken) {
      throw new ConvexError("reCAPTCHA token is required.");
    }

    const verification = await verifyTokenInternal(args.recaptchaToken);

    if (!verification.success) {
      const errorCodes: string[] = verification.errorCodes || [];
      if (errorCodes.includes("bad-request") || errorCodes.includes("invalid-input-response")) {
        throw new ConvexError("reCAPTCHA verification failed. Please complete the reCAPTCHA challenge again.");
      }
      throw new ConvexError("reCAPTCHA verification failed. Please try again.");
    }

    return await ctx.runMutation(api.qchat.loginUser, {
      email: args.email,
      password: args.password,
      role: args.role,
    });
  },
});

export const registerUserWithRecaptcha = action({
  args: {
    firstName: v.string(),
    lastName: v.string(),
    email: v.string(),
    role: v.union(v.literal("student"), v.literal("lecturer")),
    school: v.string(),
    idNumber: v.string(),
    password: v.string(),
    publicKey: v.optional(v.string()),
    hasKeypair: v.optional(v.boolean()),
    recaptchaToken: v.string(),
  },
  handler: async (ctx, args) => {
    if (!args.recaptchaToken) {
      throw new ConvexError("reCAPTCHA token is required.");
    }

    const verification = await verifyTokenInternal(args.recaptchaToken);

    if (!verification.success) {
      throw new ConvexError("reCAPTCHA verification failed. Please complete the reCAPTCHA challenge again.");
    }

    return await ctx.runMutation(api.qchat.registerUser, {
      firstName: args.firstName,
      lastName: args.lastName,
      email: args.email,
      role: args.role,
      school: args.school,
      idNumber: args.idNumber,
      password: args.password,
      publicKey: args.publicKey,
      hasKeypair: args.hasKeypair,
    });
  },
});
