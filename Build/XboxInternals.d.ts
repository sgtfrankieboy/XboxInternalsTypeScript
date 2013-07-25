declare module XboxInternals.IO {
    enum EndianType {
        BigEndian,
        LittleEndian,
        Default,
    }
    class BaseIO {
        private byteOrder;
        public buffer: ArrayBuffer;
        private _position;
        constructor(buffer: ArrayBuffer);
        public SetEndian(byteOrder: EndianType): void;
        public GetEndian(): EndianType;
        public SwapEndian(): void;
        public SetPosition(value: number): void;
        public GetPosition(): number;
        public GetLength(): number;
        public SetBuffer(buffer: ArrayBuffer): void;
        public ReadByte(): Uint8Array;
        public ReadBytes(len: number): Uint8Array;
        public ReadUInt8(): number;
        public ReadInt16(): number;
        public ReadWord(): number;
        public ReadInt24(et?: EndianType);
        public ReadInt32(): number;
        public ReadDword(): number;
        public ReadMultiByte(size: number): number;
        public ReadFloat(): number;
        public ReadDouble(): number;
        public ReadString(len?: number, nullTerminiator?: number, forceInclude0?: boolean, maxLength?: number): string;
        public ReadWString(len?: number, nullTerminiator?: number, forceInclude0?: boolean, maxLength?: number): string;
        public ReadImage(length: number): HTMLImageElement;
        public WriteByte(byte: Uint8Array): void;
        public WriteBytes(bytes: Uint8Array): void;
        public WriteWord(word: number): void;
        public WriteDword(dword: number): void;
        public WriteInt24(i24: number, et?: EndianType): void;
        public WriteString(str: string, forceLen?: number, nullTermination?: boolean, nullTerminator?: number): void;
        private reverseByteArray(array);
        public Clone(obj);
        public Save(fileName: string): void;
    }
}
declare module XboxInternals.IO {
    class FileIO extends IO.BaseIO {
        private fileName;
        constructor(buffer: ArrayBuffer);
        static LoadFromFile(file: File, callback: (fileIO: FileIO) => any): void;
        public SaveFile(): void;
        public SetFileName(name: string): void;
        public GetFileName(): string;
    }
}
declare module XboxInternals.Stfs {
    var dataBlocksPerHashTreeLevel: number[];
    enum Sex {
        StfsFemale,
        StfsMale,
    }
    enum Level {
        Zero,
        One,
        Two,
    }
    enum ConsoleType {
        DevKit,
        Retail,
    }
    enum ConsoleTypeFlags {
        TestKit,
        RecoveryGenerated,
    }
    enum Magic {
        CON,
        LIVE,
        PIRS,
    }
    enum FileEntryFlags {
        ConsecutiveBlocks,
        Folder,
    }
    enum InstallerType {
        None,
        SystemUpdate,
        TitleUpdate,
        SystemUpdateProgressCache,
        TitleUpdateProgressCache,
        TitleContentProgressCache,
    }
    enum ContentType {
        ArcadeGame,
        AvatarAssetPack,
        AvatarItem,
        CacheFile,
        CommunityGame,
        GameDemo,
        GameOnDemand,
        GamerPicture,
        GamerTitle,
        GameTrailer,
        GameVideo,
        InstalledGame,
        Installer,
        IPTVPauseBuffer,
        LicenseStore,
        MarketPlaceContent,
        Movie,
        MusicVideo,
        PodcastVideo,
        Profile,
        Publisher,
        SavedGame,
        StorageDownload,
        Theme,
        Video,
        ViralVideo,
        XboxDownload,
        XboxOriginalGame,
        XboxSavedGame,
        Xbox360Title,
        XNA,
    }
    enum BlockStatusLevelZero {
        Unallocated,
        PreviouslyAllocated,
        Allocated,
        NewlyAllocated,
    }
    enum SVODFeatures {
        EnhancedGDFLayout,
        houldBeZeroForDownLevelClients,
    }
    interface Version {
        major: number;
        minor: number;
        build: number;
        revision: number;
    }
}
declare module XboxInternals.Stfs {
    enum LicenseType {
        Unused,
        Unrestricted,
        ConsoleProfileLicense,
        WindowsProfileLicense,
        ConsoleLicense,
        MediaFlags,
        KeyVaultPrivileges,
        HyperVisorFlags,
        UserPrivileges,
    }
    interface LicenseEntry {
        type: LicenseType;
        data: number;
        bits: number;
        flags: number;
    }
    interface StfsVolumeDescriptor {
        size: Uint8Array;
        reserved: Uint8Array;
        blockSeperation: Uint8Array;
        fileTableBlockCount: number;
        fileTableBlockNum: number;
        topHashTableHash: Uint8Array;
        allocatedBlockCount: number;
        unallocatedBlockCount: number;
    }
    interface SvodVolumeDescriptor {
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
    interface Certificate {
        publicKeyCertificateSize: number;
        ownerConsoleID: Uint8Array;
        ownerConsolePartNumber: string;
        ownerConsoleType: Stfs.ConsoleType;
        consoleTypeFlags: Stfs.ConsoleTypeFlags;
        dataGeneration: string;
        publicExponent: number;
        publicModulus: Uint8Array;
        certificateSignature: Uint8Array;
        signature: Uint8Array;
    }
    interface MSTime {
        year: number;
        month: Uint8Array;
        monthDay: Uint8Array;
        hours: Uint8Array;
        minutes: Uint8Array;
        seconds: Uint8Array;
    }
    class StfsDefinitions {
        public ReadStfsVolumeDescriptorEx(io: XboxInternals.IO.BaseIO, address: number): StfsVolumeDescriptor;
        public ReadSvodVolumeDescriptorEx(io: XboxInternals.IO.BaseIO): SvodVolumeDescriptor;
        public WriteStfsVolumeDescriptorEx(descriptor: StfsVolumeDescriptor, io: XboxInternals.IO.BaseIO, address: number): void;
        public WriteCertificateEx(cert: Certificate, io: XboxInternals.IO.BaseIO, address: number): void;
        public LicenseTypeToString(type: LicenseEntry): string;
        public ByteSizeToString(bytes: number): string;
        public ReadCertificateEx(io: XboxInternals.IO.BaseIO, address: number): Certificate;
    }
}
declare module XboxInternals.AvatarAsset {
    enum AssetSubcategory {
        CarryableCarryable,
        CarryableFirst,
        CarryableLast,
        CostumeCasualSuit,
        CostumeCostume,
        CostumeFirst,
        CostumeFormalSuit,
        CostumeLast,
        CostumeLongDress,
        CostumeShortDress,
        EarringsDanglers,
        EarringsFirst,
        EarringsLargehoops,
        EarringsLast,
        EarringsSingleDangler,
        EarringsSingleLargeHoop,
        EarringsSingleSmallHoop,
        EarringsSingleStud,
        EarringsSmallHoops,
        EarringsStuds,
        GlassesCostume,
        GlassesFirst,
        GlassesGlasses,
        GlassesLast,
        GlassesSunglasses,
        GlovesFingerless,
        GlovesFirst,
        GlovesFullFingered,
        GlovesLast,
        HatBaseballCap,
        HatBeanie,
        HatBearskin,
        HatBrimmed,
        HatCostume,
        HatFez,
        HatFirst,
        HatFlatCap,
        HatHeadwrap,
        HatHelmet,
        HatLast,
        HatPeakCap,
        RingFirst,
        RingLast,
        RingLeft,
        RingRight,
        ShirtCoat,
        ShirtFirst,
        ShirtHoodie,
        ShirtJacket,
        ShirtLast,
        ShirtLongSleeveShirt,
        ShirtLongSleeveTee,
        ShirtPolo,
        ShirtShortSleeveShirt,
        ShirtSportsTee,
        ShirtSweater,
        ShirtTee,
        ShirtVest,
        ShoesCostume,
        ShoesFirst,
        ShoesFormal,
        ShoesHeels,
        ShoesHighBoots,
        ShoesLast,
        ShoesPumps,
        ShoesSandals,
        ShoesShortBoots,
        ShoesTrainers,
        TrousersCargo,
        TrousersFirst,
        TrousersHotpants,
        TrousersJeans,
        TrousersKilt,
        TrousersLast,
        TrousersLeggings,
        TrousersLongShorts,
        TrousersLongSkirt,
        TrousersShorts,
        TrousersShortSkirt,
        TrousersTrousers,
        WristwearBands,
        WristwearBracelet,
        WristwearFirst,
        WristwearLast,
        WristwearSweatbands,
        WristwearWatch,
    }
    enum BinaryAssetType {
        Component,
        Texture,
        ShapeOverride,
        Animation,
        ShapeOverridePost,
    }
    enum SkeletonVersion {
        Nxe,
        Natal,
        NxeAndNatal,
    }
    enum AssetGender {
        Male,
        Female,
        Both,
    }
    interface STRBHeader {
        magic: number;
        blockAlignmentStored: boolean;
        littleEndian: boolean;
        guid: Uint8Array;
        blockIdSize: Uint8Array;
        blockSpanSize: Uint8Array;
        unused: number;
        blockAlignment: Uint8Array;
        blockHeaderSize: number;
        blockStartAddress: number;
    }
    enum STRRBBlockId {
        STRBAnimation,
        STRBAssetMetadata,
        STRBAssetMetadataVersioned,
        STRBCustomColorTable,
        STRBEof,
        STRBInvalid,
        STRBModel,
        STRBShapeOverrides,
        STRBSkeleton,
        STRBTexture,
    }
    interface AssetMetadata {
        metadataVersion: number;
        gender: AssetGender;
        type: BinaryAssetType;
        assetTypeDetails: number;
        category: AssetSubcategory;
        skeletonVersion: SkeletonVersion;
    }
    interface RGBColor {
        blue: Uint8Array;
        green: Uint8Array;
        red: Uint8Array;
        alpha: Uint8Array;
    }
    interface ColorGroup {
        color: RGBColor;
        unknown: number;
    }
    interface ColorTableEntry {
        color1: RGBColor;
        color2: RGBColor;
        color3: RGBColor;
    }
    interface ColorTab {
        count: number;
        entries: ColorTableEntry[];
    }
    interface Animation {
        frameCount: number;
        duration: number;
        framesPerSecond: number;
    }
    interface STRBBlock {
        id: STRRBBlockId;
        dataLength: number;
        fieldSize: number;
        data: Uint8Array;
        dataAddress: number;
    }
}
declare module sha1 {
    function hash(sourceArray: Uint8Array): Uint8Array;
}
declare module XboxInternals.Stfs {
    enum XContentFlags {
        MetadataIsPEC,
        MetadataSkipRead,
        MetadataDontFreeThumbnails,
    }
    enum OnlineContentResumeState {
        FileHeadersNotReady,
        NewFolder,
        NewFolderResum_Attempt1,
        NewFolderResumeAttempt2,
        NewFolderResumeAttemptUnknown,
        NewFolderResumeAttemptSpecific,
    }
    enum FileSystem {
        FileSystemSTFS,
        FileSystemSVOD,
        FileSystemFATX,
    }
    class XContentHeader extends Stfs.StfsDefinitions {
        constructor(io: XboxInternals.IO.BaseIO, flags?: number);
        private readMetadata();
        public WriteVolumeDescriptor(): void;
        public WriteMetaData(): void;
        public ResignHeader(): void;
        static Uint8ArrayFromHex(str: string): Uint8Array;
        public WriteCertificate(): void;
        private Uint8ArrayToHexString(array);
        private io;
        private flags;
        public magic: Stfs.Magic;
        public certificate: Stfs.Certificate;
        public packageSignature: Uint8Array;
        public licenseData: Stfs.LicenseEntry[];
        public headerHash: Uint8Array;
        public headerSize: number;
        public contentType: Stfs.ContentType;
        public metaDataVersion: number;
        public contentSize: number;
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
        public stfsVolumeDescriptor: Stfs.StfsVolumeDescriptor;
        public svodVolumeDescriptor: Stfs.SvodVolumeDescriptor;
        public fileSystem: FileSystem;
        public enabled: boolean;
        public dataFileCount: number;
        public dataFileCombinedSize: number;
        public deviceID: Uint8Array;
        public displayName: string;
        public displayDescription: string;
        public publisherName: string;
        public titleName: string;
        public transferFlag: Uint8Array;
        public thumbnailImageSize: number;
        public titleThumbnailImageSize: number;
        public installerType: Stfs.InstallerType;
        public subCategory: XboxInternals.AvatarAsset.AssetSubcategory;
        public colorizable: number;
        public guid: Uint8Array;
        public skeletonVersion: XboxInternals.AvatarAsset.SkeletonVersion;
        public seriesID: Uint8Array;
        public seasonID: Uint8Array;
        public seasonNumber: number;
        public episodeNumber;
        public number;
        public resumeState: OnlineContentResumeState;
        public currentFileIndex: number;
        public currentFileOffset: number;
        public bytesProcessed: number;
        public lastModified: any;
        public cabResumeData: Uint8Array;
        public installerBaseVersion: Stfs.Version;
        public installerVersion: Stfs.Version;
        public thumbnailImage: Uint8Array;
        public titleThumbnailImage: Uint8Array;
    }
}
declare module XboxInternals.Stfs {
    class StfsPackage {
        static INT24_MAX: number;
        public metaData: Stfs.XContentHeader;
        private fileListing;
        private writtenToFile;
        private io;
        private ioPassedIn;
        private packageSex;
        private blockStep;
        private firstHashTableAddress;
        private hashOffset;
        private topLevel;
        private topTable;
        private cached;
        private tablesPerLevel;
        private flags;
        constructor(io: XboxInternals.IO.BaseIO, flags: number);
        private Init();
        private Parse();
        private PrintFileListing(fullListing?, prefix?);
        private PrintFileListingExtended(fullListing?, prefix?);
        public GetFileListing(forceUpdate: boolean): StfsFileListing;
        public GetFileMagicFromPath(pathInPackage: string): number;
        public GetFileMagic(entry: StfsFileEntry): number;
        public IsPEC(): boolean;
        public Resign(): void;
        private ReadFileListing();
        private AddToListing(fullListing, out);
        private CalculateTopLevel();
        private ComputeLevelNBackingHashBlockNumber(blockNum, level);
        private WriteUint32Array(array);
        private HashBlock(block);
        private ComputeLevel0BackingHashBlockNumber(blockNum);
        private ComputeLevel1BackingHashBlockNumber(blockNum);
        private ComputeLevel2BackingHashBlockNumber(blockNum);
        private ComputeBackingDataBlockNumber(blockNum);
        private BlockToAddress(blockNum);
        public GetHashAddressOfBlock(blockNum: number): number;
        private GetBlockHashEntry(blockNum);
        private GetFileEntryFromPath(pathInPackage, checkFolders?, newEntry?);
        private GetFileEntry(locationOfFile, start, newEntry?, updateEntry?, checkFolders?);
        public WriteFileEntry(entry: StfsFileEntry): void;
        private ExtractBlock(blockNum, length?);
        public ExtractFileFromPath(pathInPackage: string, onProgress?: (extractProgress: number) => any): XboxInternals.IO.FileIO;
        public ExtractFile(entry: StfsFileEntry, onProgress?: (extractProgress: number) => any): XboxInternals.IO.FileIO;
        private SetBlockStatus(blockNum, status);
        public RemoveFileFromPath(pathInPackage: string): void;
        public RemoveFile(entry: StfsFileEntry): void;
        private GetHashTableSkipSize(tableAddress);
        public FileExists(pathInPackage: string): boolean;
        public InjectFile(input: XboxInternals.IO.FileIO, pathInPackage: string, onProgress?: (progress: number) => any): StfsFileEntry;
        public WriteFileListing(usePassed?: boolean, outFis?: StfsFileEntry[], outFos?: StfsFileEntry[]): void;
        private GenerateRawFileListing(fl, outFiles, outFolders);
        public SetNextBlock(blockNum: number, nextBlockNum: number): void;
        private AllocateBlock();
        public GetHashTableAddress(index: number, lvl: Stfs.Level): number;
        public GetBaseHashTableAddress(index: number, lvl: Stfs.Level): number;
        public GetTableHashAddress(index: number, lvl: Stfs.Level): number;
        private FindDirectoryListing(locationOfDirectory, start);
        public ReplaceFileFromPath(input: XboxInternals.IO.FileIO, pathInPackage: string, onProgress?: (progress: number) => any): void;
        public ReplaceFile(fileIn: XboxInternals.IO.FileIO, entry: StfsFileEntry, pathInPackage: string, onProgress?: (progress: number) => any): void;
        private UpdateEntry(pathInPackage, entry);
        public GetLevelNHashTable(index: number, lvl: Stfs.Level): HashTable;
        public Rehash(): void;
        private BuildTableInMemory(table);
        public RenameFile(newName: string, pathInPackage: string): void;
        public ArrayBufferExtend(buf: ArrayBuffer, length: number): ArrayBuffer;
        public ArrayBufferConcat(buf1: ArrayBuffer, buf2: ArrayBuffer): ArrayBuffer;
    }
    class StfsFileEntry {
        public entryIndex: number;
        public name: string;
        public nameLen: Uint8Array;
        public flags: Uint8Array;
        public blocksForFile: number;
        public startingBlockNum: number;
        public pathIndicator: number;
        public fileSize: number;
        public createdTimeStamp: number;
        public accessTimeStamp: number;
        public fileEntryAddress: number;
        public blockChain: number[];
    }
    class StfsFileListing {
        public fileEntries: StfsFileEntry[];
        public folderEntries: StfsFileListing[];
        public folder: StfsFileEntry;
        constructor();
    }
    class HashEntry {
        public blockHash: Uint8Array;
        public status: Uint8Array;
        public nextBlock: number;
        constructor();
    }
    class HashTable {
        public level: Stfs.Level;
        public trueBlockNumber: number;
        public entryCount: number;
        public entries: HashEntry[];
        public addressInFile: number;
    }
    enum StfsPackageFlags {
        StfsPackagePEC,
        StfsPackageCreate,
        StfsPackageFemale,
    }
}
