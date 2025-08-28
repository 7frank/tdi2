# Backlog

## ordered log (for production release)

### [❌]fix di-debug

#### integrated interface resolver too cluttered
- [❌] "AsyncState" "isStateBased" 

- AsyncState TodoServiceState


- [❌]instead
  -  if (implementation.isInheritanceBased) return 'inheritance';
  -  if (implementation.isClassBased) return 'class';
  - have a inerhitanceType: 'inheritance' | 'class' |... or something totally else

- [❌]what are these for , wouldnt the sanitizedKey work as the unique key already?
> const uniqueKey = isPrimary 
>       ? `${sanitizedKey}_${className}`
>       : `${sanitizedKey}_${className}_direct`;
>     
>     this.interfaces.set(uniqueKey, implementation);


- [❌] "byStrategry" cant we unify the strategies

>  private determineStrategy(implementation: InterfaceImplementation): 'interface' | 'inheritance' | 'class' {
>    if (implementation.isInheritanceBased) return 'inheritance';
>    if (implementation.isClassBased) return 'class';
>    return 'interface';
>  }

- cleanup di-core interfaces




#### [❌] overhaul of line based approach of  commit b596e7b

- extractInterfaceNameFromKey probably use implementationClass isntead
- implementationClassPath is too brittle
  - we should add file location {path,line} and have one method that generates a sanitied key from that, the location info should be available elsewhere too

- [TBD] only after the generated DI-Config is properly readable
  - then we should try to use **analyze** the graph or have a SPOT in **di-core** to **validate** the graph
  - this validation and analysation logic can then be used to build the cli and web view on top

#### [✅] regression broke main

> adding file path and line number broke lookup

useService('TodoServiceInterface\_\_src_todo2_TodoService_ts_line_14')

something wrong with the setup and the dashboard build

// curent work flow

> di-core dev (once)
> br build (once)
> br build:dashboard
> bunx tdi2 serve --src ../legacy/src/

- `br src/cli.ts analyze --src ../../../examples/tdi2-basic-example/src`
- `br src/cli.ts analyze --src ../legacy/src/`
- `br src/cli.ts serve --src ../legacy/src/`
- `bunx tdi2 serve --src ../legacy/src/`

- [❌] 19 services detected vs 22 after regression
  - ensure that they are not false positives, maybe we now actually detect more
  - also we get warnings now which might be good
  - and the "Missing service dependency 'CacheInterface_any\_\_src_UserApiServiceImpl_ts_line_69' might actually work
  - we might need some tests actually

#### [❌] di-debug; render actual transformed and source side by side the same was di-test-harness does

- [❌] do something about the "build:dashboard" missing dashboard

> this will allow us to debug di transformations and prevent edge cases to be too much in the way

- rendering the input and transformed in the di-debug with the same diff view di-test-harness has will allow dev to see what is breaking

### [❌] fix di-debug v2

- [❌] dashboard resolution the way it is, is brittle and we should do something about it
  - maybe use vite directly for the index.html copy operation
- [❌] using ts-node to read config file is unnecessary overhead
  - and will only work for "dev" not "built" graph rendering in di-debug

- [❌] cli graph currently hard to read with addition of the file path and line

- [❌] dashboard graph currently broken with addition of the file path and line

### [❌] rather than optimize edge case document happy path and visualize changes in di-debug so that delveoper can see what they transform in realtime and can mitigate

**OR** ship prod with documentend quirks

- for a first iteration that should be good enough
- don't use destructuring too much
- don't use rest parameters
- don't use aliases should be good enough

### [❌] DI bugs & side effects (part 1)

#### [❌] FIXME duplicated keys, see generated list of services in browser console of "legacy" app

> this might still introduce collisions

📋 Factories:
0: "LoggerInterface**src_logging_tdi_logger_service_ts_line_16"
1: "TDILoggerService"
2: "LoggerService**src_services_ConsoleLoggerService_ts_line_7"
3: "ConsoleLoggerService"
4: "ExampleApiInterface**src_services_ExampleApiService_ts_line_12"
5: "ExampleApiService"
6: "LoggerInterface**src_services_UserApiServiceImpl_ts_line_21"
7: "ConsoleLogger"
8: "CacheInterface_T**src_services_UserApiServiceImpl_ts_line_37"
9: "MemoryCache"
10: "ExampleApiInterface**src_services_UserApiServiceImpl_ts_line_64"
11: "UserApiServiceImpl"
12: "ExampleApiInterface**src_services_UserApiServiceImpl_ts_line_157"
13: "MockUserApiService"
14: "AppStateServiceInterface**src_todo2_AppStateService_ts_line_5"
15: "AppStateService"
16: "NotificationServiceInterface**src_todo2_NotificationService_ts_line_5"
17: "NotificationService"
18: "TodoRepositoryInterface2**src_todo2_TodoRepository_ts_line_10"
19: "TodoRepository"
20: "TodoServiceInterface\_\_src_todo2_TodoService_ts_line_14"
21: "TodoService2"

