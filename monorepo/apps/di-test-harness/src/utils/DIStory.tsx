import React from "react";
import { StoryErrorBoundary } from "./StoryErrorBoundary";

type Props = { name?: string; children?: React.ReactElement; };
export function DIStory({ name, children }: Props) {
  return (
    <StoryErrorBoundary storyName={name}>
      <React.Suspense fallback={<div>Loading...</div>}>
        {children}
      </React.Suspense>
    </StoryErrorBoundary>
  );
}
