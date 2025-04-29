#!/usr/bin/env node
/**
 * Script: memorize.mjs
 *
 * Usage: `npm run memorize`
 *
 * - Iterates through all JPEG images in `public/queso/`.
 * - For each image we call the OpenAI ChatCompletion (GPT-4o Mini) with the
 *   vision capability to create a rich caption **from the perspective of the
 *   white dog**.
 * - Each caption is stored in a ChromaDB collection whose connection details
 *   are read from the local `.env` file.
 *
 * Environment variables expected:
 *   OPENAI_API_KEY – API key for OpenAI
 *   CHROMA_API_KEY – Chroma token (header type: X_CHROMA_TOKEN)
 *   CHROMA_URL     – Chroma server URL (e.g. https://api.trychroma.com:8000)
 *   CHROMA_TENANT  – Tenant ID
 *   CHROMA_DATABASE– Database name
 */

import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// Ensure environment variables from `.env` are loaded when the script is
// executed directly (outside of Next.js).
import 'dotenv/config';

import OpenAI from 'openai';
import { ChromaClient } from 'chromadb';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

function requireEnv(key) {
  const v = process.env[key];
  if (!v) {
    console.error(`❌ Missing required env var: ${key}`);
    process.exit(1);
  }
  return v;
}

const chromaClient = new ChromaClient({
  path: requireEnv('CHROMA_URL'),
  auth: {
    provider: 'token',
    credentials: requireEnv('CHROMA_API_KEY'),
    tokenHeaderType: 'X_CHROMA_TOKEN',
  },
  tenant: requireEnv('CHROMA_TENANT'),
  database: requireEnv('CHROMA_DATABASE'),
});

// Resolve path to the `public/queso` directory irrespective of where the
// script is executed from.
const PROJECT_ROOT = path.dirname(fileURLToPath(import.meta.url));
const PUBLIC_DIR = path.resolve(PROJECT_ROOT, '../public/queso');

async function main() {
  console.log('🔎 Scanning', PUBLIC_DIR);
  const allFiles = await fs.readdir(PUBLIC_DIR);
  const images = allFiles.filter((f) => /\.jpe?g$/i.test(f));

  if (images.length === 0) {
    console.log('No images found, exiting.');
    return;
  }

  console.log(`Found ${images.length} images…`);

  const collection = await chromaClient.getOrCreateCollection({ name: 'queso' });

  for (const fileName of images) {
    try {
      const id = path.parse(fileName).name; // strip extension

      // Skip documents that already exist (avoid duplicates on re-runs).
      const existing = await collection.get({ ids: [id] }).catch(() => undefined);
      if (existing && existing.ids && existing.ids.length > 0) {
        console.log(`• Skipping ${fileName} – already memorised.`);
        continue;
      }

      // Read image and encode as base64 so the OpenAI vision model can see it.
      const imgBuf = await fs.readFile(path.join(PUBLIC_DIR, fileName));
      const base64 = imgBuf.toString('base64');

      const prompt =
        "Describe what's happening in the photo from the perspective of the white dog. Ascribe detailed emotions and a short story to the photo. Keep it short - one or two sentences.";

      const response = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        max_tokens: 120,
        messages: [
          {
            role: 'user',
            content: [
              { type: 'text', text: prompt },
              {
                type: 'image_url',
                image_url: {
                  url: `data:image/jpeg;base64,${base64}`,
                },
              },
            ],
          },
        ],
      });

      const caption = (response.choices[0]?.message?.content || '').trim();

      if (!caption) {
        console.warn(`⚠️  OpenAI returned empty caption for ${fileName}`);
        continue;
      }

      await collection.add({
        ids: [id],
        documents: [caption],
      });

      console.log(`✅ Memorised ${fileName}: ${caption}`);
    } catch (err) {
      console.error(`❌ Failed processing ${fileName}:`, err);
    }
  }

  console.log('✨ Done.');
}

main();
