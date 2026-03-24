function highlightEntities(entities, root = document.body) {
  const sorted = [...entities].sort((a, b) => b.start - a.start);

  for (const entity of sorted) {
    const range = findRangeFromOffsets(entity.start, entity.end, root);
    if (!range) continue;

    const span = document.createElement("span");
    span.className = "my-highlight";

    const contents = range.extractContents();
    span.appendChild(contents);
    range.insertNode(span);
  }
}

function highlightPhrase(phrase) {
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  const regex = new RegExp(phrase, "gi");

  let node;
  while ((node = walker.nextNode())) {
    if (
      node.parentElement &&
      !["SCRIPT", "STYLE", "NOSCRIPT"].includes(node.parentElement.tagName) &&
      regex.test(node.nodeValue)
    ) {
      const span = document.createElement("span");
      span.innerHTML = node.nodeValue.replace(regex, "<mark>$&</mark>");
      node.parentNode.replaceChild(span, node);
    }
  }
}

// ---- helpers ----

function getTextNodes(root) {
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  const nodes = [];

  let node;
  while ((node = walker.nextNode())) {
    if (
      node.parentElement &&
      !["SCRIPT", "STYLE", "NOSCRIPT"].includes(node.parentElement.tagName) &&
      node.nodeValue.trim()
    ) {
      nodes.push(node);
    }
  }
  return nodes;
}

function findRangeFromOffsets(start, end, root) {
  const nodes = getTextNodes(root);

  let pos = 0;
  let startNode = null, endNode = null;
  let startOffset = 0, endOffset = 0;

  for (const node of nodes) {
    const len = node.nodeValue.length;

    if (startNode === null && start >= pos && start < pos + len) {
      startNode = node;
      startOffset = start - pos;
    }

    if (endNode === null && end > pos && end <= pos + len) {
      endNode = node;
      endOffset = end - pos;
    }

    pos += len;
  }

  if (!startNode || !endNode) return null;

  const range = document.createRange();
  range.setStart(startNode, startOffset);
  range.setEnd(endNode, endOffset);

  return range;
}