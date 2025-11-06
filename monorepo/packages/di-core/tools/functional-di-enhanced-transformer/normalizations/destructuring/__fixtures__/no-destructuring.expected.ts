export function NoDestructuring(props: { a: string; b: number }) {
  console.log(props.a, props.b);
  return props.a + props.b;
}