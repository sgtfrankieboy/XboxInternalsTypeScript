/// <reference path='../IO/BaseIO.ts' />
/// <reference path='StfsConstants.ts' />
/// <reference path='StfsDefinitions.ts' />
/// <reference path='../AvatarAssets/AvatarAssetDefinitions.ts' />

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
			// seek to the begining of the file
			this.io.SetPosition(0);

			if ((this.flags & XContentFlags.MetadataIsPEC) == 0)
			{

				this.io.WriteDword(this.magic);

				if (this.magic == Magic.CON)
					;//this.WriteCertificate(); DO THIS!!!
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
				//this.WriteCertificateEx(this.certificate, io, 0); DO THIS!!
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

		public WriteCertificate() {
			if (this.magic != Magic.CON && (this.flags & XContentFlags.MetadataIsPEC) == 0)
				throw "XContentHeader: Error writing certificate. Package is strong signed and therefor doesn't have a certificate.");
			this.WriteCertificateEx(this.certificate, this.io, (this.flags & XContentFlags.MetadataIsPEC) ? 0 : 4);
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