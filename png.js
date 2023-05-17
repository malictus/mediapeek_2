
/************************************************************************************************************ */
/**
 * PNG functions
 * 
 * */
//check to see if the beginning of a file (a DataView object) is the PNG header
function isPNG(aview) {
    const initPNG = [137, 80, 78, 71, 13, 10, 26, 10];
    counter = 0;
    while (counter < 8) {
        if (initPNG[counter] != aview.getUint8(counter)) {
            return false;
        }
        counter++;
    }
    return true;
}

//we've confirmed it's a PNG file, now grab all the metadata out of the file chunk by chunk
async function getPNGdata(file) {
    try {
        //get the UI tree element built and the root UL element
        let fileinfolist = buildTreeRoot();
        let rootnode = makeNewNode("PNG Image File Tree");
        fileinfolist.appendChild(rootnode);
        //read in 8 bytes at the beginning of each chunk
        bytepos = 8; //initially start reading after the 8-byte PNG header
        fileend = false;
        while (!fileend) {
            //read in the 8-byte header for each chunk one by one
            abuff = await file.slice(bytepos, bytepos + 8).arrayBuffer();
            aview = new DataView(abuff);
            //read chunk length
            length = aview.getUint32(0);
            //read chunk type
            chunktype = readText(aview, 4, 4);
            //figure out if this is a known chunk
            if (chunktype == 'IHDR' && length == 13) {
                //this node will be parent of others (ul)
                let sublist = makeNewNode(chunktype + " Chunk (" + length + " bytes" + ") - PNG header information");
                rootnode.children[1].appendChild(sublist);
                //read 13-byte IHDR chunk into memory
                hdrbuff = await file.slice(bytepos + 8, bytepos + 21).arrayBuffer();
                hdrview = new DataView(hdrbuff);
                width = hdrview.getUint32(0);
                sublist.children[1].appendChild(makeNewBottomNode("Image Width: " + width));
                textNames.push("IHDR Chunk: Image Width");
                textValues.push(width);
                height = hdrview.getUint32(4);
                sublist.children[1].appendChild(makeNewBottomNode("Image Height: " + height));
                textNames.push("IHDR Chunk: Image Height");
                textValues.push(height);
                bitdepth = hdrview.getUint8(8);
                sublist.children[1].appendChild(makeNewBottomNode("Bit Depth: " + bitdepth));
                textNames.push("IHDR Chunk: Bit Depth");
                textValues.push(bitdepth);
                colortype = hdrview.getUint8(9);
                sublist.children[1].appendChild(makeNewBottomNode("Color Type: " + colortype));
                textNames.push("IHDR Chunk: Color Type");
                textValues.push(colortype);
                compmethod = hdrview.getUint8(10);
                sublist.children[1].appendChild(makeNewBottomNode("Compression Method: " + compmethod));
                textNames.push("IHDR Chunk: Compression Method");
                textValues.push(compmethod);
                filtermethod = hdrview.getUint8(11);
                sublist.children[1].appendChild(makeNewBottomNode("Filter Method: " + filtermethod));
                textNames.push("IHDR Chunk: Filter Method");
                textValues.push(filtermethod);
                interlacemethod = hdrview.getUint8(12);
                sublist.children[1].appendChild(makeNewBottomNode("Interlace Method: " + interlacemethod));
                textNames.push("IHDR Chunk: Interlace Method");
                textValues.push(interlacemethod);
            } else if (chunktype == "tIME" && length == 7) {
                //this node will be parent of others (ul)
                let sublist = makeNewNode(chunktype + " Chunk (" + length + " bytes" + ") - Last Modified Date/Time");
                rootnode.children[1].appendChild(sublist);
                //read 7-byte tIME chunk into memory
                hdrbuff = await file.slice(bytepos + 8, bytepos + 15).arrayBuffer();
                hdrview = new DataView(hdrbuff);
                year = hdrview.getUint16(0);
                month = hdrview.getUint8(2);
                day = hdrview.getUint8(3);
                hour = hdrview.getUint8(4);
                minute = hdrview.getUint8(5);
                second = hdrview.getUint8(6);
                sublist.children[1].appendChild(makeNewBottomNode("Year: " + year));
                sublist.children[1].appendChild(makeNewBottomNode("Month: " + month));
                sublist.children[1].appendChild(makeNewBottomNode("Day: " + day));
                sublist.children[1].appendChild(makeNewBottomNode("Hour: " + hour));
                sublist.children[1].appendChild(makeNewBottomNode("Minute: " + minute));
                sublist.children[1].appendChild(makeNewBottomNode("Second: " + second));
                textNames.push("tIME Chunk: Last Modified Date");
                textValues.push(year + "/" + month + "/" + day + " " + hour + ":" + minute + ":" + second);
            } else if ((chunktype == "zTXt") || (chunktype == 'tEXt') || (chunktype == 'iTXt')) {
                if (length > MAX_TEXT_LENGTH_TEXTS) {
                    //really really large text field; don't grab it
                    let li = makeNewBottomNode(chunktype + " Chunk (" + length + " bytes" + ") - Text Information - TOO LARGE TO DISPLAY");
                    rootnode.children[1].appendChild(li);
                    textNames.push("zTXt/tEXt Text Information");
                    textValues.push("TOO LARGE TO DISPLAY");
                } else {
                    //this node will be parent of others (ul)
                    let sublist = makeNewNode(chunktype + " Chunk (" + length + " bytes" + ") - Text Information");
                    rootnode.children[1].appendChild(sublist);
                    //read tEXt / zTXt / iTXt chunk into memory
                    hdrbuff = await file.slice(bytepos + 8, bytepos + 8 + length).arrayBuffer();
                    hdrview = new DataView(hdrbuff);
                    nullpos = findNullSeparatorIn(hdrview);
                    keyword = readText(hdrview, 0, nullpos - 1);
                    theText = "error";
                    if (chunktype == "zTXt") {
                        theText = readCompressedText(hdrview, nullpos + 1, hdrview.byteLength - (nullpos + 1)); // +1 because there is a compression method byte (always 0)
                    } else if (chunktype == "tEXt") {
                        theText = readText(hdrview, nullpos, hdrview.byteLength - nullpos);
                    } else {
                        //iTXt
                        //TODO: currently this assumes no language tag or translated keyword; will not work if they are present
                        //read compression flag
                        compressionFlag = hdrview.getUint8(nullpos + 1);
                        if (compressionFlag == 0) {
                            //uncompressed 
                            theText = readText(hdrview, nullpos + 4, hdrview.byteLength - (nullpos + 4));
                        } else {
                            theText = readCompressedText(hdrview, nullpos + 4, hdrview.byteLength - (nullpos + 4));
                        }
                    }
                    sublist.children[1].appendChild(makeNewBottomNode("Keyword: " + keyword));
                    if (length > MAX_TEXT_LENGTH_TREE) {
                        sublist.children[1].appendChild(makeNewBottomNode("Text: TOO LONG TO DISPLAY"));
                    } else {
                        sublist.children[1].appendChild(makeNewBottomNode("Text: " + theText));
                    }
                    //dig into XMP text data to see if there are GPS coordinates and to create download link
                    if (keyword.toUpperCase().includes("ADOBE.XMP")) {
                        findGPSInExifText(theText);
                        addDownloadableLink("Extract XMP Metadata (XML)", theText, "XMP Download For " + file.name + ".txt");
                    } else {
                        //add to our text lists
                        if (chunktype == "zTXt") {
                            textNames.push("zTXt Chunk Compressed Text: " + keyword);
                        } else if (chunktype == "tEXt") {
                            textNames.push("tEXt Chunk Text: " + keyword);
                        } else {
                            textNames.push("iTXt Chunk Text: " + keyword);
                        }
                        textValues.push(theText);
                    }
                }
            } else if (chunktype == "pHYs" && length == 9) {
                //this node will be parent of others (ul)
                let sublist = makeNewNode(chunktype + " Chunk (" + length + " bytes" + ") - Pixel Dimensions");
                rootnode.children[1].appendChild(sublist);
                //read 9-byte pHYS chunk into memory
                hdrbuff = await file.slice(bytepos + 8, bytepos + 17).arrayBuffer();
                hdrview = new DataView(hdrbuff);
                sublist.children[1].appendChild(makeNewBottomNode("Pixels Per Unit (X Axis): " + hdrview.getUint32(0)));
                sublist.children[1].appendChild(makeNewBottomNode("Pixels Per Unit (Y Axis): " + hdrview.getUint32(4)));
                sublist.children[1].appendChild(makeNewBottomNode("Unit Specifier: " + hdrview.getUint8(8)));
            } else if (chunktype == "bKGD") {
                let li = makeNewBottomNode(chunktype + " Chunk (" + length + " bytes" + ") - Background Color");
                rootnode.children[1].appendChild(li);
            } else if (chunktype == "PLTE") {
                let li = makeNewBottomNode(chunktype + " Chunk (" + length + " bytes" + ") - Palette Information");
                rootnode.children[1].appendChild(li);
            } else if (chunktype == "iCCP") {
                let li = makeNewBottomNode(chunktype + " Chunk (" + length + " bytes" + ") - Embedded ICC Profile");
                rootnode.children[1].appendChild(li);
            } else if (chunktype == "IDAT") {
                //ignore this one
            } else if (chunktype == "IEND") {
                //ignore this one
            } else if (chunktype == "gAMA" && length == 4) {
                //this node will be parent of others (ul)
                let sublist = makeNewNode(chunktype + " Chunk (" + length + " bytes" + ") - Image Gamma");
                rootnode.children[1].appendChild(sublist);
                hdrbuff = await file.slice(bytepos + 8, bytepos + 12).arrayBuffer();
                hdrview = new DataView(hdrbuff);
                sublist.children[1].appendChild(makeNewBottomNode("Gamma: " + hdrview.getUint32(0)));
            } else if (chunktype == "sRGB" && length == 1) {
                //this node will be parent of others (ul)
                let sublist = makeNewNode(chunktype + " Chunk (" + length + " bytes" + ") - Standard RGB Color Space");
                rootnode.children[1].appendChild(sublist);
                hdrbuff = await file.slice(bytepos + 8, bytepos + 9).arrayBuffer();
                hdrview = new DataView(hdrbuff);
                sublist.children[1].appendChild(makeNewBottomNode("Rendering Intent: " + hdrview.getUint8(0)));
            } else {
                //unknown chunk - just put basic data on screen
                let li = makeNewBottomNode(chunktype + " Chunk (" + length + " bytes" + ")");
                rootnode.children[1].appendChild(li);
            }
            //advance to next chunk
            bytepos = bytepos + 12 + length;    //12 bytes to account for 2 4-byte headers and 1 4-byte CRC check at the end
            if (bytepos >= file.size) {
                fileend = true;
            }
        }
    }
    catch (err) {
        console.log(err);
    }
}
