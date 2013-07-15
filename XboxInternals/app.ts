///<reference path='IO/FileIO.ts' />
///<reference path='Stfs/StfsPackage.ts' /> 

var io: XboxInternals.IO.FileIO;
var stfs: XboxInternals.Stfs.StfsPackage;
var injectFile: XboxInternals.IO.FileIO;

window.onload = () => {
	document.getElementById("file").addEventListener("change", (event: any) => {
		var file: File = event.target.files[0];
		XboxInternals.IO.FileIO.LoadFromFile(file, (res) => {
			io = res;
			stfs = new XboxInternals.Stfs.StfsPackage(res, XboxInternals.Stfs.StfsPackageFlags.StfsPackageFemale);
			console.log(stfs);
		});
	});
	document.getElementById("inputInject").addEventListener("change", (event: any) => {
		var file: File = event.target.files[0];
		XboxInternals.IO.FileIO.LoadFromFile(file, (res) => {
			injectFile = res;
		});
	});
}