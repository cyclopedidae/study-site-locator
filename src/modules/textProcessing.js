export function getPortionedChunks(body) {
    const chunks = chunkify(body);
    const portions = [];

    const upperBound = 1200;
    const lowerBound = 900;

    let i = 0;

    while (i < chunks.length) {

        if (isChunkLarge(chunks, i, upperBound)) {
            let splitChunks = getSplitChunks(chunks[i], lowerBound);
            portions.push(...splitChunks);

            i++;
            continue;
        }

        if (isChunkMid(chunks, i, lowerBound, upperBound)) {
            portions.push(chunks[i]);

            i++;
            continue;
        }

        if (isChunkSmall(chunks, i, lowerBound)) {
            const numChunksToAdd = getChunksToAdd(chunks, i, lowerBound);

            let addedChunks = chunks[i];

            for (let j = 1; j <= numChunksToAdd; j++) {
                addedChunks += ' ' + chunks[i + j];
            }
            
            portions.push(addedChunks);
            i += numChunksToAdd + 1;
        }
    }
    const result = removeEmptyStrings(portions)
    return result;

}

function removeEmptyStrings(arr) {
    for (let i = arr.length - 1; i >= 0; i--) {
        if (arr[i].length === 0) {
            arr.splice(i, 1);
        }
    }
    return arr;
}

function isChunkLarge(chunks, i, upperBound) {
    if (chunks[i].length > upperBound) {
        return true;
    }

    return false;
}

function isChunkMid(chunks, i, lowerBound, upperBound) {
    if (chunks[i].length >= lowerBound && chunks[i].length <= upperBound) {
        return true;
    }

    return false;
}

function isChunkSmall(chunks, i, lowerBound) {
    if(chunks[i].length < lowerBound) {
        return true;
    }

    return false;
}

function getSplitChunks(chunk, lowerBound) {
    const chunk_length = chunk.length;
    const split_chunks = [];
    
    let splitPoint;
    const splits = Math.floor(chunk_length / lowerBound);

    if (splits >= 2 ) {
        splitPoint = chunk_length / splits;

        let startIndex = 0;
        let endIndex = 0;

        for (let j = 1; j < splits + 1; j++) {
            endIndex = chunk.indexOf('.', startIndex + splitPoint);

            if (endIndex == -1) {
                endIndex = startIndex + splitPoint;
            }

            split_chunks.push(chunk.substring(startIndex, endIndex));
            startIndex = endIndex + 1;
            }

    } else {
        const mid = Math.floor(chunk.length / 2);
        splitPoint = chunk.indexOf('.', mid);

        if (splitPoint == -1) {
            splitPoint = mid;
        }

        const chunk1 = chunk.substring(0, splitPoint);
        const chunk2 = chunk.substring(splitPoint);

        split_chunks.push(chunk1);
        split_chunks.push(chunk2);
    }

    return split_chunks;
}

function getChunksToAdd(chunks, i, lowerBound) {
    let isMax = false;
    let currSize = chunks[i].length;
    let nextSize;
    let combinedSize;

    let counter = 0;

    while(!isMax) {
        if (i + counter + 1 >= chunks.length) {
            isMax = true;
            break;
        }

        nextSize = chunks[i + counter + 1].length;
        combinedSize = currSize + nextSize;
        
        if(combinedSize <= lowerBound) {
            currSize += nextSize;
            counter ++;
        } else { break; }
    }

    return counter;
}

function chunkify(body) {
    // can just do: return body.split('\n');
    // cry
    const bd = body + '\n';
    const separator = '\n';

    const count = countCharacter(bd, separator);
    const chunks = [];

    let startIndex = 0;
    let endIndex = 0;

    for(let i = 0; i < count; i++) {
        endIndex = bd.indexOf(separator, startIndex);
        // Add line to chunk
        chunks.push(bd.substring(startIndex, endIndex));
        startIndex = endIndex + 1;
    }

    return chunks;
}

function countCharacter(str, char) {
    const regex = new RegExp(char, 'g');
    const matches = str.match(regex);
    return matches ? matches.length : 0;
}

export function getCandidateRecords() {
    const best = getBestArticleRoot();
    removeNoise(best);

    let records = [...best.querySelectorAll('h2, h3, h4, p, figcaption')]
        .map(el => {
        const built = buildCleanedTextWithMap(el.innerText || '');

        return {
            element: el,
            originalText: built.originalText,
            text: built.cleanedText,
            offsetMap: built.offsetMap
        };
        })
        .filter(record => record.text);

    // TEMP: disable heading merging until offsets work correctly
    // records = mergeHeadingRecords(records);

    records = cutRecordsAfterTerminalSections(records);

    return records
        .map((record, index) => ({
        index,
        element: record.element,
        originalText: record.originalText,
        text: record.text,
        offsetMap: record.offsetMap
        }))
        .filter(record => scoreBlockForNER(record.text) >= 2);
}
function getBestArticleRoot() {
  const selectors = [
    'article',
    'main',
    '[role="main"]',
    '.article-body',
    '.article-content',
    '.main-content',
    '.post-content',
    '.entry-content',
    '.full-text',
    '.html-body',
    'conflict-of-interest',
    'body main-article-body',
    'ArticleContent',
    'article-container'
  ];

  const candidates = [...new Set(
    selectors.flatMap(sel => [...document.querySelectorAll(sel)])
  )];

  if (candidates.length === 0) {
    candidates.push(document.body);
  }

  const scored = candidates.map(node => ({
    node,
    score: scoreNode(node),
  }));

  scored.sort((a, b) => b.score - a.score);
  return scored[0].node.cloneNode(true);
}

