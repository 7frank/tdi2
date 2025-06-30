# Backlog

## ordered log

### [❌] add react xyflow dependency view

### [❌] FIXME after hot reloading most of the service are no longer avail `rm -rf node_modules/.vite/` && `npm run di:reset && npm run dev` circumbvents this

### [❌] compile to npm package and publish

### [❌] Profile decorator and marker

### [❌] Lazy decorator and marker

### [❌] in case of multiple unnamed generic interfaces we should throw an error or warning (nject<AsyncState<{ name: string; email: string }>>;)

### [❌] hack the stack for console to get proper line numbers when logging error and so on not the monkey patched

### [❌] FIXME duplicated keys see generated list of services

### [❌] article on dev.to with todoapp and core features

### [❌] is DI scope using import path

- if say we have two "implements UserRepoInterface"

### [❌] **fix test files** missing test file dependency-tree-builder-test.ts generate one

### [❌] **fix test files** context.test.tsx\_

### [❌] use falso in tests and fixtures, we don't want the ai to hard code any solutions

### [❌] split the code base into a npm monorepo

- tdi2-core
- tdi2-react
  - logic plugins and compoennts to make react fc di work
- tdi2-react-utils
  - e.g. di dependency viewer and elk dpendencies
- tdi2-documentation
  - contain core examples for all features
- todo-app
  - comprehensive implementation of tdi react and native di

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

## Done

### [✅] add open telemetry

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
