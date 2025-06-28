- [/] transformer is hard bound

  ```tỳpescript
      // Add known token mappings
      this.tokenMap.set('EXAMPLE_API_TOKEN', 'EXAMPLE_API_TOKEN');

  ```

  - di-config.ts contains static inits of our service which we also only want with the token approach not the approach that generates a dependency tree of all dependencies
  - we should rather let it use the classname/interface/"generic interface" the initial tdi apporoach uses
  - and pass the token diffrently if one "scope" is required

- class based autowiring probably is not working fully, add this from tdi again
- move generated code into ".di" - folder
- make inject a record based generic interface something like `Inject<{api:APIInterface<Foo>}>`
  - this will allow us to potnetially disable errors via linter down the line
  - something along the line of https://claude.ai/chat/50198f4c-258d-462e-b4cf-03fa2a0613b7
- generate tests and smaller files to test individual features otherwise this is getting out of hand

  - **FIXME** tests currently are mostly ai slop and add no values

  - **fix test files**

    - [ ] context.test.tsx\_
    - [x] interface-resolver.test.ts
    - [ ] missing test file dependency-tree-builder-test.ts generate one
    - [ ] 7frank/tdi2/tools/functional-di-enhanced-transformer.ts
      - fixtures and work isolated test previously working implementation and the latest 2 commits
        - revert c11c95bbe07502336f68ddbc4aa413fb2f986009
        - revert 8a180ad8f47d098a3133fac7956f3a2052678f37
        - before these all but todo app where working. also "feature/enhance-di" is in an ok state but needs merging with main
      - split test runner into setup and several "describe" per fixture
      - bun test ./tools/functional-di-enhanced-transformer/functional-di-enhanced-transformer.test.ts
      - bun test ./tools/functional-di-enhanced-transformer/comprehensive-functional-di-test.ts
      - [ ] check test runner that it has tests for all fixtures
      - if enough test succeed and the dev is working again then separate function into logical blocks and separate files

- fix issue where when deleting .vite folder interface files break
  - maybe one plugin doesnt use the project tsconfig properly
- FC DI props.destructuring works limited at the moment and will fail if not in certain format
- is DI scope using import path
  - if say we have two "implements UserRepoInterface"
- in case of multipleunnamed generic interfaces we should throw an error or warning (nject<AsyncState<{ name: string; email: string }>>;)
- FIXME after hot reloading most of the service are no longer avail `rm -rf node_modules/.vite/` && `npm run di:reset && npm run dev` circumbvents this
- Lazy decorator and marker
- Profile decorator and marker
- FIXME duplicated keys see generated list of services
- even more tests for DI if this is supposed to be somewhat viable
- compile to npm package and publish
- write tests for different styles of inject markers
- inline
- inline destructure
- separate props interface
- use falso in tests and fixtures, we don'T want the ai to hard code any solutions
- article on dev.to with todoapp and core features

# update claude md file from project

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
