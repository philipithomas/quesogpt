# QuesoGPT

This is QuesoGPT, a way to talk to my dog Queso. He is a dog, so he can't respond with text - instead he responds with images. Try asking "what did you do today", "what do you do when you're scared", or "do you remember moving?"

### Technical Details

I developed QuesoGPT forthe  Chroma x Jam Vibe Coding Night in San Francisco on April 29, 2024. 

**[🎥 Watch the video on YouTube](https://www.youtube.com/watch?v=-3muonMwiqY)**

It was built using OpenAI Codex, mostly with a single prompt. It uses [Chroma](https://trychroma.com) for vector storage and retrieval, specifically leveraging Chroma Cloud. The application uses a retrieval-augmented generation (RAG) approach, potentially incorporating techniques like reranking to improve the relevance of the images retrieved based on the user's query.

## Environment Variables

You need to set up the following environment variables. You can create a `.env` file in the project root:

```
OPENAI_API_KEY=your_openai_api_key

# Obtain these from Chroma Cloud (https://trychroma.com)
CHROMA_URL=api.trychroma.com:8000
CHROMA_API_KEY=your_chroma_token
CHROMA_TENANT=your_chroma_tenant_id
CHROMA_DATABASE=your_chroma_database_name
```

## Getting Started

First, you need to populate the Chroma database with image descriptions. This script iterates through images in `public/queso/`, generates captions using OpenAI's vision model, and stores them in Chroma:

```bash
npm run memorize
```

Next, run the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result and chat with Queso.


### Original prompt

```
We're making a chat app.

This is an empty nex.tjs repo with a .env file with credentials for Chromadb and OpenAI, and I've already installed chromadb package and openai package and vercel ai package (read package.json)

How to work with ChromaDB:

import { ChromaClient } from "chromadb";
const client = new ChromaClient({
  path: "https://api.trychroma.com:8000",
  auth: { provider: "token", credentials: 'put your api key here, tokenHeaderType: "X_CHROMA_TOKEN" },
  tenant: 'tenant id here',
  database: 'database name here'
});

const collection = await client.getOrCreateCollection({ name: "queso" });
await collection.add({
  ids: ["1", "2", "3"],
  documents: ["apple", "oranges", "pineapple"],
});
console.log(await collection.query({ queryTexts: "hawaii", nResults: 1 }));

Your task has two parts:

# Data ingestion

I want to be able to run `npm run memorize` and it will go through each photo in public/queso/ (all jpegs from 1.jpeg, 2.jpeg, ..., 46.jpeg) and do the following in a script for every image:
1. Use OpenAI o3 model, pass the image in and ask OpenAI to generate a caption like this: "Describe what's happening in the photo from the perspective of the white dog, ascribing detailed emotions and a story to the photo, like 'hiding scared under the couch' or 'having a happy walk in the Washington Square park in the Fall leaves' or 'playing with my friend, a golden-doodle who's bigger than me'"
2. Add that caption to chromadb using the environment variables from the .env file. The ID should be the file name and the document should be file name.Ensure that it iterates through all images in that folder every time.

# Querying

I want you to build a simple chatbot, like ChatGPT, using the OpenAI SDK and this chromadb data. But, instead of the system responding with text - it responds with images. The system is pretending to be a dog, and responds with images that we stored in data ingestion. The chat functionality should be the homepage of the app.Here's how it works.1. It's a simple chat interface, all in memory. (No sidebar or anything)2. When User sends a message, the system responds by having access to chromadb as a tool. It searches Chroma using collection.query to find 10 matching images, then in a light "Reranking" the llm approach (using O4-mini model) responds to the user message with a photo. IT should be intstructed to not send photos that have already been sent in the same chat. So, if the user asks "what's your favorite time of year", it might respond with a photo from Fall.
3. User can ask follow-up questions to continue the chat in-memory

# Testing

Ensure `npm run build` succeeds and fix any issues if it does not.


```
