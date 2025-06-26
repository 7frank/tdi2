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
- generate tests and smaller files to test individual features otherwise this is getting out of hand
