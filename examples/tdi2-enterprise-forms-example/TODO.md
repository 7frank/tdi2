## Todos for the Example Implementation

- Separate view state and business state
  - Timing logic using `setTimeout` in services should be refactored elsewhere

- Add caching service or interface
  - Use IndexedDB or LocalStorage

- Resolve the "88% complete" issue

- Simplify service logic
  - Extract shared functionality
  - Use composition over inheritance

- Extract shared views and utilities into separate files

- Add questionnaire/form submission service or interface if beneficial
  - and Submitform or something that finalizes the example

- Evaluate relocating `handleFormComplete` from `HealthcareFormContainer.tsx` to `formDagService`

- Audit exceptions and `console.error` usage
  - Move relevant cases into form state and expose to user
  - Retain only those that enhance UX
  - Remove or relocate those unrelated to UX from UI components
