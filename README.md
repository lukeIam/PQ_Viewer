# PQ_Viewer
PQ_Viewer is a quick and dirty script to show PocketQuery on the map on geocaching.com.  
Requires [TamperMonkey](https://tampermonkey.net) or [GreaseMonkey](https://www.greasespot.net) (untested).

# How to use 
- Install the script from [here](https://github.com/lukeIam/PQ_Viewer/releases)
- Drop a PocketQuery-file on the new area in the map page's menu
  - Multiple files can be added, but only one after each other
  - Newer PocketQuery update existing caches in the database
  - Archived caches will be removed from the database
  - Don't use too many caches
- The caches form the PocketQuery will be added to a local database
- With the toggle you can activate or deactivate the icons representing caches from the PocketQuery
- Clicking on a circle shows a bit modified cache info popup
- A click on `Open Description` in the popup will open a new tab with the short and long description from the PocketQuery
- A double click on the drop area asks you to clear the database

# Notes
- This script was written for a personal need and without any code styling or error handling. Nevertheless, I decided to publish it as it's maybe useful for someone.
- **I will not further develop this script - but feel free to do so**
- The Leafet version geocaching.com is using is quite old, this prevents some nice things:
  - Canvas-Renderer for better speed with may caches
  - Tooltips showing the cache names
- The circles overly the normal caches (couldn't solve this)

# Screenshot
![image](https://user-images.githubusercontent.com/5115160/39074054-3e64429c-44f0-11e8-8c11-531ec0978e75.png)
