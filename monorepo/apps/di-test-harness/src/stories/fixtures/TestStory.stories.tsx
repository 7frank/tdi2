import type { Story } from "@ladle/react";
import { lazy, safeLazy } from "../../utils/simpleLazy";
import { DITransformationDemo } from "../../utils/DITransformationDemo";
import { CompileTimeDIContainer } from "@tdi2/di-core/container";
import { DI_CONFIG } from "../../.tdi2/di-config";

// Import the transformed components for live demo
const InlineDestructuredBasic = lazy(
  () =>
    import("@tdi2/di-core/examples/inline-destructured.basic.transformed.snap"),
  "InlineDestructured"
);

const FailedResolveBasic = lazy(
  () =>
    import("@tdi2/di-core/examples/1-failed-resolve.basic.transformed.snap"),
  "FailedResolve"
);

const ComplexGenericsBasic = lazy(
  () =>
    import("@tdi2/di-core/examples/complex-generics.basic.transformed.snap"),
  "ComplexGenerics"
);

const ComplexComponentBasic = lazy(
  () =>
    import("@tdi2/di-core/examples/complex-component.basic.transformed.snap"),
  "ComplexComponent"
);

const DeepDestructuringBasic = lazy(
  () =>
    import("@tdi2/di-core/examples/deep-destructuring.basic.transformed.snap"),
  "DeepDestructuring"
);

const ConditionalRenderingBasic = lazy(
  () =>
    import(
      "@tdi2/di-core/examples/conditional-rendering.basic.transformed.snap"
    ),
  "ConditionalRendering"
);

// const ComplexPropsSpreadingBasic = lazy(
//   () =>
//     import(
//       "@tdi2/di-core/examples/complex-props-spreading.basic.transformed.snap"
//     ),
//   "ComplexPropsSpreading"
// );

const InlineAllRequiredBasic = lazy(
  () =>
    import("@tdi2/di-core/examples/inline-all-required.basic.transformed.snap"),
  "InlineAllRequired"
);

const ImportedInterfaceBasic = lazy(
  () =>
    import("@tdi2/di-core/examples/imported-interface.basic.transformed.snap"),
  "ImportedInterface"
);

const EmptyServicesBasic = lazy(
  () => import("@tdi2/di-core/examples/empty-services.basic.transformed.snap"),
  "EmptyServices"
);

const InlineMixedDepsBasic = lazy(
  () =>
    import("@tdi2/di-core/examples/inline-mixed-deps.basic.transformed.snap"),
  "InlineMixedDeps"
);

const InlineWithDestructuringBasic = lazy(
  () =>
    import(
      "@tdi2/di-core/examples/inline-with-destructuring.basic.transformed.snap"
    ),
  "InlineWithDestructuring"
);

const InlineWithoutDestructuringBasic = lazy(
  () =>
    import(
      "@tdi2/di-core/examples/inline-without-destructuring.basic.transformed.snap"
    ),
  "InlineWithoutDestructuring"
);

const LifecycleHooksBasic = lazy(
  () => import("@tdi2/di-core/examples/lifecycle-hooks.basic.transformed.snap"),
  "LifecycleHooks"
);

const MultipleComponentsBasic = lazy(
  () =>
    import("@tdi2/di-core/examples/multiple-components.basic.transformed.snap"),
  "MultipleComponents"
);

const MissingDependenciesBasic = lazy(
  () =>
    import(
      "@tdi2/di-core/examples/missing-dependencies.basic.transformed.snap"
    ),
  "MissingDependencies"
);

const NoServicesBasic = lazy(
  () => import("@tdi2/di-core/examples/no-services.basic.transformed.snap"),
  "NoServices"
);

const NestedArrowFunctionsBasic = lazy(
  () =>
    import(
      "@tdi2/di-core/examples/nested-arrow-functions.basic.transformed.snap"
    ),
  "NestedArrowFunctions"
);

const SeparateInterfaceArrowBasic = lazy(
  () =>
    import(
      "@tdi2/di-core/examples/separate-interface-arrow.basic.transformed.snap"
    ),
  "SeparateInterfaceArrow"
);

const SeparateInterfaceBasic = lazy(
  () =>
    import("@tdi2/di-core/examples/separate-interface.basic.transformed.snap"),
  "SeparateInterface"
);

const NonDiServicesBasic = lazy(
  () => import("@tdi2/di-core/examples/non-di-services.basic.transformed.snap"),
  "NonDiServices"
);

const ServiceLifecycleDecoratorsBasic = lazy(
  () =>
    import(
      "@tdi2/di-core/examples/service-lifecycle-decorators.basic.transformed.snap"
    ),
  "ServiceLifecycleDecorators"
);

