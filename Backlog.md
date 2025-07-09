# Backlog

## ordered log

### [❌] issue sync

- create a small cli that helps us sync issues with github projects / issues

### [❌] create showcases for more complex scenarios

- e.g. complex forms https://claude.ai/chat/48ebf950-986b-476d-bb0c-09a5c87fe041

### [❌] useObservable

- what is RSI structurally (something else?, MVC,MVVM, MVP .. it can be all of them if implemented in a certain way)
  - with proxy state
  - with observables
- see [comparision](./docs/misc/view-logic-pattern.md)

- establish / evaluate rrecipe and establish dos and donts
  - **maybe** dont subscribe manually oin FC only use state of pbservasbalble and create functions that trigger changes but dont make them subscribable
  - **maybe** use robservables for interservice communication
  - **maybe** but then again maybe we dont need that
  - **...** explore what are good and bad patterns here by looking what is out there
  - TBA

### [❌] evaluate composability of DI

- we could create @Services(scope="dev")
- now we could have one or multiple DI_CONFIG
- that we could **compose**
- or **filter**
- we could nest them
  - maybe a global and one for a certain subtree e.g. multiple forms or pages
- in essence we would have freedom to combine them as we want which could give us opportunites when injecting

### [❌] DI bugs & side effects (part 1)

#### [❌] ⚠️ interfaces still not working with generic any

> Inject<ExampleApiInterface>;

> Validation Issues:
> Missing: UserApiServiceImpl -> CacheInterface_any

#### [❌] FIXME TodoApp TodoService2 isnt properly injected

- it was not properly injected in case there where two or more interface with the same name e.g. "TodoServiceInterface" and @Services that impplement them
- Fix or use monorepo/apps/legacy/src/di.integration.test.tsx for this scenario

#### [❌] FIXME having two different classes of the same name will one not be resolved properly

e.g.:

1 TodoService implements TodoServiceInterface
2 TodoService implements TodoServiceType

#### [❌] FIXME duplicated keys see generated list of services

- potential duplicate

#### [❌] is DI scope using import path

- potential duplicate
- if say we have two "implements UserRepoInterface"

#### [❌] in case of multiple unnamed generic interfaces we should throw an error or warning (Inject<AsyncState<{ name: string; email: string }>>;)

evaluate scenarios

- to make it easier we probably want to enforce a rule/warning that Inject interfaces need to contain inline types
- or we have some rule that warns if the Inject is not a single type/interface Inject<Foo> where Foo can be any interfac/type but must be itself not generic or subtyped...

#### [❌] Fixme: example which his generating invalid code

```typescript
export function DemographicsForm(props: DemographicsFormProps) {
  const { services, onComplete } = props;

  const { demographicsForm } = services;
}
```

### [❌] FIXME this type of destructuring requires a test and a fix as it is not properly transformed

```typescript
interface AppProps {
  services: {
    todoService: Inject<TodoServiceInterface>;
    appState: Inject<AppStateServiceInterface>;
    notifications: Inject<NotificationServiceInterface>;
  };
}

export function TodoApp2({
  services: { todoService, appState, notifications },
}: AppProps) {}
```

### [❌] FIXME could not fast refrest useDi export incompatible

### [❌] Profile decorator and marker

### [❌] Lazy decorator and marker

### [❌] cli

- which implements "which implemetnation belongs to <interface> " search
- use cas edriven more feature, goal reduce DI friction for DX

"faster" what causes this? **and** alternative to dependency viewer

### [❌] test mobx in favor of valtio

> maybe the opproblem with valtio is more a hot reloading problem than actually valtios fault

- https://www.npmjs.com/package/mobx-react-lite
- valtio needs a "proxy" state and a "snap" for reactivity
- mobx might be able to only use one "state-proxy"
  - there is this makeAutoObservable which we might be able to inject into the class constructor of new "@Service" annotated classes at compile time
  - there also is the Observer FC that we need to inject into FC that use "Inject" - Marker for observablility to work

### [❌] check for shared logic in these two and generate unit tests