#### [❌] improper handling of rest parameters

- functional-di-enhanced-transformer/**tests**/**fixtures**/complex-props-spreading.basic.

> const { id, onClick, restProps } = props;
> const { id, onClick, ...restProps } = props;

- [❌] fix test
- [❌] enable test in di-test-harness

> ensure that there are no compilation errors by building after running tests

- cd di-core
- br test:update
- br build

#### [❌] in case of multiple unnamed generic interfaces we should throw an error or warning (Inject<{ name: string; email: string }>;)

evaluate scenarios

- to make it easier we probably want to enforce a rule/warning that Inject interfaces need to contain inline types
- or we have some rule that warns if the Inject is not a single type/interface Inject<Foo> where Foo can be any interfac/type but must be itself not generic or subtyped...

### [❌] separate packages

> important for prod for less disruptions in post-prod releases
> this would be beneficial for ppl using only the core features with other languages than react

- [❌] di-core
- [❌] di-react
- [❌] di-debug (serve,(analytics),cli)

### [❌] write state ownership docs section

> the only one documentation piece missing form prod

from prod/PotentialProblems.md
and prod/PostProductionRoadmap.md

---

---

---

## ordered log (for post-production)

### [❌] (out of scope for prod )create separate files/classes that focus on normalizing a step at a time

> **separation of concern** from whats there extract/create logical parts of the pipeline for:

> follow the plan in monorepo/packages/di-core/tools/functional-di-enhanced-transformer/normalizations/README.md for:

- destructuring
- rest parameters
- aliases

**OR** <del>HOC wrap implementation in wrapper and di ffrom the otuside...</del>
**OR** <del>restrict services to be only second parameter unused in react</del>

### [❌] see if we can use https://www.npmjs.com/package/vite-plugin-debugger or the other mentioned for debugging this

### [❌] dead code elimination in di-core

### [❌] profile.manager.ts process.env not set in di-test-harness

- [❌] check that this doesnt have implications for passing profiles via env in other places too

- [❌] import.meta.data vs process.env update documentation for less friction when using Profile

### [❌] handle testing "basic and enterprise" examples locally so that we dont unnecessarily push versions

> test with local instead of npm ?
> maybe by setting these otions

```
"compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@tdi2/di-core/*": ["./src/*"]
    },
```

### [❌] changeset publish

- will not properly restore workspace:\*
- also not every workspace:\* is replaced beforehand

### [❌] harden di-test-harness fixtures tests

- for one if any cant be imported curretny all fail
- diff works but will not run examples but show errors for DI
  - maybe this has to do with reeact bundling `useDI must be used within a DIProvider` maybe different contexts

### [❌] add tsc type check to fixture tests

> this way the test will show more meaningful errors and at least warn about them

> actually we only need to run build afterwards which will show all errors regardless

### [❌] reason about InjectOptional and remove it if not enough use cases speak for it

- there seem to be some good reasons for
  - doḱument them, write ADR

### [❌] in di-debug serve graph

> improve debugging capabilities

- relations missing service => class => interfaces

### [❌] CacheInterface_any in legacy

> we have to decide how we want to handle this, spring boot would use java type erasure and use it as nongeneric
> we on the other hand could
>
> - trigger an error/warning that this needs a config bean or service not working without implementation
>   or handle it like spring boot would

- `br src/cli.ts analyze --src ../legacy/src/ --format table`

```
📄 Loaded DI config from ..//legacy/src/.tdi2/di-config.ts
🔍 Analyzing DI configuration in ../legacy/src/...

📊 DI Configuration Analysis Report
══════════════════════════════════════════════════
Status: ❌ ISSUES FOUND (Score: 80/100)
Services: 19 total
Issues: 1 errors, 0 warnings

❌ Missing Dependencies (1):
• CacheInterface_any
```

- file where the reference is: monorepo/apps/legacy/src/services/UserApiServiceImpl.ts
- file where the