function cutRecordsAfterTerminalSections(records) {
  const stopHeaders = new Set([
    'references',
    'citations',
    'acknowledgements',
    'funding',
    'conflict of interest',
    'data availability',
    'supplementary material',
    'keywords',
    'citation',
    'copyright',
    'supporting information'
  ]);

  const out = [];

  for (const record of records) {
    if (!record?.text) continue;

    if (stopHeaders.has(record.text.trim().toLowerCase())) break;
    out.push(record);
  }

  return out;
}

// Likelihood of node being the main article content
function scoreNode(node) {
  const text = node.innerText || '';
  const pCount = node.querySelectorAll('p').length;
  const linkCount = node.querySelectorAll('a').length;
  const buttonCount = node.querySelectorAll('button').length;
  const liCount = node.querySelectorAll('li').length; // list items

  const textLen = text.length;
  const penalty = linkCount * 20 + buttonCount * 30 + liCount * 8;

  return textLen + pCount * 200 - penalty;
}

function removeNoise(root) {
  const badSelectors = [
    'nav', 'header', 'footer', 'aside', 'form', 'button',
    '.references', '.reference', '.citations', '.citation',
    '.related-articles', '.related-content', '.sidebar',
    '.author-info', '.metrics', '.advertisement', '.ads',
    '.cookie', '.supplementary', '.footnotes', 'sub', '.copyright',
    '.disclaimer', '.similar', '.similar-articles', '.citedby', 
    '.citedby-articles',

    // Frontiers
    '.PeopleList', '.AffiliationList', '.RelatedArticles', '.ArticleTable', 
    '.ArticleFigure','.ArticleReference', '.Statement__Authorcontributions', 
    '.References', '.Summary', '.Editor & Reviewers', '.Statement__Supplementarymaterial',
    '.Statement__Acknowledgments',

    // PMC Pubmed
    '.usa-link', '.tbl-box p', '.ack1', '.ack', '.funding-statement1', '.ref-list1', '.ref-list'
  ];

  for (const sel of badSelectors) {
    root.querySelectorAll(sel).forEach(el => el.remove());
  }
}

function cleanBlock(text) {
    return text
        .replace(/[ \t]{2,}/g, ' ')
        .replace(/\n{2,}/g, '\n')
        .split('\n')
        .map(line => line.trim())
        .filter(line => line.length > 0)
        .join(' ');
}

function isLikelyHeading(text) {
    if (text.length === 0) return false;
    if (text.length > 80) return false;
    if (/[.!?:;]$/.test(text)) return false;
    return true;
}

function scoreBlockForNER(block) {
    let score = 0;

    if (/\b(university|institute|hospital|laboratory|lab|province)\b/i.test(block)) score += 3;
    if (/\b(department of|school of|faculty of)\b/i.test(block)) score += 3;
    if (/\b(canada|usa|united states|uk|france|germany|china|japan|australia)\b/i.test(block)) score += 2;
    if (/[A-Z][a-z]+(?:\s+[A-Z][a-z]+){1,4}/.test(block)) score += 1; // proper-name-ish phrase
    if (block.length < 40) score -= 2;
    if (/^\d+(\.|\))/ .test(block)) score -= 1;
    if (/\b(references|acknowledgements|supplementary)\b/i.test(block)) score -= 5;

    return score;
    }

    export function generateCandidates(blocks, minScore = 2) {
    return blocks.filter(block => scoreBlockForNER(block) >= minScore);
}

function mergeHeadingRecords(records) {
  const merged = [];
  let i = 0;

  while (i < records.length) {
    const curr = records[i];
    const next = records[i + 1];

    if (isLikelyHeading(curr.text) && next) {
      merged.push({
        element: next.element,
        text: `${curr.text} ${next.text}`
      });
      i += 2;
    } else {
      merged.push(curr);
      i += 1;
    }
  }

  return merged;
}

function buildCleanedTextWithMap(text) {
    const original = text || '';
    let cleaned = '';
    const offsetMap = [];

    let prevWasSpace = false;

    for (let i = 0; i < original.length; i++) {
        const ch = original[i];
        const isSpace = /\s/.test(ch);

        if (isSpace) {
        if (!prevWasSpace) {
            cleaned += ' ';
            offsetMap.push(i);
            prevWasSpace = true;
        }
        } else {
        cleaned += ch;
        offsetMap.push(i);
        prevWasSpace = false;
        }
    }

    // trim leading/trailing spaces while keeping offset map aligned
    let start = 0;
    let end = cleaned.length;

    while (start < end && cleaned[start] === ' ') start++;
    while (end > start && cleaned[end - 1] === ' ') end--;

    return {
        originalText: original,
        cleanedText: cleaned.slice(start, end),
        offsetMap: offsetMap.slice(start, end)
    };
}