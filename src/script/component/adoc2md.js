class WorkSpace {
    values;
    parent;

    /**
     *
     * @param workSpace {WorkSpace?}
     */
    constructor(workSpace) {
        if (workSpace) {
            this.parent = workSpace;
        }
        this.values = {};
    }

    get(k) {
        let v = this.values[k];
        if (typeof v === "undefined" || v === null) {
            if (this.parent)
                return this.parent.get(k);
        }

        return v;
    }


    set(k, v, root = false) {
        if (root && this.parent) {
            this.parent.set(k, v, root);
            return;
        }
        this.values[k] = v;
    }
}


const Frames = new Map();

/**
 *
 * @param tagname {string}
 * @param frame {BaseFrame}
 */
function registFrame(tagname, frame) {
    Frames.set(tagname, frame);
}

function getFrame(tagname) {
    return Frames.get(tagname);
}


class BaseFrame {

    constructor() {

    }

    getBefore(tagName, tagOption,areadyMD = "", workSpace) {
        return "";
    }

    getMarkdown(frame, areadyMD = "", workSpace) {
        let tagName = frame[0];
        let tagOption = frame[1];
        let content = [];
        for (let i = 2; i < frame.length; i++) {
            content.push(frame[i]);
        }

        const before = this.getBefore(tagName, tagOption, areadyMD, workSpace);

        let ctx = "";
        if (content.length === 1 && typeof content[0] === "string") {
            ctx = content[0].replace(/\r/g, "");
        } else {

            for (let i = 0; i < content.length; i++) {
                let item = content[i];
                const fhd = getFrame(item[0]);
                if (!fhd) {
                    console.log(JSON.stringify(item, null, 2));
                    throw new Error("不支持渲染节点：" + item[0]);
                }

                ctx += fhd.getMarkdown(item, ctx, new WorkSpace(workSpace));
            }

        }

        const after = this.getAfter(tagName, tagOption, ctx, workSpace);

        // 空内容的时候，before 和 after 都忽略。
        // 如果不想忽略，可以在 workSpace 中添加 allowEmptyContent 设置为 true、
        if (ctx.trim().length === 0 && !workSpace.get("allowEmptyContent")) {
            return "";
        }

        let md = [before, ctx, after].join("");

        if (md.trim().length === 0) {
            return "";
        }

        return md;
    }


    getAfter(tagName, tagOption, areadyMD = "", workSpace) {
        return "";
    }
}

class RootFrame extends BaseFrame {}

class HeaderFrame extends BaseFrame {
    #hx;
    constructor(hx) {
        super();
        this.#hx = hx;
    }


    getBefore(tagName, tagOption, areadyMD, workSpace) {
        return `${this.#hx} `;
    }

    getAfter(tagName, tagOption, areadyMD, workSpace) {
        return "\n\n";
    }
}

class InlineFrame extends BaseFrame {
    #pre;
    #after;
    constructor(pre, after) {
        super();
        this.#pre = pre;
        this.#after = after;
    }

    getBefore(tagName, tagOption, areadyMD, workSpace) {
        let be = "";



        if (tagOption.bold) {
            be += "**";
        }

        if (tagOption.strike) {
            be += "~~"
        }
        if (tagOption.italic) {
            be += tagOption.bold ? "_" : "*";
        }
        if (!this.#pre) {
            return be;
        } else {
            be += this.#pre;
        }


        return be;
    }

    getAfter(tagName, tagOption, areadyMD, workSpace) {
        let af = "";

        if (tagOption.italic) {
            af += tagOption.bold ? "_" : "*";
        }
        if (tagOption.strike) {
            af += "~~"
        }
        if (tagOption.bold) {
            af += "**";
        }

        if (!this.#after) {
            return af;
        } else {
            af = `${this.#after}${af}`;
        }

        return af;
    }
}

class BrFrame extends BaseFrame {
    constructor() {
        super();
    }
    getMarkdown(frame, areadyMD = "", workSpace) {
        workSpace.set("allowEmptyContent", true);
        return super.getMarkdown(frame, areadyMD, workSpace);
    }