```
br cli.ts trace CacheInterface_T --src ../../apps/legacy/src/
📄 Loaded DI config from ../../apps/legacy/src/.tdi2/di-config.ts
🔍 Tracing resolution path for 'CacheInterface_T'...

🔍 Resolution Trace: CacheInterface_T
══════════════════════════════════════════════════
Result: ✅ SUCCESS

Resolution Steps:
1. ✅ interface: Found 'CacheInterface_T' in DI configuration
2. ✅ interface: Implementation: MemoryCache (interface)
   → MemoryCache (/src/memorycache.ts)
```

The problem

```
@Service()
export class MemoryCache<T> implements CacheInterface<T> {
```

itself is generic and cannot be respolved directly
it would have to be necessary to be used via configuration / bean

- therefore we might want to have a more meaningful error message than simply saing missing

```
 br cli.ts trace CacheInterface_any --src ../../apps/legacy/src/
📄 Loaded DI config from ../../apps/legacy/src/.tdi2/di-config.ts
🔍 Tracing resolution path for 'CacheInterface_any'...

🔍 Resolution Trace: CacheInterface_any
══════════════════════════════════════════════════
Result: ❌ FAILED
Error: Service token 'CacheInterface_any' not found in DI configuration

Resolution Steps:
1. ❌ interface: Token 'CacheInterface_any' not found in DI configuration
2. ❌ interface: Similar tokens found: CacheInterface_T, MemoryCache
3. ❌ class: Expected class: CacheInterface_any - check if class exists and has @Service decorator
```

- we might be able to determine the "closest" implementation
- or check if there is a generic that is close to our naming and in which case tell that there is a compatible but not fully configured service

### [❌] sundown "legacy" app take whats there still valuable e.g. dependency viewer maybe (which we should move into di-debug package already)

### [❌] research claude code subscription schedulers

- https://chatgpt.com/c/68a3a375-488c-8320-b748-04593842b6f5

- maybe we can combine prefect with **telegram** to have something that allows us to use more of the subscription via mobile too

- use cases
  - fully automated tasks that are isolated
  - semi interactive tasks via telegram feedback channel

### [❌] focus on meaningful test cases and create snapshot tests for failing scenarios that we want to support

> focus debugging, how can we easily provide info to developer with ladle or snapshot tests, to find out why things fail and what they can do

- inline examples in test harness
- examples of snapshot tests
- both should provide similar experience
  - side by side comparision of source and generated
  - working DI (This might be still ahrd because 2 different packages)

### [❌] potential use case, "contracts"

> This deserves its own category
> but also should actually be much lower prio, stays up for the idea itself

-di & contracts https://claude.ai/chat/59abb30a-20c2-48da-9e05-5bf6798310cb

```typescript
// Meta-Framework APIs
export interface ComponentLifecycle {
  onMount?(): Promise<void>;
  onUnmount?(): Promise<void>;
  onPropsChanged?(newProps: any, oldProps: any): void;
}
```

The idea is that we can create a meta framework similar to luigi or piral and have something like microfrontends with different frameworks mixed.

## ordered (low priority)

### [❌] restructure, for smaller package sizes

- graph und structur https://claude.ai/chat/ff284e67-cac3-4c5e-a4b1-54fdfe6a8128

### ADR of bundler options

- https://lirantal.com/blog/typescript-in-2025-with-esm-and-cjs-npm-publishing

### use different inject strategy

- instead of complex types and scenarios
  - we could use a marker interface for Inject<{}> as separate union type
  - this would probly simplify the edge cases
  - linting, deep nestd injection (false positives)

```typescript
function Button({
  title,
  foo,
}: { title: string } & Inject<{
  foo: FooInterface;
  bar: Lazy<BarInterface>;
}>);
```

### [❌] replace current implementation details with one of the packages like

- @phenomnomnominal/tsquery
- ts-pattern
  > https://claude.ai/chat/589c3252-74e7-4e17-b84c-0cebca6d6c2b

maybe normalization could help

> import jscodeshift from 'jscodeshift';
> import transform from 'react-codemod/transforms/no-destructuring-assignment';

### [❌] classes vs zustand vanilla inject / maybe both

### [❌] ViewControllerService document approach

> Common in practice, though not always named "VCS." Frequently used in:

    React apps using custom hooks for state/effect logic (Controller) and services/modules for data/API (Service).

    Clean Architecture implementations in frontend, where hooks or presenters mediate between views and use cases.

    Redux Toolkit with RTK Query, where components (View) use generated hooks (Controller) that wrap service logic (API calls).

    MobX or Zustand, where reactive stores act as Controllers, with Services supplying logic or data pipelines.

> so for us this means, if we have not too many business logic / UI state

