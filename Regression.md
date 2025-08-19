failling tests before


10 tests failed:
✗ FunctionalDIEnhancedTransformer > Feature: Inline Injection Markers > Given components with inline service definitions > When component uses inline services with destructuring, Then should transform correctly [40.02ms]
✗ FunctionalDIEnhancedTransformer > Feature: Inline Injection Markers > Given components with inline service definitions > When component uses inline services without destructuring, Then should transform correctly [22.01ms]
✗ FunctionalDIEnhancedTransformer > Feature: Inline Injection Markers > Given components with inline service definitions > When component has all required services, Then should use useService for all [24.01ms]
✗ FunctionalDIEnhancedTransformer > Feature: Separate Interface Definitions > Given components with separate interface definitions > When component uses separate interface with destructuring, Then should transform correctly [11.01ms]
✗ FunctionalDIEnhancedTransformer > Feature: Separate Interface Definitions > Given components with separate interface definitions > When arrow function uses separate interface, Then should transform correctly [11.01ms]
✗ FunctionalDIEnhancedTransformer > Feature: Edge Cases and Error Handling > Given components with edge cases > When component has mixed DI and non-DI services, Then should transform only DI services [7.00ms]
✗ FunctionalDIEnhancedTransformer > Feature: Service Resolution and Key Sanitization > Given different interface types > When component uses complex generic types, Then should sanitize keys correctly [5.00ms]
✗ FunctionalDIEnhancedTransformer > Feature: Missing Dependencies Handling > Given services that cannot be resolved > When required dependency is missing, Then should add warning comment [6.00ms]
✗ FunctionalDIEnhancedTransformer > Feature: Error Recovery and Robustness > Given malformed or problematic components > When component has complex destructuring, Then should handle gracefully [6.00ms]
✗ Functional DI Transformation Tests > Tests that compile invalid > should resolve generic interface when existing [390.17ms]

 161 pass
 7 skip
 10 fail
 544 expect() calls
Ran 178 tests across 8 files. [44.00s]
error: script "test" exited with code 1



failing tests  now



12 tests failed:
✗ Lifecycle Transformation > should generate useEffect hooks for services with lifecycle methods [304.06ms]
✗ Lifecycle Transformation > should transform components with lifecycle decorators correctly [774.15ms]
✗ Functional DI Transformation Tests > Tests that compile invalid > should resolve generic interface when existing [296.06ms]
✗ Functional DI Transformation Tests > Inline Interface Transformations > should transform destructured keys and types in parameters [286.05ms]
✗ Functional DI Transformation Tests > Inline Interface Transformations > should transform inline interface with destructuring [185.04ms]
✗ Functional DI Transformation Tests > Inline Interface Transformations > should transform inline interface without destructuring [164.03ms]
✗ Functional DI Transformation Tests > Inline Interface Transformations > should transform inline interface with all required services [187.04ms]
✗ Functional DI Transformation Tests > Inline Interface Transformations > should transform inline interface with mixed dependencies [197.04ms]
✗ Functional DI Transformation Tests > Separate Interface Transformations > should handle imported interfaces correctly [179.03ms]
✗ Functional DI Transformation Tests > Edge Cases > should handle components with complex generics [193.04ms]
✗ Functional DI Transformation Tests > Edge Cases > should handle missing dependencies gracefully [179.03ms]
✗ Functional DI Transformation Tests > Edge Cases > should handle deeply nested destructuring [226.04ms]

 162 pass
 7 skip
 12 fail
 558 expect() calls
Ran 181 tests across 9 files. [46.74s]
error: script "test" exited with code 1

fix only the tests that now additionally failed
run "bun test" only  for those not all tests...




