import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { getOrCreateCollection } from '@/lib/chroma';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function POST(req: NextRequest) {
  try {
    const { message, usedIds = [] } = await req.json();

    if (typeof message !== 'string' || !message.trim()) {
      return NextResponse.json({ error: 'Invalid message' }, { status: 400 });
    }

    // Query Chroma for the 10 most relevant captions.
    const collection = await getOrCreateCollection('queso');

    const results = await collection.query({
      queryTexts: [message],
      nResults: 10,
      include: ['documents'],
    });

    // Flatten results and handle potential nulls
    const initialIdToCaptionMap = new Map<string, string>();
    const unseenIdToCaptionMap = new Map<string, string>();

    for (const row of results.rows()[0] ?? []) {
      const document = typeof row.document === 'string' ? row.document.trim() : '';
      if (!document) continue;

      initialIdToCaptionMap.set(row.id, document);

      if (!usedIds.includes(row.id)) {
        unseenIdToCaptionMap.set(row.id, document);
      }
    }

    const unseenIds = Array.from(unseenIdToCaptionMap.keys());

    if (unseenIds.length === 0) {
      // Check if there were candidates initially but all were used
      if (initialIdToCaptionMap.size > 0) {
        // You could send a specific message here, e.g., "I've shown you all relevant memories for that."
        // For now, just return a generic "not found" to match previous logic.
        return NextResponse.json({ error: 'No new images found for this query' }, { status: 404 });
      }
      // If no candidates were found initially
      return NextResponse.json({ error: 'No relevant images found for this query' }, { status: 404 });
    }

    // Rerank: ask a lightweight model to select the best image based on the caption.
    // No need for collection.get anymore

    const optionsText = unseenIds
      .map((id, idx) => `${idx + 1}. [${id}] ${unseenIdToCaptionMap.get(id)}`) // Use the map
      .join('\n');

    const rerankPrompt = `You are a small helper. The user asked: "${message}"\n` +
      'Choose the single best image (just return its number) from the list below that would answer the question from the perspective of a white dog.\n' +
      `List:\n${optionsText}\nAnswer with only the number.`;

    const choiceRes = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      max_tokens: 5,
      messages: [
        { role: 'user', content: rerankPrompt },
      ],
    });

    const numberStr = (choiceRes.choices[0].message.content || '').trim();
    let idx = parseInt(numberStr, 10);
    if (isNaN(idx) || idx < 1 || idx > unseenIds.length) {
      idx = 1; // fallback to first
    }

    const selectedId = unseenIds[idx - 1];
    // Get the caption from our map
    const selectedCaption = unseenIdToCaptionMap.get(selectedId);

    if (!selectedCaption) {
      console.error(`Could not find caption for selected ID ${selectedId} in map.`);
      return NextResponse.json({ error: 'Internal server error during selection' }, { status: 500 });
    }

    return NextResponse.json({ id: selectedId, caption: selectedCaption }); // Use selectedCaption
  } catch (err: unknown) {
    console.error('Chat route error', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