const VerboseExampleBasic = lazy(
  () => import("@tdi2/di-core/examples/verbose-example.basic.transformed.snap"),
  "VerboseExample"
);

const SnapshotUpdateTestBasic = lazy(
  () =>
    import(
      "@tdi2/di-core/examples/snapshot-update-test.basic.transformed.snap"
    ),
  "SnapshotUpdateTest"
);

const DestructuredServicesParamsBasic = lazy(
  () =>
    import(
      "@tdi2/di-core/examples/destructured-services-params.basic.transformed.snap"
    ),
  "DestructuredServicesParams"
);

const SecondaryDestructuringBasic = lazy(
  () =>
    import(
      "@tdi2/di-core/examples/secondary-destructuring.basic.transformed.snap"
    ),
  "SecondaryDestructuring"
);

// Create and configure the DI container
const container = new CompileTimeDIContainer();
container.loadConfiguration(DI_CONFIG);

export const AInlineDestructuredBasic: Story = () => {
  return (
    <DITransformationDemo
      diContainer={container}
      sourceImport={() =>
        import("@tdi2/di-core/sources/inline-destructured.basic.input.tsx?raw")
      }
      destImport={() =>
        import(
          "@tdi2/di-core/sources/inline-destructured.basic.transformed.snap.tsx?raw"
        )
      }
      transformedComponent={InlineDestructuredBasic}
      title="Inline Destructured Props Transformation"
      originalFileName="inline-destructured.basic.input.tsx"
      transformedFileName="inline-destructured.basic.transformed.snap.tsx"
    />
  );
};

export const AFailedResolveBasic: Story = () => {
  return (
    <DITransformationDemo
      diContainer={container}
      sourceImport={() =>
        import("@tdi2/di-core/sources/1-failed-resolve.basic.input.tsx?raw")
      }
      destImport={() =>
        import(
          "@tdi2/di-core/sources/1-failed-resolve.basic.transformed.snap.tsx?raw"
        )
      }
      transformedComponent={FailedResolveBasic}
      title="Failed Resolve Basic Transformation"
      originalFileName="1-failed-resolve.basic.input.tsx"
      transformedFileName="1-failed-resolve.basic.transformed.snap.tsx"
    />
  );
};

export const AComplexGenericsBasic: Story = () => {
  return (
    <DITransformationDemo
      diContainer={container}
      sourceImport={() =>
        import("@tdi2/di-core/sources/complex-generics.basic.input.tsx?raw")
      }
      destImport={() =>
        import(
          "@tdi2/di-core/sources/complex-generics.basic.transformed.snap.tsx?raw"
        )
      }
      transformedComponent={ComplexGenericsBasic}
      title="Complex Generics Basic Transformation"
      originalFileName="complex-generics.basic.input.tsx"
      transformedFileName="complex-generics.basic.transformed.snap.tsx"
    />
  );
};

export const AComplexComponentBasic: Story = () => {
  return (
    <DITransformationDemo
      diContainer={container}
      sourceImport={() =>
        import("@tdi2/di-core/sources/complex-component.basic.input.tsx?raw")
      }
      destImport={() =>
        import(
          "@tdi2/di-core/sources/complex-component.basic.transformed.snap.tsx?raw"
        )
      }
      transformedComponent={ComplexComponentBasic}
      title="Complex Component Basic Transformation"
      originalFileName="complex-component.basic.input.tsx"
      transformedFileName="complex-component.basic.transformed.snap.tsx"
    />
  );
};

export const ADeepDestructuringBasic: Story = () => {
  return (
    <DITransformationDemo
      diContainer={container}
      sourceImport={() =>
        import("@tdi2/di-core/sources/deep-destructuring.basic.input.tsx?raw")
      }
      destImport={() =>
        import(
          "@tdi2/di-core/sources/deep-destructuring.basic.transformed.snap.tsx?raw"
        )
      }
      transformedComponent={DeepDestructuringBasic}
      title="Deep Destructuring Basic Transformation"
      originalFileName="deep-destructuring.basic.input.tsx"
      transformedFileName="deep-destructuring.basic.transformed.snap.tsx"
    />
  );
};

export const AConditionalRenderingBasic: Story = () => {
  return (
    <DITransformationDemo
      diContainer={container}
      sourceImport={() =>
        import(
          "@tdi2/di-core/sources/conditional-rendering.basic.input.tsx?raw"
        )
      }
      destImport={() =>
        import(
          "@tdi2/di-core/sources/conditional-rendering.basic.transformed.snap.tsx?raw"
        )
      }
      transformedComponent={ConditionalRenderingBasic}
      title="Conditional Rendering Basic Transformation"
      originalFileName="conditional-rendering.basic.input.tsx"
      transformedFileName="conditional-rendering.basic.transformed.snap.tsx"
    />
  );
};

