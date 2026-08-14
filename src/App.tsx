import { BrowserRouter, Routes, Route } from "react-router-dom";
import { useEffect, useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../convex/_generated/api";
import { Id } from "../convex/_generated/dataModel";
import { generateClientIdentityKeys } from "./services/web3Service";
import { getPrivateKeyFromIndexedDB } from "./utils/cryptoBridge";
import { getSessionToken } from "./lib/session";

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
  const [activeUserId, setActiveUserId] = useState<string | null>(
    () => localStorage.getItem("qchat_active_user_id")
  );

  const sessionToken = getSessionToken();
  const me = useQuery(api.users.getMe, sessionToken ? { sessionToken } : "skip");

  useEffect(() => {
    if (me?._id) {
      localStorage.setItem("qchat_active_user_id", me._id);
      setActiveUserId(me._id);
    } else if (!sessionToken) {
      localStorage.removeItem("qchat_active_user_id");
      setActiveUserId(null);
    }
  }, [me, sessionToken]);

  return (
    <BrowserRouter>
      {/* Background worker – only runs when a user is logged in */}
      {activeUserId && (
        <CryptographicLoginGatekeeper
          currentUserId={activeUserId as Id<"users">}
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
      if (!userProfile) return;

      try {
        const existingKey = await getPrivateKeyFromIndexedDB(currentUserId);

        if (!existingKey || !userProfile.hasKeypair) {
          console.log(
            `%c[Crypto Guard] Initializing secure key generation for: ${userProfile.fullName}`,
            "color: #3b82f6; font-weight: bold;"
          );

          const exportedPublicKeyString = await generateClientIdentityKeys(currentUserId);

          await updateProfileKeys({
            id: currentUserId,
            publicKey: exportedPublicKeyString,
            hasKeypair: true,
          });

          console.log(
            `%c[Crypto Guard] Success! Identity keys established for ${userProfile.fullName} and saved to IndexedDB & DB.`,
            "color: #10b981; font-weight: bold;"
          );
        }
      } catch (err) {
        console.error("Cryptographic registration process stalled:", err);
      }
    }

    enforceIdentityKeys();
  }, [userProfile, currentUserId, updateProfileKeys]);

  return null; // Operates completely in the background
}

export default App;
