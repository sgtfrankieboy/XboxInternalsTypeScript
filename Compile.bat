@echo off
echo Compiling...
"C:\Program Files (x86)\Microsoft SDKs\TypeScript\tsc" XboxInternals\Stfs\StfsPackage.ts --out Build\XboxInternals.js --declaration
echo Copying Files...
xcopy XboxInternals\Cryptography\rsa.js Build\rsa.js /Y
echo Completed
pause