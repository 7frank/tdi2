# Learnings of using Claude.AI

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

## patches

- generating git patch did not work so good for bigger patches
- mostly due to fake hashes
  - so instead of `git apply foo.patch`
  - use `patch -p1 < foo.patch`

## timing

- claude says your quota runs out you will ahve to wait until then
- so your day is fragmented
- use openai for smaller parts or any other ai you have. documentation and so on it will delay the inevitable

- use offtime for strategic planning
  - or if you feel lucky clean up your code base

- if you have the feeling that the context gets to small for the next question decide to cut it and start a new chat

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

## knowledge

- you need to know how to fix things
  - sometines the last 2 lines are missing after 10 minutes of generting code
  - sometimes a keyword is a reserved word

- continue, continue, ...
- know SOLID
  - know how to separate concerns
  - separate functional units

- when you think you are in a dead end
  - stash / clean and retry ai generating wirth a slightly different prompt
- year 2000 you are a computer science person => you can google better than others
- year 2012 you are a computer science person => you can google "stackoverflow"
- year 2035 you are a computer science person => you can write short ticket descriptions that are now no longer handled by the team but your bot

## quirks

- sometimes after hitting "continue" the code is fragmented
  - you either can see the section that does ahve to be moved
  - or if you still ahve context length available you "recreate artifact name"
- if your implementation was generated decently and the last test is broken because of quota
  - try to remove the last test and fix the file / some tests are better than none
  - create a new chat and tell the bot with the requirements from the last chat to implement the missing tests

## troubleshooting

- good luck, hope you wrote enough tests
  - if not, write tests for bugs
- you can always devolve into the state of ["Vibe Coder"](https://www.youtube.com/watch?v=JeNS1ZNHQs8) for a bit and contemplate your life descisions
- keep your features branches for some time when squashing, you might want to "git bisect" later on
