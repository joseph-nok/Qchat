import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { ConvexProvider, ConvexReactClient } from "convex/react";
import "./index.css";
import App from "./App.tsx";
import { AuthProvider } from "./context/AuthContext.jsx";
import AppErrorBoundary from "./components/AppErrorBoundary.tsx";

const convexUrl = import.meta.env.VITE_CONVEX_URL;
const convex = new ConvexReactClient(convexUrl);

// The '!' exclamation mark tells TypeScript that this element definitely exists
const rootElement = document.getElementById("root")!;

createRoot(rootElement).render(
  <StrictMode>
    <ConvexProvider client={convex}>
      <AuthProvider>
        <AppErrorBoundary>
          <App />
        </AppErrorBoundary>
      </AuthProvider>
    </ConvexProvider>
  </StrictMode>,
);
