//constant array that represents all TIFF tags we know so far
const tifftags = [
    { "tag": 254, "name": "New Subfile Type"},
    { "tag": 256, "name": "Image Width" },
    { "tag": 257, "name": "Image Height" },
    { "tag": 258, "name": "Bits Per Sample" },
    { "tag": 259, "name": "Compression" },
    { "tag": 262, "name": "Photometric Interpretation" },
    { "tag": 266, "name": "Fill Order" },
    { "tag": 269, "name": "Document Name" },
    { "tag": 270, "name": "Image Description" },
    { "tag": 271, "name": "Make" },
    { "tag": 272, "name": "Model" },
    { "tag": 273, "name": "Strip Offsets" },
    { "tag": 274, "name": "Orientation" },
    { "tag": 277, "name": "Samples Per Pixel" },
    { "tag": 278, "name": "Rows Per Strip" },
    { "tag": 279, "name": "Strip Byte Counts" },
    { "tag": 280, "name": "Minimum Sample Value" },
    { "tag": 281, "name": "Maximum Sample Value" },
    { "tag": 282, "name": "X Resolution" },
    { "tag": 283, "name": "Y Resolution" },
    { "tag": 284, "name": "Planar Configuration" },
    { "tag": 296, "name": "Resolution Unit" },
    { "tag": 297, "name": "Page Number" },
    { "tag": 305, "name": "Software" },
    { "tag": 306, "name": "Date / Time" },
    { "tag": 315, "name": "Artist" },
    { "tag": 317, "name": "Predictor" },
    { "tag": 320, "name": "Color Map" },
    { "tag": 338, "name": "Extra Samples" },
    { "tag": 339, "name": "Sample Format" },
    { "tag": 347, "name": "JPEG Tables" },
    { "tag": 530, "name": "YCbCrSubSampling" },    
    { "tag": 700, "name": "XMP Metadata" },
    { "tag": 33434, "name": "Exposure Time" },
    { "tag": 33437, "name": "F Number" },
    { "tag": 33723, "name": "IPTC Metadata" },
    { "tag": 34377, "name": "Photoshop Private Tag" },
    { "tag": 34665, "name": "EXIF IFD" },
    { "tag": 34675, "name": "ICC Profile Data" },
    { "tag": 34855, "name": "ISO Speed Ratings" },
    { "tag": 36864, "name": "EXIF Version" },
    { "tag": 36867, "name": "Date Time Original" },
    { "tag": 36868, "name": "Date Time Digitized" },
    { "tag": 37121, "name": "Components Configuration" },
    { "tag": 37377, "name": "Shutter Speed Value" },
    { "tag": 37378, "name": "Aperture Value" },
    { "tag": 37510, "name": "User Comment" },
    { "tag": 37380, "name": "Exposure Bias Value" },
    { "tag": 37385, "name": "Flash" },
    { "tag": 37386, "name": "Focal Length" },
    { "tag": 37724, "name": "Photoshop Private Tag" },
    { "tag": 40960, "name": "Flashpix Version" },
    { "tag": 40961, "name": "Color Space" },
    { "tag": 40962, "name": "Pixel X Dimension" },
    { "tag": 40963, "name": "Pixel Y Dimension" },
    { "tag": 41486, "name": "Focal Plane X Resolution" },
    { "tag": 41487, "name": "Focal Plane Y Resolution" },
    { "tag": 41488, "name": "Focal Plane Resolution Unit" },
    { "tag": 41985, "name": "Custom Rendered" },
    { "tag": 41986, "name": "Exposure Mode" },
    { "tag": 41987, "name": "White Balance" },
    { "tag": 41990, "name": "Scene Capture Type" },
];


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
        let pagecount = 1;
        //read each IFD in the document (usually one, but sometimes more)
        while (parsemore) {
            //read a IFD for a single image
            //first a node for this image file directory
            let sublist = makeNewNode("Image File Directory " + pagecount);
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
                if (pagecount > 1) {
                    labelfortag = "Image " + pagecount + " - " + labelfortag;
                }
                let thenode = tifftags.find(({ tag }) => tag === idtag);
                if (!(thenode === undefined)) {
                    //use tag name, if we know it
                    labelfortag = labelfortag + " (" + thenode.name + ")";
                }
                //can we parse this further?
                //first, special cases
                if (idtag == 700) {
                    //XMP (XML) data; treat as text but NOT null-terminated (thus the "+1")
                    tagentry = await readTIFFTextTag(file, fieldcount + 1, fieldbyteoffset, labelfortag);
                } else if (idtag == 34665) {
                    //EXIF metadata; go and find those tags and read them
                    let exiflist = makeNewNode("TAG #34665 EXIF METADATA ");
                    sublist.children[1].appendChild(exiflist);
                    exifstart = aview.getUint32(offset + 8, isLittleEndian);
                    await readEXIF(exifstart, file, isLittleEndian, exiflist);
                } else {
                    //process based on field type
                    switch (fieldtype) {
                        case 2:
                            //read the text in (currently, only reads first string; technically there could be more than one null-terminated string)
                            tagentry = await readTIFFTextTag(file, fieldcount, fieldbyteoffset, labelfortag);
                            break;
                        case 3:
                            //16 bit unsigned; display it if there's only one
                            if (fieldcount == 1) {
                                theval = aview.getUint16(offset + 8, isLittleEndian);
                                tagentry = makeNewBottomNode(labelfortag + ": " + theval);
                                textNames.push(labelfortag);
                                textValues.push(theval);
                            } else {
                                tagentry = makeNewBottomNode(labelfortag);
                            }
                            break;
                        case 4:
                            //32 bit unsigned; display it if there's only one
                            if (fieldcount == 1) {
                                theval = aview.getUint32(offset + 8, isLittleEndian);
                                tagentry = makeNewBottomNode(labelfortag + ": " + theval);
                                textNames.push(labelfortag);
                                textValues.push(theval);
                            } else {
                                tagentry = makeNewBottomNode(labelfortag);
                            }
                            break;
                        case 5:
                            //fractional value; go read it and display it if there's only one
                            if (fieldcount == 1) {
                                let subarea = aview.getUint32(offset + 8, isLittleEndian);
                                let subbuff = await file.slice(subarea, subarea + 8).arrayBuffer();
                                let subview = new DataView(subbuff);
                                let numerator = subview.getUint32(0, isLittleEndian);
                                let denominator = subview.getUint32(4, isLittleEndian);
                                tagentry = makeNewBottomNode(labelfortag + ": " + numerator + "/" + denominator);
                                textNames.push(labelfortag);
                                textValues.push(numerator + "/" + denominator);
                            } else {
                                tagentry = makeNewBottomNode(labelfortag);
                            }
                            break;
                        default:
                            tagentry = makeNewBottomNode(labelfortag);
                    }
                }
                if (tagentry != null) {
                    sublist.children[1].appendChild(tagentry);
                }
                tagcount++;
            }
            //is there another page?
            offsettonext = aview.getUint32((numentries * 12), isLittleEndian);
            if (offsettonext != 0) {
                offsettoIFD = offsettonext;
                pagecount++;
            } else {
                parsemore = false;
            }
        }
    }
    catch (err) {
    console.log(err);
    }
}

