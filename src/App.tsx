import { BrowserRouter, Routes, Route } from "react-router-dom";
import { useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../convex/_generated/api";
import { Id } from "../convex/_generated/dataModel";
import { generateClientIdentityKeys } from "./services/web3Service";

import LandingPage from "./route/LandingPage";
import Login from "./route/Login";
import Register from "./route/Register";
import ForgotPassword from "./route/ForgotPassword";
import MessagesList from "./route/MessagesList";
import QAPage from "./route/QAPage";
import Explore from "./route/Explore";
import VerifyProfile from "./route/VerifyProfile";
import EditProfile from "./route/EditProfile";
import Admin from "./route/Admin";
import AdminLogin from "./route/AdminLogin";

function App() {
  // Replace this with your real auth source (Clerk, Convex auth, context, etc.)
  const currentUserId = localStorage.getItem("qchat_active_user_id") || null;

  return (
    <BrowserRouter>
      {/* Background worker – only runs when a user is logged in */}
      {currentUserId && (
        <CryptographicLoginGatekeeper
          currentUserId={currentUserId as Id<"users">}
        />
      )}

      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/messages" element={<MessagesList />} />
        <Route path="/qa" element={<QAPage />} />
        <Route path="/explore" element={<Explore />} />
        <Route path="/verify-profile" element={<VerifyProfile />} />
        <Route path="/edit-profile" element={<EditProfile />} />
        <Route path="/admin" element={<Admin />} />
        <Route path="/admin/login" element={<AdminLogin />} />
      </Routes>
    </BrowserRouter>
  );
}

export function CryptographicLoginGatekeeper({
  currentUserId,
}: {
  currentUserId: Id<"users">;
}) {
  const userProfile = useQuery(api.users.getById, { id: currentUserId });
  const updateProfileKeys = useMutation(api.users.updateProfileKeys);

  useEffect(() => {
    async function enforceIdentityKeys() {
      if (userProfile && !userProfile.hasKeypair) {
        console.log(
          `%c[Crypto Guard] Initializing secure key generation for: ${userProfile.fullName}`,
          "color: #3b82f6; font-weight: bold;",
        );

        try {
          const exportedPublicKeyString = await generateClientIdentityKeys();

          await updateProfileKeys({
            id: currentUserId,
            publicKey: exportedPublicKeyString,
            hasKeypair: true,
          });

          console.log(
            `%c[Crypto Guard] Success! Identity keys established and pinned to DB.`,
            "color: #10b981; font-weight: bold;",
          );
        } catch (err) {
          console.error("Cryptographic registration process stalled:", err);
        }
      }
    }

    enforceIdentityKeys();
  }, [userProfile, currentUserId, updateProfileKeys]);

  return null; // Operates completely in the background
}

export default App;
