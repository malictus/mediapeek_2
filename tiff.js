/**
 * TIFF FILE STUFF GOES HERE, PLUS ANYTHING EXIF RELATED EVEN IF IN OTHER FILE TYPES (JPG, etc)
 */

//array of all TIFF and EXIF tag labels we know so far
const tifftags = [
    { "tag": 0, "name": "GPS Version ID" },
    { "tag": 1, "name": "GPS Latitude Ref" },
    { "tag": 2, "name": "GPS Latitude" },
    { "tag": 3, "name": "GPS Longitude Ref" },
    { "tag": 4, "name": "GPS Longitude" },
    { "tag": 5, "name": "GPS Altitude Ref" },
    { "tag": 6, "name": "GPS Altitude" },
    { "tag": 7, "name": "GPS Time Stamp" },
    { "tag": 16, "name": "GPS Image Direction Ref" },
    { "tag": 17, "name": "GPS Image Direction" },
    { "tag": 29, "name": "GPS Date Stamp" },
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
    { "tag": 318, "name": "White Point" },
    { "tag": 319, "name": "Primary Chromaticities" },
    { "tag": 320, "name": "Color Map" },
    { "tag": 338, "name": "Extra Samples" },
    { "tag": 339, "name": "Sample Format" },
    { "tag": 347, "name": "JPEG Tables" },
    { "tag": 530, "name": "YCbCrSubSampling" },  
    { "tag": 531, "name": "YCbCrPositioning" },  
    { "tag": 700, "name": "XMP Metadata" },
    { "tag": 33434, "name": "Exposure Time" },
    { "tag": 33437, "name": "F Number" },
    { "tag": 33723, "name": "IPTC Metadata" },
    { "tag": 34377, "name": "Photoshop Private Tag" },
    { "tag": 34665, "name": "EXIF IFD" },
    { "tag": 34675, "name": "ICC Profile Data" },
    { "tag": 34850, "name": "Exposure Program" },
    { "tag": 34855, "name": "ISO Speed Ratings" },
    { "tag": 36864, "name": "EXIF Version" },
    { "tag": 36867, "name": "Date Time Original" },
    { "tag": 36868, "name": "Date Time Digitized" },
    { "tag": 36880, "name": "Offset Time" },
    { "tag": 36881, "name": "Offset Time Original" },
    { "tag": 36882, "name": "Offset Time Digitized" },
    { "tag": 37121, "name": "Components Configuration" },
    { "tag": 37122, "name": "Compressed Bits Per Pixel" },
    { "tag": 37377, "name": "Shutter Speed Value" },
    { "tag": 37378, "name": "Aperture Value" },
    { "tag": 37379, "name": "Brightness Value" },
    { "tag": 37381, "name": "Max Aperture Value" },
    { "tag": 37382, "name": "Subject Distance" },
    { "tag": 37383, "name": "Metering Mode" },
    { "tag": 37384, "name": "Light Source" },
    { "tag": 37500, "name": "Maker Note" },
    { "tag": 37510, "name": "User Comment" },
    { "tag": 37520, "name": "SubsecTime" },
    { "tag": 37521, "name": "Subsec Time Original" },
    { "tag": 37522, "name": "Subsec Time Digitized" },
    { "tag": 37380, "name": "Exposure Bias Value" },
    { "tag": 37385, "name": "Flash" },
    { "tag": 37386, "name": "Focal Length" },
    { "tag": 37724, "name": "Photoshop Private Tag" },
    { "tag": 40960, "name": "Flashpix Version" },
    { "tag": 40961, "name": "Color Space" },
    { "tag": 40962, "name": "Pixel X Dimension" },
    { "tag": 40963, "name": "Pixel Y Dimension" },
    { "tag": 40965, "name": "Interoperability IFD" },
    { "tag": 41483, "name": "Flash Energy" },
    { "tag": 41486, "name": "Focal Plane X Resolution" },
    { "tag": 41487, "name": "Focal Plane Y Resolution" },
    { "tag": 41488, "name": "Focal Plane Resolution Unit" },
    { "tag": 41493, "name": "Exposure Index" }, 
    { "tag": 41495, "name": "Sensing Method" },
    { "tag": 41728, "name": "File Source" }, 
    { "tag": 41729, "name": "Scene Type" },
    { "tag": 41985, "name": "Custom Rendered" },
    { "tag": 41986, "name": "Exposure Mode" },
    { "tag": 41987, "name": "White Balance" },
    { "tag": 41988, "name": "Digital Zoom Ratio" },
    { "tag": 41989, "name": "Focal Length In 35mm Film" },
    { "tag": 41990, "name": "Scene Capture Type" },
    { "tag": 41991, "name": "Gain Control" }, 
    { "tag": 41992, "name": "Contrast" },
    { "tag": 41993, "name": "Saturation" },
    { "tag": 41994, "name": "Sharpness" },
    { "tag": 41996, "name": "Subject Distance Range" },
    { "tag": 42016, "name": "Image Unique ID" },
    { "tag": 42035, "name": "Lens Make" },
    { "tag": 42036, "name": "Lens Model" },
    { "tag": 50341, "name": "PrintImageMatching" },    
];

