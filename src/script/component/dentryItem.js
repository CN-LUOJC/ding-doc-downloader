const {getDocList, downloadBoard, httpDownload, downloadAmind, downloadAdoc, downloadAxls, downloadDocument, downloadAttachment} = require("../api");
const Loading = require("./loading");
const utils = require("../util");
const {getCfg, CFG_KEY} = require("../cfg");
const DentryItem = {
    props: {
        dentryInfo: {type: Object},
        hasmoredata: {type: Boolean},
    },
    components: {
        DentryItem: () => DentryItem,
        Loading: Loading
    },
    created(){
        this.hasMore = this.$props.hasmoredata;
        // console.log("this.hasMore", this.hasMore, this.$props.hasmoredata, this.hasmoredata)
        // console.log("this.dentryInfo", this.dentryInfo)
    },
    render(h) {

        let icon = "📄";
        let fileSize = "";
        if (this.dentryInfo.dentryType === "folder") {
            icon = "📁";
        } else {
            if (this.dentryInfo.fileSize) {
                fileSize = utils.beautifySize(this.dentryInfo.fileSize);
                fileSize = utils.beautifySize(this.dentryInfo.fileSize);
            } else {
                fileSize = "-";
            }
        }
        let title = this.dentryInfo.name + fileSize;

        if (!this.dentryInfo.hasChildren) {
            return h("li", {}, [h("label", {class: "rounded-sm"}, [
                h("input", {ref: "checkbox", class: "dddd-checkbox dddd-checkbox-xs dddd-checkbox-neutral", type: "checkbox", on: {change: this.onSelectChange}}),
                h("span", {on: {click: this.onDentryItemClick}, class: "whitespace-nowrap overflow-hidden overflow-ellipsis pointer-events-none", title: title}, [
                    h("span", {class: "mr-2"}, [
                        icon,
                        h("span", {ref: "downloadStat", class: "ml-2 hidden"}, [
                            h("div", {ref: "downloadProgress", role:"progressbar", class: "dddd-radial-progress text-primary", style: {"--dddd-value": "0", "--dddd-size": "12px", "--dddd-thickness": "3px"}}, []),
                            h("span", {ref: "downloadResult", class: "hidden"}, "❗")
                        ])
                    ]),
                    h("span", {}, [this.dentryInfo.name, h("span", {class: "text-zinc-500 float-right"}, [fileSize])])
                ])
            ])]);
        }

        let childrenDom = [];
        if ((this.dentryInfo.children||[]).length > 0) {
            (this.dentryInfo.children||[]).map(child => {
                childrenDom.push(h("DentryItem", {ref: "di", on: {selectChange: this.onChildrenSelectChange}, props: () => ({dentryInfo: child, hasmoredata: true})}))
            });
        }

        return h("li", {class: ""}, [
            h("details", {ref: "details", open: false, on: {"toggle": this.onChildrenOpenChange}}, [
                h("summary", {style: {"display": "grid"}}, [
                    h("input", {ref: "checkbox", class: "dddd-checkbox dddd-checkbox-xs dddd-checkbox-neutral", type: "checkbox", on: {change: this.onSelectChange}}),
                    h("span", {on: {click: this.onDentryItemClick}, class: "whitespace-nowrap overflow-hidden overflow-ellipsis", title: this.dentryInfo.name}, [
                        h("span", {class: "mr-2"}, [
                            h("span", {ref: "diricon"}, icon),
                            h("Loading", {ref: "loading", class: "hidden"}),
                            h("span", {ref: "downloadStat", class: "ml-2 hidden"}, [
                                h("div", {ref: "downloadProgress", role: "progressbar", class: "dddd-radial-progress text-primary", style: {"--dddd-value": "0", "--dddd-size": "12px", "--dddd-thickness": "3px"}
                                }, []),
                                h("span", {ref: "downloadResult", class: "hidden"}, "❗")
                            ])
                        ]),
                        h("span", {}, [this.dentryInfo.name])
                    ])
                ]),
                h("ul", {ref: "children"}, childrenDom)
            ])])
    },
    methods: {
        onChildrenSelectChange(arg) {
            this.$emit("selectChange", {data: [this.dentryInfo, ...arg.data], selected: arg.selected});
        },
        async onSelectChange(){
            let selected = this.$refs.checkbox.checked;
            this.$emit("selectChange", {data: [this.dentryInfo], selected: selected});

            // 如果选中的是一个有下级内容的，那么将下面的所有内容也选中。
            if (this.dentryInfo.hasChildren) {

                // 已经加载出来了数据，没有更多数据那么直接选中。
                if (!this.hasMore) {
                    let di = this.$refs.di;
                    if (!di) return;
                    if (!Array.isArray(di)) {
                        di = [di];
                    }
                    for (let i = 0; i < di.length; i++) {
                        di[i].$select(selected);
                    }
                } else {
                    // 还有数据，那么立即加载。
                    while (this.hasMore) {
                        await this.loadChildrenData(selected, this.loadMoreId);
                    }
                }
            }
        },
        onDentryItemClick() {
            if (!this.dentryInfo.hasChildren) {
                this.$refs.checkbox.checked = !this.$refs.checkbox.checked;
                this.onSelectChange();
            }
        },
        async loadChildrenData(selected, loadMoreId) {
            this.$refs.diricon.classList.add("hidden");
            this.$refs.loading.$el.classList.remove("hidden");

            const {data} = await getDocList(this.dentryInfo.dentryUuid, loadMoreId);
            this.dentryInfo.children = data.children;
            this.hasMore = data.hasMore;
            this.loadMoreId = data.loadMoreId || "";
            for (let i = 0; i < this.dentryInfo.children.length; i++) {
                this.addDentry(this.dentryInfo.children[i], selected);
            }

            this.$refs.diricon.classList.remove("hidden");
            this.$refs.loading.$el.classList.add("hidden");
        },
        async onChildrenOpenChange() {
            // console.log("详情：", this.$refs.details.open, "是否选中：", this.$refs.checkbox.checked);

            // 如果是打开目录，但是目录下没有数据，那么尝试加载数据。
            if (this.$refs.details.open) {
                while (this.hasMore) {
                    await this.loadChildrenData(this.$refs.checkbox.checked, this.loadMoreId);
                }
            }
        },

        addDentry(dentryInfo, selected) {
            const newdti = this.$createElement(h => {
                return h("DentryItem", {ref: "di", on: {selectChange: this.onChildrenSelectChange}, props: () => ({dentryInfo: dentryInfo, hasmoredata: true})});
            });
            if (selected) {
                let di = this.$refs.di;
                if (!di) return;
                if (!Array.isArray(di)) {
                    di = [di];
                }
                for (let i = 0; i < di.length; i++) {
                    di[i].$select(selected);
                }
            }
            this.$refs.children.append(newdti);
        },

        // 选中或取消选中当前文件
        $select(select) {
            if (this.$refs.checkbox.checked === select) {
                return;
            }

            this.$refs.checkbox.checked = select;
            this.onSelectChange();
        },

        // 返回是否选中或有下级选中。
        $hasSelected() {
            let selected = this.$refs.checkbox.checked;
            if (selected) {
                return true;
            }

            // 如果有下级，那么继续
            let allDi = this.$refs.di;
            if (!allDi) {
                return false;
            }
            if (!Array.isArray(allDi)) {
                allDi = [allDi];
            }

            for (let i = 0; i < allDi.length; i++) {
                let s = allDi[i].$hasSelected();
                if (s) {
                    return s;
                }
            }

            return false;
        },

        // 如果本文件被选中了，那么下载本文件。
        async $download(dirHandler, warnmap) {

            let selected = this.$refs.checkbox.checked; // 当前文件是否选中。
            let hasSelected = this.$hasSelected(); // 当前文件或下级内容是否有选中的。

            let currentName = utils.fixFileName(this.dentryInfo.name);

            let currentDirHandle = null;
            let currentFileHandler = null;

            // 当前文件是选中的，进行下载。
            if (selected) {
                if (this.dentryInfo.dentryType !== "folder") {
                    try {

                        this.$refs.downloadStat.classList.remove("hidden");

                        let extension = this.dentryInfo.extension;
                        let newext = "";
                        if (extension === "adraw") {
                            newext = getCfg(CFG_KEY.EXPORT_ADRAW_AS, ".jpg");
                        } else if (extension === "amind") {
                            newext = getCfg(CFG_KEY.EXPORT_AMIND_AS, ".jpg");
                        } else if (extension === "adoc") {
                            newext = getCfg(CFG_KEY.EXPORT_ADOC_AS, ".docx");
                        } else if (extension === "axls") {
                            newext = getCfg(CFG_KEY.EXPORT_AXLS_AS, ".xlsx");
                        }

                        this.$refs.downloadProgress.style.setProperty("--dddd-value", "16");

                        // 先检查主文档是否已存在，不创建新文件
                        let skipMainFile = false;
                        let fileName = currentName + newext;
                        try {
                            // 先尝试获取文件句柄，不创建
                            const tempFileHandler = await dirHandler.getFileHandle(fileName, {create: false});
                            const existingFile = await tempFileHandler.getFile();
                            const ext = this.dentryInfo.extension;
                            // 对于 adoc 导出的文件（docx/pdf），只检查文件是否存在，不检查大小
                            if (ext === "adoc") {
                                console.log("adoc 导出文件已存在，跳过下载:", currentName);
                                skipMainFile = true;
                                this.$refs.downloadProgress.style.setProperty("--dddd-value", "25");
                            } else if (existingFile.size === this.dentryInfo.fileSize) {
                                console.log("主文档已存在且大小匹配，跳过下载:", currentName);
                                skipMainFile = true;
                                this.$refs.downloadProgress.style.setProperty("--dddd-value", "25");
                            } else {
                                console.log("主文档已存在但大小不匹配，重新下载:", currentName, "期望:", this.dentryInfo.fileSize, "实际:", existingFile.size);
                            }
                        } catch (e) {
                            // 文件不存在，继续下载
                        }

                        // 只有不跳过的时候，才获取下载链接和文件句柄
                        let url = "";
                        let attachments = []; // 附件列表
                        if (!skipMainFile) {
                            if (extension === "adraw") {
                                url = await downloadBoard(this.dentryInfo.dentryKey, this.dentryInfo.docKey);
                            } else if (extension === "amind") {
                                url = await downloadAmind(this.dentryInfo.dentryKey, this.dentryInfo.docKey);
                            } else if (extension === "adoc") {
                                let durl = await downloadAdoc(this.dentryInfo.dentryUuid, this.dentryInfo.docKey, this.dentryInfo.dentryKey, this.dentryInfo.contentType, this.dentryInfo.name, this.dentryInfo.fileSize, newext);
                                if (typeof durl === "string") {
                                    url = durl
                                } else {
                                    url = durl[0];

                                    let warns = durl[1];
                                    if (warns && warns.length > 0) {
                                        warnmap.push({
                                            name: fileName,
                                            warns: warns,
                                        });
                                    }

                                    // 获取附件列表
                                    attachments = durl[2] || [];
                                }

                            } else if (extension === "axls") {
                                url = await downloadAxls(this.dentryInfo.dentryUuid, this.dentryInfo.docKey, this.dentryInfo.dentryKey, this.dentryInfo.contentType, this.dentryInfo.name, this.dentryInfo.fileSize);
                            } else if (this.dentryInfo.contentType !== "alidoc" && this.dentryInfo.contentType !== "link") {
                                url = await downloadDocument(this.dentryInfo.dentryUuid);
                            } else {
                                throw new Error(`不支持此类型文件的下载：contentType=${this.dentryInfo.contentType},extension=${extension}`);
                            }

                            this.$refs.downloadProgress.style.setProperty("--dddd-value", "25");

                            // 现在才创建文件句柄
                            currentFileHandler = await dirHandler.getFileHandle(fileName, {create: true});

                            // 剩下 75 的百分比拿给 下载文件显示。
                            await httpDownload(url, currentFileHandler, (progressStat) => {
                                if (progressStat.type === "begin") {
                                    // ..
                                    // console.log("开始下载")
                                } else if (progressStat.type === "pending") {
                                    // console.log("下载中" + progressStat.percent);
                                    this.$refs.downloadProgress.style.setProperty("--dddd-value", String(Math.round(progressStat.percent * 0.5) + 25));
                                } else if (progressStat.type === "success") {
                                    // console.log("下载中完成");
                                } else if (progressStat.type === "error") {
                                    console.log("下载出错：" + progressStat.error);

                                    this.$refs.downloadProgress.classList.add("hidden");
                                    this.$refs.downloadResult.classList.remove("hidden");
                                    this.$refs.downloadResult.textContent = "❗";
                                    this.$refs.downloadResult.title = `下载出错：${progressStat.error}`;

                                    this.$el.title = `下载出错：${progressStat.error}`;
                                }
                            });
                        }

                        // 如果主文档被跳过了，获取一下文件句柄
                        if (skipMainFile && !currentFileHandler) {
                            try {
                                currentFileHandler = await dirHandler.getFileHandle(fileName, {create: false});
                            } catch (e) {
                                // 获取失败也没关系
                            }
                        }

                        // 下载附件资源
                        // 只有当主文档重新下载时，才下载附件；如果主文档跳过，附件也跳过
                        if (!skipMainFile && attachments.length > 0) {
                            // 创建 attachments 子目录
                            let attachDirHandle = null;
                            try {
                                let parentDir = dirHandler;
                                attachDirHandle = await parentDir.getDirectoryHandle(currentName + "_attachments", {create: true});
                            } catch (e) {
                                console.log("创建附件目录失败: " + e.message);
                            }

                            if (attachDirHandle) {
                                let attachIndex = 0;
                                for (let attachInfo of attachments) {
                                    attachIndex++;
                                    try {
                                        // 确定附件文件名
                                        let attachFileName = attachInfo.fileName || attachInfo.refKey || ("attachment_" + attachIndex);
                                        // 确保有扩展名
                                        if (attachInfo.extension && !attachFileName.endsWith("." + attachInfo.extension)) {
                                            attachFileName += "." + attachInfo.extension;
                                        }
                                        attachFileName = utils.fixFileName(attachFileName);

                                        let attachFileHandler = await attachDirHandle.getFileHandle(attachFileName, {create: true});

                                        // 主文档重新下载了，所以附件也要重新下载，不管附件是否已存在
                                        console.log("主文档重新下载，附件也重新下载:", attachFileName);
                                        let attachResult = await downloadAttachment(attachInfo, this.dentryInfo.dentryKey, this.dentryInfo.docKey);

                                        if (!attachResult) {
                                            console.log("无法获取附件下载链接，跳过: " + (attachInfo.fileName || attachInfo.type));
                                            continue;
                                        }

                                        if (typeof attachResult === "object" && attachResult.blob) {
                                            // downloadAttachment 直接返回了文件二进制内容（Blob）
                                            console.log("附件直接写入文件:", attachFileName, "blob size:", attachResult.blob.size);
                                            const writable = await attachFileHandler.createWritable();
                                            await writable.write(attachResult.blob);
                                            await writable.close();
                                            console.log("附件写入完成:", attachFileName);
                                        } else {
                                            // downloadAttachment 返回了下载 URL
                                            await httpDownload(attachResult, attachFileHandler, (progressStat) => {
                                                if (progressStat.type === "pending") {
                                                    let attachProgress = ((attachIndex - 1) / attachments.length + progressStat.percent / 100 / attachments.length) * 50;
                                                    this.$refs.downloadProgress.style.setProperty("--dddd-value", String(Math.round(attachProgress + 25)));
                                                } else if (progressStat.type === "error") {
                                                    console.log("附件下载出错：" + progressStat.error);
                                                }
                                            });
                                        }

                                    } catch (e) {
                                        console.log("下载附件失败: " + e.message);
                                    }
                                }
                            }
                        }

                        // 最终标记完成
                        this.$refs.downloadProgress.classList.add("hidden");
                        this.$refs.downloadResult.classList.remove("hidden");
                        this.$refs.downloadResult.textContent = "✅";
                        this.$refs.downloadResult.title = "下载完成";
                    }catch (e) {
                        console.log("下载请求出错：" + e.message);
                        this.$refs.downloadProgress.classList.add("hidden");
                        this.$refs.downloadResult.classList.remove("hidden");
                        this.$refs.downloadResult.textContent = "❗";
                        this.$refs.downloadResult.title = `下载请求出错：${e.message}`;
                        this.$el.title = `下载请求出错：${e.message}`;
                    }
                }

                // 是个目录，那就只需要创建目录即可。
                if (this.dentryInfo.dentryType === "folder" || this.dentryInfo.hasChildren) {
                    currentDirHandle = await dirHandler.getDirectoryHandle(currentName + (this.dentryInfo.dentryType === "folder" ? "" : "_dir"), {create: true});
                }
            } else {
                // 当前文件没选中，但是可能子级有选中，这种情况，一定是要创建一个目录。
                if (hasSelected) {
                    currentDirHandle = await dirHandler.getDirectoryHandle(currentName + (this.dentryInfo.dentryType === "folder" ? "" : "_dir"), {create: true});
                }
            }

            if (hasSelected) {
                // 然后如果有下级，那么继续下载下级的。
                let allDi = this.$refs.di;
                if (!allDi) {
                    return;
                }
                if (!Array.isArray(allDi)) {
                    allDi = [allDi];
                }

                for (let i = 0; i < allDi.length; i++) {
                    await allDi[i].$download(currentDirHandle, warnmap);
                }
            }
        }
    },
    data: {
        hasMore: true, // 标记当前节点下是否还有更多数据可以加载。
        loadMoreId: "", // 加载更多数据使用的游标id，会在上一个加载列表的请求中返回的。
    }
}

module.exports = DentryItem;
