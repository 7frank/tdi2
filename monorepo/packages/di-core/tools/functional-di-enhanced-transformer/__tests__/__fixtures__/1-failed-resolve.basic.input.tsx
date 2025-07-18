import { useEffect } from "react";
import { Inject } from "@tdi2/di-core/markers";
import { Service } from "@tdi2/di-core/decorators";

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
  const { data, services } = props;

  useEffect(() => {
    services.processor.process(data);
  }, [data]);

  return (
    <>
      <h4>Generic Processor (Interface DI)</h4>

      {services.processor.processed && (
        <div>
          <strong>Result:</strong>{" "}
          {JSON.stringify(services.processor.processed)}
        </div>
      )}

      <div>{services.processor?.constructor.name || "Not resolved"}</div>
    </>
  );
}
