# Media Peek
A pure javascript application for extracting metadata and GPS data from media files in an easy-to-use GUI application

* pull out and display metadata from within media files
* visualize the file structure in a tree-like format
* extract and display embedded GPS metadata
* NO UPLOADING; does all the work locally
* works with any size file - only reads metadata portions of the file so it's fast!
* 100% pure javascript with custom code for reading files; not built on bulky file-reading libraries

Currently works with TIFF, WAV, and PNG files. More formats coming soon!

I'll try to keep a current version of this online here: https://malictus.com/mediapeek/

Uses the following bits

* listree for displaying tree hierarchy - see https://github.com/SuryaSankar/listree
* pako for inflating compressed text - see https://github.com/nodeca/pako
* leaflet for generating GPS maps - see https://leafletjs.com/
* openstreetmaps for display maps - see https://www.openstreetmap.org/
