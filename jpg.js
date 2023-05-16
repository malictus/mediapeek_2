/************************************************************************************************************ */
/**
 * JPG functions
 * 
 * */
//check to see if the beginning of a file (a DataView object) is the JPG header
function isJPG(aview) {
    const initJPG = [0xFF, 0xD8, 0xFF];
    let counter = 0;
    while (counter < 3) {
        if (initJPG[counter] != aview.getUint8(counter)) {
            return false;
        }
        counter++;
    }
    return true;
}

//we've confirmed it's a JPG file, now grab all the metadata out of the file chunk by chunk
async function getJPGdata(file) {
    try {
        //get the UI tree element built and the root UL element
        let fileinfolist = buildTreeRoot();
        let rootnode = makeNewNode("JPG Image File Tree");
        fileinfolist.appendChild(rootnode);
        let byteoffset = 2;
        while (byteoffset < file.size) {
            let abuff = await file.slice(byteoffset, byteoffset + 200).arrayBuffer();
            let aview = new DataView(abuff);
            if (aview.getUint8(0) != 0xFF) {
                throw new Error("Invalid Byte Found ");
            }
            //read markers
            let marker = aview.getUint8(1);
            let newlength = aview.getUint16(2, false);
            let subName = readNullTerminatedText(aview, 4);
            if (marker == 0xDA) {
                //start of the image scan data; hard to parse this and we should be past all the metadata anyway
                break;
            }
            let markerText = "Unknown";
            switch (marker) {
                case 0xE0:
                    markerText = "APP0" + " - " + subName;
                    break;
                case 0xE1:
                    if ((subName.startsWith("http://ns.adobe.com/xa"))) {
                        markerText = "APP1 - XMP";
                    } else if ((subName.startsWith("http://ns.adobe.com/xm"))) {
                        markerText = "APP1 - XMP Extension";
                    } else {
                        markerText = "APP1" + " - " + subName;
                    }
                    break;
                case 0xE2:
                    markerText = "APP2" + " - " + subName;
                    break;
                case 0xE3:
                    markerText = "APP3" + " - " + subName;
                    break;
                case 0xE4:
                    markerText = "APP4" + " - " + subName;
                    break;
                case 0xE5:
                    markerText = "APP5" + " - " + subName;
                    break;
                case 0xE6:
                    markerText = "APP6" + " - " + subName;
                    break;
                case 0xE7:
                    markerText = "APP7" + " - " + subName;
                    break;
                case 0xE8:
                    markerText = "APP8" + " - " + subName;
                    break;
                case 0xE9:
                    markerText = "APP9" + " - " + subName;
                    break;
                case 0xEA:
                    markerText = "APP10" + " - " + subName;
                    break;
                case 0xEB:
                    markerText = "APP11" + " - " + subName;
                    break;
                case 0xEC:
                    markerText = "APP12" + " - " + subName;
                    break;
                case 0xED:
                    markerText = "APP13" + " - " + subName;
                    break;
                case 0xEE:
                    markerText = "APP14" + " - " + subName;
                    break;
                case 0xEF:
                    markerText = "APP15" + " - " + subName;
                    break;
                case 0xFE:
                    markerText = "Comment";
                    break;
                //the ones we don't really care about
                case 0xDB:
                case 0xC0:
                case 0xC1:
                case 0xC2:
                case 0xC3:
                case 0xC4:
                case 0xC5:
                case 0xC6:
                case 0xC7:
                case 0xDD:
                    markerText = "skip";
                    break;
                default:
                    markerText = "Unknown";
            }
            //parse nodes we can parse
            if ((marker == 0xE1) && (subName.toUpperCase() == "EXIF")) {
                //EXIF sub-file; parse appropriately
                try {
                    let exiflist = await parseEXIFFile(file, byteoffset + 4, "Marker #" + marker + " - " + markerText + " (" + newlength + " bytes" + ")");
                    rootnode.children[1].appendChild(exiflist);
                } catch (err) {
                    let li = makeNewBottomNode("Marker #" + marker + " - " + markerText + " (" + newlength + " bytes" + ")");
                    rootnode.children[1].appendChild(li);
                }
            } else if ((marker == 0xE1) && (subName.startsWith("http://ns.adobe.com/xa"))) {
                //read in a chunk of text
                let sublist = makeNewNode("Marker #" + marker + " - XMP XML Data (" + newlength + " bytes" + ")");
                rootnode.children[1].appendChild(sublist);
                sublist.children[1].appendChild(await readJPGText(file, newlength - (subName.length + 4), byteoffset + subName.length + 5, "XMP XML"));
            } else if ((marker == 0xE1) && (subName.startsWith("http://ns.adobe.com/xm"))) {
                //read in a chunk of text
                let sublist = makeNewNode("Marker #" + marker + " - XMP XML Extension Data (" + newlength + " bytes" + ")");
                rootnode.children[1].appendChild(sublist);
                //ignore first 40 bytes (GUID, etc)
                sublist.children[1].appendChild(await readJPGText(file, newlength - (subName.length + 4 + 40), byteoffset + subName.length + 5 + 40, "XMP Extension XML"));
            } else if (markerText != "skip") {
                //and just display the rest
                let li = makeNewBottomNode("Marker #" + marker + " - " + markerText + " (" + newlength + " bytes" + ")");
                rootnode.children[1].appendChild(li);
            }
            byteoffset += 2 + newlength;
        }
    }
    catch (err) {
        console.log(err);
    }
}

//helper function for grabbing large text from a JPG file
async function readJPGText(file, textLength, startPos, labelfortag) {
    if (textLength < MAX_TEXT_LENGTH_TEXTS) {
        //go grab the string that represents the text
        let tbuff = await file.slice(startPos, startPos + textLength).arrayBuffer();
        let tview = new DataView(tbuff);
        let val = readText(tview, 0, textLength);
        if (textLength < MAX_TEXT_LENGTH_TREE) {
            subentry = makeNewBottomNode(labelfortag + ": " + val);
        } else {
            subentry = makeNewBottomNode(labelfortag + ": TOO LONG TO DISPLAY HERE");
        }
        //put in downloadable link
        addDownloadableLink("Extract " + labelfortag, val, "XMP Download For " + file.name + ".txt");
    } else {
        subentry = makeNewBottomNode(labelfortag);
        textNames.push(labelfortag);
        textValues.push("VALUE TOO LONG TO BE DISPLAYED");
    }
    return subentry;
}