    getAfter(tagName, tagOption, areadyMD = "", workSpace) {
        return "<br>";
    }
}

class AFrame extends BaseFrame {
    getBefore(tagName, tagOption, areadyMD = "", workSpace) {
        return `[`;
    }
    getAfter(tagName, tagOption, areadyMD = "", workSpace) {
        return "]("+tagOption.href + ")";
    }
}

class ImgFrame extends BaseFrame {
    constructor() {
        super();
    }

    getBefore(tagName, tagOption, areadyMD = "", workSpace) {
        return `![${tagOption.name}](`
    }

    getMarkdown(frame, areadyMD = "", workSpace) {
        return this.getBefore(frame[0], frame[1], areadyMD, workSpace) + frame[1].src + this.getAfter(frame[0], frame[1], areadyMD, workSpace);
    }

    getAfter(tagName, tagOption, areadyMD = "", workSpace) {
        return ")";
    }
}

class BlockFrame extends BaseFrame {
    pre;
    #after;
    constructor(pre, after) {
        super();
        this.pre = pre;
        this.#after = after;
    }

    getBefore(tagName, tagOption, areadyMD, workSpace) {

        let p = areadyMD.endsWith("\n\n") ? "" : "\n";

        if (tagOption.list) {
            if (tagOption.list.isOrdered) {
                let listK = "listIndex_" + tagOption.list.listId + "_" + tagOption.list.level;

                let listIndex = workSpace.get(listK) || 0;

                let currentIndex = listIndex + 1;
                workSpace.set(listK, currentIndex, true);

                let intent = "";

                if (tagOption.list.level > 0) {
                    intent = "    ".repeat(tagOption.list.level);
                }

                p += `${intent}${currentIndex}. `;
            } else {
                p += "* ";
            }
        }


        if (!this.pre) {

        } else {
            p += `${this.pre}\n`
        }

        // 在表格里面的数据，每个单元格的数据不能换行。
        let inTable = workSpace.get("intable");
        if (inTable) {
            p = p.trim();
        }

        return p;
    }

    getAfter(tagName, tagOption, areadyMD, workSpace) {

        let af = "";
        if (!this.#after) {
            af = "\n\n";
        } else {
            af = `\n${this.#after}\n\n`;
        }

        // 在表格里面的数据，每个单元格的数据不能换行。
        let inTable = workSpace.get("intable");
        if (inTable) {
            af = af.trim();
        }

        return af;
    }
}

class CardFrame extends BlockFrame {
    constructor() {
        super("","");
    }

