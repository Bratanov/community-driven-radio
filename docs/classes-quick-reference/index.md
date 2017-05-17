---
title: Community Driven Radio - Classes Quick Reference - Documentation
---

# Classes Quick Reference

Here's a diagram showing the basic interactions between the classes.

<div class="mxgraph" style="max-width:100%;border:1px solid transparent;" data-mxgraph="{&quot;highlight&quot;:&quot;#0000ff&quot;,&quot;lightbox&quot;:false,&quot;nav&quot;:true,&quot;resize&quot;:true,&quot;toolbar&quot;:&quot;zoom&quot;,&quot;edit&quot;:&quot;https://drive.google.com/uc?id=0Bw_RSgw8AS5IZFczTUMxOXNhRTA&amp;export=download&quot;,&quot;url&quot;:&quot;https://drive.google.com/uc?id=0Bw_RSgw8AS5IZFczTUMxOXNhRTA&amp;export=download&quot;}"></div>
<script type="text/javascript" src="https://www.draw.io/embed2.js?&fetch=https%3A%2F%2Fdrive.google.com%2Fuc%3Fid%3D0Bw_RSgw8AS5IZFczTUMxOXNhRTA%26export%3Ddownload"></script>

### Client

One of the key classes is the `Client` class. It holds the socket connection to the user 
and handles sending/receiving events from/to it.

The `Client` is used in most of the main components.

### Client manager

As seen in the diagram only the ClientManager can create a `Client`.

The main client manager usage can be found in the `radio.js` file.

 - `new-client` event: Emitted when a client connects through the socket connection, 
 will receive a `Client` object as the first parameter 

### Chat

The chat is pretty simple currently. When a client is attached it will:

- Send chat history to the new client
- Send new messages to the client
- Listen for messages from the client

### Queue

The queue handles adding/removing songs from the radio, keeping in check when a song has ended 
so a new one can be started and sending out queue songs info to all clients in the attached `ClientManager`.

### QueueManager

Queue manager attaches clients to the queue. It handles initializing input events from the user that are queue related.

### VotesManager

This class works with a `Queue`, gets any songs in it and recalculates their votes when neceserry.
When `Client`s are attached they can vote for any song in this managers `Queue`.
The actual votes are attached to the `client.votes` array, in the form of song ids. When vote recalculation happens
we make sure to call `song.setVotes` with the proper new total number of votes.

### Song

This class is mainly the structure for a `Song` entity. It knows if the song is playing, when it should end and so on.
Songs are also able to fetch info for related to them songs. Related songs info is currently just plain objects.

### Youtube API

Requires an API key to work. Can make requests to the Youtube API and has methods for the requests we currently need.