// src/stories/DestructuredKeysExample.stories.tsx
import React from "react";
import type { Story } from "@ladle/react";
import { CompileTimeDIContainer } from "@tdi2/di-core/container";
import { DIProvider } from "@tdi2/di-core/context";
import { DI_CONFIG } from "../.tdi2/di-config";
import { StoryErrorBoundary } from "../utils/StoryErrorBoundary";
import { lazy } from "../utils/simpleLazy";

// Simple lazy import with error handling - now Vite-friendly
const Lazy = lazy(
  () => import("../components/SimpleAnimalComponent"), 
  "SimpleAnimalComponent"
);

// Create and configure the DI container
const container = new CompileTimeDIContainer();
container.loadConfiguration(DI_CONFIG);


export const ASimpleAnimal: Story = () => {
  return (
    <StoryErrorBoundary storyName="DestructuredKeysExample">
      <DIProvider container={container}>
        <React.Suspense fallback={<div>Loading...</div>}>
          <Lazy />
        </React.Suspense>
      </DIProvider>
    </StoryErrorBoundary>
  );
};
