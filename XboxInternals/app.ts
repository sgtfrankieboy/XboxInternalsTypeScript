///<reference path='IO/FileIO.ts' />
///<reference path='Stfs/StfsPackage.ts' /> 

window.onload = () => {
	document.getElementById("file").addEventListener("change", (event: any) => {
		var file: File = event.target.files[0];
		XboxInternals.IO.FileIO.LoadFromFile(file, (io) => {
			var stfs = new XboxInternals.Stfs.StfsPackage(io, XboxInternals.Stfs.StfsPackageFlags.StfsPackageFemale);
			console.log(stfs);
		});
	});
}