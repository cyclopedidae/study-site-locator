import { pipeline, env } from '@xenova/transformers';

let nerPipeline = null;

// env.backends.onnx.wasm.numThreads = 1;
env.allowLocalModels = true;
env.allowRemoteModels = false;
env.localModelPath = chrome.runtime.getURL('models/');

export async function getNER() {
  if (!nerPipeline) {
    nerPipeline = pipeline('token-classification', 'Xenova/bert-base-NER');
  }
  return nerPipeline
}