- 7frank/tdi2/monorepo/packages/di-core/tools/shared/RecursiveInjectExtractor.ts
- 7frank/tdi2/monorepo/packages/di-core/tools/shared/SharedDependencyExtractor.ts

### [❌] clean up & remove

- [✅] useObservableState and its usage

- [✅] useAsyncServiceInterface
- [❌] remove AsyncState special cases, or fix them in di-core, they where never meant to be this specific in the first place
- [❌] fix or remove debug endpoints
  - http://localhost:5173/\_di_debug
  - http://localhost:5173/\_di_interfaces
  - http://localhost:5173/\_di_configs"
  - if removed, remove middleware endpoints too

### [❌] create do's and don't for valtio proxies / document quirks

- or rather a note atm, destructuring is reactive setting props directly in a service is not due to reasons
  - we might be able to add a compile step later that utilized destructuring and thus triggers this automatically

```typescript
  setFilter(status: "all" | "active" | "completed"): void {
    // Note: by destructuring we seem to trigger reactivity via the proxy
    this.state.filter = { ...this.state.filter, status };
    // this.state.filter.status = status;
  }
```

### [❌] explore implications of not using the value provided by useSnapshot in code

```typescript
serviceInstance=...
const state = proxy(serviceInstance);
const snap = useSnapshot(state);
```

di-core tests generate transformed files in the wrong directory "../../"

### [❌] hack the stack for console to get proper line numbers when logging error and so on not the monkey patched

### [❌] evaluate framework

[EvaluationPlan](./monorepo/docs/EvaluationPlan.md)

### [❌] article on dev.to with todoapp and core features

- use existing docs

### [❌] **fix test files** missing test file dependency-tree-builder-test.ts generate one

### [❌] **fix test files** context.test.tsx\_

### [❌] use falso in tests and fixtures, we don't want the ai to hard code any solutions

### [❌] service-registry / autoregistry in .tdi generated

- not used? at least configured wrong, so problaby redundant
- 7frank/tdi2/examples/tdi2-basic-example/src/.tdi2/registry.ts

### [❌] split the code base into a npm monorepo

- [✅] tdi2-core
- tdi2-react-utils
  - e.g. di dependency viewer and elk dpendencies
- tdi2-documentation
  - contain core examples for all features
- todo-app
  - comprehensive implementation of tdi react and native di
- logging
  - otel **FIXME** dependencies broken in generator for services that are not in legacy

> suggest different module structure if that makes sense to you
> create linux shell scripts for the heavy liftig of the refactoring enumerate the scripts and create an artifact for each
> dont recreate files solely for imports let that be handled by the shell scripts

#### actions taken

- divide and conquery
- fits in your head
- do one thing but one thing good

> first generate directory structure so that we can refactor at all `git ls-files`

> Prompt: maybe first move files into proper directory structure and fix dependencies and only later add package.json for each ? but lets do this incrementally first create the script for the directory strucutre and the one to move the files

> Prompt: the package.json files for each package and and app for now should not contain any build stripts. instead i want to just import the plain files from there, the monorepo should for now only be used structurally. this in mind create the package json files only with the dependencies required for this package

### [❌] update claude md file from project

Suggested .claude/commands/stabilize-cycle.md

Start a stabilization iteration:

1. Create failing test for $ARGUMENTS
2. Push branch
3. Run full suite, save output log
4. Commit wip with log
5. Run Cloud AI analysis
6. Apply suggestions
7. Re-run tests
8. Repeat until stable

List of Things Belonging in CLAUDE.md:

    Project overview (layout, commands)

    Workflow/branching rules

    Stabilization loop steps (written above)

    Style and tooling conventions

    File placement guidelines

    Slash‑command references

    Where to store logs or generated artifacts

### [❌] service should be able to "implements" multiple interfaces and Inject<I1,I2,I3>

- check out how spring handles this, maybe easier as documentation artifact/recipe:

```typescript
 interface AllInterfaces extends Foo,Bar,Baz"

 @Service()
 class MyService implements AllInterfaces
```

### [❌] [out-of-scope] Immutability

https://github.com/aleclarson/valtio-kit

