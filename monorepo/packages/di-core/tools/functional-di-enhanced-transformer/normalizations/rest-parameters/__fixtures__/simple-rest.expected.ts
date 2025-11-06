export function SimpleRest(props: { a: string; b: number; c: boolean; d: string }) {
  const a = props.a;
  const b = props.b;
  const rest = (({ a, b, ...rest }) => rest)(props ?? {});
  
  console.log(a, b, rest);
  return { a, b, rest };
}