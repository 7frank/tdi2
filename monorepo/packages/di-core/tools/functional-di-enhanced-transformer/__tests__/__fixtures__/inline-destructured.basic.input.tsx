import type { Inject, InjectOptional } from "@tdi2/di-core/markers";
import { ApiInterface, TestStateInterface } from "./shared-types";

export function InlineValueProps(props: {
  services: {
    api: Inject<ApiInterface>;
  };
}) {
  const { services } = props;
  return <div>{services.api.getData()}Mixed dependencies component</div>;
}

export function InlineValueFoo(foo: {
  services: {
    api: Inject<ApiInterface>;
  };
}) {
  const { services } = foo;
  return <div>{services.api.getData()}Mixed dependencies component</div>;
}

export function InlineDestructuredNested({
  services,
}: {
  services: {
    api: Inject<ApiInterface>;
  };
}) {
  return <div>{services.api.getData()}Mixed dependencies component</div>;
}

export function InlineDestructured({ api }: { api: Inject<ApiInterface> }) {
  return <div>{api.getData()}Mixed dependencies component</div>;
}

export function InlineDestProps(props: {
  services: {
    api: Inject<ApiInterface>;
  };
}) {
  const {
    services: { api },
  } = props;
  return <div>{api.getData()}Mixed dependencies component</div>;
}

/**
 *
 *    FIXME no injected useService hook
 */
export function InlineDestructured2ndApi({
  services,
}: {
  services: {
    api: Inject<ApiInterface>;

    state: Inject<TestStateInterface>;
  };
}) {
  return <div>{services.state.value}Mixed dependencies component</div>;
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
  const {
    todo,
    services: { api },
  } = props;

  return <div>{todo.completed ? "completed" : "not completed"}</div>;
}