### [❌] [out-of-scope] ast plugin to search for valtios useSnapshot and optimize re-renders

- currently injection a service and using valtio, will re-render components fully each time one property of the state changes
- This is definitely out of scope until the core api is stable and proved a decent adoption if any
- This plugin also could be a standalone and would not necessarily have to be coupled to our code base
- this compile step would leave us mostly with what svelte does (maybe still more effective)

---

## Done

### [✅] React RFP

- generic rfp
  - speaker bio
- slide deck https://martenbe.github.io/mkslides/#/

### [✅] make real world example

#### [✅] compile to npm package for di-vite-plugin and publish

#### [✅] compile to npm package for di-core and publish

#### [✅] create stand alone example(s) in top level of monorepo

- that uses npm di-core & di-vite-plugin packages

### [✅] evaluate different pattern in combination or as alternative to valtio reactivity

> see "Recipes" for some ideas already

- Valtio vs or instead of observable or either or a combination of them
  - reason: observer pattern within the class services would be nice to have "subscribe.."
  - rxjs streams or ralway oriented style might be an improvement in readability and maintainability
    - **BUT** that should problably be more convention than core comile logic
  - https://chatgpt.com/share/6865b204-ac20-8009-87c3-9602fa61813f
- an **extension** via additional plugin or and flag could be similar to svelte
  - if service.observableVal => return <>{service.observableVal}</>
  - then transform to foo=useSubscribe({service.observableVal}) return <>{foo}</>
  - this would make classes more subscripotion/onChange friendly internally

#### [✅] DI bugs & side effects (part 1) -di-core changes broke the dev

- see [Troubleshooting](./Troubleshooting.md)

### [✅] fix remaining tests for markers and decorators and actually replace the implementation in dev

### [✅] extract shared logic from di-core tools for class and FC Inject

### [✅]Complete Interface Variant Support

> make sure that Inject marker and decorator approach variants work there are some already implemented. The generic interface i think is implemented too specific with "AsyncState". maybe ts-morph has a method that takes the AST "implements FOOO" and calls a method "implementsToString(astSnippet)"

Here is an exhaustive list of what kind the DI decorator @Service and and react marker Inject<T> should work with and enable DI properly

Inject<T> marker and class X implements|extends classOrInterface decorator

```typescript
// Standalone class
@Service()
class StandaloneService {}

// Implements simple interface
@Service()
class SimpleInterfaceService implements FooInterface {}

// Implements generic interface
@Service()
class GenericInterfaceService implements FooInterface<A, B> {}

// Extends base class
@Service()
class BaseClassService extends BaseClass {}

// Extends generic base class
@Service()
class GenericBaseClassService extends BaseClass<A, B> {}

// Implements and extends
@Service()
class ImplementsAndExtendsService
  extends BaseClass<A>
  implements FooInterface<B> {}

// Implements multiple interfaces
@Service()
class MultiInterfaceService implements FooInterface, BarInterface {}

// Implements interface with nested generics
@Service()
class NestedGenericInterfaceService implements FooInterface<Bar<Baz<C>>> {}
```

```typescript
// Single service injection via props (function)
function Component(props: { service: Inject<FooInterface> }) {
  const { service } = props;
  return <div />;
}

// Single service injection via props (arrow function)
const Component = (props: { service: Inject<FooInterface<A, B>> }) => {
  const { service } = props;
  return <div />;
}

// Destructured single service directly in parameter
const Component = ({ service }: { service: Inject<FooInterface> }) => {
  return <div />;
}

// Multiple services via nested object
function Component(props: { services: { foo: Inject<FooInterface>, bar: Inject<BarInterface> } }) {
  const { services: { foo, bar } } = props;
  return <div />;
}

// Multiple services with generics
const Component = ({ services }: { services: { foo: Inject<FooInterface<A>>, bar: Inject<BarInterface<B>> } }) => {
  return <div />;
}

// Nested generic injection
const Component = ({ service }: { service: Inject<FooInterface<Bar<Baz>>> }) => {
  return <div />;
}

```

Uses ts-morph AST methods instead of hardcoded "AsyncState" logic

