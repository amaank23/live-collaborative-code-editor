import { useEffect, useState } from "react";
import type { WebsocketProvider } from "y-websocket";
import type { UserSession } from "../types";

export interface RemoteUser {
  clientID: number;   // y-websocket awareness clientID (used for CSS class names)
  username: string;
  color: string;
}

const STYLE_TAG_ID = "yjs-cursor-styles";

/** Injects/updates a <style> tag with per-user cursor colors from y-monaco CSS classes */
function injectCursorStyles(
  states: Map<number, Record<string, unknown>>,
  localClientID: number
): void {
  let styleEl = document.getElementById(STYLE_TAG_ID) as HTMLStyleElement | null;
  if (!styleEl) {
    styleEl = document.createElement("style");
    styleEl.id = STYLE_TAG_ID;
    document.head.appendChild(styleEl);
  }

  const rules: string[] = [];
  states.forEach((state, clientID) => {
    if (clientID === localClientID) return;
    const user = state.user as { name?: string; color?: string } | undefined;
    if (!user?.color) return;

    const color = user.color;
    const name = user.name ?? "Unknown";

    // Selection highlight (background)
    rules.push(
      `.yRemoteSelection-${clientID} { background-color: ${color}33; }`
    );
    // Cursor line
    rules.push(
      `.yRemoteSelectionHead-${clientID} {
        border-left: 2px solid ${color};
        border-top: 2px solid ${color};
        border-bottom: 2px solid ${color};
        height: 100%;
        box-sizing: border-box;
        position: relative;
      }`
    );
    // Username label above cursor
    rules.push(
      `.yRemoteSelectionHead-${clientID}::after {
        content: "${name.replace(/"/g, "'")}";
        background-color: ${color};
        color: #fff;
        font-size: 11px;
        font-family: system-ui, sans-serif;
        font-weight: 600;
        padding: 1px 5px;
        border-radius: 3px 3px 3px 0;
        position: absolute;
        top: -18px;
        left: 0;
        white-space: nowrap;
        pointer-events: none;
        z-index: 100;
      }`
    );
  });

  styleEl.textContent = rules.join("\n");
}

/**
 * Sets local awareness state (username + color) and tracks remote users.
 * Must be called after the provider is ready.
 */
export function useAwareness(
  provider: WebsocketProvider | null,
  session: UserSession | null
): { remoteUsers: RemoteUser[] } {
  const [remoteUsers, setRemoteUsers] = useState<RemoteUser[]>([]);

  useEffect(() => {
    if (!provider || !session) return;

    const awareness = provider.awareness;

    // Announce this user's identity to all peers
    awareness.setLocalStateField("user", {
      name: session.username,
      color: session.color,
      clientId: session.clientId,
    });

    const handleChange = () => {
      const states = awareness.getStates() as Map<number, Record<string, unknown>>;
      const users: RemoteUser[] = [];

      states.forEach((state, clientID) => {
        if (clientID === awareness.clientID) return; // skip self
        const user = state.user as { name?: string; color?: string } | undefined;
        if (user?.name && user?.color) {
          users.push({ clientID, username: user.name, color: user.color });
        }
      });

      setRemoteUsers(users);
      injectCursorStyles(states, awareness.clientID);
    };

    awareness.on("change", handleChange);
    handleChange(); // run once immediately for current state

    return () => {
      awareness.off("change", handleChange);
    };
  }, [provider, session]);

  return { remoteUsers };
}
