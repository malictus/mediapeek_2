//maximum length for text strings to be displayed in the tree part of the UI
const MAX_TEXT_LENGTH_TREE = 500;
//maximum length for text string to be displayed in the texts portion of the UI
const MAX_TEXT_LENGTH_TEXTS = 2000000;
//arrays for the strings we're displaying
const textNames = [];
const textValues = [];

/************************************************************************************************************ */
/**
 * listree() - see https://github.com/SuryaSankar/listree
 * 
 * */
function listree() {
    const subMenuHeadingClass = "listree-submenu-heading";
    const expandedClass = "expanded";
    const collapsedClass = "collapsed";
    const subMenuHeadings = document.getElementsByClassName(subMenuHeadingClass);
    Array.from(subMenuHeadings).forEach(function (subMenuHeading) {
        subMenuHeading.classList.add(collapsedClass);
        subMenuHeading.nextElementSibling.style.display = "none";
        subMenuHeading.addEventListener('click', function (event) {
            event.preventDefault();
            const subMenuList = event.target.nextElementSibling;
            if (subMenuList.style.display == "none") {
                subMenuHeading.classList.remove(collapsedClass);
                subMenuHeading.classList.add(expandedClass);
                subMenuList.style.display = "block";
            }
            else {
                subMenuHeading.classList.remove(expandedClass);
                subMenuHeading.classList.add(collapsedClass);
                subMenuList.style.display = "none";
            }
            event.stopPropagation();
        });
    });
}

/************************************************************************************************************ */
/**
 * MAIN FUNCTION - A FILE IS BEING OPENED - DO THE ACTUAL FILE READING AND POPULATE THE FIELDS
 * 
 * */
async function getDataFor(file) {
    //blank out old data from the interface first
    clearOldData();
    //grab the file's metadata (not part of file reading itself) and populate those fields
    getMetaDataFor(file);
    //read in the first 1000 bytes of the file; that should be enough to determine the file format
    abuff = await file.slice(0, 1000).arrayBuffer();
    aview = new DataView(abuff);
    //now, figure out what kind of file this is and do the right thing based on file format
    thefiletype = figureOutFileTypeFor(aview);
    if (thefiletype == "PNG") {
        document.getElementById('infotext').innerHTML = "This file is a PNG image file.";
        await getPNGdata(file);
    } else if (thefiletype == "TIFF") { 
        document.getElementById('infotext').innerHTML = "This file is a TIFF image file.";
        await getTIFFdata(file);
    } else {
        //file type isn't known or an error  
        document.getElementById('infotext').innerHTML = "This file is not a known file type.";
    }
    //make the data look good again
    listree();
    populateTexts();
}

/************************************************************************************************************ */
/**
 * MAIN ROUTINES TO GET THE WORK DONE
 * 
 * */
//grab file metadata and populate the appropriate fields
function getMetaDataFor(file) {
    document.getElementById('filename').innerHTML = file.name;
    document.getElementById('filetype').innerHTML = file.type;
    document.getElementById('filesize').innerHTML = formatFileSize(file.size);
    document.getElementById('filemodified').innerHTML = file.lastModifiedDate;
}

//given a DataView of the beginning of a file, figure out the file format
function figureOutFileTypeFor(aview) {
    try {
        if (isPNG(aview)) {
            return "PNG";
        } else if (isTIFF(aview)) {
            return "TIFF";
        } else {
            return "unknown file type";
        }
    }
    catch (err) {
        return "error - end of file reached prematurely";
    }
}

//clear the UI of old data
function clearOldData() {
    document.getElementById('filename').innerHTML = "";
    document.getElementById('filetype').innerHTML = "";
    document.getElementById('filesize').innerHTML = "";
    document.getElementById('filemodified').innerHTML = "";
    document.getElementById('filetree').innerHTML = "";
    document.getElementById('infotext').innerHTML = "";
    document.getElementById('thetexts').innerHTML = "";
    //also clear out the text arrays
    textNames.length = 0;
    textValues.length = 0;
}