//use these markers to track negative values for global latitude and longitude
let negLat = false;
let negLong = false;

//check to see if the beginning of a file (as a DataView object) is the TIFF header
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

//read the data out of a TIFF file
async function getTIFFdata(file) {
    try {
        //reset these whenever we start, just in case
        negLat = false;
        negLong = false;
        //get the UI tree element built and the root UL element
        let fileinfolist = buildTreeRoot();
        let rootnode = makeNewNode("TIFF Image File Tree");
        fileinfolist.appendChild(rootnode);
        //find endian-ness for this file, and the byte offset to the first IFD
        let abuff = await file.slice(2, 8).arrayBuffer();
        let aview = new DataView(abuff);
        //first, find the endian
        let endiantag = aview.getUint8(0);      //just checking the first of the two bytes here is all that's needed
        let isLittleEndian = true;
        if (endiantag == 0) {
            isLittleEndian = false;
        }
        textNames.push("Is Little Endian?");
        textValues.push(isLittleEndian);
        rootnode.children[1].appendChild(makeNewBottomNode("Is Little Endian: " + isLittleEndian));
        //now, find the offset to the first IFD
        let offsettoIFD = aview.getUint32(2, isLittleEndian);
        rootnode.children[1].appendChild(makeNewBottomNode("Offset To First IFD: " + offsettoIFD + " bytes"));
        //now, start reading IFD's
        await readTIFFIFDs(file, offsettoIFD, rootnode, isLittleEndian);
    }
    catch (err) {
        console.log(err);
    }
}

//read IFD's from a TIFF file or an EXIF chunk if other kind of file
async function readTIFFIFDs(file, offsettoIFD, rootnode, isLittleEndian, offsetInFile = 0, isTIFF = true) {
    let parsemore = true;
    //read each IFD 
    while (parsemore) {
        let sublist;
        //make a node for this image file directory if this is a TIFF file
        if (isTIFF) {
            sublist = makeNewNode("Image File Directory ");
            rootnode.children[1].appendChild(sublist);
        } else {
            sublist = rootnode;
        }
        //read the number of entries in this one
        let abuff = await file.slice(offsettoIFD + offsetInFile, offsettoIFD + 2 + offsetInFile).arrayBuffer();
        let aview = new DataView(abuff);
        let numentries = aview.getUint16(0, isLittleEndian);
        //read the entire ifd dir plus the offset to next one
        abuff = await file.slice(offsettoIFD + 2 + offsetInFile, offsettoIFD + 2 + offsetInFile + (numentries * 12) + 4).arrayBuffer();
        aview = new DataView(abuff);
        await readIFDTags(file, aview, offsettoIFD, sublist, isLittleEndian, numentries, offsetInFile);
        if (isTIFF) {
            //is there another IFD? only applies in a TIFF file, not JPG, etc.
            let offsettonext = aview.getUint32((numentries * 12), isLittleEndian);
            if (offsettonext != 0) {
                offsettoIFD = offsettonext + offsetInFile;
            } else {
                parsemore = false;
            }
        } else {
            parsemore = false;
        }
    }
}

