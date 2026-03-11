import { useEffect, useRef, useState } from "react";
import * as Y from "yjs";
import { createProvider } from "../lib/yjsProvider";
import type { RoomFile } from "../types";

const API = "http://localhost:3001";

type YFileEntry = { name: string; language: string };

export function useFileSystem(roomId: string | undefined) {
  const [files, setFiles] = useState<RoomFile[]>([]);
  const [activeFileId, setActiveFileIdState] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const ydocRef = useRef<Y.Doc | null>(null);

  useEffect(() => {
    if (!roomId) return;

    let cancelled = false;
    const ydoc = new Y.Doc();
    const provider = createProvider(`room:${roomId}:meta`, ydoc);
    const yFiles = ydoc.getMap<YFileEntry>("files");
    ydocRef.current = ydoc;

    let restFiles: RoomFile[] = [];
    let synced = false;

    /** Seed the Y.Map from REST data if it is still empty */
    function trySeed() {
      if (synced && restFiles.length > 0 && yFiles.size === 0) {
        ydoc.transact(() => {
          restFiles.forEach((f) =>
            yFiles.set(f.id, { name: f.name, language: f.language })
          );
        });
      }
    }

    // Fetch initial file list from REST
    fetch(`${API}/api/rooms/${roomId}/files`)
      .then((r) => r.json())
      .then((data: RoomFile[]) => {
        if (cancelled) return;
        restFiles = data;
        // Show REST files immediately while Y.Doc finishes syncing
        if (yFiles.size === 0) {
          setFiles(data);
          setActiveFileIdState((prev) => prev ?? data[0]?.id ?? null);
        }
        setLoading(false);
        trySeed();
      })
      .catch(() => {
        if (!cancelled) setLoading(false);
      });

    // Y.Map observer — fires on every CRDT change (local or remote)
    const handleYMapChange = () => {
      if (yFiles.size === 0) return; // don't clear files before first seed
      const newFiles: RoomFile[] = [];
      yFiles.forEach((val, id) => {
        newFiles.push({
          id,
          roomId: roomId!,
          name: val.name,
          language: val.language,
          createdAt: "",
        });
      });
      newFiles.sort((a, b) => a.name.localeCompare(b.name));
      setFiles(newFiles);
      setActiveFileIdState((prev) => {
        if (prev && yFiles.has(prev)) return prev;
        return newFiles[0]?.id ?? null;
      });
    };

    yFiles.observe(handleYMapChange);

    // After Y.Doc syncs with server, seed Y.Map if needed
    provider.on("sync", (isSynced: boolean) => {
      if (!isSynced || synced) return;
      synced = true;
      trySeed();
    });

    return () => {
      cancelled = true;
      yFiles.unobserve(handleYMapChange);
      provider.destroy();
      ydoc.destroy();
      ydocRef.current = null;
    };
  }, [roomId]);

  async function createFile(name: string, language: string): Promise<void> {
    if (!roomId || !ydocRef.current) return;
    const res = await fetch(`${API}/api/rooms/${roomId}/files`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, language }),
    });
    if (!res.ok) throw new Error(await res.text());
    const file: RoomFile = await res.json();
    const yFiles = ydocRef.current.getMap<YFileEntry>("files");
    yFiles.set(file.id, { name: file.name, language: file.language });
    setActiveFileIdState(file.id);
  }

  async function deleteFile(fileId: string): Promise<void> {
    if (!roomId || !ydocRef.current) return;
    await fetch(`${API}/api/rooms/${roomId}/files/${fileId}`, {
      method: "DELETE",
    });
    const yFiles = ydocRef.current.getMap<YFileEntry>("files");
    yFiles.delete(fileId);
  }

  async function renameFile(fileId: string, newName: string): Promise<void> {
    if (!roomId || !ydocRef.current) return;
    const res = await fetch(`${API}/api/rooms/${roomId}/files/${fileId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newName }),
    });
    if (!res.ok) return;
    const yFiles = ydocRef.current.getMap<YFileEntry>("files");
    const existing = yFiles.get(fileId);
    if (existing) yFiles.set(fileId, { ...existing, name: newName });
  }

  async function updateLanguage(
    fileId: string,
    language: string
  ): Promise<void> {
    if (!roomId || !ydocRef.current) return;
    await fetch(`${API}/api/rooms/${roomId}/files/${fileId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ language }),
    });
    const yFiles = ydocRef.current.getMap<YFileEntry>("files");
    const existing = yFiles.get(fileId);
    if (existing) yFiles.set(fileId, { ...existing, language });
  }

  function setActiveFileId(id: string) {
    setActiveFileIdState(id);
  }

  return {
    files,
    activeFileId,
    setActiveFileId,
    loading,
    createFile,
    deleteFile,
    renameFile,
    updateLanguage,
  };
}
