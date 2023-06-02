# teahouse

Teahouse is a home automation orchestrator inspired by The Elm Architecture (TEA)
https://guide.elm-lang.org/architecture/

In teahouse, instead of `Html` the "view" is your house :)

For a taste, take a look at [my house!](lachies-house/house.ts)

## story

Things like Home Assistant look pretty cool, but they end up being programming in YAML.
YAML configuration is good in that its declarative, but ultimately kinda awkward to work with, 
especially since I know how to program for reals.

Elm and its architecture has a pleasant sort of middle ground: its quite data driven, but you express the data using functions.

So I decided to try to work up something like TEA, but in Typescript, and a lot less pure.

## intro

> What happens within the ~Elm~ teahouse program though? It always breaks into three parts:

> Model — the state of your ~application~ house.

> ~View~ House — a way to turn your state into ~HTML~ your house.

> Update — a way to update your state based on messages.

### Model
Model's whatever you like... generally nested records.

### House
A function which takes the model and outputs a tree of Nodes.

Leaf nodes are Home Automation devices. Devices can produce `Message`s, which are dispatched back into 
the update function.

### Update
A function which takes a message and the model and returns a new model and a command.