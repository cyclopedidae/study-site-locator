import { pipeline, env } from '@xenova/transformers';

let nerPipeline = null;

env.backends.onnx.wasm.numThreads = 1;
env.allowLocalModels = true;
env.allowRemoteModels = true;
env.localModelPath = chrome.runtime.getURL('models/');

export async function runNER(chunk) {
  const ner = await getNER();
  return await ner(chunk);
}

async function getNER() {
  if (!nerPipeline) {
    console.log("[OFFSCREEN] Loading NER model...");
    nerPipeline = await pipeline('token-classification', 'Xenova/bert-base-NER');
    console.log("[OFFSCREEN] NER model loaded");
  }
  return nerPipeline;
}
