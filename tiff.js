
/************************************************************************************************************ */
/**
 * TIFF functions
 * 
 * */
//check to see if the beginning of a file (a DataView object) is the TIFF header
function isTIFF(aview) {
    const initTIFFLE = [73, 73, 42, 0];     //little endian version
    const initTIFFBE = [77, 77, 0, 42];     //big endian version
    const fillit = [0, 0, 0, 0];
    counter = 0;
    while (counter < 4) {
        fillit[counter] = aview.getUint8(counter);
        counter++;
    }
    if (initTIFFLE.every((val, index) => val === fillit[index])) {
        return true;
    }
    if (initTIFFBE.every((val, index) => val === fillit[index])) {
        return true;
    }
    return false;
}

//we've confirmed it's a TIFF file, now grab all the metadata out of the file chunk by chunk
async function getTIFFdata(file) {
    try {
        //get the UI tree element built and the root UL element
        let fileinfolist = buildTreeRoot();
        let rootnode = makeNewNode("TIFF Image File Tree (Click to Expand)");
        fileinfolist.appendChild(rootnode);
        //find endian-ness and offset to first IFD
        bytepos = 2;
        fileend = false;
        abuff = await file.slice(bytepos, bytepos + 6).arrayBuffer();
        aview = new DataView(abuff);
        endiantag = aview.getUint8(0);      //just checking the first of the two bytes here
        isLittleEndian = true;
        if (endiantag == 0) {
            isLittleEndian = false;
        }
        textNames.push("Is Little Endian?");
        textValues.push(isLittleEndian);
        li = makeNewBottomNode("Is Little Endian: " + isLittleEndian);
        rootnode.children[1].appendChild(li);
        offsettoIFD = aview.getUint32(2, isLittleEndian);
        li = makeNewBottomNode("Offset To First IFD: " + offsettoIFD + " bytes");
        rootnode.children[1].appendChild(li);
        parsemore = true;
        //read each IFD in the document (usually one, but sometimes more)
        while (parsemore) {
            //read a IFD for a single image
            //first a node for this image file directory
            let sublist = makeNewNode("Image File Directory");
            rootnode.children[1].appendChild(sublist);
            //now read two-byte count of number of entries
            abuff = await file.slice(offsettoIFD, offsettoIFD + 2).arrayBuffer();
            aview = new DataView(abuff);
            numentries = aview.getUint16(0, isLittleEndian);
            sublist.children[1].appendChild(makeNewBottomNode("Number of Tags: " + numentries));
            //read the entire ifd dir plus the offset to next one
            abuff = await file.slice(offsettoIFD + 2, offsettoIFD + 2 + (numentries * 12) + 4).arrayBuffer();
            aview = new DataView(abuff);
            tagcount = 0;
            while (tagcount < numentries) {
                //read each tag entry in this IFD
                offset = tagcount * 12;
                idtag = aview.getUint16(offset, isLittleEndian);
                fieldtype = aview.getUint16(offset + 2, isLittleEndian);
                fieldcount = aview.getUint32(offset + 4, isLittleEndian);
                fieldbyteoffset = aview.getUint32(offset + 8, isLittleEndian); // this might also be the value, depending on the tag
                tagentry = null;
                labelfortag = "TAG #" + idtag;
                switch (idtag) {
                    case 254:
                        tagentry = makeNewBottomNode(labelfortag + " (New Subfile Type)");
                        break;
                    case 256:
                        width = aview.getUint16(offset + 8, isLittleEndian);
                        tagentry = makeNewBottomNode(labelfortag + " (Image Width): " + width);
                        textNames.push("TIFF TAG 256 - Image Width");
                        textValues.push(width);
                        break;
                    case 257:
                        height = aview.getUint16(offset + 8, isLittleEndian)
                        tagentry = makeNewBottomNode(labelfortag + " (Image Height): " + height);
                        textNames.push("TIFF TAG 257 - Image Height");
                        textValues.push(height);
                        break;
                    case 258:
                        bitspersample = aview.getUint16(offset + 8, isLittleEndian);
                        if ((fieldcount == 1) && (fieldtype == 3)) {
                            tagentry = makeNewBottomNode(labelfortag + " (Bits Per Sample): " + bitspersample);
                            textNames.push("TIFF TAG 258 - Bits Per Sample");
                            textValues.push(bitspersample);
                        } else {
                            tagentry = makeNewBottomNode(labelfortag + " (Bits Per Sample) ");
                        }
                        break;
                    case 259:
                        compression = aview.getUint16(offset + 8, isLittleEndian);
                        tagentry = makeNewBottomNode(labelfortag + " (Compression): " + compression);
                        textNames.push("TIFF TAG 259 - Compression");
                        textValues.push(compression);
                        break;
                    case 262:
                        photoin = aview.getUint16(offset + 8, isLittleEndian);
                        tagentry = makeNewBottomNode(labelfortag + " (Photometric Interpretation): " + photoin);
                        textNames.push("TIFF TAG 262 - Photometric Interpretation");
                        textValues.push(photoin);
                        break;
                    case 266:
                        fillorder = aview.getUint16(offset + 8, isLittleEndian);
                        tagentry = makeNewBottomNode(labelfortag + " (Fill Order): " + fillorder);
                        textNames.push("TIFF TAG 266 - Fill Order");
                        textValues.push(fillorder);
                        break;
                    case 269:
                        tagentry = await readTIFFTextTag(269, file, fieldcount, fieldbyteoffset, labelfortag, "Document Name");
                        break;
                    case 270:
                        tagentry = await readTIFFTextTag(270, file, fieldcount, fieldbyteoffset, labelfortag, "Image Description");
                        break;
                    case 271:
                        tagentry = await readTIFFTextTag(271, file, fieldcount, fieldbyteoffset, labelfortag, "Make");
                        break;
                    case 272:
                        tagentry = await readTIFFTextTag(272, file, fieldcount, fieldbyteoffset, labelfortag, "Model");
                        break;
                    case 273:
                        tagentry = makeNewBottomNode(labelfortag + " (Strip Offsets)");
                        break;
                    case 274:
                        orient = aview.getUint16(offset + 8, isLittleEndian);
                        tagentry = makeNewBottomNode(labelfortag + " (Orientation): " + orient);
                        textNames.push("TIFF TAG 274 - Orientation");
                        textValues.push(orient);
                        break;
                    case 277:
                        samplesperpixel = aview.getUint16(offset + 8, isLittleEndian);
                        tagentry = makeNewBottomNode(labelfortag + " (Samples Per Pixel): " + samplesperpixel);
                        textNames.push("TIFF TAG 277 - Samples Per Pixel");
                        textValues.push(samplesperpixel);
                        break;
                    case 278:
                        tagentry = makeNewBottomNode(labelfortag + " (Rows Per Strip)");
                        break;
                    case 279:
                        tagentry = makeNewBottomNode(labelfortag + " (Strip Byte Counts)");
                        break;
                    case 280:
                        tagentry = makeNewBottomNode(labelfortag + " (Minimum Sample Value)");
                        break;
                    case 281:
                        tagentry = makeNewBottomNode(labelfortag + " (Maximum Sample Value)");
                        break;
                    case 282:
                        tagentry = makeNewBottomNode(labelfortag + " (X Resolution)");
                        break;
                    case 283:
                        tagentry = makeNewBottomNode(labelfortag + " (Y Resolution)");
                        break;
                    case 284:
                        planar = aview.getUint16(offset + 8, isLittleEndian);
                        tagentry = makeNewBottomNode(labelfortag + " (Planar Configuration): " + planar);
                        textNames.push("TIFF TAG 284 - Planar Configuration");
                        textValues.push(planar);
                        break;
                    case 296:
                        resolutionunit = aview.getUint16(offset + 8, isLittleEndian);
                        tagentry = makeNewBottomNode(labelfortag + " (Resolution Unit): " + resolutionunit);
                        textNames.push("TIFF TAG 296 - Resolution Unit");
                        textValues.push(resolutionunit);
                        break;
                    case 297:
                        pagenum = aview.getUint16(offset + 8, isLittleEndian);
                        tagentry = makeNewBottomNode(labelfortag + " (Page Number): " + pagenum);
                        textNames.push("TIFF TAG 297 - Page Number");
                        textValues.push(pagenum);
                        break;
                    case 305:
                        tagentry = await readTIFFTextTag(305, file, fieldcount, fieldbyteoffset, labelfortag, "Software");
                        break;
                    case 306:
                        tagentry = await readTIFFTextTag(306, file, fieldcount, fieldbyteoffset, labelfortag, "Date / Time");
                        break;
                    case 315:
                        tagentry = await readTIFFTextTag(315, file, fieldcount, fieldbyteoffset, labelfortag, "Artist");
                        break;
                    case 317:
                        predictor = aview.getUint16(offset + 8, isLittleEndian);
                        tagentry = makeNewBottomNode(labelfortag + " (Predictor): " + predictor);
                        textNames.push("TIFF TAG 317 - Predictor");
                        textValues.push(predictor);
                        break;
                    case 320:
                        tagentry = makeNewBottomNode(labelfortag + " (Color Map)");
                        break;
                    case 339:
                        sampleformat = aview.getUint16(offset + 8, isLittleEndian);
                        tagentry = makeNewBottomNode(labelfortag + " (Sample Format): " + sampleformat);
                        textNames.push("TIFF TAG 339 - Sample Format");
                        textValues.push(sampleformat);
                        break;
                    case 347:
                        tagentry = makeNewBottomNode(labelfortag + " (JPEG Tables)");
                        break;
                    case 530:
                        tagentry = makeNewBottomNode(labelfortag + " (YCbCrSubSampling)");
                        break;
                    case 700:
                        tagentry = await readTIFFTextTag(700, file, fieldcount, fieldbyteoffset, labelfortag, "XMP Metadata");
                        break;
                    case 33723:
                        tagentry = makeNewBottomNode(labelfortag + " (IPTC METADATA)");
                        break;
                    case 34377:
                        tagentry = makeNewBottomNode(labelfortag + " (PHOTOSHOP PRIVATE TAG)");
                        break;
                    case 34665:
                        tagentry = makeNewBottomNode(labelfortag + " (EXIF IFD)");
                        break;
                    case 34675:
                        tagentry = makeNewBottomNode(labelfortag + " (ICC PROFILE DATA)");
                        break;
                    case 37724:
                        tagentry = makeNewBottomNode(labelfortag + " (PHOTOSHOP PRIVATE TAG)");
                        break;
                    default:
                        tagentry = makeNewNode(labelfortag + " (Unknown)");
                        tagentry.children[1].appendChild(makeNewBottomNode("Tag Type: " + fieldtype));
                        tagentry.children[1].appendChild(makeNewBottomNode("Tag Count: " + fieldcount));
                        tagentry.children[1].appendChild(makeNewBottomNode("Byte Offset (or value): " + fieldbyteoffset));
                }
                sublist.children[1].appendChild(tagentry);
                tagcount++;
            }
            //is there another page?
            offsettonext = aview.getUint32((numentries * 12), isLittleEndian);
            if (offsettonext != 0) {
                offsettoIFD = offsettonext;
            } else {
                parsemore = false;
            }
        }
    }
    catch (err) {
        console.log(err);
    }
}

//helper function for building text tags in the TIFF file
async function readTIFFTextTag(tagnum, file, fieldcount, fieldbyteoffset, labelfortag, fieldType) {
    if (fieldcount < MAX_TEXT_LENGTH_TEXTS) {
        //go grab the string that represents the text
        tbuff = await file.slice(fieldbyteoffset, fieldbyteoffset + (fieldcount - 1)).arrayBuffer();
        tview = new DataView(tbuff);
        val = readText(tview, 0, (fieldcount - 1));
        if (fieldcount < MAX_TEXT_LENGTH_TREE) {
            tagentry = makeNewBottomNode(labelfortag + " (" + fieldType + "): " + val);
        } else {
            tagentry = makeNewBottomNode(labelfortag + " (" + fieldType + "): TOO LONG TO DISPLAY HERE");
        }
        textNames.push("TIFF TAG " + tagnum + " - " + fieldType);
        textValues.push(val);
    } else {
        tagentry = makeNewBottomNode(labelfortag + " (" + fieldType + ")");
        textNames.push("TIFF TAG " + tagnum + " - " + fieldType);
        textValues.push("VALUE TOO LONG TO BE DISPLAYED");
    }
    return tagentry;
}
