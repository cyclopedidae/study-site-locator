import { pipeline, env } from '@xenova/transformers';

let nerPipeline = null;

env.backends.onnx.wasm.numThreads = 1;
env.allowLocalModels = true;
env.allowRemoteModels = true;
env.localModelPath = chrome.runtime.getURL('models/');

const ALLOWED_MISC_WORDS = new Set([
  'UK', 'US', 'USA', 'UAE', 'EU', 'Dutch'
]);

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "run_ner") {
    (async () => {
      try {
        console.log("[OFFSCREEN] ===== NER RUN START =====");
        console.log("[OFFSCREEN] Total candidate blocks:", request.data.length);
        const startTime = Date.now();        

        const matches = [];
        const tabId = request.tabId;

        for (let i = 0; i < request.data.length; i++) {
          const blockText = request.data[i];

          console.log(`\n[OFFSCREEN] --- Block ${i} ---`);
          console.log("[OFFSCREEN] Input text:", blockText);

          const result = await runNER(blockText);
          console.log("[OFFSCREEN] Raw NER result:", result);

          const rawRelevant = result.filter(isRelevantRawEntity);
          console.log("[OFFSCREEN] Raw relevant LOC + selected MISC:", rawRelevant);

          const mergedRelevant = mergeEntities(rawRelevant);
          console.log("[OFFSCREEN] Merged relevant:", mergedRelevant);

          const useful = mergedRelevant.filter(isUsefulEntity);
          console.log("[OFFSCREEN] Useful entities:", useful);

          if (useful.length > 0) {
            const deduped = dedupe(useful.map(ent => ent.text));

            console.log("[OFFSCREEN] Final deduped entity texts:", deduped);

            const match = {
              index: i,
              entities: deduped
            };

            matches.push(match);

            await chrome.runtime.sendMessage({
              action: "stream_ner_match",
              tabId,
              match
            });
          } else {
            console.log("[OFFSCREEN] No useful entities in this block");
          }
        }

        console.log("\n[OFFSCREEN] ===== NER RUN END =====");
        console.log("[OFFSCREEN] Final matches payload:", matches);

        sendResponse({
          status: "ok",
          matches
        });

        const elapsedTime = Date.now() - startTime;
        console.log("[OFFSCREEN] ===== ELAPSED TIME =====\n")
        console.log("[OFFSCREEN] ", elapsedTime / 1000, "seconds")
      } catch (error) {
        console.error("[OFFSCREEN] NER ERROR:", error);
        sendResponse({
          status: "offscreen ner error",
          message: error.message
        });
      }
    })();

    return true;
  }
});

// ----- NER PIPELINE -----

async function runNER(chunk) {
  const ner = await getNER();
  return await ner(chunk);
}

async function getNER() {
  if (!nerPipeline) {
    console.log("[OFFSCREEN] Loading NER model...");
    nerPipeline = await pipeline('token-classification', 'Xenova/bert-base-NER');
    console.log("[OFFSCREEN] NER model loaded");
  }
  return nerPipeline;
}

// ----- HELPERS -----

function isRelevantRawEntity(ent) {
  const label = ent.entity || '';
  const word = cleanToken(ent.word || '');

  if (label.endsWith('LOC')) return true;

  if (label.endsWith('MISC') && isLocationLikeMisc(word)) {
    return true;
  }

  return false;
}

function isLocationLikeMisc(word) {
  if (!word) return false;

  const w = word.trim();

  if (ALLOWED_MISC_WORDS.has(w)) return true;

  return false;
}

function isUsefulEntity(ent) {
  const badWords = new Set([
    'for', 'and', 'of', 'the', 'in', 'on', 'at', 'by', 'to', 'from',
    'with', 'without', 'clinical', 'study', 'trial', 'data', 'outcome',
    'primary', 'secondary', 'depressive', 'adherence', 'mood', 'weeks',
    'baseline', 'post', 'intervention', 'status', 'support'
  ]);

  const text = (ent.text || '').trim();

  if (!text) return false;

  // Keep short geo abbreviations like UK / US / EU
  if (text.length < 3 && !isLocationLikeMisc(text)) return false;

  if (badWords.has(text.toLowerCase())) return false;

  return true;
}

function dedupe(arr) {
  return [...new Set(arr.map(x => x.trim()).filter(Boolean))];
}

function mergeEntities(tokens) {
  const merged = [];
  let current = null;

  console.log("[OFFSCREEN] mergeEntities input:", tokens);

  for (const token of tokens) {
    const label = token.entity;
    const word = token.word ?? '';

    if (!label || !word) continue;

    const isBegin = label.startsWith('B-');
    const isInside = label.startsWith('I-');
    const type = label.slice(2);

    if (!current || isBegin || current.type !== type) {
      if (current) merged.push(current);

      current = {
        type,
        text: cleanToken(word)
      };
      continue;
    }

    if (isInside && current.type === type) {
      current.text += word.startsWith('##')
        ? word.slice(2)
        : ' ' + cleanToken(word);
    }
  }

  if (current) merged.push(current);

  console.log("[OFFSCREEN] mergeEntities output:", merged);

  return merged;
}

function cleanToken(word) {
  return word.replace(/^##/, '').trim();
}