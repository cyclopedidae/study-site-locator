export function highlightEntitiesInElement(element, entities) {
  if (!element || !Array.isArray(entities) || entities.length === 0) return 0;

  ensureHighlightStyle();

  const textNodes = getTextNodes(element);
  const fullText = textNodes.map(n => n.nodeValue).join('');

  console.log("[HIGHLIGHT] ===== BLOCK START =====");
  console.log("[HIGHLIGHT] Element:", element);
  console.log("[HIGHLIGHT] Full reconstructed text:", fullText);
  console.log("[HIGHLIGHT] Incoming entities:", entities);

  // Sort descending so later spans don't shift earlier offsets
  const sorted = [...entities]
    .filter(ent =>
      ent &&
      typeof ent.start === 'number' &&
      typeof ent.end === 'number' &&
      ent.end > ent.start
    )
    .sort((a, b) => b.start - a.start);

  let total = 0;

  for (const ent of sorted) {
    const expected = fullText.slice(ent.start, ent.end);

    console.log(`\n[HIGHLIGHT] Trying entity "${ent.text}"`);
    console.log("[HIGHLIGHT] start/end:", ent.start, ent.end);
    console.log("[HIGHLIGHT] text at offsets:", expected);

    if (!expected.trim()) {
      console.warn("[HIGHLIGHT] Skipping empty offset match:", ent);
      continue;
    }

    const ok = wrapRangeByOffsets(textNodes, ent.start, ent.end, ent.text);

    if (ok) {
      total++;
      console.log(`[HIGHLIGHT] SUCCESS: highlighted "${ent.text}"`);
    } else {
      console.warn(`[HIGHLIGHT] FAILED: could not highlight "${ent.text}"`);
    }
  }

  console.log("[HIGHLIGHT] Total exact-offset highlights in block:", total);
  console.log("[HIGHLIGHT] ===== BLOCK END =====");

  return total;
}

export function clearHighlights() {
  const marks = document.querySelectorAll('mark.ner-highlight');

  for (const mark of marks) {
    const parent = mark.parentNode;
    if (!parent) continue;

    parent.replaceChild(document.createTextNode(mark.textContent), mark);
    parent.normalize();
  }
}

function getTextNodes(root) {
  const walker = document.createTreeWalker(
    root,
    NodeFilter.SHOW_TEXT,
    {
      acceptNode(node) {
        const parent = node.parentElement;
        if (!parent) return NodeFilter.FILTER_REJECT;
        if (!node.nodeValue || !node.nodeValue.trim()) return NodeFilter.FILTER_REJECT;
        if (parent.closest('mark.ner-highlight')) return NodeFilter.FILTER_REJECT;
        if (["SCRIPT", "STYLE", "NOSCRIPT", "TEXTAREA"].includes(parent.tagName)) {
          return NodeFilter.FILTER_REJECT;
        }
        return NodeFilter.FILTER_ACCEPT;
      }
    }
  );

  const nodes = [];
  let node;
  while ((node = walker.nextNode())) {
    nodes.push(node);
  }

  return nodes;
}

function wrapRangeByOffsets(textNodes, start, end, labelText = "") {
  let currentOffset = 0;
  let startNode = null;
  let endNode = null;
  let startOffsetInNode = 0;
  let endOffsetInNode = 0;

  for (const node of textNodes) {
    const len = node.nodeValue.length;
    const nodeStart = currentOffset;
    const nodeEnd = currentOffset + len;

    if (!startNode && start >= nodeStart && start < nodeEnd) {
      startNode = node;
      startOffsetInNode = start - nodeStart;
    }

    if (!endNode && end > nodeStart && end <= nodeEnd) {
      endNode = node;
      endOffsetInNode = end - nodeStart;
    }

    currentOffset = nodeEnd;
  }

  if (!startNode || !endNode) {
    console.warn("[HIGHLIGHT] Could not resolve DOM nodes for offsets:", {
      labelText, start, end
    });
    return false;
  }

  try {
    const range = document.createRange();
    range.setStart(startNode, startOffsetInNode);
    range.setEnd(endNode, endOffsetInNode);

    const mark = document.createElement('mark');
    mark.className = 'ner-highlight';
    mark.dataset.entity = labelText;

    range.surroundContents(mark);
    return true;
  } catch (err) {
    console.warn("[HIGHLIGHT] surroundContents failed:", {
      labelText,
      start,
      end,
      error: err
    });
    return false;
  }
}

function ensureHighlightStyle() {
  if (document.getElementById('ner-highlight-style')) return;

  const style = document.createElement('style');
  style.id = 'ner-highlight-style';
  style.textContent = `
    mark.ner-highlight {
      background: #ffeb3b;
      color: inherit;
      padding: 0 1px;
      border-radius: 2px;
    }
  `;

  document.head.appendChild(style);
}