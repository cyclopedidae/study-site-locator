let highlightNodes = [];
let highlightNodeSet = new Set();
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
  highlightNodeSet = new Set();
  activeIndex = -1;
}

function highlightPhraseWithinRoot(root, phrase) {
  if (!phrase || !phrase.trim()) return 0;

  const escaped = escapeRegex(phrase.trim());
  const regex = new RegExp(`\\b${escaped}\\b`, 'gi');

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

      lastIndex = end;
      count++;
    }

    if (lastIndex < text.length) {
      fragment.appendChild(document.createTextNode(text.slice(lastIndex)));
    }

    textNode.parentNode.replaceChild(fragment, textNode);
  }

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
    }
  `;

  document.head.appendChild(style);
}

function isVisibleHighlight(node) {
  if (!node || !node.isConnected) return false;

  const style = window.getComputedStyle(node);
  if (
    style.display === 'none' ||
    style.visibility === 'hidden' ||
    style.opacity === '0'
  ) {
    return false;
  }

  const rect = node.getBoundingClientRect();
  if (rect.width === 0 || rect.height === 0) return false;

  if (!node.textContent || !node.textContent.trim()) return false;

  return true;
}

export function refreshHighlightNavigator() {
  const previousActive = activeIndex >= 0 ? highlightNodes[activeIndex] : null;

  highlightNodes = Array.from(document.querySelectorAll('mark.ner-highlight'))
    .filter(isVisibleHighlight);

  highlightNodeSet = new Set(highlightNodes);

  if (highlightNodes.length === 0) {
    activeIndex = -1;
    return;
  }

  if (previousActive) {
    const sameIndex = highlightNodes.indexOf(previousActive);
    if (sameIndex >= 0) {
      activeIndex = sameIndex;
      updateActiveHighlight(false);
      return;
    }
  }

  if (activeIndex < 0 || activeIndex >= highlightNodes.length) {
    activeIndex = 0;
  }

  updateActiveHighlight(false);
}

export function setActiveHighlightToFirstInElement(element) {
  if (!element) return false;

  refreshVisibleState();

  const candidates = Array.from(
    element.querySelectorAll('mark.ner-highlight')
  ).filter(isVisibleHighlight);

  if (candidates.length === 0) return false;

  const target = candidates[0];
  const index = highlightNodes.indexOf(target);

  if (index === -1) return false;

  activeIndex = index;
  updateActiveHighlight(true);
  return true;
}

export function nextHighlight() {
  refreshVisibleState();
  if (highlightNodes.length === 0) return;

  activeIndex = (activeIndex + 1) % highlightNodes.length;
  updateActiveHighlight(true);
}

export function previousHighlight() {
  refreshVisibleState();
  if (highlightNodes.length === 0) return;

  activeIndex = (activeIndex - 1 + highlightNodes.length) % highlightNodes.length;
  updateActiveHighlight(true);
}

function refreshVisibleState() {
  const previousActive = highlightNodes[activeIndex] || null;

  highlightNodes = highlightNodes.filter(isVisibleHighlight);
  highlightNodeSet = new Set(highlightNodes);

  if (highlightNodes.length === 0) {
    activeIndex = -1;
    return;
  }

  const sameIndex = previousActive ? highlightNodes.indexOf(previousActive) : -1;
  activeIndex = sameIndex >= 0 ? sameIndex : Math.min(Math.max(activeIndex, 0), highlightNodes.length - 1);
}

function updateActiveHighlight(shouldScroll = true) {
  for (let i = 0; i < highlightNodes.length; i++) {
    highlightNodes[i].classList.toggle('ner-highlight-active', i === activeIndex);
  }

  if (!shouldScroll) return;

  const active = highlightNodes[activeIndex];
  if (!active || !isVisibleHighlight(active)) return;

  active.scrollIntoView({
    behavior: 'smooth',
    block: 'center',
    inline: 'nearest'
  });
}

export function registerHighlightsInElement(element) {
  if (!element) return 0;

  const found = Array.from(element.querySelectorAll('mark.ner-highlight'))
    .filter(isVisibleHighlight);

  let added = 0;

  for (const node of found) {
    if (highlightNodeSet.has(node)) continue;
    highlightNodes.push(node);
    highlightNodeSet.add(node);
    added++;
  }

  if (activeIndex === -1 && highlightNodes.length > 0) {
    activeIndex = 0;
    updateActiveHighlight(false);
  }

  return added;
}