import { pipeline, env } from '@xenova/transformers';

let nerPipeline = null;

env.backends.onnx.wasm.numThreads = 1;
env.allowLocalModels = true;
env.allowRemoteModels = false;
env.localModelPath = chrome.runtime.getURL('models/');

chrome.runtime.onMessage.addListener((request, sender, sendResponse) =>  {
    if (request.action === "run_ner") {
        (async() => {
            try {                
                for (let i = 0; i < request.data.length; i++) {
                    const start = performance.now();
                    const result = await runNER(request.data[i]);

                    const relevant = result.filter(ent =>
                        ent.entity.endsWith("LOC") || ent.entity.endsWith("ORG")
                    )

                    const end = performance.now();
                    
                    console.log(relevant);
                    console.log(`Length of chunk: `, request.data[i].length)
                    console.log(`Elapsed: ${(end - start).toFixed(2)} ms`);
                }
                sendResponse({ status: 'ok', entities: relevant });
            } catch (error) {
                sendResponse({ status: 'offscreen ner error', message: error.message });
            }
        })();
            // .then((result) => sendResponse({ status: 'ok', entities: result }))
            // .catch((error) => sendResponse({ status: 'offscreen ner error', message: error.message }));
        
        return true;
    }
});

async function runNER(chunk) {
    const ner = await getNER();
    return await ner(chunk);
}

async function getNER() {
  if (!nerPipeline) {
    nerPipeline = await pipeline('token-classification', 'Xenova/bert-base-NER');
  }
  return nerPipeline
}