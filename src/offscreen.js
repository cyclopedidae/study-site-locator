import { pipeline, env } from '@xenova/transformers';

let nerPipeline = null;

env.backends.onnx.wasm.numThreads = 1;
env.allowLocalModels = true;
env.allowRemoteModels = false;
env.localModelPath = chrome.runtime.getURL('models/');

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "run_ner") {
        (async () => {
        try {
            const matches = [];

            console.log("[OFFSCREEN] ===== NER RUN START =====");
            console.log("[OFFSCREEN] Total candidate blocks:", request.data.length);

            for (let i = 0; i < request.data.length; i++) {
            const blockText = request.data[i];
            console.log(`\n[OFFSCREEN] --- Block ${i} ---`);
            console.log("[OFFSCREEN] Input text:", blockText);

            const test = "Patients were recruited in Sweden.";
            const result = await runNER(test); //blockText
            console.log("[OFFSCREEN] TEST STRING:", test);
            console.log("[OFFSCREEN] RAW TEST RESULT:", JSON.stringify(result, null, 2));

            console.log("[OFFSCREEN] Raw NER result:", result);

            const rawRelevant = result.filter(ent =>
                ent.entity.endsWith('LOC') || ent.entity.endsWith('ORG')
            );
            console.log("[OFFSCREEN] Raw relevant LOC/ORG:", rawRelevant);

            const mergedRelevant = mergeEntities(rawRelevant);
            console.log("[OFFSCREEN] Merged relevant:", mergedRelevant);

            const useful = mergedRelevant.filter(isUsefulEntity);
            console.log("[OFFSCREEN] Useful entities before dedupe:", useful);
            console.log("[OFFSCREEN] Useful entities after dedupe:", dedupeEntities(useful));

            if (useful.length > 0) {
                matches.push({
                index: i,
                entities: dedupeEntities(useful)
                });

                console.log("[OFFSCREEN] Final kept entities for block:", dedupeEntities(useful));
            } else {
                console.log("[OFFSCREEN] No useful entities kept for this block.");
            }
            }

            // test
            for (const token of result) {
                console.log("[OFFSCREEN] TOKEN", {
                word: token.word,
                entity: token.entity,
                start: token.start,
                end: token.end,
                index: token.index,
                score: token.score
                });
            }

            console.log("\n[OFFSCREEN] ===== NER RUN END =====");
            console.log("[OFFSCREEN] Final matches payload:", matches);

            sendResponse({
            status: "ok",
            matches
            });
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

async function runNER(chunk) {
  const ner = await getNER();
  return await ner(chunk);
}

async function getNER() {
  if (!nerPipeline) {
    nerPipeline = await pipeline('token-classification', 'Xenova/bert-base-NER');
  }
  return nerPipeline;
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
  if (text.length < 3) return false;
  if (badWords.has(text.toLowerCase())) return false;
  return true;
}

function dedupeEntities(entities) {
    const seen = new Set();
    const out = [];

    for (const ent of entities) {
        const text = (ent.text || '').trim();
        const start = Number.isFinite(ent.start) ? ent.start : null;
        const end = Number.isFinite(ent.end) ? ent.end : null;
        const type = ent.type || null;

        if (!text) continue;
        if (start === null || end === null) {
        console.warn("[OFFSCREEN] Dropping entity with bad offsets:", ent);
        continue;
        }

        const key = `${text.toLowerCase()}|${start}|${end}|${type}`;
        if (seen.has(key)) continue;

        seen.add(key);
        out.push({ text, start, end, type });
    }

    return out;
}

function mergeEntities(tokens) {
    const merged = [];
    let current = null;

    for (const token of tokens) {
        const label = token.entity;
        const word = token.word ?? '';

        if (!label || !word) continue;
        if (!Number.isFinite(token.start) || !Number.isFinite(token.end)) {
        console.warn("[OFFSCREEN] Token missing offsets:", token);
        continue;
        }

        const isBegin = label.startsWith('B-');
        const isInside = label.startsWith('I-');
        const type = label.slice(2);

        if (!current || isBegin || current.type !== type) {
        if (current) merged.push(current);

        current = {
            type,
            text: cleanToken(word),
            start: token.start,
            end: token.end
        };
        continue;
        }

        if (isInside && current.type === type) {
        current.text += word.startsWith('##')
            ? word.slice(2)
            : ' ' + cleanToken(word);

        current.end = token.end;
        }
    }

    if (current) merged.push(current);

    console.log("[OFFSCREEN] mergeEntities output:", merged);
    return merged;
}
function cleanToken(word) {
  return word.replace(/^##/, '').trim();
}