//populate the texts portion of the interface after a new file has been opened
function populateTexts() {
    counter = 0;
    while (counter < textNames.length) {
        makeNewTextEntry(textNames[counter], textValues[counter]);
        counter++;
    }
    var coll = document.getElementsByClassName("collapsible");
    var i;
    for (i = 0; i < coll.length; i++) {
        coll[i].addEventListener("click", function () {
            this.classList.toggle("active");
            var content = this.nextElementSibling;
            if (content.style.maxHeight) {
                content.style.maxHeight = null;
            } else {
                content.style.maxHeight = content.scrollHeight + "px";
            }
        });
    }
}

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
        let rootnode = makeNewNode("PNG Image File Tree (Click to Expand)");
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
            } else if ((chunktype == "zTXt") || (chunktype == 'tEXt')) {
                if (length > MAX_TEXT_LENGTH_TEXTS) {
                    //really really large text field; don't grab it
                    let li = makeNewBottomNode(chunktype + " Chunk (" + length + " bytes" + ") - Compressed Text Information - TOO LARGE TO DISPLAY");
                    rootnode.children[1].appendChild(li);
                    textNames.push("zTXt Compressed Text Information");
                    textValues.push("TOO LARGE TO DISPLAY");
                } else {
                    //this node will be parent of others (ul)
                    let sublist = makeNewNode(chunktype + " Chunk (" + length + " bytes" + ") - Compressed Text Information");
                    rootnode.children[1].appendChild(sublist);
                    //read zTXt chunk into memory
                    hdrbuff = await file.slice(bytepos + 8, bytepos + 8 + length).arrayBuffer();
                    hdrview = new DataView(hdrbuff);
                    nullpos = findNullSeparatorIn(hdrview);
                    keyword = readText(hdrview, 0, nullpos - 1);
                    theText = "error";
                    if (chunktype == "zTXt") {
                        theText = readCompressedText(hdrview, nullpos + 1, hdrview.byteLength - (nullpos + 1)); // +1 because there is a compression method byte (always 0)
                    } else {
                        theText = readText(hdrview, nullpos, hdrview.byteLength - nullpos);
                    }
                    sublist.children[1].appendChild(makeNewBottomNode("Keyword: " + keyword));
                    if (length > MAX_TEXT_LENGTH_TREE) {
                        sublist.children[1].appendChild(makeNewBottomNode("Text: TOO LONG TO DISPLAY"));
                    } else {
                        sublist.children[1].appendChild(makeNewBottomNode("Text: " + theText));
                    }
                    //add to our text lists
                    if (chunktype == "zTXt") {
                        textNames.push("zTXt Chunk Compressed Text: "  + keyword);
                    } else {
                        textNames.push("tEXt Chunk Text: " + keyword);
                    }
                    textValues.push(theText);
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
                let li = makeNewBottomNode(chunktype + " Chunk (" + length + " bytes" + ") - Image Data");
                rootnode.children[1].appendChild(li);
            } else if (chunktype == "IEND") {
                let li = makeNewBottomNode(chunktype + " Chunk (" + length + " bytes" + ") - Final PNG Chunk");
                rootnode.children[1].appendChild(li);
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

/******************************************************************************************************* */
/**
 * HELPER UTILITIES
 * 
 * */
//build the root for the file info tree (assumes it doesn't exist yet)
function buildTreeRoot() {
    fileinfolist = document.createElement('ul');
    fileinfolist.id = "fileinfolist";
    fileinfolist.setAttribute("class", "listree");
    document.getElementById('filetree').appendChild(fileinfolist);
    return fileinfolist;
}

//make a new UL element inside a LI element, to be attached to the file tree
function makeNewNode(nodeText) {
    let li = document.createElement('li');
    let lidiv = document.createElement('div');
    lidiv.setAttribute("class", "listree-submenu-heading");
    lidiv.innerText = nodeText;
    li.appendChild(lidiv);
    let ul = document.createElement('ul');
    ul.setAttribute("class", "listree-submenu-items");
    li.appendChild(ul);
    return li;
}

//make a new tree node (bottom level, no lists below this), to be attached to the file tree
function makeNewBottomNode(nodeText) {
    let li = document.createElement('li');
    li.innerText = nodeText;
    return li;
}

//make a new text entry
function makeNewTextEntry(fieldName, body) {
    let butt = document.createElement('button');
    butt.setAttribute("class", "collapsible");
    butt.innerText = fieldName;
    let contentDiv = document.createElement('div');
    contentDiv.setAttribute("class", "content");
    contentDiv.innerText = body;
    document.getElementById('thetexts').appendChild(butt);
    document.getElementById('thetexts').appendChild(contentDiv);
}

//given a DataView object, look for the first null character and return its position
//return the total length if no null character found
function findNullSeparatorIn(dataview) {
    counter = 0;
    foundit = false;
    while (!foundit && (counter < dataview.byteLength)) {
        if (dataview.getUint8(counter) == 0) {
            foundit = true;
        }
        counter++;
    }
    return counter;
}

//given a DataView object, read (UTF-8) text from it
function readText(dataView, startByte, length) {
    //double check to make sure it's not too long to display
    if (length > MAX_TEXT_LENGTH_TEXTS) {
        return "TEXT TOO LONG TO BE DISPLAYED";
    }
    counter = 0;
    byteArray = new Uint8Array(length);
    while (counter < length) {
        byteArray[counter] = dataView.getUint8(counter + startByte);
        counter++;
    }
    return new TextDecoder().decode(byteArray);
}

//given a DataView object, read compressed (zlib) text from it
function readCompressedText(dataView, startByte, length) {
    //double check to make sure it's not too long to display
    if (length > MAX_TEXT_LENGTH_TEXTS) {
        return "TEXT TOO LONG TO BE DISPLAYED";
    }
    counter = 0;
    byteArray = new Uint8Array(length);
    while (counter < length) {
        byteArray[counter] = dataView.getUint8(counter + startByte);
        counter++;
    }
    result = "ERROR READING TEXT";
    try {
        result = pako.inflate(byteArray);
    } catch (err) {
        console.log(err);
    }
    return result;
}

//given a number of bytes, return a readable string
function formatFileSize(bytes) {
    if (bytes == 0) return '0 Bytes';
    var k = 1024,
        dm = 2,
        sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB'],
        i = Math.floor(Math.log(bytes) / Math.log(k));
    return bytes + ' bytes (' + parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i] + ')';
}

/******************************************************************************************************* */
/**
 *     DRAG AND DROP AND OPEN FILE BUTTON HANDLERS
 * 
 * */
function dragOverHandler(ev) {
    // Prevent default behavior - do nothing instead
    ev.preventDefault();
}

function dropHandler(ev) {
    // Prevent default behavior 
    ev.preventDefault();
    if (ev.dataTransfer.items) {
        // Use DataTransferItemList interface to access the file
        item = ev.dataTransfer.items[0];
        if (item.kind === "file") {
            const file = item.getAsFile();
            getDataFor(file);
        }
    } else {
        // Use DataTransfer interface to access the file(s)
        item = ev.dataTransfer.files[0];
        getDataFor(item);
    }
}

const fileSelector = document.getElementById('file-selector');
fileSelector.addEventListener('change', (event) => {
    const file = event.target.files[0];
    getDataFor(file);
});