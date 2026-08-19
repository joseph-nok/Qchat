import { useEffect, useRef, useImperativeHandle, forwardRef, useState } from 'react';

declare global {
  interface Window {
    grecaptcha?: {
      render: (
        container: HTMLElement | string,
        parameters: {
          sitekey: string;
          theme?: 'light' | 'dark';
          callback?: (response: string) => void;
          'expired-callback'?: () => void;
          'error-callback'?: () => void;
        }
      ) => number;
      reset: (widgetId?: number) => void;
      getResponse: (widgetId?: number) => string;
    };
    onGrecaptchaLoaded?: () => void;
  }
}

export interface ReCaptchaRef {
  reset: () => void;
  getValue: () => string;
}

interface ReCaptchaProps {
  onVerify: (token: string) => void;
  onExpired?: () => void;
  onError?: () => void;
  theme?: 'light' | 'dark';
}

const ReCaptcha = forwardRef<ReCaptchaRef, ReCaptchaProps>(
  ({ onVerify, onExpired, onError, theme = 'dark' }, ref) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const widgetIdRef = useRef<number | null>(null);
    const [scriptLoaded, setScriptLoaded] = useState(false);
    const siteKey = import.meta.env.VITE_RECAPTCHA_SITE_KEY || '';

    useImperativeHandle(ref, () => ({
      reset: () => {
        if (window.grecaptcha && widgetIdRef.current !== null) {
          try {
            window.grecaptcha.reset(widgetIdRef.current);
          } catch (e) {
            console.warn('reCAPTCHA reset failed:', e);
          }
        }
      },
      getValue: () => {
        if (window.grecaptcha && widgetIdRef.current !== null) {
          try {
            return window.grecaptcha.getResponse(widgetIdRef.current);
          } catch (e) {
            return '';
          }
        }
        return '';
      },
    }));

    useEffect(() => {
      if (!siteKey) {
        console.warn('VITE_RECAPTCHA_SITE_KEY is not defined in environment variables.');
        return;
      }

      // Check if script is already present or loaded
      if (typeof window.grecaptcha?.render === 'function') {
        setScriptLoaded(true);
        return;
      }

      const scriptId = 'google-recaptcha-v2-script';
      let existingScript = document.getElementById(scriptId) as HTMLScriptElement | null;

      window.onGrecaptchaLoaded = () => {
        setScriptLoaded(true);
      };

      if (!existingScript) {
        const script = document.createElement('script');
        script.id = scriptId;
        script.src = 'https://www.google.com/recaptcha/api.js?onload=onGrecaptchaLoaded&render=explicit';
        script.async = true;
        script.defer = true;
        document.head.appendChild(script);
      } else {
        // Script tag exists, set callback
        existingScript.addEventListener('load', () => {
          if (window.grecaptcha) setScriptLoaded(true);
        });
      }

      return () => {
        delete window.onGrecaptchaLoaded;
      };
    }, [siteKey]);

    useEffect(() => {
      if (!scriptLoaded || !containerRef.current || !siteKey) return;
      if (widgetIdRef.current !== null) return; // Already rendered

      if (typeof window.grecaptcha?.render === 'function') {
        try {
          const id = window.grecaptcha.render(containerRef.current, {
            sitekey: siteKey,
            theme,
            callback: (token: string) => {
              onVerify(token);
            },
            'expired-callback': () => {
              onExpired?.();
            },
            'error-callback': () => {
              onError?.();
            },
          });
          widgetIdRef.current = id;
        } catch (e) {
          console.error('Failed to render reCAPTCHA widget:', e);
        }
      }
    }, [scriptLoaded, siteKey, theme, onVerify, onExpired, onError]);

    if (!siteKey) {
      return (
        <div style={{ color: 'var(--error, #ba1a1a)', fontSize: '0.85rem', margin: '0.5rem 0' }}>
          Warning: reCAPTCHA site key is missing.
        </div>
      );
    }

    return (
      <div
        className="recaptcha-wrapper"
        style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          margin: '1.25rem 0 0.75rem 0',
          minHeight: '78px',
        }}
      >
        <div ref={containerRef} />
      </div>
    );
  }
);

ReCaptcha.displayName = 'ReCaptcha';

export default ReCaptcha;
