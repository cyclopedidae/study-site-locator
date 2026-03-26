/******/ (() => { // webpackBootstrap
/******/ 	var __webpack_modules__ = ({

/***/ "./src/modules/highlightRange.js"
/*!***************************************!*\
  !*** ./src/modules/highlightRange.js ***!
  \***************************************/
() {

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

/***/ },

/***/ "./src/modules/textProcessing.js"
/*!***************************************!*\
  !*** ./src/modules/textProcessing.js ***!
  \***************************************/
(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   getPortionedChunks: () => (/* binding */ getPortionedChunks)
/* harmony export */ });
function getPortionedChunks(body) {
    const chunks = chunkify(body);
    const portions = [];

    // Q TO ASK ANDY: should I keep this? or hardcode in is* funcs?
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
                addedChunks += chunks[i + j];
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

/***/ }

/******/ 	});
/************************************************************************/
/******/ 	// The module cache
/******/ 	var __webpack_module_cache__ = {};
/******/ 	
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/ 		// Check if module is in cache
/******/ 		var cachedModule = __webpack_module_cache__[moduleId];
/******/ 		if (cachedModule !== undefined) {
/******/ 			return cachedModule.exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = __webpack_module_cache__[moduleId] = {
/******/ 			// no module.id needed
/******/ 			// no module.loaded needed
/******/ 			exports: {}
/******/ 		};
/******/ 	
/******/ 		// Execute the module function
/******/ 		if (!(moduleId in __webpack_modules__)) {
/******/ 			delete __webpack_module_cache__[moduleId];
/******/ 			var e = new Error("Cannot find module '" + moduleId + "'");
/******/ 			e.code = 'MODULE_NOT_FOUND';
/******/ 			throw e;
/******/ 		}
/******/ 		__webpack_modules__[moduleId](module, module.exports, __webpack_require__);
/******/ 	
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/ 	
/************************************************************************/
/******/ 	/* webpack/runtime/compat get default export */
/******/ 	(() => {
/******/ 		// getDefaultExport function for compatibility with non-harmony modules
/******/ 		__webpack_require__.n = (module) => {
/******/ 			var getter = module && module.__esModule ?
/******/ 				() => (module['default']) :
/******/ 				() => (module);
/******/ 			__webpack_require__.d(getter, { a: getter });
/******/ 			return getter;
/******/ 		};
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/define property getters */
/******/ 	(() => {
/******/ 		// define getter functions for harmony exports
/******/ 		__webpack_require__.d = (exports, definition) => {
/******/ 			for(var key in definition) {
/******/ 				if(__webpack_require__.o(definition, key) && !__webpack_require__.o(exports, key)) {
/******/ 					Object.defineProperty(exports, key, { enumerable: true, get: definition[key] });
/******/ 				}
/******/ 			}
/******/ 		};
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/hasOwnProperty shorthand */
/******/ 	(() => {
/******/ 		__webpack_require__.o = (obj, prop) => (Object.prototype.hasOwnProperty.call(obj, prop))
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/make namespace object */
/******/ 	(() => {
/******/ 		// define __esModule on exports
/******/ 		__webpack_require__.r = (exports) => {
/******/ 			if(typeof Symbol !== 'undefined' && Symbol.toStringTag) {
/******/ 				Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });
/******/ 			}
/******/ 			Object.defineProperty(exports, '__esModule', { value: true });
/******/ 		};
/******/ 	})();
/******/ 	
/************************************************************************/
var __webpack_exports__ = {};
// This entry needs to be wrapped in an IIFE because it needs to be in strict mode.
(() => {
"use strict";
/*!************************!*\
  !*** ./src/content.js ***!
  \************************/
__webpack_require__.r(__webpack_exports__);
/* harmony import */ var _modules_highlightRange_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./modules/highlightRange.js */ "./src/modules/highlightRange.js");
/* harmony import */ var _modules_highlightRange_js__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(_modules_highlightRange_js__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var _modules_textProcessing_js__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./modules/textProcessing.js */ "./src/modules/textProcessing.js");



chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "extract_text") {

        const body = document.body.innerText;
        const chunks = (0,_modules_textProcessing_js__WEBPACK_IMPORTED_MODULE_1__.getPortionedChunks)(body);

        chrome.runtime.sendMessage(
            { action: 'analyze_text', data: chunks }, // sending chunked body through array
            (response) => {
                sendResponse({ status: "ok", bgResponse: response })
        });

        return true;
    }
});
})();

/******/ })()
;
//# sourceMappingURL=content.js.map