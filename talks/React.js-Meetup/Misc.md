# 7.11. reactjs meeup leipzig

lets ahve these as one liners before we talk about the focus

> just one more hook
> just one more framework, u"ll see functional is much more composable

## agenda

- first "show dont tell"
- then reasons why i think this is good
- short break
- then later again coding session

## Focus of the presentation

!!! we need to show that it is simple and compatible to existing react stuff otherwise the buy in and sceptisism will prevail despite the architectural benetifs

!!! what also would work is something where code needs to be reusable like with astro where you ssr some stuff in language A for speed and use react somewhere else


> Note
> classes are a vehicle for DI not the reason
> reducing boilerplate for some characters and trading that with increase in cognitive load ... is "copium" of the react ecosystem (we are so modern / we are functional)
> react helps new developers to get small things done easily, but doesnt help them when things get harder, but instead teaches the "GIT good" and leaving developers alone with the cognitive load and uncertainty

### decoupling => [feature matrix](../../examples/comparision/FeatureMatrix.md)

### cognitive load

https://chatgpt.com/c/68fc8d5d-be14-8333-b9ea-32c7744b110d

#### items that react trades

https://chatgpt.com/c/68fc8d5d-be14-8333-b9ea-32c7744b110d

#### boiler plate reduction ad absurdum

we trade some token with cognitive load

https://chatgpt.com/c/68fc8d5d-be14-8333-b9ea-32c7744b110d

#### compare classical vs react comprehension of new code example

https://chatgpt.com/c/68fc8d5d-be14-8333-b9ea-32c7744b110d

Compare comprehension steps for an auth/authorization utility implemented as a React Hook versus a classical class. Focus: what to read, where to jump, which invariants to verify, typical traps.

Target question to resolve

#

https://www.meetup.com/de-DE/reactjs-meetup-leipzig/

##

The event is suitable for intermediate and expert developers.

About the event:

This talk presents React Service Injection (RSI) as a paradigm shift that addresses scaling problems by introducing compile-time dependency injection and service-oriented architecture to React applications.

React’s current architectural patterns fail to scale beyond medium-complexity applications. Although it is possible to mitigate some of the effects of missing architecture through best practices, these often introduce manual labor and friction.

Frank argues that one of core problems lies in React’s conflation and coupling of UI rendering with business logic and state management. Components become coupled to data sources, testing requires complex mock setups, and architectural boundaries dissolve as applications grow. Traditional solutions like Redux and modern alternatives like Zustand add complexity without solving the underlying coupling issues.

RSI addresses these problems through two key mechanisms:

- Compile-time, interface-based dependency injection with autowiring
- Reactive, stateful services using Valtio

This combination enables React components to become pure templates, while business logic resides in injectable reactive services—both fully decoupled from one another. The approach mirrors what Spring Boot brought to the Java ecosystem in 2014. It enables enterprise-grade testing patterns familiar to backend and Angular developers.

The talk demonstrates RSI through prepared code examples. The architectural approach draws from proven backend patterns, including repository, service, and adapter layers, while maintaining React’s component model.

Initial project results indicate significant improvements in code organization and testing simplicity. The pattern enables interface-driven development, SOLID principle compliance, and clear architectural boundaries previously difficult to achieve in React applications.

Agenda:

- Talk: 45 minutes
- Q&A: 15 minutes
- Break: 20+ minutes
- Live Coding Session: 30 minutes

☝ Important to know:

👨‍💼 Speaker: Frank Reimann
💬 Language: German/English — primarily German, but English is possible depending on the audience
🦾 Level: Intermediate and expert
🧠 Previous knowledge (desirable):

- Experience with React architecture and its pain points
- Challenges with scaling your React architecture and interest in understanding the causes and solutions
- Nice to have: Spring Boot, Angular, SOLID, TypeScript, and knowledge of software architecture patterns (DDD, Ports & Adapters, Onion)

📹 Will it be recorded? Yes, Frank will record his session.

🗣️ About our speaker: [Frank Reimann](https://github.com/7frank)
Frank enjoys learning new concepts and exploring technology by building prototypes.