- we could extract it in a hook (Controller) **OR** in RSI (Controller)
- if the logic would grow we could separate them by
  - converting the hook into a RSI Controller
  - then splitting Controller Logic and Business Logic into separate Classes/interfaces (This would be Clean)

!!! there is a gradient of what works best

### [❌] use crossnote cli to render to pdf

> we would use this to generate pdf from certain markdown documents that are feature heavy

- https://github.com/7frank/crossnote-cli

> alternatively we can use

https://github.com/quarto-dev
https://github.com/MartenBE/mkslides

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

### [❌] FIXME could not fast refrest useDi export incompatible

### [❌] Lazy decorator and marker

### [❌] cli

- which implements "which implemetnation belongs to <interface> " search
- use cas edriven more feature, goal reduce DI friction for DX

"faster" what causes this? **and** alternative to dependency viewer

- it must be clear why a certain component doesnt work

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

### [✅] transformed code not written to file system

> variables werent passed properly

> easier to check if something went wrong
> also easier to add to di-debug

### [✅] missing fixtures tests for edge cases

service-lifecycle-decorators.basic.input
separate-interface.interfaces
non-di-services.basic.input
no-services.basic.input.tsx
nested-arrow-functions.basic.input
empty-services.basic.input
conditional-rendering.basic.input

multiple-components.basic.input

### DI bugs & side effects (part 1)

#### [✅] Fixme: example which his generating invalid code

> secondary destructurings fails

> [✅]but our current normalization attempts seem brittle and might add more problems than solving things

> we might need something like **@babel/plugin-transform-destructuring** which normalizes the code to something that does not contain destructuring

- [✅] we have a **potential solution** but that checks for jsx and types which might not be needed at all
  - e330dfa74ef635cee217d9273f1472197055824a
  - and the next

- [✅] check that we have a unified view in di-test-harness app for all snapshot tests to better see if things change
- [✅] double and tripple check the changes

```typescript
export function DemographicsForm(props: DemographicsFormProps) {
  const { services, onComplete } = props;

  const { demographicsForm } = services;
}
```

#### [✅] normalizing destructured function arguments is only applied to "Inject"ed not all variables

see :

- destructured-services-params.basic.input.tsx
- destructured-services-params.basic.transformed.snap.tsx

#### [✅] FIXME this type of destructuring requires a test and a fix as it is not properly transformed

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

#### [✅] FIXME TodoApp TodoService2 isnt properly injected

- [✅] there is a missing interface in a test that does nothing currently we can savely remove it
  - monorepo/apps/legacy/src/di.integration.test.tsx
  - import type { TodoServiceType } from "../src/todo/interfaces/TodoInterfaces";

- it was not properly injected in case there where two or more interface (in different files ) with the same name e.g. "TodoServiceInterface" and @Services that impplement them
- Fix or use monorepo/apps/legacy/src/di.integration.test.tsx for this scenario

#### [✅] FIXME having two different classes of the same name will one not be resolved properly

e.g.:

1 TodoService implements TodoServiceInterface
2 TodoService implements TodoServiceType

#### [✅] is DI scope using import path

- potential duplicate
- if say we have two "implements UserRepoInterface"

### [✅] fix some more di issues & have more debugging support

- [✅] tsup for cli and bin/cli.js support
- [❌] publish cli to be available in the minor
- [✅] test cli commands properly that they work with
  - ecommerce example

- [✅] move ./analytics and cli and dependency view into separate @tdi2/di-debug package
- serve

### [✅] di-debug cli and serve autodetect di-config

### [✅] ⚠️ interfaces still not working with generic any

> **ANALYSIS COMPLETED**: This issue is **RESOLVED**. Key sanitizer correctly handles generic types without collisions:
>
> - `CacheInterface<any>` → `CacheInterface_any` ✅
> - `CacheInterface<string[]>` → `CacheInterface_string_Array` ✅
> - `CacheInterface<User>` → `CacheInterface_User` ✅
>
> The warning "Missing: UserApiServiceImpl -> CacheInterface_any" is expected behavior - it indicates UserApiServiceImpl needs a CacheInterface<any> implementation, which should be provided by MemoryCache service.
>
> **STATUS**: No fix needed - working as intended

### [✅] fix gh-pages actions for

- test harness
- documentation

### [✅] clean up talks/RFP for what value it still has

- maybe we simply delete it

### [✅] add di-testing example

- ecommerce, fix failing tests
- leave basic example out of it, keep the basic example well basic

### [✅] @Configration "bean"

> for things we don't own

@Configuration
public class AppConfig {

