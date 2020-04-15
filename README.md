# Tutti-frutti

Multi-player, web-based game where players can play Tutti-frutti (Basta) game. Developed with Node.js, Express.js and Socket.io

## Notes/Bugs

- The game used [WordsAPI](https://www.wordsapi.com/) before to validate the words entered, but since it's a freemium API it now only searches if the word exists inside a .txt file in the game files
  - Since the .txt file doesn't have categories, the word entered for each category will be valid even if it doesn't belong to it (e.j. for letter "a" - "apples" will belong to "Name")
- The game still has an irreproducible bug where the scoreboard sometimes appends the same results twice
- The game has a yet-to-be-fixed bug where if no player restarts the game after the round ends and they exit the client, the game will continue forever and the server will need to be restarded

## Installation

1. Download dependencies on root folder

```
npm install
```

## Start

1. Run the server

```
npm start
```

or

```
npm run devstart
```
