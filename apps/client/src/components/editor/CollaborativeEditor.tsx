import { useEffect, useRef, useState } from "react";
import MonacoEditor, { useMonaco } from "@monaco-editor/react";
import type { OnMount } from "@monaco-editor/react";
import * as Y from "yjs";
import { MonacoBinding } from "y-monaco";
import type { WebsocketProvider } from "y-websocket";
import type { editor as MonacoEditorType } from "monaco-editor";

interface CollaborativeEditorProps {
  yText: Y.Text;
  provider: WebsocketProvider;
  language: string;
  isDark: boolean;
}

export default function CollaborativeEditor({
  yText,
  provider,
  language,
  isDark,
}: CollaborativeEditorProps) {
  const monaco = useMonaco();
  const bindingRef = useRef<MonacoBinding | null>(null);
  const undoManagerRef = useRef<Y.UndoManager | null>(null);
  const editorRef = useRef<MonacoEditorType.IStandaloneCodeEditor | null>(null);
  const [editorReady, setEditorReady] = useState(0);

  // Recreate MonacoBinding + UndoManager whenever yText, provider, editor, or monaco changes
  useEffect(() => {
    const editor = editorRef.current;
    if (!editor || !yText || !provider || !monaco) return;

    bindingRef.current?.destroy();
    undoManagerRef.current?.destroy();

    bindingRef.current = new MonacoBinding(
      yText,
      editor.getModel()!,
      new Set([editor]),
      provider.awareness
    );

    // trackedOrigins must include the MonacoBinding instance because
    // MonacoBinding uses itself as the Y.js transaction origin — without this
    // the UndoManager ignores all local keystrokes and has nothing to undo.
    const undoManager = new Y.UndoManager(yText, {
      trackedOrigins: new Set([bindingRef.current]),
    });
    undoManagerRef.current = undoManager;

    // Override Monaco's built-in Ctrl+Z / Ctrl+Y / Ctrl+Shift+Z.
    // Use the ref so the closure always calls the current manager even after
    // the effect re-runs on file switches.
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyZ, () =>
      undoManagerRef.current?.undo()
    );
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyY, () =>
      undoManagerRef.current?.redo()
    );
    editor.addCommand(
      monaco.KeyMod.CtrlCmd | monaco.KeyMod.Shift | monaco.KeyCode.KeyZ,
      () => undoManagerRef.current?.redo()
    );

    return () => {
      bindingRef.current?.destroy();
      bindingRef.current = null;
      undoManagerRef.current?.destroy();
      undoManagerRef.current = null;
    };
  }, [yText, provider, editorReady, monaco]);

  const handleMount: OnMount = (editor) => {
    editorRef.current = editor;
    // Signal that the editor is ready — triggers the binding effect
    setEditorReady((n) => n + 1);
  };

  return (
    <MonacoEditor
      height="100%"
      language={language}
      theme={isDark ? "vs-dark" : "vs"}
      onMount={handleMount}
      options={{
        fontSize: 14,
        fontFamily: "'JetBrains Mono', 'Fira Code', 'Cascadia Code', monospace",
        fontLigatures: true,
        minimap: { enabled: false },
        scrollBeyondLastLine: false,
        wordWrap: "on",
        tabSize: 2,
        renderLineHighlight: "line",
        smoothScrolling: true,
        cursorBlinking: "smooth",
        cursorSmoothCaretAnimation: "on",
        formatOnPaste: true,
        bracketPairColorization: { enabled: true },
      }}
      loading={
        <div className="flex h-full items-center justify-center text-gray-400 dark:text-gray-600 text-sm">
          Loading editor…
        </div>
      }
    />
  );
}
