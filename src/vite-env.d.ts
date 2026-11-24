/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** The version the build was made at, as `tools/version.ts` reads it. */
  readonly BUILD_VERSION: string;
  /** The licences' page's file, beside the game's own page wherever it is served. */
  readonly LICENCES_PAGE: string;
}
