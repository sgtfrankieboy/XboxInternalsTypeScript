
module XboxInternals.IO {

    export enum EndianType {
        BigEndian = 0,
        LittleEndian = 1,
        Default
    }

    export class BaseIO {


        private byteOrder: EndianType;
        private buffer: ArrayBuffer;
        private _position: number;

        constructor(buffer: ArrayBuffer) {
            this.buffer = buffer;
        }

        public SetEndian(byteOrder: EndianType) {
            this.byteOrder = byteOrder;
        }

        public GetEndian(): EndianType {
            return this.byteOrder;
        }

        public SwapEndian() {
            if (this.byteOrder == EndianType.BigEndian)
                this.byteOrder = EndianType.LittleEndian;
            else
                this.byteOrder = EndianType.BigEndian;
        }

        public SetPosition(value: number) {
            this._position = value;
        }

        public GetPosition(): number {
            return this._position;
        }

        public GetLength(): number {
            return this.buffer.byteLength;
        }

        public ReadByte(): Uint8Array {
            return new Uint8Array(this.buffer, this._position++, 1);
        }

        public ReadBytes(len: number): Uint8Array {
            var ret = new Uint8Array(this.buffer, this._position, len);
            this.SetPosition(this.GetPosition() + len);
            return ret;
        }

        public ReadUInt8(): number {
            var view = new DataView(this.buffer, this._position, 1);
            this.SetPosition(this.GetPosition() + 1);
            return view.getUint8(0);
        }

        public ReadInt16(): number {
            return this.ReadWord();
        }

        public ReadWord(): number {
            var view = new DataView(this.buffer, this._position, 2);
            this.SetPosition(this.GetPosition() + 2);
            return view.getUint16(0, this.byteOrder == 1);
        }

        public ReadInt24(et: EndianType = EndianType.Default) {
            var orig: EndianType = this.byteOrder;

            if (et != EndianType.Default)
                this.byteOrder = et;

            var returnVal = this.ReadInt32();

            if (this.byteOrder == EndianType.BigEndian)
                returnVal = (returnVal & 0xFFFFFF00) >> 8;
            else
                returnVal = returnVal & 0x00FFFFFF;

            this.SetPosition(this.GetPosition() - 1);
            this.byteOrder = orig;

            return returnVal;
        }

        public ReadInt32(): number {
            return this.ReadDword();
        }

        public ReadDword(): number {
            var view = new DataView(this.buffer, this.GetPosition(), 4);
            this.SetPosition(this.GetPosition() + 4);
            return view.getUint32(0, this.byteOrder == 1);
        }

        public ReadMultiByte(size: number): number {
            switch (size) {
                case 1:
                    return this.ReadUInt8();
                case 2:
                    return this.ReadWord();
                case 4:
                    return this.ReadDword();
                default:
                    throw "BaseIO: Invalid multi-byte size.";
            }
        }

        public ReadFloat(): number {
            var view = new DataView(this.buffer, this.GetPosition(), 4);
            this.SetPosition(this.GetPosition() + 4);
            return view.getFloat32(0, this.byteOrder == 1);
        }

        public ReadDouble(): number {
            var view = new DataView(this.buffer, this.GetPosition(), 8);
            this.SetPosition(this.GetPosition() + 4);
            return view.getFloat64(0, this.byteOrder == 1);
        }

        public ReadString(len = -1, nullTerminiator = 0, forceInclude0 = true, maxLength = 0x7FFFFFFF): string {
            var val = String.fromCharCode.apply(null, new Uint8Array(this.buffer, this._position, len));
            this.SetPosition(this.GetPosition() + len);
            return val;
        }

        public ReadWString(len = -1): string {
            var val = String.fromCharCode.apply(null, new Uint8Array(this.buffer, this._position, len));
            this.SetPosition(this.GetPosition() + len);
            return val;
        }

        public ReadImage(length: number): HTMLImageElement {
            var binary = '';
            var bytes = new Uint8Array(this.buffer, this._position, length);
            for (var i = 0; i < bytes.length; i++) {
                binary += String.fromCharCode(bytes[i]);
            }
            var element: HTMLImageElement = <HTMLImageElement>document.createElement("img");
            element.src = "data:image/png;base64," + btoa(binary);
            this.SetPosition(this.GetPosition() + length);
            return element;
        }

        public WriteByte(byte: Uint8Array) {
            var view = new DataView(this.buffer, this._position, 1);
            view.setInt8(0, byte[0]);
            this.SetPosition(this.GetPosition() + 1);
        }

        public WriteWord(word: number) {
            var view = new DataView(this.buffer, this._position, 2);
            view.setInt16(0, word, this.byteOrder == 1);
            this.SetPosition(this.GetPosition() + 1);
        }

        public WriteInt24(i24: number, et: EndianType = EndianType.Default) {
            /* TODO: Write function to write as Int24 */
        }

        public WriteString(str: string, forceLen = -1, nullTermination = true, nullTerminator = 0) {
        
        }

        public WriteWString(wstr: string, nullTerminating = true) {
        
        }

        public WriteBuffer(buffer: Uint8Array, len: number) {
        
        }

        private reverseByteArray(array: Uint8Array): Uint8Array {
            var temp: number;
            for (var i = 0; i < array.length / 2; i++) {
                temp = array[i];
                array[i] = array[array.length - i - 1];
                array[array.length - i - 1] = temp;
            }
            return array;
        }

    }

}