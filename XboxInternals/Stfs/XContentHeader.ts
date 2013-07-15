/// <reference path='../IO/BaseIO.ts' />
/// <reference path='StfsConstants.ts' />
/// <reference path='StfsDefinitions.ts' />
/// <reference path='../AvatarAssets/AvatarAssetDefinitions.ts' />
/// <reference path='../Cryptography/rsa.d.ts' />
/// <reference path='../Cryptography/sha1.ts' />

module XboxInternals.Stfs {
	
	export enum XContentFlags {
		 MetadataIsPEC = 1,
		MetadataSkipRead = 2,
		MetadataDontFreeThumbnails = 4
	}

	export enum OnlineContentResumeState {
		FileHeadersNotReady = 0x46494C48,
		NewFolder = 0x666F6C64,
		NewFolderResum_Attempt1 = 0x666F6C31,
		NewFolderResumeAttempt2 = 0x666F6C32,
		NewFolderResumeAttemptUnknown = 0x666F6C3F,
		NewFolderResumeAttemptSpecific = 0x666F6C40
	}

	export enum FileSystem {
		FileSystemSTFS = 0,
		FileSystemSVOD = 1,
		FileSystemFATX = 2
	}

	export class XContentHeader extends StfsDefinitions {

		constructor(io: IO.BaseIO, flags: number = 0) {
			this.io = io;
			this.readMetadata();
			super();
		}

