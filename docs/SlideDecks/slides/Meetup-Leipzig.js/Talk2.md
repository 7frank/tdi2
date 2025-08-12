## Hypothesis: Coupling is the core reason React exhibits scaling problems

### Examples
- Hooks pull stateful and effectful logic inward, tangling unrelated concerns and worsening coupling.  
<example code block>

- Equivalent patterns in other languages—static classes with a global mutable stack—are generally avoided for maintainability reasons.  

<example code block>

- "Functional" React is not functional programming; side effects permeate the model, breaking referential transparency and composability.  
<example code block>


## Decoupling strategy (iff coupling is the problem)

- Iff coupling is the root issue, decouple by externalizing dependencies and effects behind explicit contracts.

<example code block>


- Use Dependency Injection (DI) and autowiring; proven elsewhere, yields modular, swappable, testable units.
<example code block>


- Not new, only underused in React; reuse TypeScript primitives—interfaces, classes, decorators—no wheel to invent.
- Classes are suitable carriers; they implement interfaces, and interfaces are contracts—the exact abstraction DI targets.
- In TypeScript, interfaces and types are structurally compatible, which simplifies testing; often no separate class needed when passing an instance that satisfies the contract.
<example code block>


## TODO for presetnation

- get the styling fixed
    - cd slides ... uv run mkslides build Meetup-Leipzig.js/slides.md  --config-file Meetup-Leipzig.js/config.yaml 
- add notes from above
- get the talk finished by 2pm
- https://hogenttin.github.io/hogent-markdown-slides/
- https://github.com/HoGentTIN/hogent-markdown-slides

## Notes for Presentation
- schedule a new stream tomorrow
- make sure not to "stop automatically"
- stop manually at the end of the presentation
- bluetooth audio
    - switch audio before 
    - open in browser and check base audio
    - have someone open the call in the browser and check for audio problems

