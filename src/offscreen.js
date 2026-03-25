import { pipeline, env } from '@xenova/transformers';

let nerPipeline = null;

// env.backends.onnx.wasm.numThreads = 1;
env.allowLocalModels = true;
env.allowRemoteModels = false;
env.localModelPath = chrome.runtime.getURL('models/');

chrome.runtime.onMessage.addListener((request, sender, sendResponse) =>  {
    if (request.action === "run_ner_offscreen") {
        runNER(request.chunk)
            .then((result) => sendResponse({ status: 'ok', entities: result }))
            .catch((error) => sendResponse({ status: 'error', message: error.message }));
    }

    return true;
});

async function runNER(chunk) {
    const ner = await getNER();
    return await ner(chunk);
}

async function getNER() {
  if (!nerPipeline) {
    nerPipeline = pipeline('token-classification', 'Xenova/bert-base-NER');
  }
  return nerPipeline
}