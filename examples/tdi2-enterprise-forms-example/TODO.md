## Todos for the Example Implementation

- Separate view state and business state
  - Timing logic using `setTimeout` in services should be refactored elsewhere
- evaluate whether we would / should extract a form "controller" of some sort that extracts view logic from react to a separate class
  - **AND** compare if that would be benefitial for the quailtiy criteria
  - **AND** compare to extracting a hook for view logic
  - this would be "VCS" pattern, the hoook would be a "C" in that sense anyway

- Add caching service or interface
  - Use IndexedDB or LocalStorage

- Simplify service logic
  - Extract shared functionality
  - Use composition over inheritance

- Evaluate relocating `handleFormComplete` from `HealthcareFormContainer.tsx` to `formDagService`

- Audit exceptions and `console.error` usage
  - Move relevant cases into form state and expose to user
  - Retain only those that enhance UX
  - Remove or relocate those unrelated to UX from UI components
