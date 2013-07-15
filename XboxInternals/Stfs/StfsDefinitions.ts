/// <reference path='StfsConstants.ts' />
/// <reference path='../IO/BaseIO.ts' />

module XboxInternals.Stfs {

	export enum LicenseType {
		Unused = 0x0000,
		Unrestricted = 0xFFFF,
		ConsoleProfileLicense = 0x0009,
		WindowsProfileLicense = 0x0003,
		ConsoleLicense = 0xF000,
		MediaFlags = 0xE000,
		KeyVaultPrivileges = 0xD000,
		HyperVisorFlags = 0xC000,
		UserPrivileges = 0xB000
	}

	export interface LicenseEntry {
		type: LicenseType;
		data: number; /* UINT64 */
		bits: number;
		flags: number;
	}

	export interface StfsVolumeDescriptor {
		size: Uint8Array;
		reserved: Uint8Array;
		blockSeperation: Uint8Array;
		fileTableBlockCount: number;
		fileTableBlockNum: number;
		topHashTableHash: Uint8Array;
		allocatedBlockCount: number;
		unallocatedBlockCount: number;
	}

	export interface SvodVolumeDescriptor {
		size: Uint8Array;
		blockCacheElementCount: Uint8Array;
		workerThreadProcessor: Uint8Array;
		workerThreadPriority: Uint8Array;
		rootHash: Uint8Array;
		flags: Uint8Array;
		dataBlockCount: number;
		dataBlockOffset: number;
		reserved: Uint8Array;
	}

	export interface Certificate {
		publicKeyCertificateSize: number;
		ownerConsoleID: Uint8Array;
		ownerConsolePartNumber: string;
		ownerConsoleType: ConsoleType;
		consoleTypeFlags: ConsoleTypeFlags;
		dataGeneration: string;
		publicExponent: number;
		publicModulus: Uint8Array;
		certificateSignature: Uint8Array;
		signature: Uint8Array;
	}

	export interface MSTime {
		year: number;
		month: Uint8Array;
		monthDay: Uint8Array;
		hours: Uint8Array;
		minutes: Uint8Array;
		seconds: Uint8Array;
	}

	export class StfsDefinitions {

		public ReadStfsVolumeDescriptorEx(io: IO.BaseIO, address: number): StfsVolumeDescriptor {
			io.SetPosition(address);
			io.SetEndian(IO.EndianType.BigEndian)

			var size = io.ReadByte();
			var reserved = io.ReadByte();
			var blockSeperation = io.ReadByte();

			io.SetEndian(IO.EndianType.LittleEndian);

			var fileTableBlockCount = io.ReadWord();
			var fileTableBlockNum = io.ReadInt24();

			var topHashTableHash = io.ReadBytes(0x14);

			io.SetEndian(IO.EndianType.BigEndian);

			var allocatedBlockCount = io.ReadInt32();
			var unallocatedBlockCount = io.ReadInt32();


			var descriptor: StfsVolumeDescriptor = {
				size: size,
				reserved: reserved,
				blockSeperation: blockSeperation,
				fileTableBlockCount: fileTableBlockCount,
				fileTableBlockNum: fileTableBlockNum,
				topHashTableHash: topHashTableHash,
				allocatedBlockCount: allocatedBlockCount,
				unallocatedBlockCount: unallocatedBlockCount
			}
			return descriptor;
		}

		public ReadSvodVolumeDescriptorEx(io: IO.BaseIO): SvodVolumeDescriptor {
			io.SetPosition(0x379)

			return {
				size: io.ReadByte(),
				blockCacheElementCount: io.ReadByte(),
				workerThreadProcessor: io.ReadByte(),
				workerThreadPriority: io.ReadByte(),
				rootHash: io.ReadBytes(0x14),
				flags: io.ReadByte(),
				dataBlockCount: io.ReadInt24(IO.EndianType.LittleEndian),
				dataBlockOffset: io.ReadInt24(IO.EndianType.LittleEndian),
				reserved: io.ReadBytes(0x05)
			};
		}

		public WriteStfsVolumeDescriptorEx(descriptor: StfsVolumeDescriptor, io: IO.BaseIO, address: number) {
			io.SetPosition(address);
			
			var start = 0x240000;
			start |= descriptor.blockSeperation[0];
			io.WriteInt24(start);

			io.SwapEndian();
			io.WriteWord(descriptor.fileTableBlockCount);
			io.SwapEndian();

			io.WriteInt24(descriptor.fileTableBlockNum, IO.EndianType.LittleEndian);
			io.WriteBytes(descriptor.topHashTableHash);
			io.WriteDword(descriptor.allocatedBlockCount);
			io.WriteDword(descriptor.unallocatedBlockCount);
		}

		public WriteCertificateEx(cert: Certificate, io: IO.BaseIO, address: number) {
			io.SetPosition(address);

			io.WriteWord(cert.publicKeyCertificateSize);
			io.WriteBytes(cert.ownerConsoleID);
			io.WriteString(cert.ownerConsolePartNumber, 0x11, false);
			var temp = cert.consoleTypeFlags | cert.ownerConsoleType;
			io.WriteDword(temp);

			io.WriteString(cert.dataGeneration, 0x8, false);
			io.WriteDword(cert.publicExponent);
			io.WriteBytes(cert.publicModulus);
			io.WriteBytes(cert.certificateSignature);
			io.WriteBytes(cert.signature);
		}

		public LicenseTypeToString(type: LicenseEntry): string {
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
		}

		public ByteSizeToString(bytes: number): string {
			var B: number = 1;
			var KB: number = 1024 * B;
			var MB: number = 1024 * KB;
			var GB: number = 1024 * MB;

			if (bytes > GB)
				return (bytes / GB) + " GB";
			else if (bytes > MB)
				return (bytes / MB) + " MB";
			else if (bytes > KB)
				return (bytes / KB) + " KB";
			else
				return bytes + " bytes";
		}

		public ReadCertificateEx(io: IO.BaseIO, address: number): Certificate {
			io.SetPosition(address);

			var publicKeyCertifcateSize = io.ReadWord();
			var ownerConsoleID = io.ReadBytes(0x5);
			var ownerConsolePartNumber = io.ReadString(0x11);

			var temp = io.ReadDword();
			var ownerConsoleType = <ConsoleType>(temp & 3);
			var consoleTypeFlags = <ConsoleTypeFlags>(temp & 0xFFFFFFFC);
			if (ownerConsoleType != ConsoleType.DevKit && ownerConsoleType != ConsoleType.Retail)
				throw "STFS: Invalid console type.";

			var dateGeneration = io.ReadString(0x8);

			var publicExponent = io.ReadDword();
			var publicModulus = io.ReadBytes(0x80);
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
				publicModulus: publicModulus,
				certificateSignature: certificateSignature,
				signature: signature
			}
		}

	}
}