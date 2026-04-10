interface IResGetNotebookConf {
    box: string;
    conf: NotebookConf;
    name: string;
}

interface IReslsNotebooks {
    notebooks: Notebook[];
}

interface IResUpload {
    errFiles: string[];
    succMap: { [key: string]: string };
}

interface IResdoOperations {
    doOperations: doOperation[];
    undoOperations: doOperation[] | null;
}

interface IResGetBlockKramdown {
    id: BlockId;
    kramdown: string;
}

interface IResGetChildBlock {
    id: BlockId;
    type: BlockType;
    subtype?: BlockSubType;
}

interface IResGetTemplates {
    content: string;
    path: string;
}

interface IResReadDir {
    isDir: boolean;
    isSymlink: boolean;
    name: string;
}

interface IResExportMdContent {
    hPath: string;
    content: string;
}

interface IResBootProgress {
    progress: number;
    details: string;
}

interface IResForwardProxy {
    body: string;
    contentType: string;
    elapsed: number;
    headers: { [key: string]: string };
    status: number;
    url: string;
}

interface IResExportResources {
    path: string;
}

interface IResGetDocInfo {
    /**
     * Attribute view reference list
     */
    readonly attrViews: {
        /**
         * Attribute view ID
         */
        readonly id: string;
        /**
         * Attribute view name
         */
        readonly name: "未命名" | "Sans titre" | "Sin título" | "Untitled";
    }[];
    readonly ial: {
        /**
         * document block ID
         */
        readonly id: string;
        /**
         * document title
         */
        readonly title: string;
        /**
         * The last time the block was updated
         */
        readonly updated: string;
        [property: string]: string;
    };
    /**
     * document icon
     */
    readonly icon: string;
    /**
     * block ID
     */
    readonly id: string;
    /**
     * document name
     */
    readonly name: string;
    /**
     * The number of references to the document
     */
    readonly refCount: number;
    /**
     * ID of the block referencing the document
     */
    readonly refIDs: string[];
    /**
     * document block ID
     */
    readonly rootID: string;
    /**
     * The number of sub-documents
     */
    readonly subFileCount: number;
}