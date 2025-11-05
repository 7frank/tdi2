export function SimpleDestructuring(props: { a: string; b: number; c: boolean }) {
  const a = props.a;
  const b = props.b;
  const c = props.c;
  
  console.log(a, b, c);
  return { a, b, c };
}