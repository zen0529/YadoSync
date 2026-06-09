# Channex Integration Skill (Dual-Write Pattern)

**Purpose**: This skill defines the standard operating procedure (SOP) for integrating new entities (e.g., Rate Plans, Rates, Availability, Restrictions) that must be synchronized between the Channex API and the local Supabase database.

When you ask me to **"Implement [Entity] using the Channex Integration Skill"**, I will automatically follow these steps and architecture guidelines without needing detailed reprompting.

## Architecture Guidelines (The Dual-Write Pattern)
For any core entity managed in the property owner's inventory, Supabase is the **Source of Truth for the UI**, but Channex is the **Source of Truth for the PMS distribution**. 

Every mutation (Create, Update, Delete) follows a Strict 3-Step Process:
1. **Mutate in Channex**: Call the Channex API to perform the action.
2. **Mutate in Supabase**: If Channex succeeds, replicate the change in the local Supabase table.
3. **Update Local State**: Update the React UI state with the result from Supabase.

### Directory Structure Convention
For a new feature (e.g., `rate-plans`), the following structure should be strictly adhered to:
```text
src/features/property-owner/[feature-name]/
├── channex/
│   ├── get[Entity]s.js       (Fetch list from Channex)
│   ├── get[Entity].js        (Fetch single from Channex)
│   ├── create[Entity].js     (Create in Channex)
│   ├── update[Entity].js     (Update in Channex)
│   └── delete[Entity].js     (Delete in Channex)
├── supabase/
│   ├── get[Entity]s.js       (Fetch list from Supabase)
│   ├── get[Entity].js        (Fetch single from Supabase)
│   ├── create[Entity].js     (Insert into Supabase)
│   ├── update[Entity].js     (Update in Supabase)
│   └── delete[Entity].js     (Delete in Supabase)
├── hooks/
│   ├── use[Entity]s.js       (Loads list of entities into state)
│   ├── useCreate[Entity].js  (Orchestrates creation: Channex -> Supabase)
│   ├── useUpdate[Entity].js  (Orchestrates update: Channex -> Supabase)
│   └── useDelete[Entity].js  (Orchestrates deletion: Channex -> Supabase)
├── components/               (UI Components following the aesthetic)
├── pages/                    (Page Layouts)
└── index.js                  (Exports the main components/pages)
```

## Implementation Steps I Will Follow

### Step 1: Channex API Handlers (`/channex`)
- Create API wrappers for `GET`, `POST`, `PUT`, and `DELETE` matching the Channex REST spec.
- Extract the `user-api-key` from `.env` (or state) and map JSON body payloads correctly.
- Implement robust error handling (e.g., catching `422 Validation error` and extracting `details`).

### Step 2: Supabase DB Handlers (`/supabase`)
- Create individual files for each CRUD operation (`get[Entity]s.js`, `create[Entity].js`, `update[Entity].js`, `delete[Entity].js`).
- Ensure the `id` from Channex is mapped to the `channex_[entity]_id` column in the Supabase table.
- Ensure the `property_id` or `user_id` is passed to satisfy Row Level Security (RLS) policies.

### Step 3: Orchestration Hooks (`/hooks`)
- Build separated custom React hooks for each operation (e.g., `use[Entity]s`, `useCreate[Entity]`, `useUpdate[Entity]`).
- `use[Entity]s`: Fetch rows exclusively from Supabase to render the UI quickly.
- `useCreate[Entity]`:
  - First, create the entity in Channex.
  - Then, attempt to save to Supabase.
  - **ROLLBACK**: If saving to Supabase fails, catch the error, immediately delete the orphaned record from Channex, and re-throw the error to the UI.
- `useUpdate[Entity]`, `useDelete[Entity]`: Wrap the dual-write pattern (Channex -> Supabase -> local state).
- Handle loading states (`loading`, `error`) and show toast notifications using `sonner`.

### Step 4: UI & Aesthetics (`/components`, `/pages`)
- Build the UI using Radix UI/Shadcn primitives (`Dialog`, `Button`, `Select`, `Table`).
- Adhere to the established rich aesthetics (glassmorphism cards, micro-animations, lucide-react icons, gradients).
- Ensure loaders (`Loader2`) are used for async interactions.
- Do not use Tailwind default colors (red, blue) natively; use the tailored modern palettes (e.g., emerald/green for success actions, slate/gray for borders).

## How to use this skill
Simply say: 
> *"Use the Channex Integration Skill to build the CRUD flow for [Entity Name]. Here is the Channex JSON payload required for creation: { ... }"*

I will immediately scaffold the directories, hook up the dual-write flow, and design the UI based on our established standards.