		private readMetadata() {
			this.io.SetPosition(0x0);

			if ((this.flags & XContentFlags.MetadataIsPEC) == 0) {
				
				this.magic = <Magic>this.io.ReadDword();
				if (this.magic == Magic.CON)
					this.certificate = this.ReadCertificateEx(this.io, 4);
				else if (this.magic == Magic.LIVE || this.magic == Magic.PIRS)
					this.packageSignature = this.io.ReadBytes(0x100);
				else {
					throw "XContentHeader: Content signature of type 0x" + <number>this.magic + " is invalid";
				}

				this.io.SetPosition(0x22C);

				// Read licensing data
				this.licenseData = new Array<LicenseEntry>(0x10);
				for (var i = 0; i < 0x10; i++)
				{
					this.io.SetPosition(this.io.GetPosition() + 8); // JavaScript has no INT64, Skip 8 bytes.
					this.licenseData[i] = {
						type: 0,
						data: 0,
						bits: this.io.ReadDword(),
						flags: this.io.ReadDword()
					}

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

				// header hash / content id
				this.headerHash = this.io.ReadBytes(0x14);

				this.headerSize = this.io.ReadDword();

				this.contentType = <ContentType>this.io.ReadDword();

				// read metadata information
				this.metaDataVersion = this.io.ReadDword();
				this.contentSize = 0;
				this.io.SetPosition(this.io.GetPosition() + 8); // JavaScript has no INT64, Skip 8 bytes.
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
				this.fileSystem = <FileSystem>this.io.ReadDword();
				if (this.fileSystem > 1)
					throw "XContentHeader: Invalid file system. Only STFS and SVOD are supported.";

				if (this.fileSystem == FileSystem.FileSystemSTFS)
					this.stfsVolumeDescriptor = this.ReadStfsVolumeDescriptorEx(this.io, 0x379);
				else if (this.fileSystem = FileSystem.FileSystemSVOD)
					this.svodVolumeDescriptor = this.ReadSvodVolumeDescriptorEx(this.io);

				this.dataFileCount = this.io.ReadDword();
				this.dataFileCombinedSize = 0;
				this.io.SetPosition(this.io.GetPosition() + 8); // JavaScript has no INT64, Skip 8 bytes.

				if (this.contentType == ContentType.AvatarItem) {
					this.io.SetPosition(0x3D9);
					this.io.SwapEndian();

					this.subCategory = <AvatarAsset.AssetSubcategory>this.io.ReadDword();
					this.colorizable = this.io.ReadDword();

					this.io.SwapEndian();

					this.guid = this.io.ReadBytes(0x10);
					this.skeletonVersion = <AvatarAsset.SkeletonVersion>this.io.ReadByte()[0];

					if (this.skeletonVersion < 1 || this.skeletonVersion > 3)
						throw "XContentHeader: Invalid skeleton version.";
				} else if (this.contentType == ContentType.Video) {
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

				this.thumbnailImage = this.io.ReadBytes(this.thumbnailImageSize);
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
		}

		public WriteVolumeDescriptor() {
			if (this.fileSystem == FileSystem.FileSystemSTFS)
				this.WriteStfsVolumeDescriptorEx(this.stfsVolumeDescriptor, this.io, (this.flags & XContentFlags.MetadataIsPEC) ? 0x244 : 0x379);
			// TODO: Write SVOD Volume Descriptor
		}

		public WriteMetaData() {
			return; // Not Yet fully functional.
			// seek to the begining of the file
			this.io.SetPosition(0);

			if ((this.flags & XContentFlags.MetadataIsPEC) == 0)
			{

				this.io.WriteDword(this.magic);

				if (this.magic == Magic.CON)
					this.WriteCertificate();
				else
				{
					throw "XContentHeader: Content signature type 0x" + this.magic + " is invalid.";
				}

				// Write the licensing data
				this.io.SetPosition(0x22C);
				for (var i = 0; i < 0x10; i++)
				{
					//this.io.Write(((UINT64) licenseData[i].type << 48) | (UINT64) licenseData[i].data);
					this.io.SetPosition(this.io.GetPosition() + 8);
					this.io.WriteDword(this.licenseData[i].bits);
					this.io.WriteByte(new Uint8Array([this.licenseData[i].flags]));
				}

				this.io.WriteBytes(this.headerHash);
				this.io.WriteDword(this.headerSize);
				this.io.WriteDword(this.contentType);
				this.io.WriteDword(this.metaDataVersion);
				//this.io.Write((UINT64) contentSize); DO THIS
				this.io.SetPosition(this.io.GetPosition() + 8);
				this.io.WriteDword(this.mediaID);
				this.io.WriteDword(this.version);
				this.io.WriteDword(this.baseVersion);
				this.io.WriteDword(this.titleID);
				this.io.WriteByte(this.platform);
				this.io.WriteByte(this.executableType);
				this.io.WriteByte(this.discNumber);
				this.io.WriteByte(this.discInSet);
				this.io.WriteDword(this.savegameID);
				this.io.WriteBytes(this.consoleID);
				this.io.WriteBytes(this.profileID);

				this.WriteVolumeDescriptor();

				this.io.WriteDword(this.dataFileCount);
				//this.io.Write(this.dataFileCombinedSize); INT64 - DO THIS!!

				// Write the avatar asset metadata if needed
				if (this.contentType == ContentType.AvatarItem)
				{
					this.io.SetPosition(0x3D9);
					this.io.SwapEndian();

					this.io.WriteDword(this.subCategory);
					this.io.WriteDword(this.colorizable);
					
					this.io.SwapEndian();

					this.io.WriteBytes(this.guid);
					this.io.WriteByte(new Uint8Array([this.skeletonVersion]));
				}
				else if (this.contentType == ContentType.Video)
				{
					this.io.SetPosition(0x3D9);

					this.io.WriteBytes(this.seriesID);
					this.seasonID = this.io.ReadBytes(0x10);

					this.io.WriteWord(this.seasonNumber);
					this.io.WriteWord(this.episodeNumber);
				}

				// skip padding
				this.io.SetPosition(0x3FD);

				this.io.WriteBytes(this.deviceID);
				this.io.WriteString(this.displayName);

				this.io.SetPosition(0xD11);
				this.io.WriteString(this.displayDescription);

				this.io.SetPosition(0x1611);
				this.io.WriteString(this.publisherName);

				this.io.SetPosition(0x1691);
				this.io.WriteString(this.titleName);

				this.io.SetPosition(0x1711);
				this.io.WriteByte(this.transferFlag);

				this.io.WriteDword(this.thumbnailImageSize);
				this.io.WriteDword(this.titleThumbnailImageSize);
				
				this.io.WriteBytes(this.thumbnailImage);
				this.io.SetPosition(0x571A);
				this.io.WriteBytes(this.titleThumbnailImage);

				if (((this.headerSize + 0xFFF) & 0xFFFFF000) - 0x971A < 0x15F4)
					return;
			}
			else
			{
				this.consoleID = this.certificate.ownerConsoleID;
				this.WriteCertificateEx(this.certificate, this.io, 0);
				this.io.SetPosition(0x32C);
				this.io.WriteBytes(this.headerHash);

				this.WriteStfsVolumeDescriptorEx(this.stfsVolumeDescriptor, this.io, 0x244);

				// *skip missing int*
				this.io.SetPosition(0x26C);
				this.io.WriteBytes(this.profileID);
				this.io.WriteByte(new Uint8Array([(this.enabled ? 1 : 0)]));
				this.io.WriteBytes(this.consoleID);
			}
		}

		public ResignHeader() {
			var headerStart: number, size: number, hashLoc: number, toSignLoc: number, consoleIDLoc: number;

			// set the headerStart
			if (this.flags & XContentFlags.MetadataIsPEC)
			{
				headerStart = 0x23C;
				hashLoc = 0x228;
				size = 0xDC4;
				toSignLoc = 0x23C;
				consoleIDLoc = 0x275;
			}
			else
			{
				headerStart = 0x344;
				hashLoc = 0x32C;
				size = 0x118;
				toSignLoc = 0x22C;
				consoleIDLoc = 0x36C;
			}

			// calculate header size / first hash table address
			var calculated = ((this.headerSize + 0xFFF) & 0xFFFFF000);
			calculated = (this.io.buffer.byteLength < calculated) ? this.io.buffer.byteLength : calculated;
			var realHeaderSize = calculated - headerStart;

			// Write the console id
			this.io.SetPosition(consoleIDLoc);
			this.io.WriteBytes(this.certificate.ownerConsoleID);

			// read the data to hash
			this.io.SetPosition(headerStart);
			var buffer = this.io.ReadBytes(realHeaderSize);

			// hash the header
			this.headerHash = sha1.hash(buffer);

			this.io.SetPosition(hashLoc);
			this.io.WriteBytes(this.headerHash);

			this.io.SetPosition(toSignLoc);

			var sha1DataToSign = sha1.hash(this.io.ReadBytes(size));
			var rsa = new RSAKey();
			rsa.setPrivateEx("a31d6ce5fa95fde89021fad10c64192b86589b172b1005b8d1f84cef534cd54e5cae86ef927b90d1e062fd7c54559ee0e7befa3f9e156f6c384eaf070c61ab515e2353141888cb6fcbc5d630f406ed2423ef256d009177249be5a3c02790c297f7749d6f17837eb537de51e8d71ce156d956c8c3c3209d64c32f8c9192306fdb", "00010001", "51ec1f9d5626c2fc10a66764cb3a6d4da1e74ea842f0f4fdfa66efc78e102fe41ca31dd0ce392ec3192dd0587479ac08e790c1ac2dc6eb47e83dcf4c6dff5165d46ebd0f15793795c4af909e2b508a0a224ab341e5898073cdfa2102f5dd30dd072a6f340781977eb2fb72e9eac18839ac482ba84dfcd7ed9bf9dec245934c4c", "cce75dfe72b6fde71de31a0eac337ab921e88a849bda9f1e5834687ab11d7e1c1852657b978ea76a9dee5a77523b718f33d0495ec330397236bf1dd9f224e871", "cbca5874d403629306501f42f6aa5936a7a1f3975c9ac86a27cf85052a66416a7f2f84c81813c61d8dc7322f72193fa4ed71e761c0cf61ae8ba068a77d83230b", "4cca74e67435724858621114e8a24e5eed7f49d252da8701874af4d0ee69c026655313e752b04abbe13e3fb7322146f8c5114d3def66b650c085b579458f6171", "afdc46e7528a3547a11c054e392499e64354cbabe3db22761132d09cbb911084818b152fc32f5538edbf673c705eff8028f3b173b6fa7f562be1da4e274ec22f", "286abbd19395941a6eedd70ec0612bc2efe1863d3412886f94a4486ec9871e46004600528e9f47c08cabbc49ac5b13f2ec278d1b6e5106a6f1621aeb782e8848");
			this.certificate.signature = XContentHeader.Uint8ArrayFromHex(rsa.signHashWithSHA1(this.Uint8ArrayToHexString(sha1DataToSign)));
			
			this.certificate.publicKeyCertificateSize = 0x1A8;
			this.certificate.ownerConsoleID = new Uint8Array([0x09, 0x12, 0xBA, 0x26, 0xE3]);
			this.certificate.ownerConsolePartNumber = "X803395-001";
			this.certificate.ownerConsoleType = Stfs.ConsoleType.Retail;
			this.certificate.dataGeneration = "09-18-06";
			this.certificate.publicExponent = 0x00010001;
			this.certificate.publicModulus = new Uint8Array([0xC3, 0x2F, 0x8C, 0x91, 0x92, 0x30, 0x6F, 0xDB, 0xD9, 0x56, 0xC8, 0xC3, 0xC3, 0x20, 0x9D, 0x64, 0x37, 0xDE, 0x51, 0xE8, 0xD7, 0x1C, 0xE1, 0x56, 0xF7, 0x74, 0x9D, 0x6F, 0x17, 0x83, 0x7E, 0xB5, 0x9B, 0xE5, 0xA3, 0xC0, 0x27, 0x90, 0xC2, 0x97, 0x23, 0xEF, 0x25, 0x6D, 0x00, 0x91, 0x77, 0x24, 0xCB, 0xC5, 0xD6, 0x30, 0xF4, 0x06, 0xED, 0x24, 0x5E, 0x23, 0x53, 0x14, 0x18, 0x88, 0xCB, 0x6F, 0x38, 0x4E, 0xAF, 0x07, 0x0C, 0x61, 0xAB, 0x51, 0xE7, 0xBE, 0xFA, 0x3F, 0x9E, 0x15, 0x6F, 0x6C, 0xE0, 0x62, 0xFD, 0x7C, 0x54, 0x55, 0x9E, 0xE0, 0x5C, 0xAE, 0x86, 0xEF, 0x92, 0x7B, 0x90, 0xD1, 0xD1, 0xF8, 0x4C, 0xEF, 0x53, 0x4C, 0xD5, 0x4E, 0x86, 0x58, 0x9B, 0x17, 0x2B, 0x10, 0x05, 0xB8, 0x90, 0x21, 0xFA, 0xD1, 0x0C, 0x64, 0x19, 0x2B, 0xA3, 0x1D, 0x6C, 0xE5, 0xFA, 0x95, 0xFD, 0xE8]);
			this.certificate.certificateSignature = new Uint8Array([0xF9, 0x70, 0x0D, 0x2A, 0x89, 0x39, 0x9E, 0xD5, 0x4E, 0x65, 0x87, 0x44, 0xF9, 0x4F, 0x20, 0x90, 0x89, 0x41, 0x37, 0x50, 0x2E, 0xF8, 0x30, 0x08, 0xCC, 0x6E, 0xCD, 0xD1, 0x57, 0xE7, 0xC3, 0xB7, 0x96, 0xB0, 0x2A, 0x80, 0x59, 0xCB, 0x7E, 0x43, 0xFB, 0xDB, 0x7E, 0x0C, 0xEF, 0x6C, 0x5E, 0x00, 0x0B, 0x1E, 0x87, 0xE1, 0x02, 0x64, 0xA7, 0x08, 0x24, 0x32, 0xB9, 0x53, 0x15, 0x00, 0xE9, 0xE3, 0x53, 0x0C, 0x15, 0xE1, 0x5D, 0x59, 0xC6, 0x09, 0xAB, 0xD1, 0x73, 0xB5, 0xEE, 0xC5, 0xE7, 0x50, 0xBC, 0xC2, 0xB2, 0x25, 0x98, 0xBA, 0xA0, 0x0A, 0x84, 0xF4, 0xF8, 0x2D, 0x1A, 0xD2, 0xC9, 0x7F, 0xDC, 0xCF, 0x5D, 0x02, 0x21, 0x9A, 0x25, 0xE0, 0x69, 0x11, 0x6C, 0xFC, 0x88, 0x06, 0x01, 0x49, 0xF4, 0x74, 0x40, 0x8D, 0xD8, 0x91, 0xDB, 0x83, 0xC9, 0x60, 0xCE, 0x0D, 0x7F, 0x97, 0xAA, 0x2A, 0x36, 0xA5, 0xF0, 0x0C, 0x10, 0x63, 0xE9, 0xA9, 0x39, 0x4F, 0xBB, 0x47, 0x6C, 0x44, 0x22, 0xF1, 0xBE, 0x3A, 0x49, 0x01, 0xED, 0x5B, 0x47, 0x00, 0x43, 0x21, 0xBD, 0xFB, 0xB2, 0x95, 0x9A, 0x5F, 0xB4, 0x46, 0xF4, 0xA7, 0x12, 0x24, 0x4B, 0x0B, 0x7F, 0xB8, 0x8E, 0xBB, 0x52, 0x83, 0x22, 0x58, 0x1E, 0x06, 0xB7, 0xAD, 0x7A, 0x3A, 0x16, 0x7E, 0xC8, 0xD7, 0x37, 0x81, 0x9E, 0x8A, 0xF2, 0xC4, 0x66, 0x08, 0x88, 0xFE, 0xA7, 0x0E, 0x8F, 0x9D, 0x87, 0x5F, 0x0E, 0x7B, 0x48, 0x9A, 0x06, 0x62, 0xF7, 0x24, 0x25, 0xCD, 0xB0, 0x4F, 0x73, 0x68, 0x97, 0x0C, 0xE4, 0xAD, 0xE8, 0x55, 0x9A, 0xB4, 0xFA, 0x65, 0xB5, 0xA3, 0x58, 0xFE, 0x81, 0x40, 0x54, 0xAA, 0x1F, 0x00, 0x2A, 0xF1, 0xDD, 0x8A, 0x1F, 0x45, 0x4E, 0x9D, 0xFF, 0x82, 0x46, 0x5A, 0x5A, 0x90, 0x25, 0xA0, 0x58, 0x0F, 0xF2, 0x27]);

			this.WriteCertificate();
		}

		public static Uint8ArrayFromHex(str: string): Uint8Array {
			var array = new Uint8Array(str.length / 2);

			for (var i = 0; i < str.length - 1; i += 2) {
				array[i / 2] = parseInt(str.substr(i, 2), 16);
			}

			return array;
		}

		public static BnQw_SwapDwQwLeBe(data: Uint8Array) {
			if (data.length % 8 != 0)
				throw "STFS: length is not divisible by 8.\n";

			var temp = new Uint8Array(data.length);
			for (var i = 0; i < data.length; i += 8) {
				var begin = (data.length - (i + 8));
				var end = (data.length - i);
				
				for (var x = 7; x >= 0; x--)
					temp.set(data.subarray(begin + x, begin + x + 1), i + (7 - x));
			}
			return temp;
		}

		public WriteCertificate() {
			if (this.magic != Magic.CON && (this.flags & XContentFlags.MetadataIsPEC) == 0)
				throw "XContentHeader: Error writing certificate. Package is strong signed and therefor doesn't have a certificate.";
			this.WriteCertificateEx(this.certificate, this.io, (this.flags & XContentFlags.MetadataIsPEC) ? 0 : 4);
		}

		private Uint8ArrayToHexString(array: Uint8Array): string {
			var hexString: string = "";

			for (var i = 0; i < array.length; i++)
				hexString += ((array[i] > 0xF) ? "" : "0") + array[i].toString(16);

			return hexString.toUpperCase();
		}

		private io: IO.BaseIO;
		private flags: number;


		public magic: Magic;
		public certificate: Certificate;

		public packageSignature: Uint8Array;

		public licenseData: LicenseEntry[];
		public headerHash: Uint8Array;
		public headerSize: number;
		public contentType: ContentType;
		public metaDataVersion: number;
		public contentSize: number; /* UINT64 */
		public mediaID: number;
		public version: number;
		public baseVersion: number;
		public titleID: number;
		public platform: Uint8Array;
		public executableType: Uint8Array;
		public discNumber: Uint8Array;
		public discInSet: Uint8Array;
		public savegameID: number;
		public consoleID: Uint8Array;
		public profileID: Uint8Array;

		public stfsVolumeDescriptor: StfsVolumeDescriptor;
		public svodVolumeDescriptor: SvodVolumeDescriptor;
		public fileSystem: FileSystem;

		public enabled: boolean;

		// metadata v1
		public dataFileCount: number;
		public dataFileCombinedSize: number; /* UINT64 */
		public deviceID: Uint8Array;
		public displayName: string;
		public displayDescription: string;
		public publisherName: string;
		public titleName: string;
		public transferFlag: Uint8Array;
		public thumbnailImageSize: number;
		public titleThumbnailImageSize: number;

		public installerType: InstallerType;

		// Avatar Asset
		public subCategory: AvatarAsset.AssetSubcategory;
		public colorizable: number;
		public guid: Uint8Array;
		public skeletonVersion: AvatarAsset.SkeletonVersion;

		// Media
		public seriesID: Uint8Array;
		public seasonID: Uint8Array;
		public seasonNumber: number;
		public episodeNumber; number;

		// installer progress cache data
		public resumeState: OnlineContentResumeState;
		public currentFileIndex: number;
		public currentFileOffset: number; /* UINT64 */
		public bytesProcessed: number; /* UINT64 */
		public lastModified: any;
		public cabResumeData: Uint8Array;

		// installer update data
		installerBaseVersion: Version;
		installerVersion: Version;

		thumbnailImage: Uint8Array;
		titleThumbnailImage: Uint8Array;
	}
}