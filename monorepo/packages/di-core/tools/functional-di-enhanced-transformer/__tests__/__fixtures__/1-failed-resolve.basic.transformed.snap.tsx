// Auto-generated transformation snapshot for GenericProcessor
// Generated: 2025-07-18T10:55:20.261Z
import { useEffect } from "react";
import { Inject } from "@tdi2/di-core/markers";
import { Service } from "@tdi2/di-core/decorators";
import { useService, useOptionalService } from "@tdi2/di-core/context";

@Service()
class Foo implements GenericServiceInterface<string> {
  processed: string;
  process(data: string): Promise<string> {
    throw new Error("Method not implemented.");
  }
}

// Generic interface example
interface GenericServiceInterface<T> {
  processed: T;
  process(data: T): Promise<T>;
}

// Component using generic interface
export function GenericProcessor<T = any>(props: {
  data: T;
  services: {
    processor: Inject<GenericServiceInterface<T>>;
  };
}) {
    const processor = props.services?.processor;
    const { data } = props; if (!processor) {throw new Error("Could not find implementation for 'GenericServiceInterface<T>'");}
  useEffect(() => {
    processor.process(data);
  }, [data]);

  return (
    <>
      <h4>Generic Processor (Interface DI)</h4>

      {processor.processed && (
        <div>
          <strong>Result:</strong>{" "}
          {JSON.stringify(processor.processed)}
        </div>
      )}

      <div>{processor.constructor.name || "Not resolved"}</div>
    </>
  );
}