//read IFD tags in a single IFD (plus any sub-IFD's we find)
async function readIFDTags(file, aview, offsettoIFD, sublist, isLittleEndian, numentries, offsetToFile = 0) {    
    let tagcount = 0;
    while (tagcount < numentries) {
        //read a tag entry
        let offset = tagcount * 12;
        //read the tag info
        let idtag = aview.getUint16(offset, isLittleEndian); 
        let fieldtype = aview.getUint16(offset + 2, isLittleEndian);
        let fieldcount = aview.getUint32(offset + 4, isLittleEndian);
        let fieldbyteoffset = aview.getUint32(offset + 8, isLittleEndian); // this might also be the value, depending on the tag
        let tagentry = null;
        let labelfortag = "TAG #" + idtag;
        let thenode = tifftags.find(({ tag }) => tag === idtag);
        if (!(thenode === undefined)) {
            //use tag name, if we know it
            labelfortag = labelfortag + " (" + thenode.name + ")";
        }
        //first, special cases
        if (((idtag == 2) || (idtag == 4) || (idtag == 7)) && (fieldcount == 3) && (fieldtype = 5)) {
            //calculate fractional data
            let subbuff = await file.slice(fieldbyteoffset + offsetToFile, fieldbyteoffset + 24 + offsetToFile).arrayBuffer();    //read in the 6 numbers
            let subview = new DataView(subbuff);
            let numerator1 = subview.getUint32(0, isLittleEndian);
            let denominator1 = subview.getUint32(4, isLittleEndian);
            let numerator2 = subview.getUint32(8, isLittleEndian);
            let denominator2 = subview.getUint32(12, isLittleEndian);
            let numerator3 = subview.getUint32(16, isLittleEndian);
            let denominator3 = subview.getUint32(20, isLittleEndian);
            if (idtag == 7) {
                tagentry = makeNewBottomNode(labelfortag + ": " + (numerator1 / denominator1) + ":" + (numerator2 / denominator2) + ":" + (numerator3 / denominator3));
            } else {
                tagentry = makeNewBottomNode(labelfortag + ": " + (numerator1 / denominator1) + ", " + (numerator2 / denominator2) + ", " + (numerator3 / denominator3));
            }
            if (idtag == 2) {
                OSMLatitude = (numerator1 / denominator1) + ((numerator2 / denominator2) / 60) + ((numerator3 / denominator3) / 3600);
            } else if (idtag == 4) {
                OSMLongitude = (numerator1 / denominator1) + ((numerator2 / denominator2) / 60) + ((numerator3 / denominator3) / 3600);
            } else if (idtag == 7) {
                OSMTimeStamp = (numerator1 / denominator1) + ":" + (numerator2 / denominator2) + ":" + (numerator3 / denominator3) + " UTC";
            }
        } else if (idtag == 700) {
            //XMP (XML) data; treat as text but NOT null-terminated (thus the "+1")
            tagentry = await readTIFFTextTag(file, fieldcount + 1, fieldbyteoffset + offsetToFile, labelfortag, false);
            //add this to downloadable links (slice(-1) is a hack to grab the last value we just in above)
            addDownloadableLink("Extract XMP Metadata (XML)", textValues.slice(-1), "XMP Download For " + file.name + ".txt");
        } else if ((idtag == 34665) || (idtag == 34853)) {
            //EXIF metadata; go and find those tags and read them
            let exiflist;
            if (idtag == 34665) {
                exiflist = makeNewNode("TAG #34665 EXIF METADATA ");
            } else {
                exiflist = makeNewNode("TAG #34853 EXIF (GPS) METADATA ");
            } 
            sublist.children[1].appendChild(exiflist);
            let exifstart = aview.getUint32(offset + 8, isLittleEndian);
            //read two-byte count of number of entries
            let exifbuff = await file.slice(exifstart + offsetToFile, exifstart + 2 + offsetToFile).arrayBuffer();
            let exifview = new DataView(exifbuff);
            let exifnumentries = exifview.getUint16(0, isLittleEndian);
            exifbuff = await file.slice(exifstart + 2 + offsetToFile, exifstart + 2 + offsetToFile + (exifnumentries * 12)).arrayBuffer();
            exifview = new DataView(exifbuff);
            //recurse to grab these additional EXIF tags
            await readIFDTags(file, exifview, exifstart, exiflist, isLittleEndian, exifnumentries, offsetToFile); 
        } else {
            //process based on field type
            switch (fieldtype) {
                case 2:
                    //if four bytes or less, read directly from here
                    if (fieldcount < 5) {
                        if (idtag == 1) {
                            //get latitude marker - technically we now read this value twice, but I think it's OK
                            latTest = readText(aview, offset + 8, 1);
                            if (latTest == "S") {
                                negLat = true;
                            } else {
                                negLat = false;
                            }
                        }
                        if (idtag == 3) {
                            //get latitude marker - technically we now read this value twice, but I think it's OK
                            longTest = readText(aview, offset + 8, 1);
                            if (longTest == "W") {
                                negLong = true;
                            } else {
                                negLong = false;
                            }
                        }
                        tagentry = await readTIFFTextTag(file, fieldcount, offsettoIFD + 2 + offset + 8 + offsetToFile, labelfortag);
                    } else {
                        //read the text in (currently, only reads first string; technically there could be more than one null-terminated string)
                        tagentry = await readTIFFTextTag(file, fieldcount, fieldbyteoffset + offsetToFile, labelfortag);
                    }
                    if (idtag == 29) {
                        //this is date stamp
                        OSMDateStamp = textValues.slice(-1);
                    }
                    break;
                case 3:
                    //16 bit unsigned; display it if there's only one
                    if (fieldcount == 1) {
                        theval = aview.getUint16(offset + 8, isLittleEndian);
                        tagentry = makeNewBottomNode(labelfortag + ": " + theval);
                    } else {
                        tagentry = makeNewBottomNode(labelfortag);
                    }
                    break;
                case 4:
                    //32 bit unsigned; display it if there's only one
                    if (fieldcount == 1) {
                        theval = aview.getUint32(offset + 8, isLittleEndian);
                        tagentry = makeNewBottomNode(labelfortag + ": " + theval);
                    } else {
                        tagentry = makeNewBottomNode(labelfortag);
                    }
                    break;
                case 5:
                    //fractional value; go read it and display it if there's only one
                    if (fieldcount == 1) {
                        let subarea = aview.getUint32(offset + 8, isLittleEndian);
                        let subbuff = await file.slice(subarea + offsetToFile, subarea + offsetToFile + 8).arrayBuffer();
                        let subview = new DataView(subbuff);
                        let numerator = subview.getUint32(0, isLittleEndian);
                        let denominator = subview.getUint32(4, isLittleEndian);
                        tagentry = makeNewBottomNode(labelfortag + ": " + numerator + "/" + denominator);
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
    //now that all tags are read, adjust for negative latitude and longitude values, if applicable
    if ((OSMLatitude != 0) || (OSMLongitude != 0)) {
        if ((negLat == true) && (OSMLatitude > 0)) {
            OSMLatitude = -OSMLatitude;
        }
        if ((negLong == true) && (OSMLongitude > 0)) {
            OSMLongitude = -OSMLongitude;
        }
    }
}    
 
//read an EXIF chunk of a file; this is called from NON-TIFF files like JPG that have an EXIF chunk
async function parseEXIFFile(file, start, nodeString) {
    try {
        //reset these
        negLat = false;
        negLong = false;
        let rootnode = makeNewNode(nodeString);
        //find endian-ness and offset to first IFD
        bytepos = 6;    //skip the first 6 ID bytes that just say "Exif" with two zero bytes after
        let abuff = await file.slice(bytepos + start, bytepos + start + 18).arrayBuffer();
        let aview = new DataView(abuff);
        let endiantag = aview.getUint16(0);
        let isLittleEndian;
        if (endiantag === 0x4949) {
            isLittleEndian = true;
        } else if (endiantag === 0x4D4D) {
            isLittleEndian = false;
        } else {
            throw new Error('Invalid TIFF header');
        }
        let checker = aview.getUint16(2, isLittleEndian);
        if (checker !== 0x002A) {
            throw new Error('Invalid TIFF data');
        }
        let offsettoIFD = aview.getUint32(4, isLittleEndian);
        await readTIFFIFDs(file, offsettoIFD, rootnode, isLittleEndian, bytepos + start, false);
        return rootnode;
    } catch (err) {
        console.log(err);
    }
}

//helper function for building text tags in the TIFF file
async function readTIFFTextTag(file, fieldcount, fieldbyteoffset, labelfortag, addToList = true) {
    if (fieldcount < MAX_TEXT_LENGTH_TEXTS) {
        //go grab the string that represents the text
        let tbuff = await file.slice(fieldbyteoffset, fieldbyteoffset + (fieldcount - 1)).arrayBuffer();
        let tview = new DataView(tbuff);
        let val = readText(tview, 0, (fieldcount - 1));
        if (fieldcount < MAX_TEXT_LENGTH_TREE) {
            subentry = makeNewBottomNode(labelfortag + ": " + val);
        } else {
            subentry = makeNewBottomNode(labelfortag + ": TOO LONG TO DISPLAY HERE");
        }
        if (addToList) {
            textNames.push(labelfortag);
            textValues.push(val);
        }
    } else {
        subentry = makeNewBottomNode(labelfortag);
        if (addToList) {
            textNames.push(labelfortag);
            textValues.push("VALUE TOO LONG TO BE DISPLAYED");
        }
    }
    return subentry;
}