/************************************************************************************************************ */
/**
 * JPG functions
 * 
 * */
//check to see if the beginning of a file (a DataView object) is the JPG header
function isJPG(aview) {
    const initJPG = [0xFF, 0xD8, 0xFF];
    counter = 0;
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
        let rootnode = makeNewNode("JPG Image File Tree (Click to Expand)");
        fileinfolist.appendChild(rootnode);
        let byteoffset = 2;
        while (byteoffset < file.size) {
            let abuff = await file.slice(byteoffset, byteoffset + 200).arrayBuffer();
            let aview = new DataView(abuff);
            if (aview.getUint8(0) != 0xFF) {
                throw new Error("Invalid Byte Found ");
            }
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
                    if (subName.startsWith("http://ns.adobe.com/xap")) {
                        markerText = "APP1 - XMP";
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
            if (markerText != "skip") {
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
