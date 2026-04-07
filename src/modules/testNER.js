import { pipeline, env } from '@xenova/transformers';

let nerPipeline = null;

env.backends.onnx.wasm.numThreads = 1;
env.allowLocalModels = true;
env.allowRemoteModels = true;

async function runNER(chunk, options = {}) {
  const ner = await getNER();
  return await ner(chunk, options);
}

async function getNER() {
  if (!nerPipeline) {
    nerPipeline = await pipeline('token-classification', 'Xenova/bert-base-NER');
    console.log("NER model loaded");
  }
  return nerPipeline;
}

async function testNER(str) {
  const result = await runNER(str, { ignore_labels: [] });
  console.log(result);
}

testNER("The study was conducted across 2 Selwyn Foundation dementia day care centers in Auckland, New Zealand.");

//node C:\Users\User\Documents\00_INBOX\mhf_ssl_location_finder\mhf_ssl_location_finder\src\modules\testNER.js