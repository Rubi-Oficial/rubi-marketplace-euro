import { useCallback, useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

const SESSION_KEY = "rubi_tracking_session";
const FLUSH_INTERVAL_MS = 3000;
const MAX_QUEUE_SIZE = 10;

type TrackVisitPayload = {
  session_id: string;
  page_path: string;
  referrer_url?: string;
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  user_id?: string;
};

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
  const queueRef = useRef<TrackVisitPayload[]>([]);
  const flushTimerRef = useRef<number | null>(null);

  const flushQueue = useCallback(async () => {
    if (queueRef.current.length === 0) return;

    const batch = queueRef.current.splice(0, queueRef.current.length);

    try {
      await supabase.functions.invoke("track-visit", {
        body: {
          visits: batch,
        },
      });
    } catch {
      // Silently fail — tracking is non-critical
    }
  }, []);

  const scheduleFlush = useCallback(() => {
    if (flushTimerRef.current !== null) return;

    flushTimerRef.current = window.setTimeout(async () => {
      flushTimerRef.current = null;
      await flushQueue();
    }, FLUSH_INTERVAL_MS);
  }, [flushQueue]);

  const queueVisit = useCallback((visit: TrackVisitPayload) => {
    queueRef.current.push(visit);

    if (queueRef.current.length >= MAX_QUEUE_SIZE) {
      if (flushTimerRef.current !== null) {
        window.clearTimeout(flushTimerRef.current);
        flushTimerRef.current = null;
      }
      void flushQueue();
      return;
    }

    scheduleFlush();
  }, [flushQueue, scheduleFlush]);

  useEffect(() => {
    const flushOnHidden = () => {
      if (document.visibilityState === "hidden") {
        void flushQueue();
      }
    };

    const flushOnPageHide = () => {
      void flushQueue();
    };

    document.addEventListener("visibilitychange", flushOnHidden);
    window.addEventListener("pagehide", flushOnPageHide);

    return () => {
      document.removeEventListener("visibilitychange", flushOnHidden);
      window.removeEventListener("pagehide", flushOnPageHide);
    };
  }, [flushQueue]);

  useEffect(() => {
    const path = location.pathname;
    if (path === lastPath.current) return;

    lastPath.current = path;

    const sessionId = getSessionId();
    const utmParams = getUTMParams();

    queueVisit({
      session_id: sessionId,
      page_path: path,
      referrer_url: document.referrer || undefined,
      ...utmParams,
    });
  }, [location.pathname, queueVisit, userId]);

  useEffect(() => {
    return () => {
      if (flushTimerRef.current !== null) {
        window.clearTimeout(flushTimerRef.current);
      }
      void flushQueue();
    };
  }, [flushQueue]);
}
