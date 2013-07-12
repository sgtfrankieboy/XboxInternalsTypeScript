var XboxInternals;
(function (XboxInternals) {
    (function (IO) {
        (function (EndianType) {
            EndianType[EndianType["BigEndian"] = 0] = "BigEndian";
            EndianType[EndianType["LittleEndian"] = 1] = "LittleEndian";

            EndianType[EndianType["Default"] = 0] = "Default";
        })(IO.EndianType || (IO.EndianType = {}));
        var EndianType = IO.EndianType;

        var BaseIO = (function () {
            function BaseIO(buffer) {
                this.buffer = buffer;
                this.SetPosition(0);
                this.byteOrder = EndianType.BigEndian;
            }
            BaseIO.prototype.SetEndian = function (byteOrder) {
                this.byteOrder = byteOrder;
            };

            BaseIO.prototype.GetEndian = function () {
                return this.byteOrder;
            };

            BaseIO.prototype.SwapEndian = function () {
                if (this.byteOrder == EndianType.BigEndian)
                    this.byteOrder = EndianType.LittleEndian; else
                    this.byteOrder = EndianType.BigEndian;
            };

            BaseIO.prototype.SetPosition = function (value) {
                this._position = value;
            };

            BaseIO.prototype.GetPosition = function () {
                return this._position;
            };

            BaseIO.prototype.GetLength = function () {
                return this.buffer.byteLength;
            };

            BaseIO.prototype.SetBuffer = function (buffer) {
                this.buffer = buffer;
            };

            BaseIO.prototype.ReadByte = function () {
                return this.Clone(new Uint8Array(this.buffer, this._position++, 1));
            };

            BaseIO.prototype.ReadBytes = function (len) {
                var ret = new Uint8Array(this.buffer, this._position, len);
                this.SetPosition(this.GetPosition() + len);
                return this.Clone(ret);
            };

            BaseIO.prototype.ReadUInt8 = function () {
                var view = new DataView(this.buffer, this._position, 1);
                this.SetPosition(this.GetPosition() + 1);
                return view.getUint8(0);
            };

            BaseIO.prototype.ReadInt16 = function () {
                var view = new DataView(this.buffer, this._position, 2);
                this.SetPosition(this.GetPosition() + 2);
                return view.getInt16(0, this.byteOrder == 1);
            };

            BaseIO.prototype.ReadWord = function () {
                var view = new DataView(this.buffer, this._position, 2);
                this.SetPosition(this.GetPosition() + 2);
                return view.getUint16(0, this.byteOrder == 1);
            };

            BaseIO.prototype.ReadInt24 = function (et) {
                if (typeof et === "undefined") { et = EndianType.Default; }
                var orig = this.byteOrder;

                if (et != EndianType.Default)
                    this.byteOrder = et;

                var int24Bytes = this.ReadBytes(0x3);
                var returnVal;

                if (this.byteOrder == EndianType.LittleEndian)
                    returnVal = (int24Bytes[2] << 16) | (int24Bytes[1] << 8) | (int24Bytes[0]); else
                    returnVal = (int24Bytes[0] << 16) | (int24Bytes[1] << 8) | (int24Bytes[2]);

                this.byteOrder = orig;

                return returnVal;
            };

            BaseIO.prototype.ReadInt32 = function () {
                var view = new DataView(this.buffer, this.GetPosition(), 4);
                this.SetPosition(this.GetPosition() + 4);
                return view.getInt32(0, this.byteOrder == 1);
            };

            BaseIO.prototype.ReadDword = function () {
                var view = new DataView(this.buffer, this.GetPosition(), 4);
                this.SetPosition(this.GetPosition() + 4);
                return view.getUint32(0, this.byteOrder == 1);
            };

            BaseIO.prototype.ReadMultiByte = function (size) {
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
            };

            BaseIO.prototype.ReadFloat = function () {
                var view = new DataView(this.buffer, this.GetPosition(), 4);
                this.SetPosition(this.GetPosition() + 4);
                return view.getFloat32(0, this.byteOrder == 1);
            };

            BaseIO.prototype.ReadDouble = function () {
                var view = new DataView(this.buffer, this.GetPosition(), 8);
                this.SetPosition(this.GetPosition() + 4);
                return view.getFloat64(0, this.byteOrder == 1);
            };

            BaseIO.prototype.ReadString = function (len, nullTerminiator, forceInclude0, maxLength) {
                if (typeof len === "undefined") { len = -1; }
                if (typeof nullTerminiator === "undefined") { nullTerminiator = 0; }
                if (typeof forceInclude0 === "undefined") { forceInclude0 = true; }
                if (typeof maxLength === "undefined") { maxLength = 0x7FFFFFFF; }
                var stringBytes = this.Clone(new Uint8Array(this.buffer, this._position, len));
                var i = 0;
                1;
                for (; i < stringBytes.length; i++)
                    if ((i + 1 < stringBytes.length && stringBytes[i + 1] == 0 && stringBytes[i] == 0) || (i + 1 >= stringBytes.length && stringBytes[i] == 0))
                        break;

                var val = String.fromCharCode.apply(null, new Uint8Array(this.buffer, this._position, i));
                this.SetPosition(this.GetPosition() + len);
                return val;
            };

            BaseIO.prototype.ReadWString = function (len, nullTerminiator, forceInclude0, maxLength) {
                if (typeof len === "undefined") { len = -1; }
                if (typeof nullTerminiator === "undefined") { nullTerminiator = 0; }
                if (typeof forceInclude0 === "undefined") { forceInclude0 = true; }
                if (typeof maxLength === "undefined") { maxLength = 0x7FFFFFFF; }
                var stringBytes = new Uint16Array(len);
                var i = 0;
                var currentChar;
                var origPosition = this.GetPosition();

                while ((i++ < len || len == -1) && (currentChar = this.ReadWord()) != nullTerminiator)
                    stringBytes[i - 1] = currentChar;

                if (len != -1)
                    this.SetPosition(origPosition + len);
                return String.fromCharCode.apply(null, stringBytes.subarray(0, i));
            };

            BaseIO.prototype.ReadImage = function (length) {
                var binary = '';
                var bytes = this.Clone(new Uint8Array(this.buffer, this._position, length));
                for (var i = 0; i < bytes.length; i++) {
                    binary += String.fromCharCode(bytes[i]);
                }
                var element = document.createElement("img");
                element.src = "data:image/png;base64," + btoa(binary);
                this.SetPosition(this.GetPosition() + length);
                return element;
            };

            BaseIO.prototype.WriteByte = function (byte) {
                var view = new DataView(this.buffer, this._position, 1);
                view.setUint8(0, byte[0]);
                this.SetPosition(this.GetPosition() + 1);
            };

            BaseIO.prototype.WriteBytes = function (bytes) {
                var view = new DataView(this.buffer, this._position, bytes.length);
                for (var i = 0; i < bytes.length; i++)
                    view.setUint8(i, bytes[i]);
                this.SetPosition(this.GetPosition() + bytes.length);
            };

            BaseIO.prototype.WriteWord = function (word) {
                var view = new DataView(this.buffer, this._position, 2);
                view.setInt16(0, word, this.byteOrder == 1);
                this.SetPosition(this.GetPosition() + 2);
            };

            BaseIO.prototype.WriteDword = function (dword) {
                var view = new DataView(this.buffer, this._position, 4);
                view.setInt32(0, dword, this.byteOrder == 1);
                this.SetPosition(this.GetPosition() + 4);
            };

            BaseIO.prototype.WriteInt24 = function (i24, et) {
                if (typeof et === "undefined") { et = EndianType.Default; }
                var byteArray = new Uint8Array(3);

                var orig = this.byteOrder;
                if (et != EndianType.Default)
                    this.byteOrder = et;

                if (this.byteOrder == EndianType.LittleEndian) {
                    i24 <<= 8;
                    for (var i = 0; i < 3; i++)
                        byteArray[2 - i] = (i24 >> ((i + 1) * 8)) & 0xFF;
                    this.reverseByteArray(byteArray);
                } else {
                    for (var i = 0; i < 3; i++)
                        byteArray[2 - i] = (i24 >> (i * 8)) & 0xFF;
                }

                this.WriteBytes(byteArray);
                this.byteOrder = orig;
            };

            BaseIO.prototype.WriteString = function (str, forceLen, nullTermination, nullTerminator) {
                if (typeof forceLen === "undefined") { forceLen = -1; }
                if (typeof nullTermination === "undefined") { nullTermination = true; }
                if (typeof nullTerminator === "undefined") { nullTerminator = 0; }
                var stringArray = new Uint8Array(str.length + ((nullTermination) ? 1 : 0));
                for (var i = 0; i < str.length; i++)
                    stringArray[i] = str.charCodeAt(i);

                if (nullTermination)
                    stringArray[str.length] = nullTerminator;

                this.WriteBytes(stringArray);

                if (forceLen > 0) {
                    forceLen -= str.length;
                    var nullTerminatorArray = new Uint8Array(forceLen);
                    for (var i = 0; i < forceLen; i++)
                        nullTerminatorArray[i] = nullTerminator;

                    this.WriteBytes(nullTerminatorArray);
                }
            };

            BaseIO.prototype.reverseByteArray = function (array) {
                var temp;
                for (var i = 0; i < array.length / 2; i++) {
                    temp = array[i];
                    array[i] = array[array.length - i - 1];
                    array[array.length - i - 1] = temp;
                }
                return array;
            };

            BaseIO.prototype.Clone = function (obj) {
                if (null == obj || "object" != typeof obj)
                    return obj;

                if (obj instanceof Date) {
                    var copy = new Date();
                    copy.setTime(obj.getTime());
                    return copy;
                }

                if (obj instanceof Array) {
                    var copy = [];
                    for (var i = 0, len = obj.length; i < len; i++) {
                        copy[i] = this.Clone(obj[i]);
                    }
                    return copy;
                }

                if (obj instanceof Object) {
                    var copy = {};
                    for (var attr in obj) {
                        if (obj.hasOwnProperty(attr))
                            copy[attr] = this.Clone(obj[attr]);
                    }
                    return copy;
                }

                throw new Error("Unable to copy obj! Its type isn't supported.");
            };

            BaseIO.prototype.Save = function (fileName) {
                var blob = new Blob([this.buffer], { type: "application/octet-stream" });

                if (navigator.msSaveBlob) {
                    navigator.msSaveBlob(blob, fileName);
                } else {
                    var downloadLink = document.createElement("a");
                    downloadLink.download = fileName;

                    if ((window).webkitURL != null) {
                        downloadLink.href = (window).webkitURL.createObjectURL(blob);
                    } else {
                        downloadLink.href = (window).URL.createObjectURL(blob);
                        downloadLink.onclick = function (event) {
                            document.body.removeChild(event.target);
                        };
                        downloadLink.style.display = "none";
                        document.body.appendChild(downloadLink);
                    }

                    downloadLink.click();
                }
            };
            return BaseIO;
        })();
        IO.BaseIO = BaseIO;
    })(XboxInternals.IO || (XboxInternals.IO = {}));
    var IO = XboxInternals.IO;
})(XboxInternals || (XboxInternals = {}));
var __extends = this.__extends || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    __.prototype = b.prototype;
    d.prototype = new __();
};
var XboxInternals;
(function (XboxInternals) {
    (function (IO) {
        var FileIO = (function (_super) {
            __extends(FileIO, _super);
            function FileIO(buffer) {
                _super.call(this, buffer);
            }
            FileIO.LoadFromFile = function (file, callback) {
                var reader = new FileReader();
                reader.onloadend = function () {
                    var io = new FileIO(reader.result);
                    io.fileName = file.name;
                    callback(io);
                };
                reader.onerror = function (e) {
                    console.error(e.message);
                };
                reader.readAsArrayBuffer(file);
            };

            FileIO.prototype.SaveFile = function () {
                this.Save(this.fileName);
            };

            FileIO.prototype.SetFileName = function (name) {
                this.fileName = name;
            };

            FileIO.prototype.GetFileName = function () {
                return this.fileName;
            };
            return FileIO;
        })(IO.BaseIO);
        IO.FileIO = FileIO;
    })(XboxInternals.IO || (XboxInternals.IO = {}));
    var IO = XboxInternals.IO;
})(XboxInternals || (XboxInternals = {}));
var XboxInternals;
(function (XboxInternals) {
    (function (Stfs) {
        Stfs.dataBlocksPerHashTreeLevel = new Array(0xAA, 0x70E4, 0x4AF768);

        (function (Sex) {
            Sex[Sex["StfsFemale"] = 0] = "StfsFemale";

            Sex[Sex["StfsMale"] = 1] = "StfsMale";
        })(Stfs.Sex || (Stfs.Sex = {}));
        var Sex = Stfs.Sex;

        (function (Level) {
            Level[Level["Zero"] = 0] = "Zero";
            Level[Level["One"] = 1] = "One";

            Level[Level["Two"] = 2] = "Two";
        })(Stfs.Level || (Stfs.Level = {}));
        var Level = Stfs.Level;

        (function (ConsoleType) {
            ConsoleType[ConsoleType["DevKit"] = 1] = "DevKit";

            ConsoleType[ConsoleType["Retail"] = 2] = "Retail";
        })(Stfs.ConsoleType || (Stfs.ConsoleType = {}));
        var ConsoleType = Stfs.ConsoleType;

        (function (ConsoleTypeFlags) {
            ConsoleTypeFlags[ConsoleTypeFlags["TestKit"] = 0x40000000] = "TestKit";

            ConsoleTypeFlags[ConsoleTypeFlags["RecoveryGenerated"] = 0x80000000] = "RecoveryGenerated";
        })(Stfs.ConsoleTypeFlags || (Stfs.ConsoleTypeFlags = {}));
        var ConsoleTypeFlags = Stfs.ConsoleTypeFlags;

        (function (Magic) {
            Magic[Magic["CON"] = 0x434F4E20] = "CON";
            Magic[Magic["LIVE"] = 0x4C495645] = "LIVE";

            Magic[Magic["PIRS"] = 0x50495253] = "PIRS";
        })(Stfs.Magic || (Stfs.Magic = {}));
        var Magic = Stfs.Magic;

        (function (FileEntryFlags) {
            FileEntryFlags[FileEntryFlags["ConsecutiveBlocks"] = 1] = "ConsecutiveBlocks";

            FileEntryFlags[FileEntryFlags["Folder"] = 2] = "Folder";
        })(Stfs.FileEntryFlags || (Stfs.FileEntryFlags = {}));
        var FileEntryFlags = Stfs.FileEntryFlags;

        (function (InstallerType) {
            InstallerType[InstallerType["None"] = 0] = "None";
            InstallerType[InstallerType["SystemUpdate"] = 0x53555044] = "SystemUpdate";
            InstallerType[InstallerType["TitleUpdate"] = 0x54555044] = "TitleUpdate";
            InstallerType[InstallerType["SystemUpdateProgressCache"] = 0x50245355] = "SystemUpdateProgressCache";
            InstallerType[InstallerType["TitleUpdateProgressCache"] = 0x50245455] = "TitleUpdateProgressCache";

            InstallerType[InstallerType["TitleContentProgressCache"] = 0x50245443] = "TitleContentProgressCache";
        })(Stfs.InstallerType || (Stfs.InstallerType = {}));
        var InstallerType = Stfs.InstallerType;

        (function (ContentType) {
            ContentType[ContentType["ArcadeGame"] = 0xD0000] = "ArcadeGame";
            ContentType[ContentType["AvatarAssetPack"] = 0x8000] = "AvatarAssetPack";
            ContentType[ContentType["AvatarItem"] = 0x9000] = "AvatarItem";
            ContentType[ContentType["CacheFile"] = 0x40000] = "CacheFile";
            ContentType[ContentType["CommunityGame"] = 0x2000000] = "CommunityGame";
            ContentType[ContentType["GameDemo"] = 0x80000] = "GameDemo";
            ContentType[ContentType["GameOnDemand"] = 0x7000] = "GameOnDemand";
            ContentType[ContentType["GamerPicture"] = 0x20000] = "GamerPicture";
            ContentType[ContentType["GamerTitle"] = 0xA0000] = "GamerTitle";
            ContentType[ContentType["GameTrailer"] = 0xC0000] = "GameTrailer";
            ContentType[ContentType["GameVideo"] = 0x400000] = "GameVideo";
            ContentType[ContentType["InstalledGame"] = 0x4000] = "InstalledGame";
            ContentType[ContentType["Installer"] = 0xB0000] = "Installer";
            ContentType[ContentType["IPTVPauseBuffer"] = 0x2000] = "IPTVPauseBuffer";
            ContentType[ContentType["LicenseStore"] = 0xF0000] = "LicenseStore";
            ContentType[ContentType["MarketPlaceContent"] = 2] = "MarketPlaceContent";
            ContentType[ContentType["Movie"] = 0x100000] = "Movie";
            ContentType[ContentType["MusicVideo"] = 0x300000] = "MusicVideo";
            ContentType[ContentType["PodcastVideo"] = 0x500000] = "PodcastVideo";
            ContentType[ContentType["Profile"] = 0x10000] = "Profile";
            ContentType[ContentType["Publisher"] = 3] = "Publisher";
            ContentType[ContentType["SavedGame"] = 1] = "SavedGame";
            ContentType[ContentType["StorageDownload"] = 0x50000] = "StorageDownload";
            ContentType[ContentType["Theme"] = 0x30000] = "Theme";
            ContentType[ContentType["Video"] = 0x200000] = "Video";
            ContentType[ContentType["ViralVideo"] = 0x600000] = "ViralVideo";
            ContentType[ContentType["XboxDownload"] = 0x70000] = "XboxDownload";
            ContentType[ContentType["XboxOriginalGame"] = 0x5000] = "XboxOriginalGame";
            ContentType[ContentType["XboxSavedGame"] = 0x60000] = "XboxSavedGame";
            ContentType[ContentType["Xbox360Title"] = 0x1000] = "Xbox360Title";

            ContentType[ContentType["XNA"] = 0xE0000] = "XNA";
        })(Stfs.ContentType || (Stfs.ContentType = {}));
        var ContentType = Stfs.ContentType;

        (function (BlockStatusLevelZero) {
            BlockStatusLevelZero[BlockStatusLevelZero["Unallocated"] = 0] = "Unallocated";
            BlockStatusLevelZero[BlockStatusLevelZero["PreviouslyAllocated"] = 0x40] = "PreviouslyAllocated";
            BlockStatusLevelZero[BlockStatusLevelZero["Allocated"] = 0x80] = "Allocated";

            BlockStatusLevelZero[BlockStatusLevelZero["NewlyAllocated"] = 0xC0] = "NewlyAllocated";
        })(Stfs.BlockStatusLevelZero || (Stfs.BlockStatusLevelZero = {}));
        var BlockStatusLevelZero = Stfs.BlockStatusLevelZero;

        (function (SVODFeatures) {
            SVODFeatures[SVODFeatures["EnhancedGDFLayout"] = 0x40] = "EnhancedGDFLayout";

            SVODFeatures[SVODFeatures["houldBeZeroForDownLevelClients"] = 0x80] = "houldBeZeroForDownLevelClients";
        })(Stfs.SVODFeatures || (Stfs.SVODFeatures = {}));
        var SVODFeatures = Stfs.SVODFeatures;
    })(XboxInternals.Stfs || (XboxInternals.Stfs = {}));
    var Stfs = XboxInternals.Stfs;
})(XboxInternals || (XboxInternals = {}));
var XboxInternals;
(function (XboxInternals) {
    (function (Stfs) {
        (function (LicenseType) {
            LicenseType[LicenseType["Unused"] = 0x0000] = "Unused";
            LicenseType[LicenseType["Unrestricted"] = 0xFFFF] = "Unrestricted";
            LicenseType[LicenseType["ConsoleProfileLicense"] = 0x0009] = "ConsoleProfileLicense";
            LicenseType[LicenseType["WindowsProfileLicense"] = 0x0003] = "WindowsProfileLicense";
            LicenseType[LicenseType["ConsoleLicense"] = 0xF000] = "ConsoleLicense";
            LicenseType[LicenseType["MediaFlags"] = 0xE000] = "MediaFlags";
            LicenseType[LicenseType["KeyVaultPrivileges"] = 0xD000] = "KeyVaultPrivileges";
            LicenseType[LicenseType["HyperVisorFlags"] = 0xC000] = "HyperVisorFlags";

            LicenseType[LicenseType["UserPrivileges"] = 0xB000] = "UserPrivileges";
        })(Stfs.LicenseType || (Stfs.LicenseType = {}));
        var LicenseType = Stfs.LicenseType;

        var StfsDefinitions = (function () {
            function StfsDefinitions() {
            }
            StfsDefinitions.prototype.ReadStfsVolumeDescriptorEx = function (io, address) {
                io.SetPosition(address);
                io.SetEndian(XboxInternals.IO.EndianType.BigEndian);

                var size = io.ReadByte();
                var reserved = io.ReadByte();
                var blockSeperation = io.ReadByte();

                io.SetEndian(XboxInternals.IO.EndianType.LittleEndian);

                var fileTableBlockCount = io.ReadWord();
                var fileTableBlockNum = io.ReadInt24();

                var topHashTableHash = io.ReadBytes(0x14);

                io.SetEndian(XboxInternals.IO.EndianType.BigEndian);

                var allocatedBlockCount = io.ReadInt32();
                var unallocatedBlockCount = io.ReadInt32();

                var descriptor = {
                    size: size,
                    reserved: reserved,
                    blockSeperation: blockSeperation,
                    fileTableBlockCount: fileTableBlockCount,
                    fileTableBlockNum: fileTableBlockNum,
                    topHashTableHash: topHashTableHash,
                    allocatedBlockCount: allocatedBlockCount,
                    unallocatedBlockCount: unallocatedBlockCount
                };
                return descriptor;
            };

            StfsDefinitions.prototype.ReadSvodVolumeDescriptorEx = function (io) {
                io.SetPosition(0x379);

                return {
                    size: io.ReadByte(),
                    blockCacheElementCount: io.ReadByte(),
                    workerThreadProcessor: io.ReadByte(),
                    workerThreadPriority: io.ReadByte(),
                    rootHash: io.ReadBytes(0x14),
                    flags: io.ReadByte(),
                    dataBlockCount: io.ReadInt24(XboxInternals.IO.EndianType.LittleEndian),
                    dataBlockOffset: io.ReadInt24(XboxInternals.IO.EndianType.LittleEndian),
                    reserved: io.ReadBytes(0x05)
                };
            };

            StfsDefinitions.prototype.WriteStfsVolumeDescriptorEx = function (descriptor, io, address) {
                io.SetPosition(address);

                var start = 0x240000;
                start |= descriptor.blockSeperation[0];
                io.WriteInt24(start);

                io.SwapEndian();
                io.WriteWord(descriptor.fileTableBlockCount);
                io.SwapEndian();

                io.WriteInt24(descriptor.fileTableBlockNum, XboxInternals.IO.EndianType.LittleEndian);
                io.WriteBytes(descriptor.topHashTableHash);
                io.WriteDword(descriptor.allocatedBlockCount);
                io.WriteDword(descriptor.unallocatedBlockCount);
            };

            StfsDefinitions.prototype.LicenseTypeToString = function (type) {
                switch (type) {
                    case LicenseType.Unused:
                        return "Unused";
                    case LicenseType.Unrestricted:
                        return "Unrestricted";
                    case LicenseType.ConsoleProfileLicense:
                        return "ConsoleProfileLicense";
                    case LicenseType.WindowsProfileLicense:
                        return "WindowsProfileLicense";
                    case LicenseType.ConsoleLicense:
                        return "ConsoleLicense";
                    case LicenseType.MediaFlags:
                        return "MediaFlags";
                    case LicenseType.KeyVaultPrivileges:
                        return "KeyVaultPrivileges";
                    case LicenseType.HyperVisorFlags:
                        return "HyperVisorFlags";
                    case LicenseType.UserPrivileges:
                        return "UserPrivileges";
                    default:
                        throw "STFS: Invalid 'License Type' value.";
                }
            };

            StfsDefinitions.prototype.ByteSizeToString = function (bytes) {
                var B = 1;
                var KB = 1024 * B;
                var MB = 1024 * KB;
                var GB = 1024 * MB;

                if (bytes > GB)
                    return (bytes / GB) + " GB"; else if (bytes > MB)
                    return (bytes / MB) + " MB"; else if (bytes > KB)
                    return (bytes / KB) + " KB"; else
                    return bytes + " bytes";
            };

            StfsDefinitions.prototype.ReadCertificateEx = function (io, address) {
                io.SetPosition(address);

                var publicKeyCertifcateSize = io.ReadWord();
                var ownerConsoleID = io.ReadBytes(0x5);
                var ownerConsolePartNumber = io.ReadString(0x11);

                var temp = io.ReadDword();
                var ownerConsoleType = (temp & 3);
                var consoleTypeFlags = (temp & 0xFFFFFFFC);
                if (ownerConsoleType != Stfs.ConsoleType.DevKit && ownerConsoleType != Stfs.ConsoleType.Retail)
                    throw "STFS: Invalid console type.";

                var dateGeneration = io.ReadString(0x8);

                var publicExponent = io.ReadDword();
                var publicModules = io.ReadBytes(0x80);
                var certificateSignature = io.ReadBytes(0x100);
                var signature = io.ReadBytes(0x10);

                return {
                    publicKeyCertificateSize: publicKeyCertifcateSize,
                    ownerConsoleID: ownerConsoleID,
                    ownerConsolePartNumber: ownerConsolePartNumber,
                    ownerConsoleType: ownerConsoleType,
                    consoleTypeFlags: consoleTypeFlags,
                    dataGeneration: dateGeneration,
                    publicExponent: publicExponent,
                    publicModules: publicModules,
                    certificateSignature: certificateSignature,
                    signature: signature
                };
            };
            return StfsDefinitions;
        })();
        Stfs.StfsDefinitions = StfsDefinitions;
    })(XboxInternals.Stfs || (XboxInternals.Stfs = {}));
    var Stfs = XboxInternals.Stfs;
})(XboxInternals || (XboxInternals = {}));
var XboxInternals;
(function (XboxInternals) {
    (function (AvatarAsset) {
        (function (AssetSubcategory) {
            AssetSubcategory[AssetSubcategory["CarryableCarryable"] = 0x44c] = "CarryableCarryable";
            AssetSubcategory[AssetSubcategory["CarryableFirst"] = 0x44c] = "CarryableFirst";
            AssetSubcategory[AssetSubcategory["CarryableLast"] = 0x44c] = "CarryableLast";
            AssetSubcategory[AssetSubcategory["CostumeCasualSuit"] = 0x68] = "CostumeCasualSuit";
            AssetSubcategory[AssetSubcategory["CostumeCostume"] = 0x69] = "CostumeCostume";
            AssetSubcategory[AssetSubcategory["CostumeFirst"] = 100] = "CostumeFirst";
            AssetSubcategory[AssetSubcategory["CostumeFormalSuit"] = 0x67] = "CostumeFormalSuit";
            AssetSubcategory[AssetSubcategory["CostumeLast"] = 0x6a] = "CostumeLast";
            AssetSubcategory[AssetSubcategory["CostumeLongDress"] = 0x65] = "CostumeLongDress";
            AssetSubcategory[AssetSubcategory["CostumeShortDress"] = 100] = "CostumeShortDress";
            AssetSubcategory[AssetSubcategory["EarringsDanglers"] = 0x387] = "EarringsDanglers";
            AssetSubcategory[AssetSubcategory["EarringsFirst"] = 900] = "EarringsFirst";
            AssetSubcategory[AssetSubcategory["EarringsLargehoops"] = 0x38b] = "EarringsLargehoops";
            AssetSubcategory[AssetSubcategory["EarringsLast"] = 0x38b] = "EarringsLast";
            AssetSubcategory[AssetSubcategory["EarringsSingleDangler"] = 0x386] = "EarringsSingleDangler";
            AssetSubcategory[AssetSubcategory["EarringsSingleLargeHoop"] = 0x38a] = "EarringsSingleLargeHoop";
            AssetSubcategory[AssetSubcategory["EarringsSingleSmallHoop"] = 0x388] = "EarringsSingleSmallHoop";
            AssetSubcategory[AssetSubcategory["EarringsSingleStud"] = 900] = "EarringsSingleStud";
            AssetSubcategory[AssetSubcategory["EarringsSmallHoops"] = 0x389] = "EarringsSmallHoops";
            AssetSubcategory[AssetSubcategory["EarringsStuds"] = 0x385] = "EarringsStuds";
            AssetSubcategory[AssetSubcategory["GlassesCostume"] = 0x2be] = "GlassesCostume";
            AssetSubcategory[AssetSubcategory["GlassesFirst"] = 700] = "GlassesFirst";
            AssetSubcategory[AssetSubcategory["GlassesGlasses"] = 700] = "GlassesGlasses";
            AssetSubcategory[AssetSubcategory["GlassesLast"] = 0x2be] = "GlassesLast";
            AssetSubcategory[AssetSubcategory["GlassesSunglasses"] = 0x2bd] = "GlassesSunglasses";
            AssetSubcategory[AssetSubcategory["GlovesFingerless"] = 600] = "GlovesFingerless";
            AssetSubcategory[AssetSubcategory["GlovesFirst"] = 600] = "GlovesFirst";
            AssetSubcategory[AssetSubcategory["GlovesFullFingered"] = 0x259] = "GlovesFullFingered";
            AssetSubcategory[AssetSubcategory["GlovesLast"] = 0x259] = "GlovesLast";
            AssetSubcategory[AssetSubcategory["HatBaseballCap"] = 0x1f6] = "HatBaseballCap";
            AssetSubcategory[AssetSubcategory["HatBeanie"] = 500] = "HatBeanie";
            AssetSubcategory[AssetSubcategory["HatBearskin"] = 0x1fc] = "HatBearskin";
            AssetSubcategory[AssetSubcategory["HatBrimmed"] = 0x1f8] = "HatBrimmed";
            AssetSubcategory[AssetSubcategory["HatCostume"] = 0x1fb] = "HatCostume";
            AssetSubcategory[AssetSubcategory["HatFez"] = 0x1f9] = "HatFez";
            AssetSubcategory[AssetSubcategory["HatFirst"] = 500] = "HatFirst";
            AssetSubcategory[AssetSubcategory["HatFlatCap"] = 0x1f5] = "HatFlatCap";
            AssetSubcategory[AssetSubcategory["HatHeadwrap"] = 0x1fa] = "HatHeadwrap";
            AssetSubcategory[AssetSubcategory["HatHelmet"] = 0x1fd] = "HatHelmet";
            AssetSubcategory[AssetSubcategory["HatLast"] = 0x1fd] = "HatLast";
            AssetSubcategory[AssetSubcategory["HatPeakCap"] = 0x1f7] = "HatPeakCap";
            AssetSubcategory[AssetSubcategory["RingFirst"] = 0x3e8] = "RingFirst";
            AssetSubcategory[AssetSubcategory["RingLast"] = 0x3ea] = "RingLast";
            AssetSubcategory[AssetSubcategory["RingLeft"] = 0x3e9] = "RingLeft";
            AssetSubcategory[AssetSubcategory["RingRight"] = 0x3e8] = "RingRight";
            AssetSubcategory[AssetSubcategory["ShirtCoat"] = 210] = "ShirtCoat";
            AssetSubcategory[AssetSubcategory["ShirtFirst"] = 200] = "ShirtFirst";
            AssetSubcategory[AssetSubcategory["ShirtHoodie"] = 0xd0] = "ShirtHoodie";
            AssetSubcategory[AssetSubcategory["ShirtJacket"] = 0xd1] = "ShirtJacket";
            AssetSubcategory[AssetSubcategory["ShirtLast"] = 210] = "ShirtLast";
            AssetSubcategory[AssetSubcategory["ShirtLongSleeveShirt"] = 0xce] = "ShirtLongSleeveShirt";
            AssetSubcategory[AssetSubcategory["ShirtLongSleeveTee"] = 0xcc] = "ShirtLongSleeveTee";
            AssetSubcategory[AssetSubcategory["ShirtPolo"] = 0xcb] = "ShirtPolo";
            AssetSubcategory[AssetSubcategory["ShirtShortSleeveShirt"] = 0xcd] = "ShirtShortSleeveShirt";
            AssetSubcategory[AssetSubcategory["ShirtSportsTee"] = 200] = "ShirtSportsTee";
            AssetSubcategory[AssetSubcategory["ShirtSweater"] = 0xcf] = "ShirtSweater";
            AssetSubcategory[AssetSubcategory["ShirtTee"] = 0xc9] = "ShirtTee";
            AssetSubcategory[AssetSubcategory["ShirtVest"] = 0xca] = "ShirtVest";
            AssetSubcategory[AssetSubcategory["ShoesCostume"] = 0x197] = "ShoesCostume";
            AssetSubcategory[AssetSubcategory["ShoesFirst"] = 400] = "ShoesFirst";
            AssetSubcategory[AssetSubcategory["ShoesFormal"] = 0x193] = "ShoesFormal";
            AssetSubcategory[AssetSubcategory["ShoesHeels"] = 0x191] = "ShoesHeels";
            AssetSubcategory[AssetSubcategory["ShoesHighBoots"] = 0x196] = "ShoesHighBoots";
            AssetSubcategory[AssetSubcategory["ShoesLast"] = 0x197] = "ShoesLast";
            AssetSubcategory[AssetSubcategory["ShoesPumps"] = 0x192] = "ShoesPumps";
            AssetSubcategory[AssetSubcategory["ShoesSandals"] = 400] = "ShoesSandals";
            AssetSubcategory[AssetSubcategory["ShoesShortBoots"] = 0x195] = "ShoesShortBoots";
            AssetSubcategory[AssetSubcategory["ShoesTrainers"] = 0x194] = "ShoesTrainers";
            AssetSubcategory[AssetSubcategory["TrousersCargo"] = 0x131] = "TrousersCargo";
            AssetSubcategory[AssetSubcategory["TrousersFirst"] = 300] = "TrousersFirst";
            AssetSubcategory[AssetSubcategory["TrousersHotpants"] = 300] = "TrousersHotpants";
            AssetSubcategory[AssetSubcategory["TrousersJeans"] = 0x132] = "TrousersJeans";
            AssetSubcategory[AssetSubcategory["TrousersKilt"] = 0x134] = "TrousersKilt";
            AssetSubcategory[AssetSubcategory["TrousersLast"] = 0x135] = "TrousersLast";
            AssetSubcategory[AssetSubcategory["TrousersLeggings"] = 0x12f] = "TrousersLeggings";
            AssetSubcategory[AssetSubcategory["TrousersLongShorts"] = 0x12e] = "TrousersLongShorts";
            AssetSubcategory[AssetSubcategory["TrousersLongSkirt"] = 0x135] = "TrousersLongSkirt";
            AssetSubcategory[AssetSubcategory["TrousersShorts"] = 0x12d] = "TrousersShorts";
            AssetSubcategory[AssetSubcategory["TrousersShortSkirt"] = 0x133] = "TrousersShortSkirt";
            AssetSubcategory[AssetSubcategory["TrousersTrousers"] = 0x130] = "TrousersTrousers";
            AssetSubcategory[AssetSubcategory["WristwearBands"] = 0x322] = "WristwearBands";
            AssetSubcategory[AssetSubcategory["WristwearBracelet"] = 800] = "WristwearBracelet";
            AssetSubcategory[AssetSubcategory["WristwearFirst"] = 800] = "WristwearFirst";
            AssetSubcategory[AssetSubcategory["WristwearLast"] = 0x323] = "WristwearLast";
            AssetSubcategory[AssetSubcategory["WristwearSweatbands"] = 0x323] = "WristwearSweatbands";

            AssetSubcategory[AssetSubcategory["WristwearWatch"] = 0x321] = "WristwearWatch";
        })(AvatarAsset.AssetSubcategory || (AvatarAsset.AssetSubcategory = {}));
        var AssetSubcategory = AvatarAsset.AssetSubcategory;

        (function (BinaryAssetType) {
            BinaryAssetType[BinaryAssetType["Component"] = 1] = "Component";
            BinaryAssetType[BinaryAssetType["Texture"] = 2] = "Texture";
            BinaryAssetType[BinaryAssetType["ShapeOverride"] = 3] = "ShapeOverride";
            BinaryAssetType[BinaryAssetType["Animation"] = 4] = "Animation";

            BinaryAssetType[BinaryAssetType["ShapeOverridePost"] = 5] = "ShapeOverridePost";
        })(AvatarAsset.BinaryAssetType || (AvatarAsset.BinaryAssetType = {}));
        var BinaryAssetType = AvatarAsset.BinaryAssetType;

        (function (SkeletonVersion) {
            SkeletonVersion[SkeletonVersion["Nxe"] = 1] = "Nxe";
            SkeletonVersion[SkeletonVersion["Natal"] = 0] = "Natal";

            SkeletonVersion[SkeletonVersion["NxeAndNatal"] = 1] = "NxeAndNatal";
        })(AvatarAsset.SkeletonVersion || (AvatarAsset.SkeletonVersion = {}));
        var SkeletonVersion = AvatarAsset.SkeletonVersion;

        (function (AssetGender) {
            AssetGender[AssetGender["Male"] = 1] = "Male";
            AssetGender[AssetGender["Female"] = 0] = "Female";

            AssetGender[AssetGender["Both"] = 1] = "Both";
        })(AvatarAsset.AssetGender || (AvatarAsset.AssetGender = {}));
        var AssetGender = AvatarAsset.AssetGender;

        (function (STRRBBlockId) {
            STRRBBlockId[STRRBBlockId["STRBAnimation"] = 1] = "STRBAnimation";
            STRRBBlockId[STRRBBlockId["STRBAssetMetadata"] = 6] = "STRBAssetMetadata";
            STRRBBlockId[STRRBBlockId["STRBAssetMetadataVersioned"] = 8] = "STRBAssetMetadataVersioned";
            STRRBBlockId[STRRBBlockId["STRBCustomColorTable"] = 7] = "STRBCustomColorTable";
            STRRBBlockId[STRRBBlockId["STRBEof"] = -1] = "STRBEof";
            STRRBBlockId[STRRBBlockId["STRBInvalid"] = 0] = "STRBInvalid";
            STRRBBlockId[STRRBBlockId["STRBModel"] = 3] = "STRBModel";
            STRRBBlockId[STRRBBlockId["STRBShapeOverrides"] = 4] = "STRBShapeOverrides";
            STRRBBlockId[STRRBBlockId["STRBSkeleton"] = 5] = "STRBSkeleton";

            STRRBBlockId[STRRBBlockId["STRBTexture"] = 2] = "STRBTexture";
        })(AvatarAsset.STRRBBlockId || (AvatarAsset.STRRBBlockId = {}));
        var STRRBBlockId = AvatarAsset.STRRBBlockId;
    })(XboxInternals.AvatarAsset || (XboxInternals.AvatarAsset = {}));
    var AvatarAsset = XboxInternals.AvatarAsset;
})(XboxInternals || (XboxInternals = {}));
var XboxInternals;
(function (XboxInternals) {
    (function (Stfs) {
        (function (XContentFlags) {
            XContentFlags[XContentFlags["MetadataIsPEC"] = 1] = "MetadataIsPEC";
            XContentFlags[XContentFlags["MetadataSkipRead"] = 2] = "MetadataSkipRead";

            XContentFlags[XContentFlags["MetadataDontFreeThumbnails"] = 4] = "MetadataDontFreeThumbnails";
        })(Stfs.XContentFlags || (Stfs.XContentFlags = {}));
        var XContentFlags = Stfs.XContentFlags;

        (function (OnlineContentResumeState) {
            OnlineContentResumeState[OnlineContentResumeState["FileHeadersNotReady"] = 0x46494C48] = "FileHeadersNotReady";
            OnlineContentResumeState[OnlineContentResumeState["NewFolder"] = 0x666F6C64] = "NewFolder";
            OnlineContentResumeState[OnlineContentResumeState["NewFolderResum_Attempt1"] = 0x666F6C31] = "NewFolderResum_Attempt1";
            OnlineContentResumeState[OnlineContentResumeState["NewFolderResumeAttempt2"] = 0x666F6C32] = "NewFolderResumeAttempt2";
            OnlineContentResumeState[OnlineContentResumeState["NewFolderResumeAttemptUnknown"] = 0x666F6C3F] = "NewFolderResumeAttemptUnknown";

            OnlineContentResumeState[OnlineContentResumeState["NewFolderResumeAttemptSpecific"] = 0x666F6C40] = "NewFolderResumeAttemptSpecific";
        })(Stfs.OnlineContentResumeState || (Stfs.OnlineContentResumeState = {}));
        var OnlineContentResumeState = Stfs.OnlineContentResumeState;

        (function (FileSystem) {
            FileSystem[FileSystem["FileSystemSTFS"] = 0] = "FileSystemSTFS";
            FileSystem[FileSystem["FileSystemSVOD"] = 1] = "FileSystemSVOD";

            FileSystem[FileSystem["FileSystemFATX"] = 2] = "FileSystemFATX";
        })(Stfs.FileSystem || (Stfs.FileSystem = {}));
        var FileSystem = Stfs.FileSystem;

        var XContentHeader = (function (_super) {
            __extends(XContentHeader, _super);
            function XContentHeader(io, flags) {
                if (typeof flags === "undefined") { flags = 0; }
                this.io = io;
                this.readMetadata();
                _super.call(this);
            }
            XContentHeader.prototype.readMetadata = function () {
                this.io.SetPosition(0x0);

                if ((this.flags & XContentFlags.MetadataIsPEC) == 0) {
                    this.magic = this.io.ReadDword();
                    if (this.magic == Stfs.Magic.CON)
                        this.certificate = this.ReadCertificateEx(this.io, 4); else if (this.magic == Stfs.Magic.LIVE || this.magic == Stfs.Magic.PIRS)
                        this.packageSignature = this.io.ReadBytes(0x100); else {
                        throw "XContentHeader: Content signature of type 0x" + this.magic + " is invalid";
                    }

                    this.io.SetPosition(0x22C);

                    this.licenseData = new Array(0x10);
                    for (var i = 0; i < 0x10; i++) {
                        this.io.SetPosition(this.io.GetPosition() + 8);
                        this.licenseData[i] = {
                            type: 0,
                            data: 0,
                            bits: this.io.ReadDword(),
                            flags: this.io.ReadDword()
                        };

                        switch (this.licenseData[i].type) {
                            case 0:
                            case 0xFFFF:
                            case 9:
                            case 3:
                            case 0xF000:
                            case 0xE000:
                            case 0xD000:
                            case 0xC000:
                            case 0xB000:
                                break;
                            default:
                                throw "XContentHeader: Invalid license type at index " + i + ".";
                        }
                    }

                    this.headerHash = this.io.ReadBytes(0x14);

                    this.headerSize = this.io.ReadDword();

                    this.contentType = this.io.ReadDword();

                    this.metaDataVersion = this.io.ReadDword();
                    this.contentSize = 0;
                    this.io.SetPosition(this.io.GetPosition() + 8);
                    this.mediaID = this.io.ReadDword();
                    this.version = this.io.ReadDword();
                    this.baseVersion = this.io.ReadDword();
                    this.titleID = this.io.ReadDword();
                    this.platform = this.io.ReadByte();
                    this.executableType = this.io.ReadByte();
                    this.discNumber = this.io.ReadByte();
                    this.discInSet = this.io.ReadByte();
                    this.savegameID = this.io.ReadDword();
                    this.consoleID = this.io.ReadBytes(0x5);
                    this.profileID = this.io.ReadBytes(0x8);

                    this.io.SetPosition(0x3A9);
                    this.fileSystem = this.io.ReadDword();
                    if (this.fileSystem > 1)
                        throw "XContentHeader: Invalid file system. Only STFS and SVOD are supported.";

                    if (this.fileSystem == FileSystem.FileSystemSTFS)
                        this.stfsVolumeDescriptor = this.ReadStfsVolumeDescriptorEx(this.io, 0x379); else if (this.fileSystem = FileSystem.FileSystemSVOD)
                        this.svodVolumeDescriptor = this.ReadSvodVolumeDescriptorEx(this.io);

                    this.dataFileCount = this.io.ReadDword();
                    this.dataFileCombinedSize = 0;
                    this.io.SetPosition(this.io.GetPosition() + 8);

                    if (this.contentType == Stfs.ContentType.AvatarItem) {
                        this.io.SetPosition(0x3D9);
                        this.io.SwapEndian();

                        this.subCategory = this.io.ReadDword();
                        this.colorizable = this.io.ReadDword();

                        this.io.SwapEndian();

                        this.guid = this.io.ReadBytes(0x10);
                        this.skeletonVersion = this.io.ReadByte()[0];

                        if (this.skeletonVersion < 1 || this.skeletonVersion > 3)
                            throw "XContentHeader: Invalid skeleton version.";
                    } else if (this.contentType == Stfs.ContentType.Video) {
                        this.io.SetPosition(0x3D9);

                        this.seriesID = this.io.ReadBytes(0x10);
                        this.seasonID = this.io.ReadBytes(0x10);

                        this.seasonNumber = this.io.ReadWord();
                        this.episodeNumber = this.io.ReadWord();
                    }

                    this.io.SetPosition(0x3FD);
                    this.deviceID = this.io.ReadBytes(0x14);

                    this.displayName = this.io.ReadWString(0x80);

                    this.io.SetPosition(0xD11);
                    this.displayDescription = this.io.ReadWString(0x80);

                    this.io.SetPosition(0x1611);
                    this.publisherName = this.io.ReadWString(0x80);

                    this.io.SetPosition(0x1691);
                    this.titleName = this.io.ReadWString(0x80);

                    this.io.SetPosition(0x1711);
                    this.transferFlag = this.io.ReadByte();

                    this.thumbnailImageSize = this.io.ReadDword();
                    this.titleThumbnailImageSize = this.io.ReadDword();

                    this.thumbnailImage = this.io.ReadImage(this.thumbnailImageSize);
                    this.io.SetPosition(0x571A);
                } else {
                    this.ReadCertificateEx(this.io, 0);
                    this.headerHash = this.io.ReadBytes(0x14);

                    this.ReadStfsVolumeDescriptorEx(this.io, 0x244);

                    this.io.SetPosition(0x26C);
                    this.profileID = this.io.ReadBytes(0x8);
                    this.enabled = (this.io.ReadByte()[0] >= 1);
                    this.consoleID = this.io.ReadBytes(0x5);

                    this.headerSize = 0x1000;
                }
            };

            XContentHeader.prototype.WriteVolumeDescriptor = function () {
                if (this.fileSystem == FileSystem.FileSystemSTFS)
                    this.WriteStfsVolumeDescriptorEx(this.stfsVolumeDescriptor, this.io, (this.flags & XContentFlags.MetadataIsPEC) ? 0x244 : 0x379);
            };
            return XContentHeader;
        })(Stfs.StfsDefinitions);
        Stfs.XContentHeader = XContentHeader;
    })(XboxInternals.Stfs || (XboxInternals.Stfs = {}));
    var Stfs = XboxInternals.Stfs;
})(XboxInternals || (XboxInternals = {}));
var XboxInternals;
(function (XboxInternals) {
    (function (Stfs) {
        var StfsPackage = (function () {
            function StfsPackage(io, flags) {
                this.io = io;
                this.ioPassedIn = true;
                this.flags = flags;
                this.metaData = null;
                this.Init();
            }
            StfsPackage.prototype.Init = function () {
                if (this.flags & StfsPackageFlags.StfsPackageCreate) {
                    var headerSize = (this.flags & StfsPackageFlags.StfsPackagePEC) ? ((this.flags & StfsPackageFlags.StfsPackageFemale) ? 0x2000 : 0x1000) : ((this.flags & StfsPackageFlags.StfsPackageFemale) ? 0xB000 : 0xA000);
                    var zeroBuffer = new Uint8Array(0x1000);
                    for (var i = 0; i < ((headerSize >> 0xC) + ((this.flags & StfsPackageFlags.StfsPackageFemale) ? 1 : 2) + 2); i++) {
                        this.io.WriteBytes(zeroBuffer);
                    }

                    this.io.SetPosition((this.flags & StfsPackageFlags.StfsPackagePEC) ? 0x246 : 0x37B);
                    this.io.WriteByte(new Uint8Array([(this.flags & StfsPackageFlags.StfsPackageFemale) >> 2]));
                }

                this.Parse();
            };

            StfsPackage.prototype.Parse = function () {
                this.metaData = new Stfs.XContentHeader(this.io, (this.flags & StfsPackageFlags.StfsPackagePEC));

                if (this.metaData.fileSystem != Stfs.FileSystem.FileSystemSTFS && (this.flags & StfsPackageFlags.StfsPackagePEC) == 0)
                    throw "STFS: Invalid file system header.";

                this.packageSex = ((~this.metaData.stfsVolumeDescriptor.blockSeperation[0]) & 1);

                if (this.packageSex == Stfs.Sex.StfsFemale) {
                    this.blockStep = [
                        0xAB,
                        0x718F
                    ];
                } else {
                    this.blockStep = [
                        0xAC,
                        0x723A
                    ];
                }

                this.firstHashTableAddress = (this.metaData.headerSize + 0x0FFF) & 0xFFFFF000;

                this.tablesPerLevel = Array(3);
                this.tablesPerLevel[0] = Math.floor(this.metaData.stfsVolumeDescriptor.allocatedBlockCount / 0xAA) + ((this.metaData.stfsVolumeDescriptor.allocatedBlockCount % 0xAA != 0) ? 1 : 0);
                this.tablesPerLevel[1] = Math.floor(this.tablesPerLevel[0] / 0xAA) + ((this.tablesPerLevel[0] % 0xAA != 0 && this.metaData.stfsVolumeDescriptor.allocatedBlockCount > 0xAA) ? 1 : 0);
                this.tablesPerLevel[2] = Math.floor(this.tablesPerLevel[1] / 0xAA) + ((this.tablesPerLevel[1] % 0xAA != 0 && this.metaData.stfsVolumeDescriptor.allocatedBlockCount > 0x70E4) ? 1 : 0);

                this.topLevel = this.CalculateTopLevel();

                this.topTable = new HashTable();

                this.topTable.trueBlockNumber = this.ComputeLevelNBackingHashBlockNumber(0, this.topLevel);
                this.topTable.level = this.topLevel;

                var baseAddres = (this.topTable.trueBlockNumber << 0xC) + this.firstHashTableAddress;
                this.topTable.addressInFile = baseAddres + ((this.metaData.stfsVolumeDescriptor.blockSeperation[0] & 2) << 0xB);
                this.io.SetPosition(this.topTable.addressInFile);

                var dataBlocksPerHashTreeLevel = [1, 0xAA, 0x70E4];

                this.topTable.entryCount = Math.floor(this.metaData.stfsVolumeDescriptor.allocatedBlockCount / dataBlocksPerHashTreeLevel[this.topLevel]);
                if (this.metaData.stfsVolumeDescriptor.allocatedBlockCount > 0x70E4 && (this.metaData.stfsVolumeDescriptor.allocatedBlockCount % 0x70E4 != 0))
                    this.topTable.entryCount++; else if (this.metaData.stfsVolumeDescriptor.allocatedBlockCount > 0xAA && (this.metaData.stfsVolumeDescriptor.allocatedBlockCount % 0xAA != 0))
                    this.topTable.entryCount++;

                this.topTable.entries = Array(this.topTable.entryCount);
                for (var i = 0; i < this.topTable.entryCount; i++) {
                    this.topTable.entries[i] = {
                        blockHash: this.io.ReadBytes(0x14),
                        status: this.io.ReadByte(),
                        nextBlock: this.io.ReadInt24()
                    };
                }

                var fe = new StfsFileEntry();
                fe.pathIndicator = 0xFFFF;
                fe.name = "Root";
                fe.entryIndex = 0xFFFF;

                this.fileListing = new StfsFileListing();
                this.fileListing.folder = fe;

                this.ReadFileListing();
            };

            StfsPackage.prototype.PrintFileListing = function (fullListing, prefix) {
                if (typeof fullListing === "undefined") { fullListing = null; }
                if (typeof prefix === "undefined") { prefix = ""; }
                if (fullListing == null)
                    fullListing = this.fileListing;

                console.log(prefix, fullListing.folder.name);

                prefix += "    ";
                for (var i = 0; i < fullListing.fileEntries.length; i++)
                    console.log(prefix, fullListing.fileEntries[i].name);

                for (var i = 0; i < fullListing.folderEntries.length; i++)
                    this.PrintFileListing(fullListing.folderEntries[i], prefix + "    ");
            };

            StfsPackage.prototype.PrintFileListingExtended = function (fullListing, prefix) {
                if (typeof fullListing === "undefined") { fullListing = null; }
                if (typeof prefix === "undefined") { prefix = ""; }
                if (fullListing == null)
                    fullListing = this.fileListing;

                console.log(prefix, fullListing.folder.name);

                prefix += "    ";
                for (var i = 0; i < fullListing.fileEntries.length; i++)
                    console.log(prefix, fullListing.fileEntries[i].name);

                for (var i = 0; i < fullListing.folderEntries.length; i++)
                    this.PrintFileListing(fullListing.folderEntries[i], prefix + "    ");
            };

            StfsPackage.prototype.GetFileListing = function (forceUpdate) {
                if (forceUpdate)
                    this.ReadFileListing();

                return this.fileListing;
            };

            StfsPackage.prototype.GetFileMagicFromPath = function (pathInPackage) {
                return this.GetFileMagic(this.GetFileEntryFromPath(pathInPackage));
            };

            StfsPackage.prototype.GetFileMagic = function (entry) {
                if (entry.fileSize < 4)
                    return 0;

                this.io.SetPosition(this.BlockToAddress(entry.startingBlockNum));

                return this.io.ReadDword();
            };

            StfsPackage.prototype.IsPEC = function () {
                return (this.flags & StfsPackageFlags.StfsPackagePEC) == 1;
            };

            StfsPackage.prototype.ReadFileListing = function () {
                this.fileListing.fileEntries.length = 0;
                this.fileListing.folderEntries.length = 0;

                var entry = new StfsFileEntry();
                entry.startingBlockNum = this.metaData.stfsVolumeDescriptor.fileTableBlockNum;
                entry.fileSize = (this.metaData.stfsVolumeDescriptor.fileTableBlockCount * 0x1000);

                var block = entry.startingBlockNum;

                var fl = new StfsFileListing();
                var currentAddr;

                for (var x = 0; x < this.metaData.stfsVolumeDescriptor.fileTableBlockCount; x++) {
                    currentAddr = this.BlockToAddress(block);
                    this.io.SetPosition(currentAddr);

                    for (var i = 0; i < 0x40; i++) {
                        var fe = new StfsFileEntry();

                        fe.fileEntryAddress = currentAddr + (i * 0x40);

                        fe.entryIndex = (x * 0x40) + i;

                        fe.name = this.io.ReadString(0x28);
                        var lengthy = fe.name.length;

                        fe.nameLen = this.io.ReadByte();

                        if ((fe.nameLen[0] & 0x3F) == 0) {
                            this.io.SetPosition(currentAddr + ((i + 1) * 0x40));
                            continue;
                        } else if (fe.name.length == 0)
                            break;

                        fe.blocksForFile = this.io.ReadInt24(XboxInternals.IO.EndianType.LittleEndian);
                        this.io.SetPosition(this.io.GetPosition() + 3);

                        fe.startingBlockNum = this.io.ReadInt24(XboxInternals.IO.EndianType.LittleEndian);
                        fe.pathIndicator = this.io.ReadWord();
                        fe.fileSize = this.io.ReadDword();
                        fe.createdTimeStamp = this.io.ReadDword();
                        fe.accessTimeStamp = this.io.ReadDword();

                        fe.flags = new Uint8Array(1);
                        fe.flags[0] = fe.nameLen[0] >> 6;

                        fe.nameLen[0] &= 0x3F;

                        var debugPoint = "";
                        fl.fileEntries.push(fe);
                    }

                    block = this.GetBlockHashEntry(block).nextBlock;
                }

                this.fileListing = this.AddToListing(fl, this.fileListing);
                this.writtenToFile = this.fileListing;
            };

            StfsPackage.prototype.AddToListing = function (fullListing, out) {
                for (var i = 0; i < fullListing.fileEntries.length; i++) {
                    var isDirectory = (fullListing.fileEntries[i].flags[0] & 2) == 2;

                    if (fullListing.fileEntries[i].pathIndicator == out.folder.entryIndex) {
                        if (!isDirectory)
                            out.fileEntries.push(fullListing.fileEntries[i]); else if (fullListing.fileEntries[i].entryIndex != out.folder.entryIndex) {
                            var fl = new StfsFileListing();
                            fl.folder = fullListing.fileEntries[i];
                            out.folderEntries.push(fl);
                        }
                    }
                }

                for (var i = 0; i < out.folderEntries.length; i++) {
                    out.folderEntries[i] = this.AddToListing(fullListing, out.folderEntries[i]);
                }

                return out;
            };

            StfsPackage.prototype.CalculateTopLevel = function () {
                if (this.metaData.stfsVolumeDescriptor.allocatedBlockCount <= 0xAA)
                    return Stfs.Level.Zero; else if (this.metaData.stfsVolumeDescriptor.allocatedBlockCount <= 0x70E4)
                    return Stfs.Level.One; else if (this.metaData.stfsVolumeDescriptor.allocatedBlockCount <= 0x4AF768)
                    return Stfs.Level.Two; else
                    throw "STFS: Invalid number of allocated blocks.";
            };

            StfsPackage.prototype.ComputeLevelNBackingHashBlockNumber = function (blockNum, level) {
                switch (level) {
                    case Stfs.Level.Zero:
                        return this.ComputeLevel0BackingHashBlockNumber(blockNum);
                    case Stfs.Level.One:
                        return this.ComputeLevel1BackingHashBlockNumber(blockNum);
                    case Stfs.Level.Two:
                        return this.ComputeLevel2BackingHashBlockNumber(blockNum);
                    default:
                        throw "STFS: Invalid level.";
                }
            };

            StfsPackage.prototype.ComputeLevel0BackingHashBlockNumber = function (blockNum) {
                if (blockNum < 0xAA)
                    return 0;

                var num = (Math.floor(blockNum / 0xAA)) * this.blockStep[0];
                num += ((Math.floor(blockNum / 0x70E4)) + 1) << this.packageSex;

                if (Math.floor(blockNum / 0x70E4) == 0)
                    return num;

                return num + (1 << this.packageSex);
            };

            StfsPackage.prototype.ComputeLevel1BackingHashBlockNumber = function (blockNum) {
                if (blockNum < 0x70E4)
                    return this.blockStep[0];
                return (1 << this.packageSex) + (Math.floor(blockNum / 0x70E4)) * this.blockStep[1];
            };

            StfsPackage.prototype.ComputeLevel2BackingHashBlockNumber = function (blockNum) {
                return this.blockStep[2];
            };

            StfsPackage.prototype.ComputeBackingDataBlockNumber = function (blockNum) {
                var toReturn = (Math.floor((blockNum + 0xAA) / 0xAA) << this.packageSex) + blockNum;
                if (blockNum < 0xAA)
                    return toReturn; else if (blockNum < 0x70E4)
                    return toReturn + (Math.floor((blockNum + 0x70E4) / 0x70E4) << this.packageSex); else
                    return (1 << this.packageSex) + (toReturn + (Math.floor((blockNum + 0x70E4) / 0x70E4) << this.packageSex));
            };

            StfsPackage.prototype.BlockToAddress = function (blockNum) {
                if (blockNum >= StfsPackage.INT24_MAX)
                    throw "STFS: block number must be less than 0xFFFFFF.";
                return (this.ComputeBackingDataBlockNumber(blockNum) << 0x0C) + this.firstHashTableAddress;
            };

            StfsPackage.prototype.GetHashAddressOfBlock = function (blockNum) {
                if (blockNum >= this.metaData.stfsVolumeDescriptor.allocatedBlockCount)
                    throw "STFS: Reference to illegal block number.";

                var hashAddr = (this.ComputeLevel0BackingHashBlockNumber(blockNum) << 0xC) + this.firstHashTableAddress;
                hashAddr += (blockNum % 0xAA) * 0x18;

                switch (this.topLevel) {
                    case 0:
                        hashAddr += ((this.metaData.stfsVolumeDescriptor.blockSeperation[0] & 2) << 0xB);
                        break;
                    case 1:
                        hashAddr += ((this.topTable.entries[Math.floor(blockNum / 0xAA)].status[0] & 0x40) << 6);
                        break;
                    case 2:
                        var level1Off = ((this.topTable.entries[Math.floor(blockNum / 0x70E4)].status[0] & 0x40) << 6);
                        var pos = ((this.ComputeLevel1BackingHashBlockNumber(blockNum) << 0xC) + this.firstHashTableAddress + level1Off) + ((blockNum % 0xAA) * 0x18);
                        this.io.SetPosition(pos + 0x14);
                        hashAddr += ((this.io.ReadByte()[0] & 0x40) << 6);
                        break;
                }

                return hashAddr;
            };

            StfsPackage.prototype.GetBlockHashEntry = function (blockNum) {
                if (blockNum >= this.metaData.stfsVolumeDescriptor.allocatedBlockCount)
                    throw "STFS: Reference to illegal block number.";

                this.io.SetPosition(this.GetHashAddressOfBlock(blockNum));

                return {
                    blockHash: this.io.ReadBytes(0x14),
                    status: this.io.ReadByte(),
                    nextBlock: this.io.ReadInt24()
                };
            };

            StfsPackage.prototype.GetFileEntryFromPath = function (pathInPackage, checkFolders, newEntry) {
                if (typeof checkFolders === "undefined") { checkFolders = false; }
                if (typeof newEntry === "undefined") { newEntry = null; }
                var entry = this.GetFileEntry(pathInPackage.split('\\'), this.fileListing, newEntry, (newEntry != null), checkFolders);

                if (entry.nameLen[0] == 0)
                    throw "STFS: File entry " + pathInPackage + " cannot be found in the package.";

                return entry;
            };

            StfsPackage.prototype.GetFileEntry = function (locationOfFile, start, newEntry, updateEntry, checkFolders) {
                if (typeof newEntry === "undefined") { newEntry = null; }
                if (typeof updateEntry === "undefined") { updateEntry = false; }
                if (typeof checkFolders === "undefined") { checkFolders = false; }
                if (locationOfFile.length == 1) {
                    for (var i = 0; i < start.fileEntries.length; i++) {
                        if (start.fileEntries[i].name == locationOfFile[0]) {
                            if (updateEntry) {
                                start.fileEntries[i] = newEntry;
                                this.io.SetPosition(start.fileEntries[i].fileEntryAddress);
                                this.WriteFileEntry(start.fileEntries[i]);
                            }

                            return start.fileEntries[i];
                        }
                    }

                    if (checkFolders) {
                        for (var i = 0; i < start.folderEntries.length; i++) {
                            if (start.folderEntries[i].folder.name == locationOfFile[0]) {
                                if (updateEntry) {
                                    start.folderEntries[i].folder = newEntry;
                                    this.io.SetPosition(start.folderEntries[i].folder.fileEntryAddress);
                                    this.WriteFileEntry(start.folderEntries[i].folder);
                                }

                                return start.folderEntries[i].folder;
                            }
                        }
                    }
                } else {
                    for (var i = 0; i < start.folderEntries.length; i++) {
                        if (start.folderEntries[i].folder.name == locationOfFile[0]) {
                            var index = locationOfFile.indexOf(locationOfFile[0], 0);
                            if (index != undefined)
                                locationOfFile.splice(index, 1);

                            return this.GetFileEntry(locationOfFile, start.folderEntries[i], newEntry, updateEntry, checkFolders);
                        }
                    }
                }

                var nullEntry = new StfsFileEntry();
                nullEntry.nameLen = new Uint8Array([0]);
                return nullEntry;
            };

            StfsPackage.prototype.WriteFileEntry = function (entry) {
                entry.nameLen = new Uint8Array([entry.name.length]);

                if (entry.nameLen[0] > 0x28)
                    throw "STFS: File entry name length cannot be  greater than 40(0x28) characters.";

                var nameLengthAndFlags = entry.nameLen[0] | (entry.flags[0] << 6);

                var orig = this.io.GetEndian();
                this.io.SetEndian(XboxInternals.IO.EndianType.BigEndian);

                this.io.WriteString(entry.name, 0x28, false);
                this.io.WriteByte(new Uint8Array([nameLengthAndFlags]));
                this.io.WriteInt24(entry.blocksForFile, XboxInternals.IO.EndianType.LittleEndian);
                this.io.WriteInt24(entry.blocksForFile, XboxInternals.IO.EndianType.LittleEndian);
                this.io.WriteInt24(entry.startingBlockNum, XboxInternals.IO.EndianType.LittleEndian);
                this.io.WriteWord(entry.pathIndicator);
                this.io.WriteDword(entry.fileSize);
                this.io.WriteDword(entry.createdTimeStamp);
                this.io.WriteDword(entry.accessTimeStamp);

                this.io.SetEndian(orig);
            };

            StfsPackage.prototype.ExtractBlock = function (blockNum, length) {
                if (typeof length === "undefined") { length = 0x1000; }
                if (blockNum >= this.metaData.stfsVolumeDescriptor.allocatedBlockCount)
                    throw "STFS: Reference to illegal block number.";
                if (length > 0x1000)
                    throw "STFS: length cannot be greater 0x1000";

                this.io.SetPosition(this.BlockToAddress(blockNum));
                return this.io.ReadBytes(length);
            };

            StfsPackage.prototype.ExtractFileFromPath = function (pathInPackage, onProgress) {
                if (typeof onProgress === "undefined") { onProgress = null; }
                var entry = this.GetFileEntryFromPath(pathInPackage);
                return this.ExtractFile(entry, onProgress);
            };

            StfsPackage.prototype.ExtractFile = function (entry, onProgress) {
                if (typeof onProgress === "undefined") { onProgress = null; }
                if (entry.nameLen[0] == 0)
                    throw "STFS: File '" + entry.name + "' doesn't exist in the package.";

                var fileSize = entry.fileSize;

                var fileIO = new XboxInternals.IO.FileIO(new ArrayBuffer(fileSize));
                fileIO.SetFileName(entry.name);

                if (fileSize == 0) {
                    if (onProgress != null)
                        onProgress(100);
                    return fileIO;
                }

                if ((entry.flags[0] & 1) == 1) {
                    var buffer = new ArrayBuffer(fileSize);

                    var startAddress = this.BlockToAddress(entry.startingBlockNum);
                    this.io.SetPosition(startAddress);

                    var blockCount = (this.ComputeLevel0BackingHashBlockNumber(entry.startingBlockNum) + this.blockStep[0]) - ((startAddress - this.firstHashTableAddress) >> 0xC);

                    if (entry.blocksForFile <= blockCount) {
                        fileIO.WriteBytes(this.io.ReadBytes(entry.fileSize));

                        if (onProgress != null)
                            onProgress(100);

                        return fileIO;
                    } else {
                        fileIO.WriteBytes(this.io.ReadBytes(blockCount << 0xC));

                        if (onProgress != null)
                            onProgress(Math.round((100 / entry.blocksForFile) * blockCount));
                    }

                    var tempSize = (entry.fileSize - (blockCount << 0xC));
                    while (tempSize >= 0xAA000) {
                        var currentPos = this.io.GetPosition();
                        this.io.SetPosition(currentPos + this.GetHashTableSkipSize(currentPos));

                        fileIO.WriteBytes(this.io.ReadBytes(0xAA000));

                        tempSize -= 0xAA000;
                        blockCount += 0xAA;

                        if (onProgress != null)
                            onProgress(Math.round((100 / entry.blocksForFile) * blockCount));
                    }

                    if (tempSize != 0) {
                        var currentPos = this.io.GetPosition();
                        this.io.SetPosition(currentPos + this.GetHashTableSkipSize(currentPos));

                        fileIO.WriteBytes(this.io.ReadBytes(tempSize));

                        if (onProgress != null)
                            onProgress(100);
                    }

                    return fileIO;
                } else {
                    var fullReadCounts = Math.floor(fileSize / 0x1000);
                    fileSize -= (fullReadCounts * 0x1000);

                    var block = entry.startingBlockNum;

                    for (var i = 0; i < fullReadCounts; i++) {
                        fileIO.WriteBytes(this.ExtractBlock(block));

                        block = this.GetBlockHashEntry(block).nextBlock;

                        if (onProgress != null)
                            onProgress(Math.round((100 / entry.blocksForFile) * (i + 1)));
                    }

                    if (fileSize != 0) {
                        fileIO.WriteBytes(this.ExtractBlock(block, fileSize));

                        if (onProgress != null)
                            onProgress(100);
                    }

                    return fileIO;
                }
            };

            StfsPackage.prototype.GetHashTableSkipSize = function (tableAddress) {
                var trueBlockNumber = (tableAddress - this.firstHashTableAddress) >> 0xC;

                if (trueBlockNumber == 0)
                    return (0x1000 << this.packageSex);

                if (trueBlockNumber == this.blockStep[1])
                    return (0x3000 << this.packageSex); else if (trueBlockNumber > this.blockStep[1])
                    trueBlockNumber -= (this.blockStep[1] + (1 << this.packageSex));

                if (trueBlockNumber == this.blockStep[0] || trueBlockNumber % this.blockStep[1] == 0)
                    return (0x2000 << this.packageSex);

                return (0x1000 << this.packageSex);
            };

            StfsPackage.prototype.FileExists = function (pathInPackage) {
                var entry = this.GetFileEntry(pathInPackage.split('\\'), this.fileListing);
                return (entry.nameLen[0] != 0);
            };

            StfsPackage.prototype.InjectFile = function (input, pathInPackage, onProgress) {
                if (typeof onProgress === "undefined") { onProgress = null; }
                if (this.FileExists(pathInPackage))
                    throw "STFS: File already exists in the package.";

                var split = pathInPackage.split("\\");
                var folder;

                var size = split.length;
                var fileName;
                if (size > 1) {
                    fileName = split[size - 1];
                    split = split.splice(size - 1, 1);

                    folder = this.FindDirectoryListing(split, this.fileListing);
                    if (folder == null)
                        throw "STFS: The given folder could not be found.";
                } else {
                    fileName = pathInPackage;
                    folder = this.fileListing;
                }

                var fileSize = input.buffer.byteLength;

                var entry = new StfsFileEntry();
                entry.name = fileName;

                if (fileName.length > 0x28)
                    throw "STFS: file entry name length cannot be greater than 40(0x28) characters.";

                entry.fileSize = fileSize;
                entry.flags = new Uint8Array([Stfs.FileEntryFlags.ConsecutiveBlocks]);
                entry.pathIndicator = folder.folder.entryIndex;
                entry.startingBlockNum = StfsPackage.INT24_MAX;
                entry.blocksForFile = ((fileSize + 0xFFF) & 0xFFFFFFF000) >> 0xC;
                entry.createdTimeStamp = Date.now();
                entry.accessTimeStamp = entry.createdTimeStamp;

                var block = 0;
                var prevBlock = StfsPackage.INT24_MAX;
                var counter = 0;
                while (fileSize >= 0x1000) {
                    block = this.AllocateBlock();

                    if (entry.startingBlockNum == StfsPackage.INT24_MAX)
                        entry.startingBlockNum = block;

                    if (prevBlock != StfsPackage.INT24_MAX)
                        this.SetNextBlock(prevBlock, block);

                    prevBlock = block;

                    this.io.SetPosition(this.BlockToAddress(block));
                    this.io.WriteBytes(input.ReadBytes(0x1000));

                    fileSize -= 0x1000;

                    if (onProgress)
                        onProgress(Math.round((100 / entry.blocksForFile) * ++counter));
                }

                if (fileSize != 0) {
                    block = this.AllocateBlock();

                    if (entry.startingBlockNum == StfsPackage.INT24_MAX)
                        entry.startingBlockNum = block;

                    if (prevBlock != StfsPackage.INT24_MAX)
                        this.SetNextBlock(prevBlock, block);

                    this.io.SetPosition(this.BlockToAddress(block));
                    this.io.WriteBytes(input.ReadBytes(fileSize));

                    fileSize = 0;

                    if (onProgress)
                        onProgress(100);
                }

                this.SetNextBlock(block, StfsPackage.INT24_MAX);

                folder.fileEntries.push(entry);
                this.WriteFileListing();

                if (this.topLevel == Stfs.Level.Zero) {
                    this.io.SetPosition(this.topTable.addressInFile);

                    this.topTable.entryCount = this.metaData.stfsVolumeDescriptor.allocatedBlockCount;

                    for (var i = 0; i < this.topTable.entryCount; i++) {
                        this.topTable.entries[i].blockHash = this.io.ReadBytes(0x14);
                        this.topTable.entries[i].status = this.io.ReadByte();
                        this.topTable.entries[i].nextBlock = this.io.ReadInt24();
                    }
                }

                return entry;
            };

            StfsPackage.prototype.WriteFileListing = function (usePassed, outFis, outFos) {
                var outFiles;
                var outFolders;

                if (!usePassed) {
                    var temp = this.GenerateRawFileListing(this.fileListing, [], []);
                    outFiles = temp.outFiles;
                    outFolders = temp.outFolders;
                }

                outFolders = outFolders.splice(1);

                var folders = {};
                folders[0xFFFF] = 0xFFFF;

                var alwaysAllocate = false;
                var firstCheck = true;

                var block = this.metaData.stfsVolumeDescriptor.fileTableBlockNum;
                this.io.SetPosition(this.BlockToAddress(block));

                var outFileSize = outFolders.length;

                for (var i = 0; i < outFileSize; i++)
                    folders[outFolders[i].entryIndex] = i;

                for (var i = 0; i < outFolders.length; i++) {
                    if (firstCheck)
                        firstCheck = false; else if ((i + 1) % 0x40 == 0) {
                        var nextBlock;
                        if (alwaysAllocate) {
                            nextBlock = this.AllocateBlock();

                            this.SetNextBlock(block, nextBlock);
                        } else {
                            nextBlock = this.GetBlockHashEntry(block).nextBlock;

                            if (nextBlock == StfsPackage.INT24_MAX) {
                                nextBlock = this.AllocateBlock();
                                this.SetNextBlock(block, nextBlock);
                                alwaysAllocate = true;
                            }
                        }

                        block = nextBlock;
                        this.io.SetPosition(this.BlockToAddress(block));
                    }

                    outFolders[i].pathIndicator = folders[outFolders[i].pathIndicator];

                    this.WriteFileEntry(outFolders[i]);
                }

                var outFoldersAndFilesSize = outFileSize + outFiles.length;
                for (var i = outFileSize; i < outFoldersAndFilesSize; i++) {
                    if (firstCheck)
                        firstCheck = false; else if ((i + 1) % 0x40 == 0) {
                        var nextBlock;
                        if (alwaysAllocate) {
                            nextBlock = this.AllocateBlock();

                            this.SetNextBlock(block, nextBlock);
                        } else {
                            nextBlock = this.GetBlockHashEntry(block).nextBlock;

                            if (nextBlock == StfsPackage.INT24_MAX) {
                                nextBlock = this.AllocateBlock();
                                this.SetNextBlock(block, nextBlock);
                                alwaysAllocate = true;
                            }
                        }

                        block = nextBlock;
                        this.io.SetPosition(this.BlockToAddress(block));
                    }

                    outFiles[i - outFileSize].pathIndicator = folders[outFiles[i - outFileSize].pathIndicator];
                    this.WriteFileEntry(outFiles[i - outFileSize]);
                }

                var remainingEntries = (outFoldersAndFilesSize % 0x40);
                var remainer = 0;
                if (remainingEntries > 0)
                    remainer = (0x40 - remainingEntries) * 0x40;
                var nullBytes = new Uint8Array(remainer);
                this.io.WriteBytes(nullBytes);

                this.metaData.stfsVolumeDescriptor.fileTableBlockCount = Math.floor(outFoldersAndFilesSize / 0x40) + 1;
                if (outFoldersAndFilesSize % 0x40 == 0 && outFoldersAndFilesSize != 0)
                    this.metaData.stfsVolumeDescriptor.fileTableBlockCount--;
                this.metaData.WriteVolumeDescriptor();

                this.ReadFileListing();
            };

            StfsPackage.prototype.GenerateRawFileListing = function (fl, outFiles, outFolders) {
                var fiEntries = fl.fileEntries.length;
                var foEntries = fl.folderEntries.length;
                for (var i = 0; i < fiEntries; i++) {
                    outFiles.push(fl.fileEntries[i]);
                }

                outFolders.push(fl.folder);

                for (var i = 0; i < foEntries; i++) {
                    var temp = this.GenerateRawFileListing(fl.folderEntries[i], outFiles, outFolders);
                    outFiles = temp.outFiles;
                    outFolders = temp.outFolders;
                }

                return {
                    outFiles: outFiles,
                    outFolders: outFolders
                };
            };

            StfsPackage.prototype.SetNextBlock = function (blockNum, nextBlockNum) {
                if (blockNum >= this.metaData.stfsVolumeDescriptor.allocatedBlockCount)
                    throw "STFS: Reference to illegal block number.";

                var hashLoc = this.GetHashAddressOfBlock(blockNum) + 0x15;
                this.io.SetPosition(hashLoc);
                this.io.WriteInt24(nextBlockNum);

                if (this.topLevel == Stfs.Level.Zero)
                    this.topTable.entries[blockNum].nextBlock = nextBlockNum;
            };

            StfsPackage.prototype.AllocateBlock = function () {
                this.cached = new HashTable();
                this.cached.addressInFile = 0;
                this.cached.entryCount = 0;
                this.cached.level = -1;
                this.cached.trueBlockNumber = 0xFFFFFFFF;

                var lengthToWrite = 0x1000;

                this.metaData.stfsVolumeDescriptor.allocatedBlockCount++;

                var recalcTablesPerLevel = [3];
                recalcTablesPerLevel[0] = Math.floor(this.metaData.stfsVolumeDescriptor.allocatedBlockCount / 0xAA) + ((this.metaData.stfsVolumeDescriptor.allocatedBlockCount % 0xAA != 0) ? 1 : 0);
                recalcTablesPerLevel[1] = Math.floor(recalcTablesPerLevel[0] / 0xAA) + ((recalcTablesPerLevel[0] % 0xAA != 0 && this.metaData.stfsVolumeDescriptor.allocatedBlockCount > 0xAA) ? 1 : 0);
                recalcTablesPerLevel[2] = Math.floor(recalcTablesPerLevel[1] / 0xAA) + ((recalcTablesPerLevel[1] % 0xAA != 0 && this.metaData.stfsVolumeDescriptor.allocatedBlockCount > 0x70E4) ? 1 : 0);

                for (var i = 2; i >= 0; i--) {
                    if (recalcTablesPerLevel[i] != this.tablesPerLevel[i]) {
                        lengthToWrite += (this.packageSex + 1) * 0x1000;
                        this.tablesPerLevel[i] = recalcTablesPerLevel[i];

                        if ((i + 1) == this.topLevel) {
                            this.topTable.entryCount++;
                            this.topTable.entries.push(new HashEntry());
                            this.topTable.entries[this.topTable.entryCount - 1].status[0] = 0;
                            this.topTable.entries[this.topTable.entryCount - 1].nextBlock = 0;

                            this.io.SetPosition(this.topTable.addressInFile + ((this.tablesPerLevel[i] - 1) * 0x18) + 0x15);
                            this.io.WriteInt24(StfsPackage.INT24_MAX);
                        }
                    }
                }

                var tempBuffer = this.ArrayBufferExtend(this.io.buffer, lengthToWrite);
                this.io.SetBuffer(tempBuffer);
                this.io.SetPosition(this.io.buffer.byteLength - 1);

                var newTop = this.CalculateTopLevel();
                if (this.topLevel != newTop) {
                    this.topLevel = newTop;
                    this.topTable.level = this.topLevel;

                    var blockOffset = this.metaData.stfsVolumeDescriptor.blockSeperation[0] & 2;
                    this.metaData.stfsVolumeDescriptor.blockSeperation[0] &= 0xFD;
                    this.topTable.addressInFile = this.GetHashTableAddress(0, this.topLevel);
                    this.topTable.entryCount = 2;
                    this.topTable.trueBlockNumber = this.ComputeLevelNBackingHashBlockNumber(0, this.topLevel);

                    this.topTable.entries = [];

                    this.topTable.entries[0].status[0] = blockOffset << 5;
                    this.io.SetPosition(this.topTable.addressInFile + 0x14);
                    this.io.WriteByte(this.topTable.entries[0].status);

                    this.metaData.stfsVolumeDescriptor.blockSeperation[0] &= 0xFD;
                }

                this.io.SetPosition(this.GetHashAddressOfBlock(this.metaData.stfsVolumeDescriptor.allocatedBlockCount - 1) + 0x14);
                this.io.WriteByte(new Uint8Array([0x80]));

                if (this.topLevel == Stfs.Level.Zero) {
                    this.topTable.entryCount++;
                    this.topTable.entries.push(new HashEntry());
                    this.topTable.entries[this.metaData.stfsVolumeDescriptor.allocatedBlockCount - 1].status[0] = Stfs.BlockStatusLevelZero.Allocated;
                    this.topTable.entries[this.metaData.stfsVolumeDescriptor.allocatedBlockCount - 1].nextBlock = StfsPackage.INT24_MAX;
                }

                this.io.WriteInt24(StfsPackage.INT24_MAX);

                this.metaData.WriteVolumeDescriptor();

                return this.metaData.stfsVolumeDescriptor.allocatedBlockCount - 1;
            };

            StfsPackage.prototype.GetHashTableAddress = function (index, lvl) {
                var baseAddress = this.GetBaseHashTableAddress(index, lvl);

                if (this.packageSex == Stfs.Sex.StfsFemale)
                    return baseAddress; else if (lvl = this.topTable.level)
                    return baseAddress + ((this.metaData.stfsVolumeDescriptor.blockSeperation[0] & 2) << 0xB); else {
                    this.io.SetPosition(this.GetTableHashAddress(index, lvl));
                }
            };

            StfsPackage.prototype.GetBaseHashTableAddress = function (index, lvl) {
                return ((this.ComputeLevelNBackingHashBlockNumber(index * Stfs.dataBlocksPerHashTreeLevel[lvl], lvl) << 0xC) + this.firstHashTableAddress);
            };

            StfsPackage.prototype.GetTableHashAddress = function (index, lvl) {
                if (lvl >= this.topTable.level || lvl < Stfs.Level.Zero)
                    throw "STFS: Level is invalid. No parent hash address accessible.";

                var baseHashAddress = this.GetBaseHashTableAddress(Math.floor(index / 0xAA), (lvl + 1));

                if (lvl + 1 == this.topLevel)
                    baseHashAddress += ((this.metaData.stfsVolumeDescriptor.blockSeperation[0] & 2) << 0xB); else
                    baseHashAddress += ((this.topTable.entries[index].status[0] & 0x40) << 6);

                return baseHashAddress + (index * 0x18);
            };

            StfsPackage.prototype.FindDirectoryListing = function (locationOfDirectory, start) {
                if (locationOfDirectory.length == 0)
                    return start;

                var finalLoop = (locationOfDirectory.length == 1);
                for (var i = 0; i < start.folderEntries.length; i++) {
                    if (start.folderEntries[i].folder.name == locationOfDirectory[0]) {
                        locationOfDirectory = locationOfDirectory.slice(0, 1);
                        if (finalLoop)
                            return start.folderEntries[i]; else
                            for (var i = 0; i < start.folderEntries.length; i++)
                                return this.FindDirectoryListing(locationOfDirectory, start.folderEntries[i]);
                    }
                }
            };

            StfsPackage.prototype.ReplaceFileFromPath = function (input, pathInPackage, onProgress) {
                if (typeof onProgress === "undefined") { onProgress = null; }
                var entry = this.GetFileEntryFromPath(pathInPackage);
                this.ReplaceFile(input, entry, pathInPackage, onProgress);
            };

            StfsPackage.prototype.ReplaceFile = function (fileIn, entry, pathInPackage, onProgress) {
                if (typeof onProgress === "undefined") { onProgress = null; }
                if (entry.nameLen[0] == 0)
                    throw "STFS: File doesn't exists in the package.";

                var fileSize = fileIn.buffer.byteLength;

                entry.fileSize = fileSize;
                entry.blocksForFile = ((fileSize + 0xFFF) & 0xFFFFFFF000) >> 0xC;

                var block = entry.startingBlockNum;
                this.io.SetPosition(this.BlockToAddress(block));

                var fullReads = Math.floor(fileSize / 0x1000);
                var first = true;
                var alwaysAllocate = false;

                for (var i = 0; i < fullReads; i++) {
                    if (!first) {
                        var nextBlock;
                        if (alwaysAllocate) {
                            nextBlock = this.AllocateBlock();

                            this.SetNextBlock(block, nextBlock);
                        } else {
                            nextBlock = this.GetBlockHashEntry(block).nextBlock;

                            if (nextBlock == StfsPackage.INT24_MAX) {
                                nextBlock = this.AllocateBlock();
                                this.SetNextBlock(block, nextBlock);
                                alwaysAllocate = true;
                            }
                        }

                        block = nextBlock;
                        this.io.SetPosition(this.BlockToAddress(block));
                    } else
                        first = false;

                    this.io.WriteBytes(fileIn.ReadBytes(0x1000));

                    if (onProgress != null)
                        onProgress(Math.floor(101 / fullReads) * i);
                }

                var remainder = fileSize % 0x1000;
                if (remainder != 0) {
                    var nextBlock;
                    if (!first) {
                        if (alwaysAllocate) {
                            nextBlock = this.AllocateBlock();

                            this.SetNextBlock(block, nextBlock);
                        } else {
                            nextBlock = this.GetBlockHashEntry(block).nextBlock;

                            if (nextBlock == StfsPackage.INT24_MAX) {
                                nextBlock = this.AllocateBlock();
                                this.SetNextBlock(block, nextBlock);
                                alwaysAllocate = true;
                            }
                        }

                        block = nextBlock;
                    }

                    this.io.SetPosition(this.BlockToAddress(block));

                    this.io.WriteBytes(fileIn.ReadBytes(remainder));
                }

                this.SetNextBlock(block, StfsPackage.INT24_MAX);

                entry.flags[0] &= 0x2;

                this.io.SetPosition(entry.fileEntryAddress + 0x28);
                this.io.WriteByte(new Uint8Array([entry.nameLen[0] | (entry.flags[0] << 6)]));
                this.io.WriteInt24(entry.blocksForFile, XboxInternals.IO.EndianType.LittleEndian);
                this.io.WriteInt24(entry.blocksForFile, XboxInternals.IO.EndianType.LittleEndian);

                this.io.SetPosition(entry.fileEntryAddress + 0x34);
                this.io.WriteDword(entry.fileSize);
                this.UpdateEntry(pathInPackage, entry);

                if (this.topLevel = Stfs.Level.Zero) {
                    this.io.SetPosition(this.topTable.addressInFile);

                    for (var i = 0; i < this.topTable.entryCount; i++) {
                        this.topTable.entries[i].blockHash = this.io.ReadBytes(0x14);
                        this.topTable.entries[i].status = this.io.ReadByte();
                        this.topTable.entries[i].nextBlock = this.io.ReadInt24();
                    }
                }

                if (onProgress)
                    onProgress(100);
            };

            StfsPackage.prototype.UpdateEntry = function (pathInPackage, entry) {
                this.GetFileEntry(pathInPackage.split("\\"), this.fileListing, entry, true);
            };

            StfsPackage.prototype.RenameFile = function (newName, pathInPackage) {
                var entry = this.io.Clone(this.GetFileEntryFromPath(pathInPackage, true));
                entry.name = newName;

                entry = this.GetFileEntryFromPath(pathInPackage, true, entry);

                this.io.SetPosition(entry.fileEntryAddress);
                this.WriteFileEntry(entry);
            };

            StfsPackage.prototype.ArrayBufferExtend = function (buf, length) {
                var tmp = new Uint8Array(buf.byteLength + length);
                tmp.set(new Uint8Array(buf), 0);
                return tmp.buffer;
            };

            StfsPackage.prototype.ArrayBufferConcat = function (buf1, buf2) {
                var tmp = new Uint8Array(buf1.byteLength + buf2.byteLength);
                tmp.set(new Uint8Array(buf1), 0);
                tmp.set(new Uint8Array(buf2), buf2.byteLength);
                return tmp.buffer;
            };
            StfsPackage.INT24_MAX = 8388607;
            return StfsPackage;
        })();
        Stfs.StfsPackage = StfsPackage;

        var StfsFileEntry = (function () {
            function StfsFileEntry() {
            }
            return StfsFileEntry;
        })();
        Stfs.StfsFileEntry = StfsFileEntry;

        var StfsFileListing = (function () {
            function StfsFileListing() {
                this.fileEntries = [];
                this.folderEntries = [];
                this.folder = new StfsFileEntry();
            }
            return StfsFileListing;
        })();
        Stfs.StfsFileListing = StfsFileListing;

        var HashEntry = (function () {
            function HashEntry() {
                this.blockHash = new Uint8Array(0x14);
                this.status = new Uint8Array(0x1);
            }
            return HashEntry;
        })();
        Stfs.HashEntry = HashEntry;

        var HashTable = (function () {
            function HashTable() {
            }
            return HashTable;
        })();
        Stfs.HashTable = HashTable;

        (function (StfsPackageFlags) {
            StfsPackageFlags[StfsPackageFlags["StfsPackagePEC"] = 1] = "StfsPackagePEC";
            StfsPackageFlags[StfsPackageFlags["StfsPackageCreate"] = 2] = "StfsPackageCreate";

            StfsPackageFlags[StfsPackageFlags["StfsPackageFemale"] = 4] = "StfsPackageFemale";
        })(Stfs.StfsPackageFlags || (Stfs.StfsPackageFlags = {}));
        var StfsPackageFlags = Stfs.StfsPackageFlags;
    })(XboxInternals.Stfs || (XboxInternals.Stfs = {}));
    var Stfs = XboxInternals.Stfs;
})(XboxInternals || (XboxInternals = {}));
