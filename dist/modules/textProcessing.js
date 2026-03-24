export function getPortionedChunks(body) {
    const chunks = chunkify(body);
    const portions = [];

    // Q TO ASK ANDY: should I keep this? or hardcode in is* funcs?
    const upperBound = 1200;
    const lowerBound = 900;

    let i = 0;

    while (i < chunks.length) {

        if (isChunkLarge(chunks, i, upperBound)) {
            let splitChunks = getSplitChunks(chunks[i], lowerBound);
            portions.push(...splitChunks);

            i++;
            continue;
        }

        if (isChunkMid(chunks, i, lowerBound, upperBound)) {
            portions.push(chunks[i]);

            i++;
            continue;
        }

        if (isChunkSmall(chunks, i, lowerBound)) {
            const numChunksToAdd = getChunksToAdd(chunks, i, lowerBound);

            let addedChunks = chunks[i];

            for (let j = 1; j <= numChunksToAdd; j++) {
                addedChunks += chunks[i + j];
            }
            
            portions.push(addedChunks);
            i += numChunksToAdd + 1;
        }
    }
    const result = removeEmptyStrings(portions)
    return result;

}

function removeEmptyStrings(arr) {
    for (let i = arr.length - 1; i >= 0; i--) {
        if (arr[i].length === 0) {
            arr.splice(i, 1);
        }
    }
    return arr;
}

function isChunkLarge(chunks, i, upperBound) {
    if (chunks[i].length > upperBound) {
        return true;
    }

    return false;
}

function isChunkMid(chunks, i, lowerBound, upperBound) {
    if (chunks[i].length >= lowerBound && chunks[i].length <= upperBound) {
        return true;
    }

    return false;
}

function isChunkSmall(chunks, i, lowerBound) {
    if(chunks[i].length < lowerBound) {
        return true;
    }

    return false;
}

function getSplitChunks(chunk, lowerBound) {
    const chunk_length = chunk.length;
    const split_chunks = [];
    
    let splitPoint;
    const splits = Math.floor(chunk_length / lowerBound);

    if (splits >= 2 ) {
        splitPoint = chunk_length / splits;

        let startIndex = 0;
        let endIndex = 0;

        for (let j = 1; j < splits + 1; j++) {
            endIndex = chunk.indexOf('.', startIndex + splitPoint);

            if (endIndex == -1) {
                endIndex = startIndex + splitPoint;
            }

            split_chunks.push(chunk.substring(startIndex, endIndex));
            startIndex = endIndex + 1;
            }

    } else {
        const mid = Math.floor(chunk.length / 2);
        splitPoint = chunk.indexOf('.', mid);

        if (splitPoint == -1) {
            splitPoint = mid;
        }

        const chunk1 = chunk.substring(0, splitPoint);
        const chunk2 = chunk.substring(splitPoint);

        split_chunks.push(chunk1);
        split_chunks.push(chunk2);
    }

    return split_chunks;
}

function getChunksToAdd(chunks, i, lowerBound) {
    let isMax = false;
    let currSize = chunks[i].length;
    let nextSize;
    let combinedSize;

    let counter = 0;

    while(!isMax) {
        if (i + counter + 1 >= chunks.length) {
            isMax = true;
            break;
        }

        nextSize = chunks[i + counter + 1].length;
        combinedSize = currSize + nextSize;
        
        if(combinedSize <= lowerBound) {
            currSize += nextSize;
            counter ++;
        } else { break; }
    }

    return counter;
}

function chunkify(body) {
    // can just do: return body.split('\n');
    // cry
    const bd = body + '\n';
    const separator = '\n';

    const count = countCharacter(bd, separator);
    const chunks = [];

    let startIndex = 0;
    let endIndex = 0;

    for(let i = 0; i < count; i++) {
        endIndex = bd.indexOf(separator, startIndex);
        // Add line to chunk
        chunks.push(bd.substring(startIndex, endIndex));
        startIndex = endIndex + 1;
    }

    return chunks;
}

function countCharacter(str, char) {
    const regex = new RegExp(char, 'g');
    const matches = str.match(regex);
    return matches ? matches.length : 0;
}