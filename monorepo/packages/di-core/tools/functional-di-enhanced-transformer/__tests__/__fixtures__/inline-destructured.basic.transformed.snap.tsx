// Auto-generated transformation snapshot for InlineValueProps
// Generated: 2025-07-16T19:06:26.301Z
import type { Inject, InjectOptional } from "@tdi2/di-core/markers";
import { ApiInterface, TestStateInterface } from "./shared-types";
import { useService, useOptionalService } from "@tdi2/di-core/context";

export function InlineValueProps(props: {
  services: {
    api: Inject<ApiInterface>;
  };
}) {
    const api = props.services?.api ?? (useService('ApiInterface') as unknown as ApiInterface);
  return <div>{api.getData()}Mixed dependencies component</div>;
}

export function InlineValueFoo(props: {
  services: {
    api: Inject<ApiInterface>;
  };
}) {
    const api = props.services?.api ?? (useService('ApiInterface') as unknown as ApiInterface);
  return <div>{api.getData()}Mixed dependencies component</div>;
}

export function InlineDestructuredNested(props: {
      services: {
        api: Inject<ApiInterface>;
      };
    }) {
    const api = props.services?.api ?? (useService('ApiInterface') as unknown as ApiInterface);
  return <div>{api.getData()}Mixed dependencies component</div>;
}

export function InlineDestructured(props: { api: Inject<ApiInterface> }) {
    const api = props.api ?? (useService('ApiInterface') as unknown as ApiInterface);
  return <div>{api.getData()}Mixed dependencies component</div>;
}

export function InlineDestProps(props: {
  services: {
    api: Inject<ApiInterface>;
  };
}) {
    const api = props.services?.api ?? (useService('ApiInterface') as unknown as ApiInterface);
  return <div>{api.getData()}Mixed dependencies component</div>;
}

/**
 *
 *    FIXME no injected useService hook
 */
export function InlineDestructured2ndApi(props: {
      services: {
        api: Inject<ApiInterface>;

        state: Inject<TestStateInterface>;
      };
    }) {
    const api = props.services?.api ?? (useService('ApiInterface') as unknown as ApiInterface);
    const state = props.services?.state ?? (useService('TestStateInterface') as unknown as TestStateInterface);
  return <div>{state.value}Mixed dependencies component</div>;
}

export interface Todo {
  id: string;
  title: string;
  completed: boolean;
  createdAt: Date;
  updatedAt: Date;
}

interface TodoCardProps {
  todo: Todo;
  services: {
    api: Inject<ApiInterface>;
  };
}

export function TodoCard(props: TodoCardProps) {
    const api = props.services?.api ?? (useService('ApiInterface') as unknown as ApiInterface);
  return <div>{todo.completed ? "completed" : "not completed"}</div>;
}
