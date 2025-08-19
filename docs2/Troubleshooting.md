#### [✅] di-core changes broke the dev

> fixed in ea898a5771af83f6874c39d05222a62a85f2a3ad

##### troubleshooting

- http://localhost:5173/todo-app not working
  - cache not found
  - removing chacne will show untransformed code in console log
  - todoapp not transformed maybe wrong folder in config?
- but some parts like http://localhost:5173/interface-examples are working

- createFunctionCandidate hasInjectMarkers does return null for todoapp
- created separate class that check inject now the candidate is found and transofrmed

- ❌ foudn in generatedcode: SharedDependencyExtractor.ts => extractFromTypeReference =>"Type reference extraction not yet implemented:"

- ❌ "No dependencies found for"

#####

- dev is working the same way when not isung the changes from the [integrated dependency injection feature](https://github.com/7frank/tdi2/pull/11/files)
- but as soon as di-core gets built the vite plugin no longer
  - processes jsx files
  - generates transformed.tsx

- maybe the tests are part solution, some related are failing
- divide and conquery ...

- `✅ Transformed GenericProcessor with 2 dependencies`
- `Loading transformed version of EnhancedFunctionalComponent.tsx`

#####

Try this(

> **Learnings maybe make context small**
>
> - git diff working/failed ) (**only code and test** not text files)
>   - then take that and dev berfore and dev after
>   - then "create multiple smaller diff artifacts to fix my di
