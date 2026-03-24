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


chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "read_body") {

        const body = document.body.innerText;

        chrome.runtime.sendMessage(
            { action: 'send_raw_body', data: body }, 
            (response) => {
                sendResponse({ status: "ok", bgResponse: response })
        });
        // highlightPhrase("Netherlands Organization");
        return true;
    }
});
})();

/******/ })()
;
//# sourceMappingURL=content.js.map