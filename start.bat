@echo off

set /p fileName="Enter file name: "
start cmd /k server.bat

pushd har

if exist %fileName% (
	yslow --info all --format json %fileName% > output-har.json
	echo output-har.json successfully created!
)else (
	echo No such file exist!
	echo Make sure that %fileName% file is present inside the "har" folder
)

pause >nul