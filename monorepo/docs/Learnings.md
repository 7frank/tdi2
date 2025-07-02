## Learnings

## Vibe Coding

- Claude with git repo as context works great until about 66% of context size is reached,
  - then its time to SOC your code base into pacakges
  - in my case turborepo worked great

## refactoring

- if it fits in the context of about 66% refactoring with relevant code sections and readme or explaination works decent
- let ai write unit tests as long as your unit is still below ~1000 lines of code
  - the eearlier the more painless
  - later it gets a drag

- refactoring works like alawys,
  - let ai create tests for impl
  - let ai fix the tests by pasting test results
  - do this unit the tests are green
  - decide if the test or the impl might be at fault

## size matters - Divide an conquer

- the bigger the change you want to make is the harder it will get
- write down a plan or let ai decide what orde rthe chang eshould be made

## format

- try one artifact per file
- generating git patch did not work so good for bigger patches

## timing

- claude says your quota runs out you will ahve to wait until then
- so your day is fragmented
- use openai for smaller parts or any other ai you have. documentation and so on it will delay the inevitable

- use offtime for strategic planning
  - or if you feel lucky clean up your code base

## clean up

- claud generates a lot of noice
  - want some function you get premium function with golden extras
  - clean up regularly when you feel your ai slop accumulates to much

## costs

- claude ai chat is 20€ per month you get enough to do decent projects
- claude api is expensive, claude is talkative and accumulates costs fast, which will increase pressure to succeed

## GIT

- commit often
- feature branch often
- revert if necessary
