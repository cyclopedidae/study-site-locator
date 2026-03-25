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