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

testNER("This study was conducted among a rural Northern Plains American Indian reservation population that had participated in a previous study known as the American Indian Vietnam Veterans Project (8) . When the present study was initiated, veterans from the previous study represented the best sample available of American Indians with a known prevalence of lifetime psychiatric disorders, including PTSD (8) . The substantial prevalence of well-characterized cases of mental illness was critical to testing the reliability of the SCID in this manner. Bias due to respondents’ prior familiarity with the SCID was minimized by the 8 years or more that had elapsed since the conclusion of the American Indian Vietnam Veterans Project.");

//node C:\Users\User\Documents\00_INBOX\mhf_ssl_location_finder\mhf_ssl_location_finder\src\modules\testNER.js