✅ AST-Driven Approach

classDecl.getImplements() instead of string parsing
heritage.getTypeNodes() for proper AST traversal
Handles complex nested generics correctly

also for the @Service decorator as well as the Inject<T> marker make sure that you use the AST after you found a string of that value that you make sure in the AST that the marker/decorator comes from @tdi2/di-core , resolve the full file name the decorator /marker is from and make the comparison configurable like an array so that if i change the package name or move the file i only have to change the value in the array diTypesLocatation["@tdi2/di-core/.../decoratorfile","...nmarkerlocation*.*"] ) so that we not only watch for a string

split existing tests for decorators and markers 9n separate files, while at it externalize the fixtures into separate files ./fixtures/<name of approach>.ts.txt
if test fit in one of the categoriy merge decide which test would be best and keep that

continue here make new chat window and let claude generate the rest of the test file based on the fixtures missing
https://claude.ai/chat/acf5b96b-c97b-4d10-9664-5885330dde07

### [✅] add valtio to useService hook to potentially truly make this approach unique

- find out if the useService code works and if todoapp is broken
- proxy class directly for performance reasons
  - dont do `[instance]=useState(proxy()) ; service=useSnapshot(instance)` which wil lgenerate a proxy per DI reference

- [valtio](https://www.npmjs.com/package/valtio)
- https://github.com/pmndrs/valtio/blob/main/docs/how-tos/how-to-organize-actions.mdx

### [✅] add react xyflow dependency view

### add open telemetry

### [✅] write tests for different styles of inject markers

- inline

- inline destructure

- separate props interface

### [✅] interface-resolver.test.ts

### [✅] fix issue where when deleting .vite folder interface files break

- maybe one plugin doesnt use the project tsconfig properly

### [✅] 7frank/tdi2/tools/functional-di-enhanced-transformer.ts

- [✅] fixtures and work isolated test previously working implementation and the latest 2 commits
  - [✅] revert c11c95bbe07502336f68ddbc4aa413fb2f986009
  - [✅] revert 8a180ad8f47d098a3133fac7956f3a2052678f37
  - [✅] before these all but todo app where working. also "feature/enhance-di" is in an ok state but needs merging with main
- [ ]split test runner into setup and several "describe" per fixture
- [✅] bun test ./tools/functional-di-enhanced-transformer/functional-di-enhanced-transformer.test.ts
- [✅] bun test ./tools/functional-di-enhanced-transformer/comprehensive-functional-di-test.ts

- [✅]if enough test succeed and the dev is working again then separate function into logical blocks and separate files
- [❌] check test runner that it has tests for all fixtures

### [✅] transformer is hard bound

```tỳpescript
    // Add known token mappings
    this.tokenMap.set('EXAMPLE_API_TOKEN', 'EXAMPLE_API_TOKEN');

```

###

- convert whole project to turborepo
  - everything is one app one app

- di-config.ts contains static inits of our service which we also only want with the token approach not the approach that generates a dependency tree of all dependencies
- we should rather let it use the classname/interface/"generic interface" the initial tdi apporoach uses
- and pass the token diffrently if one "scope" is required

### [✅] class based autowiring probably is not working fully, add this from tdi again

### [✅] move generated code into ".di" - folder

### [✅] make inject a record based generic interface something like `Inject<{api:APIInterface<Foo>}>`

- this will allow us to potnetially disable errors via linter down the line
- something along the line of https://claude.ai/chat/50198f4c-258d-462e-b4cf-03fa2a0613b7

Service()
class UserService implements UserServiceInterface
{
public state ...;
loadUser(userId):void

}

// userId would no longer be passed to the
interface UserProfileProps{services:{userService:Inject<UserServiceInterface>} }

export function UserProfile({ services:{userService} }: ) {

React.useEffect(() => {
userService.loadUser(userId);
}, [userId]);

// Valtio automatically tracks these accesses for re-rendering
const user = useSnapshot(userService.state).users.get(userId);
const loading = useSnapshot(userService.state).loading.has(userId);

return loading ? <Spinner /> : <UserCard user={user} />;
}
