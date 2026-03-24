import { pipeline, env } from '@xenova/transformers';

let nerReady = null;

env.backends.onnx.wasm.numThreads = 1;

export async function findEntities(chunks) {
  if (!nerReady) {
    nerReady = pipeline('token-classification', 'Xenova/bert-base-NER');
  }

  for (let chunk of chunks) {
    console.log(chunk);
    const ner = await nerReady;
    const result = await ner(chunk);
    console.log(result);  
  }

  return result;
}