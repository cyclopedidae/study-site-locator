import { pipeline } from '@xenova/transformers';

const ner = await pipeline('token-classification', 'Xenova/bert-base-NER');

async function findEntities(text) {
    return await ner(text);
}