    getMarkdown(frame, areadyMD = "", workSpace) {
        let tagOption = frame[1];
        let metadata = tagOption.metadata || {};
        let cardType = metadata.type || "";

        // 调试：输出所有 card 节点的完整信息
        console.log("[adoc2md调试] card节点, type:", cardType, "完整tagOption:", JSON.stringify(tagOption).substring(0, 1000));
        console.log("[adoc2md调试] card子内容数量:", frame.length - 2);
        for (let i = 2; i < frame.length; i++) {
            if (Array.isArray(frame[i])) {
                console.log("[adoc2md调试] card子节点", i, "tag:", frame[i][0], "option:", JSON.stringify(frame[i][1]).substring(0, 500));
            } else {
                console.log("[adoc2md调试] card子节点", i, "内容:", String(frame[i]).substring(0, 200));
            }
        }

        // 判断是否是附件类型的 card
        // 支持类型：application/x-alidocs-plugin-attachment, attachment, video, audio, file, pdf, document, image, media
        let cardTypeLower = cardType.toLowerCase();
        const isAttachment = cardTypeLower.includes("attachment") ||
            cardTypeLower.includes("video") ||
            cardTypeLower.includes("audio") ||
            cardTypeLower.includes("file") ||
            cardTypeLower.includes("pdf") ||
            cardTypeLower.includes("document") ||
            cardTypeLower.includes("image") ||
            cardTypeLower.includes("media");

        if (isAttachment) {
            // 收集附件信息到 workSpace
            const collectAttachment = workSpace.get("collectAttachment");
            let attachmentInfo = {
                type: cardType,
                metadataId: metadata.id || "",
                dentryUuid: metadata.dentryUuid || metadata.dentryId || "",
                fileName: metadata.fileName || metadata.name || "",
                fileSize: metadata.fileSize || 0,
                downloadUrl: metadata.downloadUrl || metadata.url || "",
                extension: metadata.extension || "",
                contentType: metadata.contentType || "",
            };

            // 尝试从 card 子内容中提取更多附件信息
            for (let i = 2; i < frame.length; i++) {
                let item = frame[i];
                if (Array.isArray(item) && item[1]) {
                    let itemOption = item[1];
                    if (itemOption.dentryUuid && !attachmentInfo.dentryUuid) {
                        attachmentInfo.dentryUuid = itemOption.dentryUuid;
                    }
                    if (itemOption.fileName && !attachmentInfo.fileName) {
                        attachmentInfo.fileName = itemOption.fileName;
                    }
                    if (itemOption.name && !attachmentInfo.fileName) {
                        attachmentInfo.fileName = itemOption.name;
                    }
                    if (itemOption.fileSize && !attachmentInfo.fileSize) {
                        attachmentInfo.fileSize = itemOption.fileSize;
                    }
                    if (itemOption.downloadUrl && !attachmentInfo.downloadUrl) {
                        attachmentInfo.downloadUrl = itemOption.downloadUrl;
                    }
                    if (itemOption.url && !attachmentInfo.downloadUrl) {
                        attachmentInfo.downloadUrl = itemOption.url;
                    }
                    if (itemOption.extension && !attachmentInfo.extension) {
                        attachmentInfo.extension = itemOption.extension;
                    }
                    if (itemOption.contentType && !attachmentInfo.contentType) {
                        attachmentInfo.contentType = itemOption.contentType;
                    }
                }
            }

            if (collectAttachment) {
                collectAttachment(attachmentInfo);
            }

            // 在 markdown 中输出附件引用
            let displayName = attachmentInfo.fileName || (cardType + "附件");
            let attachDir = "attachments";
            let localPath = attachDir + "/" + (attachmentInfo.fileName || (cardType + "_" + (attachmentInfo.dentryUuid || Date.now())));

            let typeLabel = "";
            switch (cardType) {
                case "video": typeLabel = "视频"; break;
                case "audio": typeLabel = "音频"; break;
                case "pdf": typeLabel = "PDF"; break;
                case "attachment": typeLabel = "附件"; break;
                case "file": typeLabel = "文件"; break;
                case "document": typeLabel = "文档"; break;
                default: typeLabel = cardType;
            }

            return super.getBefore(frame[0], frame[1], areadyMD, workSpace) +
                `📎 [${typeLabel}: ${displayName}](${localPath})` +
                super.getAfter(frame[0], frame[1], areadyMD, workSpace);
        }

        // 其他不支持的 card 类型，保留原有逻辑
        const getDocUrl = workSpace.get("getDdocUrl");
        return [this.getBefore(frame[0], frame[1], areadyMD, workSpace), getDocUrl("类型:" + cardType), this.getAfter(frame[0], frame[1], areadyMD, workSpace)].join("");
    }

    getBefore(tagName, tagOption, areadyMD = "", workSpace) {
        return super.getBefore(tagName, tagOption, areadyMD, workSpace) + "[不支持的内容，请到钉钉文档查看](";
    }

    getAfter(tagName, tagOption, areadyMD, workSpace) {
        return ")\n\n";
    }
}

class HrFrame extends BlockFrame {
    constructor() {
        super("---", "");
    }

    getMarkdown(frame, areadyMD = "", workSpace) {
        workSpace.set("allowEmptyContent", true);
        return super.getMarkdown(frame, areadyMD, workSpace);
    }
}

class CodeFrame extends BlockFrame {
    constructor() {
        super("```", "```");
    }

