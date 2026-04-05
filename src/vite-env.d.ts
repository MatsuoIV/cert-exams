/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_EXAM_DURATION_MINUTES: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
