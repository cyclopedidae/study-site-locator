import { highlightEntitiesInElement, clearHighlights } from './modules/highlight.js';
import { getCandidateRecords } from './modules/textProcessing.js';

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "extract_text") {
    const candidates = getCandidateRecords();
    const texts = candidates.map(c => c.text);

    console.log("[CONTENT] Candidate texts sent to NER:", texts);

    chrome.runtime.sendMessage(
      { action: 'analyze_text', data: texts },
      (response) => {
        if (chrome.runtime.lastError) {
          console.error("[CONTENT] analyze_text runtime error:", chrome.runtime.lastError.message);
          sendResponse({
            status: "error",
            message: chrome.runtime.lastError.message
          });
          return;
        }

        console.log("[CONTENT] Background response:", response);

        clearHighlights();

        const matches = response?.data?.matches ?? [];
        let total = 0;

        console.log("[CONTENT] Total matched candidate blocks:", matches.length);

        for (const match of matches) {
          const candidate = candidates[match.index];
          if (!candidate?.element) {
            console.warn("[CONTENT] Missing candidate element for match:", match);
            continue;
          }

          const entityTexts = match.entities
            .map(ent => typeof ent === 'string' ? ent : ent?.text)
            .filter(Boolean);

          console.log(`\n[CONTENT] ===== Highlighting block ${match.index} =====`);
          console.log("[CONTENT] Candidate text:", candidate.text);
          console.log("[CONTENT] Entities to highlight:", entityTexts);

          const count = highlightEntitiesInElement(candidate.element, entityTexts);
          total += count;

          console.log(`[CONTENT] Highlighted ${count} occurrence(s) in block ${match.index}`);
        }

        console.log("[CONTENT] Total highlights applied:", total);

        sendResponse({
          status: "ok",
          highlighted: total,
          matches
        });
      }
    );

    return true;
  }
});