// export const AComplexPropsSpreadingBasic: Story = () => {
//   return (
//     <DITransformationDemo
//       diContainer={container}
//       sourceImport={() =>
//         import(
//           "@tdi2/di-core/sources/complex-props-spreading.basic.input.tsx?raw"
//         )
//       }
//       destImport={() =>
//         import(
//           "@tdi2/di-core/sources/complex-props-spreading.basic.transformed.snap.tsx?raw"
//         )
//       }
//       transformedComponent={ComplexPropsSpreadingBasic}
//       title="Complex Props Spreading Basic Transformation"
//       originalFileName="complex-props-spreading.basic.input.tsx"
//       transformedFileName="complex-props-spreading.basic.transformed.snap.tsx"
//     />
//   );
// };

export const AInlineAllRequiredBasic: Story = () => {
  return (
    <DITransformationDemo
      diContainer={container}
      sourceImport={() =>
        import("@tdi2/di-core/sources/inline-all-required.basic.input.tsx?raw")
      }
      destImport={() =>
        import(
          "@tdi2/di-core/sources/inline-all-required.basic.transformed.snap.tsx?raw"
        )
      }
      transformedComponent={InlineAllRequiredBasic}
      title="Inline All Required Basic Transformation"
      originalFileName="inline-all-required.basic.input.tsx"
      transformedFileName="inline-all-required.basic.transformed.snap.tsx"
    />
  );
};

export const AImportedInterfaceBasic: Story = () => {
  return (
    <DITransformationDemo
      diContainer={container}
      sourceImport={() =>
        import("@tdi2/di-core/sources/imported-interface.basic.input.tsx?raw")
      }
      destImport={() =>
        import(
          "@tdi2/di-core/sources/imported-interface.basic.transformed.snap.tsx?raw"
        )
      }
      transformedComponent={ImportedInterfaceBasic}
      title="Imported Interface Basic Transformation"
      originalFileName="imported-interface.basic.input.tsx"
      transformedFileName="imported-interface.basic.transformed.snap.tsx"
    />
  );
};

export const AEmptyServicesBasic: Story = () => {
  return (
    <DITransformationDemo
      diContainer={container}
      sourceImport={() =>
        import("@tdi2/di-core/sources/empty-services.basic.input.tsx?raw")
      }
      destImport={() =>
        import(
          "@tdi2/di-core/sources/empty-services.basic.transformed.snap.tsx?raw"
        )
      }
      transformedComponent={EmptyServicesBasic}
      title="Empty Services Basic Transformation"
      originalFileName="empty-services.basic.input.tsx"
      transformedFileName="empty-services.basic.transformed.snap.tsx"
    />
  );
};

export const AInlineMixedDepsBasic: Story = () => {
  return (
    <DITransformationDemo
      diContainer={container}
      sourceImport={() =>
        import("@tdi2/di-core/sources/inline-mixed-deps.basic.input.tsx?raw")
      }
      destImport={() =>
        import(
          "@tdi2/di-core/sources/inline-mixed-deps.basic.transformed.snap.tsx?raw"
        )
      }
      transformedComponent={InlineMixedDepsBasic}
      title="Inline Mixed Deps Basic Transformation"
      originalFileName="inline-mixed-deps.basic.input.tsx"
      transformedFileName="inline-mixed-deps.basic.transformed.snap.tsx"
    />
  );
};

export const AInlineWithDestructuringBasic: Story = () => {
  return (
    <DITransformationDemo
      diContainer={container}
      sourceImport={() =>
        import(
          "@tdi2/di-core/sources/inline-with-destructuring.basic.input.tsx?raw"
        )
      }
      destImport={() =>
        import(
          "@tdi2/di-core/sources/inline-with-destructuring.basic.transformed.snap.tsx?raw"
        )
      }
      transformedComponent={InlineWithDestructuringBasic}
      title="Inline With Destructuring Basic Transformation"
      originalFileName="inline-with-destructuring.basic.input.tsx"
      transformedFileName="inline-with-destructuring.basic.transformed.snap.tsx"
    />
  );
};

