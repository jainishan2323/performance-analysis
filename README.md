# performance-analysis
Tool to generate web page performance from .har file
Page Performance Précis (P3)
Main Purpose of this tool is to get performance analysis of web page and to test the performance of our Widgets.
In case we don’t have access to client environments or when we are using VPN to connect it most of the times it’s hard to analyze what exactly is causing performance issues, now we can just ask the client to send the .har file of their environment and analyze the page performance without running it in our browser.
Besides, it gives detailed analysis of web page performance from page load time to amount of data it loads, one can also check the time/data taken by any request (.js, REST, css, etc) and identify culprit files which are hampering performance.

1.	HOW TO INSTALL AND SETUP.
•	Go to Perforce location and download/checkout tool
//depot/Applications/AMSS/Advocacy/Page Performance Précis (P Cube)/
•	Install Node.js on your computer, latest version is recommended
 
•	Check If node is Installed by checking ‘node -v’ in command prompt.
•	If you are on Amdocs network you may have to setup proxy for node to install it’s modules, just add following commands in cmd.
o	npm config set proxy http://genproxy.amdocs.com:8080
o	npm config set https-proxy http://genproxy.amdocs.com:8080
•	Congrats you have node.js setup, now you need to Install Node Modules on your performance tool folder.
•	Open command prompt on your folder and run npm install command.
 
•	Node will start installing required modules. Note:
o	npm install to be done only once, when you have freshly downloaded folder, need not run this command every time.
o	In case you have older npm version; Update npm using "npm install npm -g".
o	In case you receive unrecognized command error, install package globally (e.g yslow is not recognized, install it manually using "npm install yslow -g").

2.	HOW TO RUN TOOL
•	Go to desired web page in chrome incognito mode and press f12.
•	Navigate to Network Tabs and refresh page (You can avoid refresh if you have already Network tab enabled before hitting URL).
 
•	Right click on network table and "Save as HAR with content".
 
•	Save .har file in our har folder of project (e.g: C:\Projects\Page Performance Précis (P Cube)\har\ilcm6880.eaas.amdocs.com.har).
•	Run ‘start.bat’
•	Enter the name of har file for which you need to generate report. (Make sure to add .har in the end)
 
•	Press enter, output-har.json will be generated and your node server will start.
 
•	Go to localhost:3000.
•	You can see detailed report chart of your .har file
•	You can also save the report using print -> save as “pdf”.
