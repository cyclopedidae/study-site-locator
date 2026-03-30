import { highlightEntitiesInElement, clearHighlights } from './modules/highlight.js';
import { getCandidateRecords } from './modules/textProcessing.js';

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "extract_text") {

    const candidates = getCandidateRecords();
    const texts = candidates.map(c => c.text);

    console.log("[CONTENT] Candidate records:", candidates);
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
                if (!candidate?.element) continue;

                const remappedEntities = match.entities
                    .map(ent => remapEntityOffsets(ent, candidate.offsetMap, candidate.originalText))
                    .filter(Boolean);

                total += highlightEntitiesInElement(candidate.element, remappedEntities);
                
                console.log("[CONTENT] Candidate original text:", candidate.originalText);
                console.log("[CONTENT] Candidate cleaned text:", candidate.text);
                console.log("[CONTENT] Candidate offsetMap length:", candidate.offsetMap?.length);
                console.log("[CONTENT] Raw NER entities:", match.entities);
                console.log("[CONTENT] Remapped entities:", remappedEntities);
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

function remapEntityOffsets(ent, offsetMap, originalText) {
    if (!ent) {
        console.warn("[CONTENT] remapEntityOffsets got null entity");
        return null;
    }

    if (!Array.isArray(offsetMap)) {
        console.warn("[CONTENT] Missing offsetMap for candidate:", { ent, offsetMap });
        return null;
    }

    if (
        !Number.isFinite(ent.start) ||
        !Number.isFinite(ent.end) ||
        ent.start < 0 ||
        ent.end <= ent.start ||
        ent.start >= offsetMap.length
    ) {
        console.warn("[CONTENT] Bad entity offsets from NER:", ent);
        return null;
    }

    const originalStart = offsetMap[ent.start];
    const endCleanIndex = Math.min(ent.end - 1, offsetMap.length - 1);
    const originalEndInclusive = offsetMap[endCleanIndex];
    const originalEnd = originalEndInclusive + 1;

    const remapped = {
        ...ent,
        start: originalStart,
        end: originalEnd
    };

    console.log("[CONTENT] Remapped entity:", {
        cleanedText: ent.text,
        cleanedStart: ent.start,
        cleanedEnd: ent.end,
        originalStart,
        originalEnd,
        originalSlice: originalText.slice(originalStart, originalEnd)
    });

    return remapped;
}