    @Bean
    public PaymentService paymentService() {
        return new PaymentService();
    }

}

### [✅] fix ai system prompt

- we have the documentation and degit
- we also should have a basic system prompt, so that we or any user could simply copy & paste that to claude code, as baseline then add our requirements (styling / business logic /test quantity)
- our base prompt would handle that the actually generataed code is using the di approach properlly

### [✅] update docs for profile, scope, configuration, bean

### [✅] ecommerce example

- now create an exommerce example which the documentation is talking about similarly to examples/tdi2-basic-example
  in the same parent folder

> our documentation should reference snippets of the actual implementation similar to enterprise example

- links to ecommerce example from documentation
- links from documentation to "storybook" ladle (maybe a bit too much)

### [✅] show the USP unique selling point early and let people experience the benefit first hand

- [✅] is there a clear "roter faden" the user should be able to follow that

- [✅] we are trying to solve a problem
  - therefore the docuemtation should reflect that

- also communicate our USP in seconds
  - [✅] our usp is decoupling IMO
- [✅]we need the basic example up front
  /home/frank/Projects/7frank/tdi2/examples/tdi2-basic-example/README.md
  simply degit and run experience the working di stuff is i think valuable

### [✅] improve documentation

- [✅] adr section
- [✅] astro starlight
- [✅] better structure

- [✅] migrate ./docs
- [✅] migrte ./monorepo/docs
- [✅] ingore docs/SlideDecks
- [✅]] keep minimal doku in packages,apps,monorepo root, and root
- [✅]] consistent example accross all documentation "ecommerce application"

- [✅] we need to review the content
  - [✅] some metrics are hallucinated
  - [✅] some comparisions like "we dont need redux bla" anymore outdated
  - [✅] we need more comparisions e.g. zustandjs

- [✅] search for missing info from original files we are about to delete and check if we should add them somewhere in the new docs

- [✅] search for redunancies

### [✅] lifecycle

simlarly to angular we should have some form of lifecycle utility
either as interfaces or decorators. below are the most common ones needed:

- ✅ ngOnInit — 80%
- ✅ ngOnDestroy — 60%
- ✅ mount/unmount

### [✅] @Scoped singleton|instance default singleton without settings scope

### [✅] fix tests

> fixed most tests

### [✅]improve coding with ai tools

- ai coding tools https://claude.ai/chat/8fc03e1d-4679-4762-931c-4f23f1581f20

### [✅] testing utilities package

- https://claude.ai/chat/ce705f0a-1f89-4e05-b0cb-3e5655e9c193

- AST should not remove but conditionally inject if service was passed use that if not then inject like before
- create test utility. that makes creating a config for a test easy
  - maybe use thing like @Mockbean in test or scope test / integration ...

### [✅] qualifier maybe already implemented due to not necessary with generic ionterfaces and no type reasure in ts

### [✅]mockbean

### [✅] release di-core 2.3.0 or 2.2.1

- test with basic and enterprise to prevent regressions or at least not bump versions when regressions occur

- maybe separate tsup tools&dist and examples in separate tsup config

### [✅] improve testing v2

- integrate snapshot tests into ladle

### [✅] improve testing

- code-generator.snapshot.test.ts focus: correct code
- ladle / vite test suite, runnning a set of compeonnts with a test harnish
  - having git diff utiltiites and other debug informations readily available as well as a living documentation

- create a fixture based test runner as part of di-core https://claude.ai/chat/848a009f-9959-40ba-b234-04291db352b2
  - export these as (ts not compiled) fixtures so that our ladle stories can use them directly
  - as well as the compile results so that we can show the code before and aftertransformation in ladle

- diff ignore pattern array e.g. timestamp

- format
- tsc
  - now as a separate measure after diff it should test if a file actually compiles or is at least syntactically coherent. what options do i have

#### [✅] broken impl?

- todo fix tests and remove tests that now are handled by our snapshot tests
- todo check of code generator now is deprecated
- TODO git bisect breaking changes and se whats recyclbe
  - until tests it should be ok , then refactoring broke things

#### [✅] T_T

- fix optional in generated
- fix one example in "inline destructured"

### [✅] react critique

- timeline complexity
- developers
- examples of classes and hooks

### [✅] RSI critique

- but why didnt someone invent this sooner?
- but what about serverside and hydration?

### [✅] create showcases for more complex scenarios

- e.g. complex forms https://claude.ai/chat/48ebf950-986b-476d-bb0c-09a5c87fe041

### [✅] issue sync

- create a small cli that helps us sync issues with github projects / issues

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
