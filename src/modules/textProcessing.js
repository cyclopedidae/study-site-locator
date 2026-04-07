const NOISE_SELECTORS = [
  'nav', 'header', 'footer', 'aside', 'form', 'button',
  '.references', '.reference', '.citations', '.citation',
  '.related-articles', '.related-content', '.sidebar',
  '.author-info', '.metrics', '.advertisement', '.ads',
  '.cookie', '.supplementary', '.footnotes', 'sub', '.copyright',
  '.disclaimer', '.similar', '.similar-articles', '.citedby',
  '.citedby-articles',

  // Frontiers
  '.PeopleList', '.AffiliationList', '.RelatedArticles', '.ArticleTable',
  '.ArticleFigure', '.ArticleReference', '.Statement__Authorcontributions',
  '.References', '.Summary', '.Editor\\ \\&\\ Reviewers',
  '.Statement__Supplementarymaterial', '.Statement__Acknowledgments',

  // PMC / PubMed
  '.usa-link', '.tbl-box p', '.ack1', '.ack',
  '.funding-statement1', '.ref-list1', '.ref-list',
];

const SELECTORS = [
  '#bodymatter', // Sage,
  '#Article content',
  '.article-body',
  '.article-content',
  '.main-content',
  '.post-content',
  '.entry-content',
  '.full-text',
  '.html-body',
  'conflict-of-interest',
  'ArticleContent',
  'article-container',
  '.articleBody',
  '#body' // ScienceDirect
];

const METHOD_HEADERS = [
  'methods',
  'method',
  '2 methods', // Wiley
  '2. method',
  'materials and methods',
  '2 materials and methods',
  'patients and methods',
  'methodology',
  'experimental procedures',
  'study design',
  'research design',
  'subjects and methods',
  'materials methods',
  'the study'
];

const TERMINAL_HEADERS = [
  'results',
  'discussion',
  'conclusion',
  'conclusions',
  'limitations',
  'references',
  'acknowledgements',
  'funding',
  'data availability',
  'supplementary material',
  'citation',
  'copyright',
  'keywords'
];

const STOP_HEADERS = new Set([
  'references',
  'citations',
  'acknowledgements',
  'data availability',
  'supplementary material',
  'citation',
  'copyright',
  'supporting information',
  'author contributions'
]);

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
    const bd = body + '\n';
    const separator = '\n';

    const count = countCharacter(bd, separator);
    const chunks = [];

    let startIndex = 0;
    let endIndex = 0;

    for(let i = 0; i < count; i++) {
        endIndex = bd.indexOf(separator, startIndex);
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
  console.log("[TEXT] root:", best);

  let records = [...best.querySelectorAll('h2, h3, h4, p, figcaption, div[role="paragraph"], [id^="para"], [id^="p00"]')]
    .filter(el => !isInNoise(el))
    .map(el => ({
      tag: el.tagName,
      element: el,
      text: cleanBlock(el.innerText || '')
    }))
    .filter(record => record.text);

  console.log("[TEXT] raw records count:", records.length);
  console.log("[TEXT] all raw records:", records.map(r => ({
    tag: r.tag,
    text: r.text
  })));

  records = cutRecordsAfterTerminalSections(records);
  console.log("[TEXT] after terminal cut:", records.length);

  const methodsInfo = prioritizeMethodsSection(records);
  records = methodsInfo.records;
  const methodsFound = methodsInfo.methodsFound;

  console.log("[TEXT] after methods prioritize:", records.length);
  records = mergeHeadingRecords(records);
  console.log("[TEXT] after merge:", records.length);

  records = removeHeadingOnlyRecords(records);
  console.log("[TEXT] after heading removal:", records.length);

  const scored = records.map((record, index) => ({
    index,
    element: record.element,
    text: record.text,
    inMethods: !!record.inMethods,
    methodsFound,
    score: scoreBlockForNER(record.text)
  }));

  console.log("[TEXT] scored records:", scored.map(r => ({
    score: r.score,
    text: r.text
  })));

  return scored.filter(record => record.score >= 2);
}

