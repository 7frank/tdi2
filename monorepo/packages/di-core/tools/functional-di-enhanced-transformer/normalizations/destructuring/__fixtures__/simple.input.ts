export function SimpleDestructuring(props: { a: string; b: number; c: boolean }) {
  const { a, b, c } = props;
  
  console.log(a, b, c);
  return { a, b, c };
}