    getBefore(tagName, tagOption, areadyMD, workSpace) {
        let newLine = areadyMD.endsWith("\n\n") ? "" : "\n";
        let b = `${newLine}${this.pre}${tagOption.syntax||""}\n`;

        if (tagOption.title) {
            let cmt = getCommentMark(tagOption.syntax);
            b += `${cmt} ${tagOption.title}`;
            if (cmt.startsWith("<!--")) {
                b += ` -->`;
            } else if (cmt.startsWith("/*")) {
                b += ` */`;
            }

            b += `\n\n`;
        }

        return b;
    }
}

class TcFrame extends InlineFrame {
    constructor() {
        super("","");
    }
}

class TableFrame extends BaseFrame {
    constructor() {
        super();
    }

    getMarkdown(frame, areadyMD = "", workSpace) {
        let ctx = "";
        workSpace.set("intable", true); // 标记此frame 内部的解析是在 table 下面，数据不能换行。
        for (let i = 2; i < frame.length; i++) {
            let trFrame = frame[i];
            let trOption = trFrame[1];

            let trValues = [];
            for (let j = 2; j < trFrame.length; j++) {
                let tcFrame = trFrame[j];
                let f = getFrame(tcFrame[0]);
                if (!f) {
                    console.log(JSON.stringify(tcFrame, null, 2));
                    throw new Error(`不支持渲染节点：${tcFrame[0]}`);
                }

                trValues.push(f.getMarkdown(tcFrame, "",new WorkSpace(workSpace)).trim());
            }
            ctx += `| ${trValues.join(" | ")} |\n`;

            let tableHadHeaderKey = frame[1].uuid + "_hadheader";

            // 如果表没有设置表头，那么设置一个，markdown必须有表头分隔符才会渲染成表格的样式。
            if (!workSpace.get(tableHadHeaderKey)) {
                ctx += "|"
                for (let o  in trValues) {
                    ctx += " --- |";
                }
                ctx += "\n";

                workSpace.set(tableHadHeaderKey, true, true);

            } else {
                // 正常的行数据。
            }

        }

        return ctx + "\n";
    }

}


registFrame("h1", new HeaderFrame("#"));
registFrame("h2", new HeaderFrame("##"));
registFrame("h3", new HeaderFrame("###"));
registFrame("h4", new HeaderFrame("####"));
registFrame("h5", new HeaderFrame("#####"));
registFrame("br", new BrFrame());
registFrame("a", new AFrame());
registFrame("hr", new HrFrame());
registFrame("p", new BlockFrame("", ""));
registFrame("card", new CardFrame());
registFrame("container", new BlockFrame(":::", ":::"));
registFrame("tc", new TcFrame());
registFrame("span", new InlineFrame("", ""));
registFrame("cangjie-textinline", new InlineFrame("`", "`"));
registFrame("inlineCode", new InlineFrame("`", "`"));
registFrame("code", new CodeFrame());
registFrame("root", new RootFrame());
registFrame("table", new TableFrame());
registFrame("img", new ImgFrame());


// 获取各个语言的单行注释语法前缀。
function getCommentMark(lang) {
    switch (lang) {
        case "c":
        case "c++":
        case "cpp":
        case "javascript":
        case "java":
        case "js":
        case "ts":
        case "typescript":
        case "csharp":
        case "c#":
        case "swift":
        case "go":
        case "golang":
        case "rust":
        case "dart":
        case "kotlin":
        case "delphi":
        case "groovy":
        case "php":
        case "scala": return "// ";
        case "python":
        case "ruby":
        case "perl":
        case "bash":
        case "shell":
        case "powershell":
        case "r":
        case "elixir":
        case "coffeescript":
        case "toml":
        case "yaml":return "# ";
        case "lua":
        case "haskell":
        case "sql": return "-- ";
        case "ini": return "; ";
        case "html":
        case "xml": return "<!-- ";
        case "css": return "/* ";
        case "vb": return "' ";
        case "abap": return "\" ";
        case "stata": return "* ";
        case "erlang":
        case "matlab": return "% ";
        case "ocaml": return "(* ";
    }

    return "// ";
}


/**
 * 递归从数据对象中提取附件信息（adoc2md 内部使用）
 * @param obj 数据对象
 * @param attachInfo 附件信息对象（会被修改）
 */
