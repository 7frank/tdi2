- transformer is hard bound

```tỳpescript
     // Add known token mappings
    this.tokenMap.set('EXAMPLE_API_TOKEN', 'EXAMPLE_API_TOKEN');
    this.tokenMap.set('LOGGER_TOKEN', 'LOGGER_TOKEN');
```

- we should rather let it use the classname/interface/"generic interface" the initial tdi apporoach uses
- and pass the token diffrently if one "scope" is required