function prioritizeMethodsSection(records) {
  let methodsStart = -1;
  let methodsEnd = records.length;

  const headingPriority = ['h2', 'h3', 'h4'];

  const methodCandidates = records
    .map((record, index) => ({
      index,
      text: normalizeHeading(record?.text),
      tag: record?.element?.tagName?.toLowerCase() || ''
    }))
    .filter(record =>
      METHOD_HEADERS.includes(record.text) &&
      headingPriority.includes(record.tag)
    );

  if (methodCandidates.length === 0) {
    console.log("[TEXT] No Methods section found");
    return {
      records: records.map(record => ({ ...record, inMethods: false })),
      methodsFound: false
    };
  }

  let chosenLevel = null;
  for (const level of headingPriority) {
    if (methodCandidates.some(record => record.tag === level)) {
      chosenLevel = level;
      break;
    }
  }

  const chosenMethod = methodCandidates.find(record => record.tag === chosenLevel);
  methodsStart = chosenMethod.index;

  for (let i = methodsStart + 1; i < records.length; i++) {
    const text = normalizeHeading(records[i]?.text);
    const tag = records[i]?.element?.tagName?.toLowerCase() || '';

    if (tag === chosenLevel && TERMINAL_HEADERS.includes(text)) {
      methodsEnd = i;
      break;
    }
  }

  const tagged = records.map((record, index) => ({
    ...record,
    inMethods: index >= methodsStart && index < methodsEnd
  }));

  const methodsRecords = tagged.slice(methodsStart, methodsEnd);
  const beforeMethods = tagged.slice(0, methodsStart);
  const afterMethods = tagged.slice(methodsEnd);

  console.log("[TEXT] Methods section prioritized:", {
    chosenLevel,
    methodsStart,
    methodsEnd,
    methodsCount: methodsRecords.length
  });

  return {
    records: [...methodsRecords, ...beforeMethods, ...afterMethods],
    methodsFound: true
  };
}

function removeHeadingOnlyRecords(records) {
  return records.filter(record => !isHeadingOnlyRecord(record.text));
}

function isHeadingOnlyRecord(text) {
  const t = normalizeHeading(text);
  if (!t) return true;

  // Remove if alone
  const headings = new Set([
    'abstract',
    'introduction',
    'background',
    'methods',
    'materials and methods',
    'patients and methods',
    'methodology',
    'experimental procedures',
    'study design',
    'research design',
    'subjects and methods',
    'results',
    'discussion',
    'conclusion',
    'conclusions',
    'references',
    'acknowledgements',
    'funding',
    'data availability',
    'supplementary material',
    'keywords',
    'citation',
    'copyright'
  ]);

  return headings.has(t);
}

function normalizeHeading(text) {
  return (text || '')
    .trim()
    .toLowerCase()
    .replace(/[.:]+$/g, '')
    .replace(/\s+/g, ' ');
}

function getBestArticleRoot() {
  const candidates = [...new Set(
    SELECTORS.flatMap(sel => [...document.querySelectorAll(sel)])
  )];

  if (candidates.length === 0) {
    candidates.push(document.body);
  }

  const scored = candidates.map(node => ({
    node,
    score: scoreNode(node),
  }));

  scored.sort((a, b) => b.score - a.score);

  console.log("[TEXT] Best article root chosen:", scored[0]);
  return scored[0].node;
}

function cutRecordsAfterTerminalSections(records) {
  const out = [];

  for (const record of records) {
    if (!record?.text) continue;

    const lowered = record.text.trim().toLowerCase();
    if (STOP_HEADERS.has(lowered)) {
      console.log("[TEXT] Stopping at terminal section:", record.text);
      break;
    }

    out.push(record);
  }

  return out;
}

function scoreNode(node) {
  const text = node.innerText || '';
  const pCount = node.querySelectorAll('p').length;
  const linkCount = node.querySelectorAll('a').length;
  const buttonCount = node.querySelectorAll('button').length;
  const liCount = node.querySelectorAll('li').length;

  const textLen = text.length;
  const penalty = linkCount * 20 + buttonCount * 30 + liCount * 8;

  return textLen + pCount * 200 - penalty;
}

function isInNoise(el) {
  return NOISE_SELECTORS.some(sel => el.closest(sel));
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

    if (/\b(|conducted in|conducted at|university|institute|laboratory|lab|department of|school of|faculty of|subjects|center)\b/i.test(block)) score += 3;
    if (/\b(hospital|province|review board|participants)\b/i.test(block)) score += 5;
    //if (/\b(canada|usa|united states|uk|france|germany|china|japan|australia|sweden)\b/i.test(block)) score += 2;
    if (/[A-Z][a-z]+(?:\s+[A-Z][a-z]+){1,4}/.test(block)) score += 1;
    if (/\b(north|northern|east|eastern|west|western|south|southern)\b/i.test(block)) score += 1;
    if (block.length < 40) score -= 2;
    if (/^\d+(\.|\))/.test(block)) score -= 1;
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
        text: `${curr.text} ${next.text}`,
        inMethods: !!next.inMethods
      });
      i += 2;
    } else {
      merged.push(curr);
      i += 1;
    }
  }

  return merged;
}