function _deepExtractInfo(obj, attachInfo) {
    if (!obj || typeof obj !== "object") return;

    if (Array.isArray(obj)) {
        for (let item of obj) {
            _deepExtractInfo(item, attachInfo);
        }
        return;
    }

    if (obj.dentryUuid && !attachInfo.dentryUuid) attachInfo.dentryUuid = obj.dentryUuid;
    if (obj.dentryId && !attachInfo.dentryUuid) attachInfo.dentryUuid = obj.dentryId;
    if (obj.fileName && !attachInfo.fileName) attachInfo.fileName = obj.fileName;
    if (obj.name && !attachInfo.fileName) attachInfo.fileName = obj.name;
    if (obj.title && !attachInfo.fileName) attachInfo.fileName = obj.title;
    if (obj.fileSize && !attachInfo.fileSize) attachInfo.fileSize = obj.fileSize;
    if (obj.size && !attachInfo.fileSize) attachInfo.fileSize = obj.size;
    if (obj.downloadUrl && !attachInfo.downloadUrl) attachInfo.downloadUrl = obj.downloadUrl;
    if (obj.url && !attachInfo.downloadUrl) attachInfo.downloadUrl = obj.url;
    if (obj.src && !attachInfo.downloadUrl) attachInfo.downloadUrl = obj.src;
    if (obj.extension && !attachInfo.extension) attachInfo.extension = obj.extension;
    if (obj.fileExtension && !attachInfo.extension) attachInfo.extension = obj.fileExtension;
    if (obj.contentType && !attachInfo.contentType) attachInfo.contentType = obj.contentType;
    if (obj.mimeType && !attachInfo.contentType) attachInfo.contentType = obj.mimeType;
    if (obj.fileType && !attachInfo.contentType) attachInfo.contentType = obj.fileType;
    if (obj.ossUrl && !attachInfo.downloadUrl) attachInfo.downloadUrl = obj.ossUrl;
    if (obj.preSignUrl && !attachInfo.downloadUrl) attachInfo.downloadUrl = obj.preSignUrl;
    // 钉钉文档附件特有字段
    if (obj.resourceId && !attachInfo.resourceId) attachInfo.resourceId = obj.resourceId;
    if (obj.storagePath && !attachInfo.storagePath) attachInfo.storagePath = obj.storagePath;
    if (obj.uniqueId && !attachInfo.uniqueId) attachInfo.uniqueId = obj.uniqueId;

    // 从 fileType 推断扩展名
    if (attachInfo.contentType && !attachInfo.extension) {
        let extMap = {
            "application/pdf": "pdf",
            "video/mp4": "mp4",
            "video/quicktime": "mov",
            "audio/mpeg": "mp3",
            "audio/wav": "wav",
            "image/png": "png",
            "image/jpeg": "jpg",
            "image/gif": "gif",
            "application/zip": "zip",
        };
        if (extMap[attachInfo.contentType]) {
            attachInfo.extension = extMap[attachInfo.contentType];
        }
    }

    for (let key in obj) {
        if (typeof obj[key] === "object" && obj[key] !== null) {
            _deepExtractInfo(obj[key], attachInfo);
        }
    }
}

/**
 * 传入 钉钉文档的 docContent 字符串。
 * @param docContent {string}
 * @param docUrl {string} // 有些内容markdown不支持的，那么这时，在markdown中输出文档地址，使得用户可以在打开原文。
 * @param options {object?} // 可选配置
 * @param options.dentryId {string?} // 文档的 dentryId，用于附件下载
 * @return {[string, string[], object[]]} // 数组第一个是markdown结果，第二个是警告列表，第三个是附件信息列表。
 */
