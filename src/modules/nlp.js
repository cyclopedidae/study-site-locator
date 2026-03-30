import { pipeline, env } from '@xenova/transformers';

let nerPipeline = null;

env.backends.onnx.wasm.numThreads = 1;
env.allowLocalModels = true;
env.allowRemoteModels = false;
env.localModelPath = chrome.runtime.getURL('models/');

export async function findEntities(chunks) {

  const ner = await getNER();
  const results = []

  for (let chunk of chunks) {
    console.log(chunk);
    const out = await ner(chunk);
    console.log(out);  
    results.push(out);
  }

  return results;
}

async function getNER() {
  if (!nerPipeline) {
    nerPipeline = pipeline('token-classification', 'Xenova/bert-base-NER');
  }
  return nerPipeline
}