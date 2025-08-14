# Mogul Clip 

A Google Chrome browser extension to ingest (_clip_!) - web articles and RSS feeds - into Mogul.

## installation 
in development mode, you install this in Google Chrome by going to `chrome://extensions` and clicking on `Load unpacked extension...` and selecting the director with `manifest.json` in it.

## to resolve

* **authentication** - the general strategy here is to open a regular tab from the extension, and in that tab let the user login to Mogul, as per usual. Then, poll the tab for the cookie which the extension will read and can transmit to the API via a header assuming we install some sort of gateway filter to allow it.

* **search** - how do we search for content?

* **the backend API for notes or tags or whatever** - how does this api look? how can we make it a generic concern that works across all the different types of things we want to clip? videos, rss, articles, etc? do we use vector search to show possibly related notes and clips for various content? is it a thing we show below text as a _writing tool_? 
