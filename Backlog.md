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

  - fix test files
    - [x] interface-resolver.test.ts
    - [ ] missing test file dependency-tree-builder-test.ts generate one

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
