---
title: How to create an interactive quiz: questions, rules, hosting
description: Create a live interactive quiz: choose your questions, set time limits and points, let players join with a QR code, and host the game all the way to the podium.
date: 2026-09-29
translation: creer-un-quiz-interactif
answer: To create an interactive quiz, write short, varied questions (multiple choice, true or false, free answer, poll), set the time and points for each one, then open a game: players join on their phones with a code or a QR code, answer live, and the leaderboard appears after every question.
---

# How to create an interactive quiz, from the first question to the podium

An interactive quiz is played live: the host launches the questions, each player answers on their phone, points are added up automatically and the leaderboard appears between questions. Tools such as Kahoot! made the format popular. Party with friends, classroom, team meeting or wedding: the recipe is the same. Here is how to prepare a good quiz, then how to host it.

## Set the frame

Before writing a single question, answer three questions:

- **Who is playing?** Children, colleagues, experts: the level and the tone depend on it.
- **How long do you have?** Count the answering time, plus the time to read the question and discuss the answer. 20 questions of 20 seconds, with half a minute of discussion after each, make about 17 minutes of play.
- **Which screen?** In a room, show the quiz on a big screen or a TV to share the suspense.

## Mix question types

- **Multiple choice**: one right answer among several options. Quick to play.
- **True or false**: great for warming up, but a random answer has a one-in-two chance of being right.
- **Free answer**: players type their answer. Harder, so more rewarding. Plan for acceptable variants ("Pacific" and "Pacific Ocean", for example).
- **Poll**: no right answer, everyone gives their opinion. Perfect to break the ice or gather opinions in a meeting.

## Write good questions

1. **One idea per question**, with a short wording that can be read in a few seconds.
2. **Plausible wrong answers.** If three options out of four are absurd, the question becomes a reflex.
3. **No ambiguity.** Avoid questions with two defensible answers and obscure figures, and check every answer against a reliable source.
4. **A short explanation** after the answer: players learn something, even when they get it wrong.
5. **Rising difficulty**, with a few easy questions at the start so that everyone gets into the game.

## Set the time and the points

Match the time to the question: 10 seconds is enough for a true or false, while a free answer or a long question needs more.

In a live quiz, points often reward both accuracy and speed. In Mister Qowa, a right answer earns all its points if it comes straight away, and half if it comes in the last second. Each right answer in a row adds a 10% bonus to the next one, up to 50%.

Example: a 1,000-point question with 20 seconds to answer. A player answers correctly after 10 seconds: 750 points. If they had already strung together two right answers, they get 900. A wrong answer scores nothing.

To keep up the suspense, put a double-points question at the end.

## Host the game

1. **Open the game room** and show the code: players type it in or scan the QR code, then pick a nickname.
2. **Wait until everyone is in**, then launch the first question.
3. **During the question**, keep an eye on the number of answers received: no need to wait for the timer if everyone has answered.
4. **After each question**, show how the answers were split, the right answer and the leaderboard. That is the moment to comment.
5. **At the end**, the podium. Plan a rematch.

Do a test run with two phones before the big day, and check the venue's connection.

## Two variants to keep things lively

- **Teams**: players' points add up by team. Handy for a class or a company event.
- **Elimination**: a wrong answer or no answer knocks the player out, and the tension rises with each question. Players who are out follow the rest as spectators.

## How Mister Qowa helps

[Mister Qowa](https://mister-guiiug.github.io/mister-qowa/) lets you create the quiz and host it live.

- **Three ways to create a quiz**: by hand (multiple choice, true or false, free answer, poll), by importing a text with one question per line, or by generating an AI draft from a topic or a text, with your own Google Gemini or Anthropic key. You review everything before saving.
- **Time and points for each question**: 10, 15, 20, 30 or 60 seconds, and 500, 1,000 or 2,000 points.
- **An 8-digit PIN and a QR code** to join; players see the question and the options on their phone.
- **Automatic scores, leaderboard and podium**, with the split of answers after each question.
- **The host stays in control**: pause, skip or replay a question, remove a player, end a question early.
- **Team (2 to 4) and elimination modes**, plus a solo mode for practice.

Kahoot! is a trademark of its owner. Mister Qowa is an independent app with no connection to it.

## Frequently asked questions

### Do players need to install an app?

No. They scan the QR code or open the link in their phone's browser, type the PIN if it is not already filled in, then choose a nickname and an avatar.

### Do I need an account to host a quiz?

No. Mister Qowa asks for no email and no password: an anonymous guest account is created at the first game, on the device used.

### How do I write a quiz from a text?

In Mister Qowa, write one question per line, with the fields separated by semicolons. For multiple choice, mark the right answer with an asterisk: `Capital of France ; *Paris ; Lyon ; Marseille`. For true or false, add T or F.

### Does the free answer take accents and capital letters into account?

Not by default: accents, capital letters and extra spaces are ignored. A question can be made case-sensitive, and several answers can be accepted.

### Do I need an internet connection?

Yes. The host and the players must stay connected throughout the live game.

## References

- [Mister Qowa: how points are calculated, in the source code](https://github.com/mister-guiiug/mister-qowa/blob/main/shared/scoring.ts)
- [Google: using Gemini API keys](https://ai.google.dev/gemini-api/docs/api-key)
- [Anthropic: Claude API overview](https://platform.claude.com/docs/en/api/overview)
- [Wikipedia: Kahoot!](https://en.wikipedia.org/wiki/Kahoot!)