//helper function to read EXIF extension metadata
async function readEXIF(exifstart, file, isLittleEndian, exiflist) {
    //read two-byte count of number of entries
    let exifbuff = await file.slice(exifstart, exifstart + 2).arrayBuffer();
    let exifview = new DataView(exifbuff);
    let exifnumentries = exifview.getUint16(0, isLittleEndian);
    let abuff = await file.slice(exifstart + 2, exifstart + 2 + (exifnumentries * 12)).arrayBuffer();
    let aview = new DataView(abuff);
    let tagcount = 0;
    while (tagcount < exifnumentries) {
        //read each tag entry 
        let offset = tagcount * 12;
        let idtag = aview.getUint16(offset, isLittleEndian);
        let fieldtype = aview.getUint16(offset + 2, isLittleEndian);
        let fieldcount = aview.getUint32(offset + 4, isLittleEndian);
        let fieldbyteoffset = aview.getUint32(offset + 8, isLittleEndian); // this might also be the value, depending on the tag
        let exiftagentry = null;
        let labelfortag = "TAG #" + idtag;
        let thenode = tifftags.find(({ tag }) => tag === idtag);
        if (!(thenode === undefined)) {
            //use tag name, if we know it
            labelfortag = labelfortag + " (" + thenode.name + ")";
        }
        //can we parse this further?
        switch (fieldtype) {
            case 2:
                //read the text in (currently, only reads first string; technically there could be more than one null-terminated string)
                exiftagentry = await readTIFFTextTag(file, fieldcount, fieldbyteoffset, labelfortag);
                break;
            case 3:
                //16 bit unsigned; display it if there's only one
                if (fieldcount == 1) {
                    theval = aview.getUint16(offset + 8, isLittleEndian);
                    exiftagentry = makeNewBottomNode(labelfortag + ": " + theval);
                    textNames.push(labelfortag);
                    textValues.push(theval);
                } else {
                    exiftagentry = makeNewBottomNode(labelfortag);
                }
                break;
            case 4:
                //32 bit unsigned; display it if there's only one
                if (fieldcount == 1) {
                    theval = aview.getUint32(offset + 8, isLittleEndian);
                    exiftagentry = makeNewBottomNode(labelfortag + ": " + theval);
                    textNames.push(labelfortag);
                    textValues.push(theval);
                } else {
                    exiftagentry = makeNewBottomNode(labelfortag);
                }
                break;
            case 5:
                //fractional value; go read it and display it if there's only one
                if (fieldcount == 1) {
                    let subarea = aview.getUint32(offset + 8, isLittleEndian);
                    let subbuff = await file.slice(subarea, subarea + 8).arrayBuffer();
                    let subview = new DataView(subbuff);
                    let numerator = subview.getUint32(0, isLittleEndian);
                    let denominator = subview.getUint32(4, isLittleEndian);
                    exiftagentry = makeNewBottomNode(labelfortag + ": " + numerator + "/" + denominator);
                    textNames.push(labelfortag);
                    textValues.push(numerator + "/" + denominator);
                } else {
                    exiftagentry = makeNewBottomNode(labelfortag);
                }
                break;
            default:
                exiftagentry = makeNewBottomNode(labelfortag);
        }
        exiflist.children[1].appendChild(exiftagentry);
        tagcount++;
    }
}

//helper function for building text tags in the TIFF file
async function readTIFFTextTag(file, fieldcount, fieldbyteoffset, labelfortag) {
    if (fieldcount < MAX_TEXT_LENGTH_TEXTS) {
        //go grab the string that represents the text
        tbuff = await file.slice(fieldbyteoffset, fieldbyteoffset + (fieldcount - 1)).arrayBuffer();
        tview = new DataView(tbuff);
        val = readText(tview, 0, (fieldcount - 1));
        if (fieldcount < MAX_TEXT_LENGTH_TREE) {
            tagentry = makeNewBottomNode(labelfortag + ": " + val);
        } else {
            tagentry = makeNewBottomNode(labelfortag + ": TOO LONG TO DISPLAY HERE");
        }
        textNames.push(labelfortag);
        textValues.push(val);
    } else {
        tagentry = makeNewBottomNode(labelfortag);
        textNames.push(labelfortag);
        textValues.push("VALUE TOO LONG TO BE DISPLAYED");
    }
    return tagentry;
}