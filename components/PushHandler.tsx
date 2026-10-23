import * as Notifications from "expo-notifications";
import { useRouter } from "expo-router";
import { useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import api from "../services/api";
import { resolveMobileRoute } from "../utils/notificationRoute";

// Remembers which push was already opened, so a re-render doesn't open it twice
let lastHandledId: string | null = null;

/**
 * Tapping a push notification opens the matching screen (and marks it read),
 * whether the app was closed or already open. Rendered only where pushes
 * work (see pushSupported).
 */
export default function PushHandler() {
  const router = useRouter();
  const { user } = useAuth();
  const response = Notifications.useLastNotificationResponse();

  useEffect(() => {
    if (!user || !response) return;
    if (response.actionIdentifier !== Notifications.DEFAULT_ACTION_IDENTIFIER) return;

    const id = response.notification.request.identifier;
    if (id === lastHandledId) return;
    lastHandledId = id;

    const data = response.notification.request.content.data as {
      notification_id?: number;
      link?: string | null;
    };
    if (data?.notification_id) {
      api.post(`/donor/notifications/${data.notification_id}/read`).catch(() => {});
    }
    // When the tap started the app, the start screen is still redirecting to
    // Home; wait a moment so the push's screen ends up on top
    const timer = setTimeout(
      () => router.push((resolveMobileRoute(data?.link) ?? "/notifications") as any),
      400
    );
    return () => clearTimeout(timer);
  }, [response, user, router]);

  return null;
}
