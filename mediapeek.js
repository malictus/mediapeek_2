//maximum length for text strings to be displayed in the tree part of the UI
const MAX_TEXT_LENGTH_TREE = 500;
//maximum length for text string to be displayed in the texts portion of the UI
const MAX_TEXT_LENGTH_TEXTS = 20000000;
//maximum size to display a picture
const MAX_PICTURE_SIZE = 100000000;
//arrays for the strings we're displaying
const textNames = [];
const textValues = [];
//holders for latitude and longitude for the openstreetmap view
OSMLatitude = 0;
OSMLongitude = 0;

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
    } else if (thefiletype == "WAV") {
        document.getElementById('infotext').innerHTML = "This file is a WAV sound file.";
        await getWAVdata(file);
    } else if (thefiletype == "JPG") {
        document.getElementById('infotext').innerHTML = "This file is a JPG image file.";
        await getJPGdata(file);
    } else {
        //file type isn't known or an error  
        document.getElementById('infotext').innerHTML = "This file is not a known file type.";
    }
    //load the media file into the appropriate window
    loadPlayer(file);
    //make the data look good again
    listree();
    populateTexts();
    populateStreetMap();
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
        } else if (isWAV(aview)) {
            return "WAV";
        } else if (isJPG(aview)) {
            return "JPG";
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
    //clear GPS
    OSMLatitude = 0;
    OSMLongitude = 0;
    document.getElementById('map').innerHTML = "";
    document.getElementById('downloadlinks').innerHTML = "";
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

//populate the street map portion of the interface after a new file has been opened
function populateStreetMap() {
    if ((OSMLatitude != 0) || (OSMLongitude != 0)) {
        var container = L.DomUtil.get('map');
        if (container != null) {
            container._leaflet_id = null;
        }
        var map = L.map('map').setView([OSMLatitude, OSMLongitude], 13);
        L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
            maxZoom: 19,
            attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        }).addTo(map);
        var marker = L.marker([OSMLatitude, OSMLongitude]).addTo(map);
    } else {
        document.getElementById('map').innerHTML = "NONE FOUND";
    }
}

//search through a pile of Exif data in XMP format, pull out the GPS data if it exists, and enable our map
function findGPSInExifText(text) {
    if ((text.includes("exif:GPSLatitude=")) && (text.includes("exif:GPSLongitude="))) {
        let latstart = text.indexOf("exif:GPSLatitude=\"") + 18;
        let latend = text.indexOf("\"", latstart);
        let lat = text.substring(latstart, latend);
        let longstart = text.indexOf("exif:GPSLongitude=\"") + 19;
        let longend = text.indexOf("\"", longstart);
        let long = text.substring(longstart, longend);
        //currently, the only example I have is this format: LATITUDE: 19,44.5023333N and LONGITUDE: 156,1.8778333W
        //there are likely others
        let latdegrees = lat.substring(0, lat.indexOf(","));
        let longdegrees = long.substring(0, long.indexOf(","));
        let latminutes = lat.substring(lat.indexOf(",") + 1, lat.length - 1);
        let longminutes = long.substring(long.indexOf(",") + 1, long.length - 1);
        let reallat = +latdegrees + (+latminutes / 60);
        let reallong = +longdegrees + (+longminutes / 60);
        if (lat.slice(-1) == "S") {
            reallat = -reallat;
        }
        if (long.slice(-1) == "W") {
            reallong = -reallong;
        }
        OSMLatitude = reallat;
        OSMLongitude = reallong;
    }
}

//add to the extracted text links on the page
function addDownloadableLink(linkName, theText, theFileName) {
    let aTag = document.createElement('a');
    aTag.innerHTML = linkName;
    aTag.href = "data:application/octet-stream," + encodeURIComponent(theText);
    aTag.setAttribute("download", theFileName);
    document.getElementById('downloadlinks').appendChild(aTag);
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

// Display picture/video/sound player
function loadPlayer(file) {
    var thetype = file.type;
    var displayNode = document.getElementById('filedisplay');
    //start with this, in case it can't be displayed
    displayNode.innerHTML = "FILE CANNOT BE DISPLAYED";
    //now display if possible
    if (thetype.startsWith("image/") && (!thetype.startsWith("image/tiff"))) {
        //display an image
        //don't want to run the browser out of memory
        if (file.size < MAX_PICTURE_SIZE) {
            var reader = new FileReader();
            reader.onload = function (event) {
                the_url = event.target.result;
                displayNode.innerHTML = "<img class='imgdisplay' src='" + the_url + "' />";
            }
            reader.readAsDataURL(file);
        }
    } else if (thetype.startsWith("video/") || thetype.startsWith("audio/")) {
        //display a video
        displayNode.innerHTML = "<video id='videodisplay'></video>";
        var videoNode = document.getElementById('videodisplay');
        videoNode.setAttribute("src", "");
        videoNode.style.visibility = "hidden";
        videoNode.setAttribute("controls", false);
        var canPlay = videoNode.canPlayType(thetype);
        if (canPlay != '') {
            var fileURL = URL.createObjectURL(file);
            videoNode.src = fileURL;
            videoNode.style.visibility = "";
            videoNode.setAttribute("controls", true);
        } 
    } 
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
