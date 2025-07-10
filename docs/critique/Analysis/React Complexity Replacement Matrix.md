# React Complexity Replacement Matrix

## State Management

**Class Complexity** → **Hook Complexity**
- `this.state = { count: 0 }` → `const [count, setCount] = useState(0)`
- Instance variable scope → Closure scope + stale closure bugs
- Direct state access → State setter timing + batching issues
- Predictable state lifecycle → Manual dependency tracking

## Lifecycle Management

**Class Complexity** → **Hook Complexity**
- `componentDidMount()` → `useEffect(() => {}, [])`
- `componentDidUpdate()` → `useEffect(() => {})` + dependency array management
- `componentWillUnmount()` → `useEffect(() => { return () => {} }, [])`
- 3 explicit methods → 1 overloaded hook + manual dependency management
- Clear lifecycle phases → Effect timing + render phase understanding

## Logic Reuse

**Class Complexity** → **Hook Complexity**
- HOCs/Render props → Custom hooks
- Wrapper hell + prop drilling → Hook call order dependency
- Explicit component nesting → Implicit hook execution order
- Visual component tree → Invisible hook dependency chains

## Context Binding

**Class Complexity** → **Hook Complexity**
- `this.method.bind(this)` → `useCallback(() => {}, [deps])`
- One-time binding errors → Continuous dependency management
- Explicit binding → Manual memoization + dependency arrays
- Runtime `this` errors → Stale closure bugs + over-rendering

## Side Effects

**Class Complexity** → **Hook Complexity**
- Lifecycle method fragmentation → `useEffect` conflation
- `componentDidMount + componentDidUpdate + componentWillUnmount` → Single `useEffect` with complex logic
- Clear separation by lifecycle → Manual effect splitting + coordination
- Deterministic execution order → Effect scheduling + concurrent mode

## Performance Optimization

**Class Complexity** → **Hook Complexity**
- `shouldComponentUpdate()` → `React.memo()` + `useMemo()` + `useCallback()`
- One method for optimization → Three different hooks + dependency management
- Class-level optimization → Per-value memoization
- Instance method caching → Manual callback memoization

## Error Handling

**Class Complexity** → **Hook Complexity**
- `componentDidCatch()` → Still requires class components
- Built-in error boundaries → No hook equivalent (architectural gap)
- Instance-level error handling → External error boundary wrappers

## Component Communication

**Class Complexity** → **Hook Complexity**
- `createRef()` → `useRef()` + `forwardRef()`
- Instance method calls → Imperative handle patterns
- Direct instance access → Ref forwarding chains

## Testing

**Class Complexity** → **Hook Complexity**
- Mock instance methods → Mock hook implementations
- Instance state inspection → Hook state testing libraries
- Lifecycle method testing → Effect execution testing
- Clear test boundaries → Implementation detail testing

## Architecture

**Class Complexity** → **Hook Complexity**
- Inheritance hierarchies → Hook composition chains
- Interface contracts → Convention-based patterns
- Dependency injection → Context provider trees
- Compile-time structure → Runtime hook rules
- Explicit class boundaries → Implicit function boundaries

## Mental Model

**Class Complexity** → **Hook Complexity**
- Object-oriented patterns → Functional-looking but procedural patterns
- Instance lifecycle → Render cycle + effect scheduling
- `this` context → Closure scope + render timing
- Method dispatch → Hook call order + rules of hooks

## Summary

**What was eliminated**: Explicit structure, compile-time contracts, clear boundaries
**What was introduced**: Runtime rules, manual coordination, implicit dependencies

**Net effect**: Complexity moved from framework to developer, from structure to convention, from compile-time to runtime.