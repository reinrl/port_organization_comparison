# Plan: Multi-Environment Selection UI

## Background

The project currently hard-codes two active environments ("source" and "dest") via `src/envs/source.json` and `src/envs/dest.json`. Three alternate environment configs exist (`_dev.json`, `_beta.json`, `_prod.json`) but are ignored at startup because of the underscore prefix convention. To compare a different pair of environments the user must manually rename files and restart the server.

This plan describes changing the startup and UI so that:

1. All configured environments are fetched at startup.
2. The Home page lets the user choose which environment to treat as "source" (left) and which as "destination" (right).
3. All comparison pages immediately reflect the selection without a restart.
4. The selection persists across browser refreshes via `localStorage`.

---

## Decisions

| Decision | Choice |
|---|---|
| `_eu-dev.json` | Leave archived (underscore prefix kept) |
| Current `source.json` / `dest.json` | Delete entirely |
| Env display labels | Add optional `displayName` field to env JSON; fall back to `envName` if absent |
| Same-env selection | Block it — disable the already-selected env in the opposite dropdown |

---

## Phase 1 — Env File Preparation ✅

> *Complete.*

1. ✅ **Updated** `src/envs/_dev.json`: `envName` → `"dev"`, added `"displayName": "Dev"`
2. ✅ **Updated** `src/envs/_beta.json`: `envName` → `"beta"`, added `"displayName": "Beta"`
3. ✅ **Updated** `src/envs/_prod.json`: `envName` → `"prod"`, added `"displayName": "Production"`
4. ✅ **Renamed** all three by dropping the `_` prefix → `dev.json`, `beta.json`, `prod.json`
5. ✅ **Deleted** `src/envs/source.json`, `src/envs/dest.json`, and `src/envs/_eu-dev.json`
6. ✅ **Updated** `src/envs/README.md`: `envName` is now a unique, arbitrary identifier; `displayName` is optional (falls back to `envName`); underscore-prefix convention is documented

---

## Phase 2 — Update `index.cjs` configs.ts Generation ✅

**File:** `src/index.cjs`

> *Complete. The generation block now emits `allEnvConfigs`, `envNames`, and `displayNames` instead of per-env named config objects.*

Example of the generated `configs.ts` shape:

```ts
import devActions from "../output/dev/Actions.json";
// ... all types for all envs ...

export const allEnvConfigs: Record<string, Record<string, unknown[]>> = {
  dev:  { Actions: devActions,  Blueprints: devBlueprints,  ... },
  beta: { Actions: betaActions, ... },
  prod: { Actions: prodActions, ... },
};

export const envNames: string[] = ["dev", "beta", "prod"];

export const displayNames: Record<string, string> = {
  dev:  "Dev",
  beta: "Beta",
  prod: "Production",
};
```

`displayName` is read from each env config object and falls back to `envName` if absent. The old per-env `${env}Config` named exports are dropped entirely.

---

## Phase 3 — New React Context for Env Selection ✅

**New file:** `src/contexts/EnvSelectionContext.tsx`

> *Complete. Context exposes `sourceEnv`, `destEnv`, `setSourceEnv`, `setDestEnv`, and `availableEnvs` (`{ envName, displayName }[]`). Selections are persisted to `localStorage` and validated against the current `envNames` list on mount. Provider is placed in `src/index.tsx` wrapping `<App />` so all descendants (including `App` itself) can consume it.*

---

## Phase 4 — Update `useItemFilter` ✅

**File:** `src/hooks/useItemFilter.ts`

> *Complete. Replaced `sourceConfig`/`destConfig` static imports with `allEnvConfigs` + `useEnvSelection` context hook.*

---

## Phase 5 — Home Page Env Selector ✅

**File:** `src/components/itemType/Home.tsx`

> *Complete. Renders two `<Form.Select>` dropdowns (Source / Destination) populated from `availableEnvs`. The currently selected env is disabled in the opposite dropdown. A summary line below shows the active comparison.*

---

## Phase 6 — Navbar Env Label ✅

**File:** `src/App.tsx`

> *Complete. A muted `"Dev → Production"` label is rendered in the right-side `Nav` next to the theme toggle, visible on all pages.*

---

## File Change Summary

| File | Action |
|---|---|
| `src/envs/_dev.json` | Update `envName`, add `displayName`, rename to `dev.json` |
| `src/envs/_beta.json` | Update `envName`, add `displayName`, rename to `beta.json` |
| `src/envs/_prod.json` | Update `envName`, add `displayName`, rename to `prod.json` |
| `src/envs/source.json` | Delete |
| `src/envs/dest.json` | Delete |
| `src/envs/README.md` | Update schema documentation |
| `src/index.cjs` | Update configs.ts generation block |
| `src/util/configs.ts` | Auto-regenerated — no manual edits |
| `src/contexts/EnvSelectionContext.tsx` | **Create new** |
| `src/App.tsx` | Add `<EnvSelectionProvider>` wrapper; optional nav label |
| `src/hooks/useItemFilter.ts` | Use `allEnvConfigs` + context instead of static imports |
| `src/components/itemType/Home.tsx` | Env picker UI |

**No changes needed:** `Content.tsx`, `ItemViewer.tsx`, `Actions.tsx`, `Blueprints.tsx`, `Integrations.tsx`, `Pages.tsx`, `Items.tsx`, `validatePages.cjs` (already env-agnostic).

---

## Verification Steps

1. Run `npm run dev` — confirm `src/output/` contains `dev/`, `beta/`, `prod/` subdirectories, each with the expected JSON files
2. Confirm `src/util/configs.ts` exports `allEnvConfigs`, `envNames`, and `displayNames`
3. Load the app — Home page shows two dropdowns each listing "Dev", "Beta", "Production"
4. Confirm the env already selected in one dropdown appears disabled in the other
5. Select "Dev" as source and "Production" as dest; navigate to Blueprints — verify the diff shows data from those respective environments
6. Hard-refresh the browser — confirm selections are restored from `localStorage`
7. Navigate to Pages — confirm page validation badges still render correctly (they key off env name, not the old "source"/"dest" strings)
8. Navigate to any comparison page and confirm the navbar label updates to reflect the active comparison
