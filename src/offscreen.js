import { runNER } from './modules/ner';

const ALLOWED_MISC_WORDS = new Set([
  'UK', 
  'US', 
  'USA', 
  'UAE', 
  'EU', 
  'Dutch', 
  'Review Board', 
  'University', 
  "'University's",
  'Indian',
  'American'
]);

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "run_ner") {
    (async () => {
      try {
        console.log("[OFFSCREEN] ===== NER RUN START =====");
        console.log("[OFFSCREEN] Total candidate blocks:", request.data.length);

        const matches = [];
        const tabId = request.tabId;

        for (let i = 0; i < request.data.length; i++) {
          const startTime = Date.now();        
          const block = request.data[i];
          const blockText = block.text;
          const inMethods = !!block.inMethods;
          const methodsFound = !!block.methodsFound;

          console.log(`\n[OFFSCREEN] --- Block ${i} ---`);
          console.log("[OFFSCREEN] Input text:", blockText);

          const result = await runNER(blockText);
          console.log("[OFFSCREEN] Raw NER result:", result);

          const mergedRelevant = mergeEntities(result, { inMethods, methodsFound });
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
          
          const elapsedTime = Date.now() - startTime;
          console.log("[OFFSCREEN] ==== ELAPSED TIME ====\n")
          console.log("[OFFSCREEN] ", elapsedTime / 1000, "seconds")
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

// ----- HELPERS -----

function isRelevantMergedEntity(ent, context = {}) {
  const type = ent?.type || '';
  const text = (ent?.text || '').trim();
  const score = ent?.score ?? 0;
  const inMethods = !!context.inMethods;
  const methodsFound = !!context.methodsFound;

  if (!text) return false;
  if (score <= 0.45) return false;

  if (type === 'LOC') return true;

  if (type === 'MISC' && isAllowedWord(text)) {
    return true;
  }

  if (type === 'ORG') {
    if (methodsFound && !inMethods) return false;
    return isRelevantOrganization(text);
  }

  return false;
}

function isAllowedWord(word) {
  if (!word) return false;
  const w = word.trim();
  if (ALLOWED_MISC_WORDS.has(w)) return true;
  return false;
}

function isUsefulEntity(ent) {
  const badWords = new Set([
    'for', 'and', 'of', 'the', 'in', 'on', 'at', 'by', 'to', 'from',
    'with', 'without', 'study', 'data', 'outcome',
    'primary', 'secondary', 'depressive', 'adherence', 'mood', 'weeks',
    'baseline', 'post', 'intervention', 'status', 'support'
  ]);

  const text = (ent.text || '').trim();

  if (!text) return false;

  // Keep short geo abbreviations like UK / US / EU
  if (text.length < 3 && !isAllowedWord(text)) return false;

  if (badWords.has(text.toLowerCase())) return false;

  return true;
}

function dedupe(arr) {
  return [...new Set(arr.map(x => x.trim()).filter(Boolean))];
}

function isRelevantOrganization(text) {
  return /\b(university|universities|hospital|hospitals|review board|institutional review board|irb|ethics committee|ethics board|institute|institutes|department|faculty|school|schools|college|colleges|center|centre|clinic|clinics|medical center|medical centre)\b/i.test(text);
}

function mergeEntities(tokens, context = {}) {
  const merged = [];
  let current = null;

  for (const token of tokens) {
    const label = token?.entity || '';
    const rawWord = token?.word || '';
    const score = token?.score ?? 0;

    if (!label || !rawWord) {
      if (current) {
        merged.push(current);
        current = null;
      }
      continue;
    }

    const prefix = label.slice(0, 2);
    const type = label.slice(2);
    const word = cleanToken(rawWord);
    const isSubword = rawWord.startsWith('##');

    if (!type || label === 'O') {
      if (current) {
        merged.push(current);
        current = null;
      }
      continue;
    }

    if (!current) {
      current = {
        entity: label,
        type,
        text: word,
        score
      };
      continue;
    }

    if (isSubword && current.type === type) {
      current.text += word;
      current.score = Math.min(current.score, score);
      continue;
    }

    if (prefix === 'I-' && current.type === type) {
      current.text += ' ' + word;
      current.score = Math.min(current.score, score);
      continue;
    }

    if (current) merged.push(current);

    current = {
      entity: label,
      type,
      text: word,
      score
    };
  }

  if (current) merged.push(current);

  console.log("[OFFSCREEN] mergeEntities output:", merged);

  return merged.filter(ent => isRelevantMergedEntity(ent, context));
}

function cleanToken(word) {
  return word.replace(/^##/, '').trim();
}