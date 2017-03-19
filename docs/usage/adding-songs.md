---
title: Community Driven Radio - Adding Songs Usage
---

## How are songs added by users?

Songs are added to queue using the input provided.

A user can either paste a URL or YoutubeID of a song (which is a video, actually).

The YoutubeID is passed with the `new_song` event to the server over the socket connection.

The `QueueManager` reacts on this event and triggers the `add` method on the `Queue`.

Song will **not** be added if it:

- Is currently playing
- Already exists in the queue
- Is not embeddable

In those cases the user will receive an error message (with the `be_alerted` event).

After the video is successfully found on YouTube and above conditions are met:

- a new `Song` object will be created and placed into the `Queue`'s `items` array.

- `queue.onQueueChanged` will be triggered, which will emit a `queue_info` event to all users with the new queue items. (@see `queue.getInfo()`)