---
title: Community Driven Radio - Voting Usage
---

## How does voting work?

All newly added `Song`s have 0 votes by default.

All newly created `Client`s have empty votes by default.

A user can vote for a `Song` by clicking the appropriate button in the UI, 
this will send a `vote` event, over the sockets, with the song id.  

The `VotesManager` reacts on this event with either:

- An error message if this `Client` has already voted for the song
- Or calling `client.addVote`, which adds the vote to the `client.votes` array

Then it `recalculateVotes` for all `Songs`s in the `Queue` (including the `active` `Song`)

This sets the appropriate votes count for each song, then triggers `onQueueChanged`,

which sends the updated queue items to all users with the `queue_info` event.