export const AInlineWithoutDestructuringBasic: Story = () => {
  return (
    <DITransformationDemo
      diContainer={container}
      sourceImport={() =>
        import(
          "@tdi2/di-core/sources/inline-without-destructuring.basic.input.tsx?raw"
        )
      }
      destImport={() =>
        import(
          "@tdi2/di-core/sources/inline-without-destructuring.basic.transformed.snap.tsx?raw"
        )
      }
      transformedComponent={InlineWithoutDestructuringBasic}
      title="Inline Without Destructuring Basic Transformation"
      originalFileName="inline-without-destructuring.basic.input.tsx"
      transformedFileName="inline-without-destructuring.basic.transformed.snap.tsx"
    />
  );
};

export const ALifecycleHooksBasic: Story = () => {
  return (
    <DITransformationDemo
      diContainer={container}
      sourceImport={() =>
        import("@tdi2/di-core/sources/lifecycle-hooks.basic.input.tsx?raw")
      }
      destImport={() =>
        import(
          "@tdi2/di-core/sources/lifecycle-hooks.basic.transformed.snap.tsx?raw"
        )
      }
      transformedComponent={LifecycleHooksBasic}
      title="Lifecycle Hooks Basic Transformation"
      originalFileName="lifecycle-hooks.basic.input.tsx"
      transformedFileName="lifecycle-hooks.basic.transformed.snap.tsx"
    />
  );
};

export const AMultipleComponentsBasic: Story = () => {
  return (
    <DITransformationDemo
      diContainer={container}
      sourceImport={() =>
        import("@tdi2/di-core/sources/multiple-components.basic.input.tsx?raw")
      }
      destImport={() =>
        import(
          "@tdi2/di-core/sources/multiple-components.basic.transformed.snap.tsx?raw"
        )
      }
      transformedComponent={MultipleComponentsBasic}
      title="Multiple Components Basic Transformation"
      originalFileName="multiple-components.basic.input.tsx"
      transformedFileName="multiple-components.basic.transformed.snap.tsx"
    />
  );
};

export const AMissingDependenciesBasic: Story = () => {
  return (
    <DITransformationDemo
      diContainer={container}
      sourceImport={() =>
        import("@tdi2/di-core/sources/missing-dependencies.basic.input.tsx?raw")
      }
      destImport={() =>
        import(
          "@tdi2/di-core/sources/missing-dependencies.basic.transformed.snap.tsx?raw"
        )
      }
      transformedComponent={MissingDependenciesBasic}
      title="Missing Dependencies Basic Transformation"
      originalFileName="missing-dependencies.basic.input.tsx"
      transformedFileName="missing-dependencies.basic.transformed.snap.tsx"
    />
  );
};

export const ANoServicesBasic: Story = () => {
  return (
    <DITransformationDemo
      diContainer={container}
      sourceImport={() =>
        import("@tdi2/di-core/sources/no-services.basic.input.tsx?raw")
      }
      destImport={() =>
        import(
          "@tdi2/di-core/sources/no-services.basic.transformed.snap.tsx?raw"
        )
      }
      transformedComponent={NoServicesBasic}
      title="No Services Basic Transformation"
      originalFileName="no-services.basic.input.tsx"
      transformedFileName="no-services.basic.transformed.snap.tsx"
    />
  );
};

export const ANestedArrowFunctionsBasic: Story = () => {
  return (
    <DITransformationDemo
      diContainer={container}
      sourceImport={() =>
        import(
          "@tdi2/di-core/sources/nested-arrow-functions.basic.input.tsx?raw"
        )
      }
      destImport={() =>
        import(
          "@tdi2/di-core/sources/nested-arrow-functions.basic.transformed.snap.tsx?raw"
        )
      }
      transformedComponent={NestedArrowFunctionsBasic}
      title="Nested Arrow Functions Basic Transformation"
      originalFileName="nested-arrow-functions.basic.input.tsx"
      transformedFileName="nested-arrow-functions.basic.transformed.snap.tsx"
    />
  );
};

export const ASeparateInterfaceArrowBasic: Story = () => {
  return (
    <DITransformationDemo
      diContainer={container}
      sourceImport={() =>
        import(
          "@tdi2/di-core/sources/separate-interface-arrow.basic.input.tsx?raw"
        )
      }
      destImport={() =>
        import(
          "@tdi2/di-core/sources/separate-interface-arrow.basic.transformed.snap.tsx?raw"
        )
      }
      transformedComponent={SeparateInterfaceArrowBasic}
      title="Separate Interface Arrow Basic Transformation"
      originalFileName="separate-interface-arrow.basic.input.tsx"
      transformedFileName="separate-interface-arrow.basic.transformed.snap.tsx"
    />
  );
};

