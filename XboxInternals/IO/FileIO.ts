/// <reference path='BaseIO.ts' />

module XboxInternals.IO {

	export class FileIO extends BaseIO {

		private fileName: string;

		constructor(buffer: ArrayBuffer) {
			super(buffer);
		}

		public static LoadFromFile(file: File, callback: (fileIO: FileIO) => any) {
			// Create new FileReader to read the File as a ArrayBuffer.
			var reader = new FileReader();
			reader.onloadend = () => {
				var io: FileIO = new FileIO(reader.result);
				io.fileName = file.name;
				callback(io);
			};
			reader.onerror = (e) => {
				console.error(e.message);
			};
			reader.readAsArrayBuffer(file);
		}
		
		public SaveFile() {
			// Saves the file with the original file name.
			this.Save(this.fileName);
		}

		public SetFileName(name: string) {
			this.fileName = name;
		}

		public GetFileName(): string {
			return this.fileName;
		}
	}
}