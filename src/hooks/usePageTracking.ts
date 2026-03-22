import { useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

const SESSION_KEY = "rubi_tracking_session";

function getSessionId(): string {
  let id = sessionStorage.getItem(SESSION_KEY);
  if (!id) {
    id = crypto.randomUUID();
    sessionStorage.setItem(SESSION_KEY, id);
  }
  return id;
}

function getUTMParams() {
  const params = new URLSearchParams(window.location.search);
  return {
    utm_source: params.get("utm_source") || undefined,
    utm_medium: params.get("utm_medium") || undefined,
    utm_campaign: params.get("utm_campaign") || undefined,
  };
}

export function usePageTracking(userId?: string) {
  const location = useLocation();
  const lastPath = useRef("");

  useEffect(() => {
    const path = location.pathname;
    // Avoid duplicate tracking for same path
    if (path === lastPath.current) return;
    lastPath.current = path;

    const sessionId = getSessionId();
    const utmParams = getUTMParams();

    // Fire and forget — non-blocking
    supabase.functions.invoke("track-visit", {
      body: {
        session_id: sessionId,
        page_path: path,
        referrer_url: document.referrer || undefined,
        ...utmParams,
        user_id: userId || undefined,
      },
    }).catch(() => {
      // Silently fail — tracking is non-critical
    });
  }, [location.pathname, userId]);
}
