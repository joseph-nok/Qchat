/// <reference types="vite/client" />

declare module '*.jsx';

interface ImportMetaEnv {
  readonly VITE_MERCURY_KEY?: string;
  readonly VITE_CONVEX_URL?: string;
  readonly VITE_CONVEX_SITE_URL?: string;
  readonly VITE_BESU_RPC_URL?: string;
  readonly VITE_CONTRACT_ADDRESS?: string;
  readonly VITE_SYSTEM_PRIVATE_KEY?: string;
  readonly VITE_RECAPTCHA_SITE_KEY?: string;
  readonly VITE_RECAPTCHA_SECRET_KEY?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
