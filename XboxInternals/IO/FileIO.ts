/// <reference path='BaseIO.ts' />

module XboxInternals.IO {

    export class FileIO extends BaseIO {

        private fileName: string;

        constructor(buffer: ArrayBuffer) {
            super(buffer);
        }

        public static LoadFromFile(file: File, callback: (fileIO: FileIO) => any) {
            var reader = new FileReader();
            reader.onloadend = () => {
                var io: FileIO = new FileIO(reader.result);
                io.fileName = file.name;
                callback(io);
            };
            reader.readAsArrayBuffer(file);
        }
    }
}