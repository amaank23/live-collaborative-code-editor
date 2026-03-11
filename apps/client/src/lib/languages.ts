export interface Language {
  id: string;
  label: string;
  monacoId: string;
}

export const LANGUAGES: Language[] = [
  { id: "javascript", label: "JavaScript", monacoId: "javascript" },
  { id: "typescript", label: "TypeScript", monacoId: "typescript" },
  { id: "python", label: "Python", monacoId: "python" },
  { id: "html", label: "HTML", monacoId: "html" },
  { id: "css", label: "CSS", monacoId: "css" },
  { id: "json", label: "JSON", monacoId: "json" },
  { id: "markdown", label: "Markdown", monacoId: "markdown" },
  { id: "rust", label: "Rust", monacoId: "rust" },
  { id: "go", label: "Go", monacoId: "go" },
];

export function getMonacoLanguage(languageId: string): string {
  return LANGUAGES.find((l) => l.id === languageId)?.monacoId ?? "plaintext";
}
