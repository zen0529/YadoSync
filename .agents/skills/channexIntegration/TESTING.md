# Channex Integration Testing Skill

**Purpose**: This skill defines the standard operating procedure (SOP) for writing unit tests for any Channex Integration module (which follows the Dual-Write Architecture).

When you ask me to **"Write tests for the [Entity] Channex flow using the Testing Skill"**, I will automatically generate tests using **Vitest** that adhere to these rules.

## Core Testing Philosophy
Because the Channex integration relies heavily on a "Dual-Write" flow (Channex -> Supabase), our tests must heavily mock external dependencies to ensure the orchestration logic (especially the **Rollback** logic) works flawlessly.

### What We Use
- **Runner**: Vitest (`describe`, `it`, `expect`, `vi`, `beforeEach`)
- **Testing Approach**: Pure unit testing with heavily mocked dependencies.

---

## Required Test Cases for Every Hook (`use[Entity].js`)

For every orchestration hook (e.g., `useCreateRatePlan`, `useRoomTypes`), the following test cases **MUST** be implemented:

1. **Successful Dual-Write**: 
   - *Condition*: Both Channex and Supabase succeed.
   - *Assertion*: Verify Channex API was called with the correct payload. Verify Supabase was called with the returned Channex ID. Verify local state was updated.
2. **Channex Failure**: 
   - *Condition*: Channex API throws an error (e.g., `422 Validation Error`).
   - *Assertion*: Verify Supabase `insert` is **never** called. Verify the error is thrown/caught properly.
3. **Supabase Failure (Rollback Triggered)**: 
   - *Condition*: Channex API succeeds, but Supabase `insert` throws an error.
   - *Assertion*: Verify the `delete` Channex function is called with the newly created Channex ID to clean up the orphaned record.

## Mocking Conventions

### 1. Mocking Supabase
We do not hit the real database during unit tests. You must mock the Supabase client:
```javascript
vi.mock('@/lib/supabase', () => ({
  supabase: {
    from: vi.fn().mockReturnThis(),
    select: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    delete: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    single: vi.fn(),
  }
}));
```

### 2. Mocking Channex Handlers
Instead of mocking `fetch` directly in hook tests, mock the specific Channex API wrappers (e.g., `createInChannex`).
```javascript
vi.mock('../channex/createEntity', () => ({
  createInChannex: vi.fn(),
}));
```

### 3. Clear Mocks
Always clear mocks in `beforeEach` to prevent test pollution:
```javascript
beforeEach(() => {
  vi.clearAllMocks();
});
```

## How to use this skill
Simply say: 
> *"Use the Channex Testing Skill to write tests for `useCreateRatePlan.js`."*

I will immediately scaffold the Vitest file, set up the Supabase and Channex mocks, and write the critical success, failure, and rollback scenarios.
