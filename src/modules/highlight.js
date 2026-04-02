let highlightNodes = [];
let activeIndex = -1;

export function highlightEntitiesInElement(element, entities) {
  if (!element || !Array.isArray(entities) || entities.length === 0) return 0;

  ensureHighlightStyle();

  let total = 0;
  const sorted = [...entities].sort((a, b) => b.length - a.length);

  for (const entity of sorted) {
    total += highlightPhraseWithinRoot(element, entity);
  }

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

  highlightNodes = [];
  activeIndex = -1;
}

function highlightPhraseWithinRoot(root, phrase) {
  if (!phrase || !phrase.trim()) return 0;

  const escaped = escapeRegex(phrase.trim());
  const regex = new RegExp(`\\b${escaped}\\b`, 'gi');

  console.log(`[HIGHLIGHT] Looking for phrase: "${phrase}"`);

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

  let count = 0;

  for (const textNode of nodes) {
    const text = textNode.nodeValue;
    regex.lastIndex = 0;

    if (!regex.test(text)) continue;
    regex.lastIndex = 0;

    console.log("[HIGHLIGHT] Match found in text node:", text);

    const fragment = document.createDocumentFragment();
    let lastIndex = 0;
    let match;

    while ((match = regex.exec(text)) !== null) {
      const start = match.index;
      const end = start + match[0].length;

      if (start > lastIndex) {
        fragment.appendChild(document.createTextNode(text.slice(lastIndex, start)));
      }

      const mark = document.createElement('mark');
      mark.className = 'ner-highlight';
      mark.textContent = text.slice(start, end);
      fragment.appendChild(mark);

      console.log("[HIGHLIGHT] Highlighted:", match[0]);

      lastIndex = end;
      count++;
    }

    if (lastIndex < text.length) {
      fragment.appendChild(document.createTextNode(text.slice(lastIndex)));
    }

    textNode.parentNode.replaceChild(fragment, textNode);
  }

  console.log(`[HIGHLIGHT] Total matches for "${phrase}":`, count);
  return count;
}

function escapeRegex(text) {
  return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
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

  mark.ner-highlight-active {
    background: #ff9800;
    outline: 2px solid #e65100;
  }
`;

  document.head.appendChild(style);
}

export function refreshHighlightNavigator() {
  highlightNodes = Array.from(document.querySelectorAll('mark.ner-highlight'));
  activeIndex = highlightNodes.length ? 0 : -1;
  updateActiveHighlight();
}

export function nextHighlight() {
  if (highlightNodes.length === 0) return;
  activeIndex = (activeIndex + 1) % highlightNodes.length;
  updateActiveHighlight();
}

export function previousHighlight() {
  if (highlightNodes.length === 0) return;
  activeIndex = (activeIndex - 1 + highlightNodes.length) % highlightNodes.length;
  updateActiveHighlight();
}

export function getHighlightCount() {
  return highlightNodes.length;
}

export function getActiveHighlightIndex() {
  return activeIndex;
}

function updateActiveHighlight() {
  for (let i = 0; i < highlightNodes.length; i++) {
    highlightNodes[i].classList.toggle('ner-highlight-active', i === activeIndex);
  }

  const active = highlightNodes[activeIndex];
  if (!active) return;

  active.scrollIntoView({
    behavior: 'smooth',
    block: 'center',
    inline: 'nearest'
  });
}