export const ASeparateInterfaceBasic: Story = () => {
  return (
    <DITransformationDemo
      diContainer={container}
      sourceImport={() =>
        import("@tdi2/di-core/sources/separate-interface.basic.input.tsx?raw")
      }
      destImport={() =>
        import(
          "@tdi2/di-core/sources/separate-interface.basic.transformed.snap.tsx?raw"
        )
      }
      transformedComponent={SeparateInterfaceBasic}
      title="Separate Interface Basic Transformation"
      originalFileName="separate-interface.basic.input.tsx"
      transformedFileName="separate-interface.basic.transformed.snap.tsx"
    />
  );
};

export const ANonDiServicesBasic: Story = () => {
  return (
    <DITransformationDemo
      diContainer={container}
      sourceImport={() =>
        import("@tdi2/di-core/sources/non-di-services.basic.input.tsx?raw")
      }
      destImport={() =>
        import(
          "@tdi2/di-core/sources/non-di-services.basic.transformed.snap.tsx?raw"
        )
      }
      transformedComponent={NonDiServicesBasic}
      title="Non DI Services Basic Transformation"
      originalFileName="non-di-services.basic.input.tsx"
      transformedFileName="non-di-services.basic.transformed.snap.tsx"
    />
  );
};

export const AServiceLifecycleDecoratorsBasic: Story = () => {
  return (
    <DITransformationDemo
      diContainer={container}
      sourceImport={() =>
        import(
          "@tdi2/di-core/sources/service-lifecycle-decorators.basic.input.tsx?raw"
        )
      }
      destImport={() =>
        import(
          "@tdi2/di-core/sources/service-lifecycle-decorators.basic.transformed.snap.tsx?raw"
        )
      }
      transformedComponent={ServiceLifecycleDecoratorsBasic}
      title="Service Lifecycle Decorators Basic Transformation"
      originalFileName="service-lifecycle-decorators.basic.input.tsx"
      transformedFileName="service-lifecycle-decorators.basic.transformed.snap.tsx"
    />
  );
};

export const AVerboseExampleBasic: Story = () => {
  return (
    <DITransformationDemo
      diContainer={container}
      sourceImport={() =>
        import("@tdi2/di-core/sources/verbose-example.basic.input.tsx?raw")
      }
      destImport={() =>
        import(
          "@tdi2/di-core/sources/verbose-example.basic.transformed.snap.tsx?raw"
        )
      }
      transformedComponent={VerboseExampleBasic}
      title="Verbose Example Basic Transformation"
      originalFileName="verbose-example.basic.input.tsx"
      transformedFileName="verbose-example.basic.transformed.snap.tsx"
    />
  );
};

export const ASnapshotUpdateTestBasic: Story = () => {
  return (
    <DITransformationDemo
      diContainer={container}
      sourceImport={() =>
        import("@tdi2/di-core/sources/snapshot-update-test.basic.input.tsx?raw")
      }
      destImport={() =>
        import(
          "@tdi2/di-core/sources/snapshot-update-test.basic.transformed.snap.tsx?raw"
        )
      }
      transformedComponent={SnapshotUpdateTestBasic}
      title="Snapshot Update Test Basic Transformation"
      originalFileName="snapshot-update-test.basic.input.tsx"
      transformedFileName="snapshot-update-test.basic.transformed.snap.tsx"
    />
  );
};

export const ADestructuredServicesParamsBasic: Story = () => {
  return (
    <DITransformationDemo
      diContainer={container}
      sourceImport={() =>
        import(
          "@tdi2/di-core/sources/destructured-services-params.basic.input.tsx?raw"
        )
      }
      destImport={() =>
        import(
          "@tdi2/di-core/sources/destructured-services-params.basic.transformed.snap.tsx?raw"
        )
      }
      transformedComponent={DestructuredServicesParamsBasic}
      title="Destructured Services Params Basic Transformation"
      originalFileName="destructured-services-params.basic.input.tsx"
      transformedFileName="destructured-services-params.basic.transformed.snap.tsx"
    />
  );
};

export const ASecondaryDestructuringBasic: Story = () => {
  return (
    <DITransformationDemo
      diContainer={container}
      sourceImport={() =>
        import(
          "@tdi2/di-core/sources/secondary-destructuring.basic.input.tsx?raw"
        )
      }
      destImport={() =>
        import(
          "@tdi2/di-core/sources/secondary-destructuring.basic.transformed.snap.tsx?raw"
        )
      }
      transformedComponent={SecondaryDestructuringBasic}
      title="Secondary Destructuring Basic Transformation"
      originalFileName="secondary-destructuring.basic.input.tsx"
      transformedFileName="secondary-destructuring.basic.transformed.snap.tsx"
    />
  );
};
