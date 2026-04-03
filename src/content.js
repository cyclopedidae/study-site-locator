import {
  highlightEntitiesInElement,
  clearHighlights,
  registerHighlightsInElement,
  nextHighlight,
  previousHighlight
} from './modules/highlight.js';

import { getCandidateRecords } from './modules/textProcessing.js';

let currentCandidates = [];
let totalHighlights = 0;
let isExtractionRunning = false;

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "extract_text") {
    const candidates = getCandidateRecords();
    const texts = candidates.map(c => c.text);

    currentCandidates = candidates;
    totalHighlights = 0;
    isExtractionRunning = true;
    clearHighlights();

    console.log("[CONTENT] Candidate texts sent to NER:", texts);

    // Respond immediately so the popup remains responsive.
    sendResponse({
      status: "started",
      candidateCount: texts.length
    });

    chrome.runtime.sendMessage(
      { action: "analyze_text", data: texts },
      (response) => {
        isExtractionRunning = false;

        if (chrome.runtime.lastError) {
          console.error("[CONTENT] analyze_text runtime error:", chrome.runtime.lastError.message);
          return;
        }

        console.log("[CONTENT] Final background response:", response);
        console.log("[CONTENT] Total highlights applied:", totalHighlights);
      }
    );

    return;
  }

  if (request.action === "ner_match_found") {
    const match = request.match;
    const candidate = currentCandidates[match.index];

    if (!candidate?.element) {
      console.warn("[CONTENT] Missing candidate element for streamed match:", match);
      sendResponse({ status: "missing_candidate" });
      return;
    }

    const entityTexts = (match.entities || [])
      .map(ent => typeof ent === 'string' ? ent : ent?.text)
      .filter(Boolean);

    console.log(`\n[CONTENT] ===== Incremental highlight for block ${match.index} =====`);
    console.log("[CONTENT] Candidate text:", candidate.text);
    console.log("[CONTENT] Entities to highlight:", entityTexts);

    const count = highlightEntitiesInElement(candidate.element, entityTexts);
    totalHighlights += count;

    console.log(`[CONTENT] Incrementally highlighted ${count} occurrence(s) in block ${match.index}`);
    console.log("[CONTENT] Running total highlights:", totalHighlights);

    // Only register the new marks from this element.
    registerHighlightsInElement(candidate.element);

    sendResponse({
      status: "ok",
      highlighted: count,
      totalHighlighted: totalHighlights
    });
    return;
  }

  if (request.action === "next_highlight") {
    nextHighlight();
    sendResponse({
      status: "ok",
      running: isExtractionRunning
    });
    return;
  }

  if (request.action === "previous_highlight") {
    previousHighlight();
    sendResponse({
      status: "ok",
      running: isExtractionRunning
    });
    return;
  }
});