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
            let abuff = await file.slice(byteoffset, byteoffset + 4).arrayBuffer();
            let aview = new DataView(abuff);
            if (aview.getUint8(0) != 0xFF) {
                throw new Error("Invalid Byte Found ");
            }
            let marker = aview.getUint8(1);
            let newlength = aview.getUint16(2, false);
            if (marker == 0xDA) {
                //start of scan data; hard to parse this and we should be past metadata anyway
                break;
            }
            let li = makeNewBottomNode("Marker # " + marker + " (" + newlength + " bytes" + ")");
            rootnode.children[1].appendChild(li);
            byteoffset += 2 + newlength;
        }
    }
    catch (err) {
        console.log(err);
    }
}
