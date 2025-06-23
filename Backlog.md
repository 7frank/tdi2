- transformer is hard bound

  ```tỳpescript
      // Add known token mappings
      this.tokenMap.set('EXAMPLE_API_TOKEN', 'EXAMPLE_API_TOKEN');
      this.tokenMap.set('LOGGER_TOKEN', 'LOGGER_TOKEN');
  ```

  - di-config.ts contains static inits of our service which we also only want with the token approach not the approach that generates a dependency tree of all dependencies
  - we should rather let it use the classname/interface/"generic interface" the initial tdi apporoach uses
  - and pass the token diffrently if one "scope" is required

- class based autowiring probably is not working, add this from tdi again
- move generated code into ".di" - folder
