import { useEffect, useRef } from "react";
import MonacoEditor from "@monaco-editor/react";
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
  const bindingRef = useRef<MonacoBinding | null>(null);
  const editorRef = useRef<MonacoEditorType.IStandaloneCodeEditor | null>(null);

  // Destroy binding when yText changes (file switch in Phase 6)
  useEffect(() => {
    return () => {
      bindingRef.current?.destroy();
      bindingRef.current = null;
    };
  }, [yText]);

  const handleMount: OnMount = (editor) => {
    editorRef.current = editor;

    // Destroy any previous binding first
    bindingRef.current?.destroy();

    // Bind Y.Text to the Monaco model
    bindingRef.current = new MonacoBinding(
      yText,
      editor.getModel()!,
      new Set([editor]),
      provider.awareness
    );
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