function adoc2md(docContent, docUrl, options) {
    if (typeof docContent === "string") {
        docContent = JSON.parse(docContent);
    }
    options = options || {};
    let doc = Object.values(docContent.parts).find(p => p.type==="application/x-alidocs-word").data.body;
    let f = getFrame(doc[0]);
    if (!f) {
        throw new Error(`不支持渲染节点:${f}\n 按F12打开控制台，将`);
    }
    const w =  new WorkSpace();
    const warns = [];
    const attachments = [];
    w.set("getDdocUrl", (reason) => {
        warns.push(`发现不支持的内容[${reason}]。`);
        return docUrl;
    });
    w.set("collectAttachment", (attachmentInfo) => {
        // 补充文档来源信息
        attachmentInfo.sourceDentryId = options.dentryId || "";

        // 如果 metadata 中有 id，尝试从 docContent.parts 中查找对应的 part 数据
        if (attachmentInfo.metadataId && docContent.parts) {
            let part = docContent.parts[attachmentInfo.metadataId];
            if (part && part.data) {
                console.log("[adoc2md调试] 通过metadataId找到part, type:", part.type);
                _deepExtractInfo(part.data, attachmentInfo);
            } else {
                // 遍历所有 parts 查找匹配的
                for (let partKey in docContent.parts) {
                    let p = docContent.parts[partKey];
                    if (p.type === attachmentInfo.type || p.id === attachmentInfo.metadataId) {
                        console.log("[adoc2md调试] 通过遍历找到匹配part, key:", partKey);
                        if (p.data) _deepExtractInfo(p.data, attachmentInfo);
                        break;
                    }
                }
            }
        }

        attachments.push(attachmentInfo);
    });

    // 同时扫描所有非 word 类型的 parts，提取附件信息
    for (let partKey in docContent.parts) {
        let part = docContent.parts[partKey];
        if (part.type !== "application/x-alidocs-word") {
            console.log("[adoc2md调试] 非word part, key:", partKey, "type:", part.type, "data:", JSON.stringify(part.data).substring(0, 2000));
            let attachInfo = {
                type: part.type || "",
                partKey: partKey,
                dentryUuid: "",
                fileName: "",
                fileSize: 0,
                downloadUrl: "",
                extension: "",
                contentType: "",
                sourceDentryId: options.dentryId || "",
            };
            if (part.data) {
                _deepExtractInfo(part.data, attachInfo);
            }
            if (attachInfo.fileName || attachInfo.dentryUuid || attachInfo.downloadUrl) {
                attachments.push(attachInfo);
            }
        }
    }

    // 同时扫描文档的 refs 部分，提取附件引用信息
    let wordPart = Object.values(docContent.parts).find(p => p.type === "application/x-alidocs-word");
    console.log("[adoc2md调试] docContent.parts keys:", Object.keys(docContent.parts));
    console.log("[adoc2md调试] wordPart.refs:", wordPart && wordPart.refs ? JSON.stringify(wordPart.refs).substring(0, 2000) : "无refs");
    if (wordPart && wordPart.data) {
        console.log("[adoc2md调试] wordPart.data keys:", Object.keys(wordPart.data));
    }
    if (wordPart && wordPart.refs) {
        let refs = wordPart.refs;
        for (let refKey in refs) {
            let ref = refs[refKey];
            if (ref && ref.type && ref.type !== "application/x-alidocs-word") {
                // 这是一个嵌入资源的引用
                let attachInfo = {
                    type: "ref",
                    refKey: refKey,
                    refType: ref.type || "",
                    dentryUuid: ref.dentryUuid || ref.dentryId || "",
                    fileName: ref.fileName || ref.name || "",
                    fileSize: ref.fileSize || ref.size || 0,
                    downloadUrl: ref.downloadUrl || ref.url || "",
                    extension: ref.extension || "",
                    contentType: ref.contentType || "",
                    sourceDentryId: options.dentryId || "",
                    data: ref.data || null,
                };
                attachments.push(attachInfo);
            }
        }
    }

    // 去重：根据 fileName + resourceId + downloadUrl 去重
    const dedupedAttachments = [];
    const seen = new Set();
    for (let att of attachments) {
        let key = (att.fileName || "") + "|" + (att.resourceId || "") + "|" + (att.downloadUrl || "") + "|" + (att.dentryUuid || "");
        if (!seen.has(key)) {
            seen.add(key);
            dedupedAttachments.push(att);
        }
    }

    return [f.getMarkdown(doc, "", w), warns, dedupedAttachments];
}
module.exports = {
    adoc2md,
}