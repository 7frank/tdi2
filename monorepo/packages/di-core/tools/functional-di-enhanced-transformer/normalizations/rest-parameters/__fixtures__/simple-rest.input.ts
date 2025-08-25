export function SimpleRest(props: { a: string; b: number; c: boolean; d: string }) {
  const { a, b, ...rest } = props;
  
  console.log(a, b, rest);
  return { a, b, rest };
}