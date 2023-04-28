
/************************************************************************************************************ */
/**
 * WAV functions
 * 
 * */
function isWAV(aview) {
    if ((readText(aview, 0, 4) == "RIFF") && (readText(aview, 8, 4) == "WAVE")) {
        return true;
    }
    return false;
}

//we've confirmed it's a WAV file, now grab all the metadata out of the file chunk by chunk
async function getWAVdata(file) {
    try {
        //get the UI tree element built and the root UL element
        let fileinfolist = buildTreeRoot();
        let rootnode = makeNewNode("WAV Sound File Tree (Click to Expand)");
        fileinfolist.appendChild(rootnode);
        //for now, we are ignoring overall RIFF chunk size, and just reading each individual chunk until EOF reached
        bytepos = 12;
        moreleft = true;
        while (moreleft) {
            abuff = await file.slice(bytepos, bytepos + 8).arrayBuffer();
            aview = new DataView(abuff);
            chunkname = readText(aview, 0, 4);
            length = aview.getUint32(4, true);
            if (chunkname == "data") {
                let li = makeNewBottomNode("data Chunk (" + length + " bytes" + ") - Audio Sample Data");
                rootnode.children[1].appendChild(li);
            } else if (chunkname == "_PMX") {
                if (length > MAX_TEXT_LENGTH_TEXTS) {
                    //really really large text field; don't grab it
                    let li = makeNewBottomNode("_PMX Chunk (" + length + " bytes" + ") - XMP Metadata - TOO LARGE TO DISPLAY");
                    rootnode.children[1].appendChild(li);
                    textNames.push("_PMX Chunk - XMP Metadata");
                    textValues.push("TOO LARGE TO DISPLAY");
                } else {
                    //this node will be parent of others (ul)
                    let sublist = makeNewNode("_PMX Chunk (" + length + " bytes" + ") -  XMP Metadata");
                    rootnode.children[1].appendChild(sublist);
                    //read chunk into memory
                    hdrbuff = await file.slice(bytepos + 8, bytepos + 8 + length).arrayBuffer();
                    hdrview = new DataView(hdrbuff);
                    val = readText(hdrview, 0, length);
                    if (length > MAX_TEXT_LENGTH_TREE) {
                        sublist.children[1].appendChild(makeNewBottomNode("Text: TOO LONG TO DISPLAY"));
                    } else {
                        sublist.children[1].appendChild(makeNewBottomNode("Text: " + val));
                    }
                    //add to our text lists
                    textNames.push("_PMX (XMP) Data");
                    textValues.push(val);
                }
            } else {
                //unknown chunk
                let li = makeNewBottomNode(chunkname + " Chunk (" + length + " bytes" + ")");
                rootnode.children[1].appendChild(li);
            }
            bytepos = bytepos + 8 + length + (length % 2);  //include pad byte for odd lengths
            if (bytepos >= file.size) {
                moreleft = false;
            }
        }
    }
    catch (err) {
        console.log(err);
    }
}
