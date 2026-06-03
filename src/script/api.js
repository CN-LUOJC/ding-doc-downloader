const httpRequest = require("./Http");
const utils = require("./util");
const {adoc2md} = require("./component/adoc2md");
const accessToken = {value: ""};
const corpId = {value: ""};

function randomStr(len, base) {
    let str = "";
    let baseLength = base.length;
    for (let i = 0; i < len; i++) {
        let index = Math.floor(Math.random() * baseLength);
        str += base[index];
    }

    return str;
}

function getBase() {
    return `${window.location.protocol}//${window.location.host}`;
}

function getAccessToken() {
    return httpRequest({
        url: `${getBase()}/portal/api/v1/token/getAccessToken`,
        method: "POST"
    }).then(response => {
        if (!response.isSuccess) {
            return Promise.reject(new Error("getAccessToken Error: " + JSON.stringify(response)));
        }
        return response;
    });
}

function getDingWebAppVersion() {

    // let docframe = document.querySelectorAll("iframe");
    //
    // if (window.WSM_config && window.WSM_config.appVersion) {
    //     return window.WSM_config.appVersion;
    // }

    return "4.85.4";

}

/**
 *
 * @returns {Promise<string>}
 */
async function getDocOpenToken(dentryKey, docKey, cropid) {

    if (!window.lwpClient) {
        throw new Error("导出pdf需要lwp通信，当前lwp通信方案不可用。");
    }

    const resp = await lwpClient.sendMsg("/r/Adaptor/DingTalkDocI/getDocOpenToken", {
        "A-DENTRY-KEY": dentryKey,
        "utm_source": "portal",
        "utm_medium": "portal_space_file_tree",
        "SOURCE_DOC_APP": "doc",
        "A-DOC-KEY": docKey,
        "mid": randomStr(25, "0192837465") + " 0"
    }, [cropid, docKey]);

    const {body, code} = resp;

    if (code !== 200) {
        throw new Error(JSON.stringify(resp));
    }

    return body;
}

/**
 *
 */
function getUserInfo() {
    return httpRequest({
        url: `${getBase()}/api/users/getUserInfo`, method: "POST"
    }).then(response => {
        if (!response.isSuccess) {
            return Promise.reject(new Error("getUserInfo Error: " + JSON.stringify(response)));
        }
        return response;
    })
}

/**
 *
 * @returns {Promise<string>}
 */
async function getCorpId() {
    if (corpId.value) {
        return corpId.value;
    }

    let line = document.cookie.split(";").find(line => line.includes("portal_corp_id"));
    if (line) {
        return Promise.resolve(line.split("=").pop().trim());
    }

    return getUserInfo().then(({data}) => {
        return data.orgs.find(org => org.isMainOrg).corpId;
    });
}


/**
 *
 * @param config {{
 *     url: string,
 *     method?: "get"|"post",
 *     data?: any,
 *     headers?: object
 * }}
 */
async function doRequest(config) {
    config.url = `${getBase()}${config.url}`;
    config.headers = config.headers || {};

    if (!accessToken.value) {
        const {data} = await getAccessToken();
        accessToken.value = data.accessToken;
    }
    config.headers["A-Token"] = accessToken.value;

    if (!config.nocorpid) {
        if (!corpId.value) {
            const cid = await getCorpId();
            corpId.value = cid;
        }
        config.headers["corp-id"] = corpId.value;
    }
    return httpRequest(config).then(resp => {
        if (!resp.isSuccess) {
            return Promise.reject(new Error(JSON.stringify(resp)));
        }
        return resp;
    });
}

let content =
    {
        "version": 1,
        "type": "application/x-alidocs-package",
        "main": "00000000-0000-0000-0000-000000000001",
        "plugins": "00000000-0000-0000-0000-000000000002",
        "parts": {
            "00000000-0000-0000-0000-000000000001": {
                "id": "00000000-0000-0000-0000-000000000001",
                "type": "application/x-alidocs-word",
                "version": 1,
                "data": {
                    "style": {
                        "docDefaults": {
                            "type": "paragraph",
                            "default": 1,
                            "name": "dingdocnormal",
                            "data": {"rPr": {}, "pPr": {"spacing": {"before": 8, "after": 8}}}
                        }
                    },
                    "theme": [],
                    "settings": {"titleCover": {"isHide": true}},
                    "app": {},
                    "numberings": {},
                    "headers": {},
                    "body": ["root", {
                        "sectPr": {
                            "pgSz": {"w": 892, "h": 1127},
                            "pgMar": {
                                "top": 96,
                                "bottom": 96,
                                "left": 72,
                                "right": 72,
                                "header": 56.73,
                                "footer": 66.13,
                                "gutter": 0
                            }
                        }
                    }, ["p", {
                        "list": {
                            "listId": "wno61ttrdi",
                            "level": 0,
                            "isOrdered": true,
                            "isTaskList": false,
                            "listStyleType": "DEC_LEN_LROM_P",
                            "symbolStyle": {},
                            "listStyle": {"format": "decimal", "text": "%1.", "align": "left"},
                            "hideSymbol": false
                        }, "ind": {"left": 0}, "uuid": "lmzzty1ef5kmlb7f8sa"
                    }, ["span", {"data-type": "text"}, ["span", {"data-type": "leaf"}, "第二版本 autor 指令编辑器完成。"]]], ["p", {
                        "list": {
                            "listId": "wno61ttrdi",
                            "level": 0,
                            "isOrdered": true,
                            "isTaskList": false,
                            "isChecked": false,
                            "listStyleType": "DEC_LEN_LROM_P",
                            "symbolStyle": {},
                            "listStyle": {"format": "decimal", "text": "%1.", "align": "left"},
                            "hideSymbol": false,
                            "extraData": {}
                        }, "ind": {"left": 0}, "uuid": "lmzzu6s809xg90q5so06"
                    }, ["span", {"data-type": "text"}, ["span", {"data-type": "leaf"}, "团队建设："]]], ["p", {
                        "list": {
                            "listId": "wno61ttrdi",
                            "level": 1,
                            "isOrdered": true,
                            "isTaskList": false,
                            "isChecked": false,
                            "listStyleType": "DEC_LEN_LROM_P",
                            "symbolStyle": {},
                            "listStyle": {"format": "lowerLetter", "text": "%2.", "align": "left"},
                            "hideSymbol": false,
                            "extraData": {}
                        }, "ind": {"left": 0}, "uuid": "lmzzubpug9lvxscsbad"
                    }, ["span", {"data-type": "text"}, ["span", {"data-type": "leaf"}, "社区平台推动完成。"]]], ["p", {
                        "list": {
                            "listId": "wno61ttrdi",
                            "level": 1,
                            "isOrdered": true,
                            "isTaskList": false,
                            "isChecked": false,
                            "listStyleType": "DEC_LEN_LROM_P",
                            "symbolStyle": {},
                            "listStyle": {"format": "lowerLetter", "text": "%2.", "align": "left"},
                            "hideSymbol": false,
                            "extraData": {}
                        }, "ind": {"left": 0}, "uuid": "lmzzujki80w1unxk6ke"
                    }, ["span", {"data-type": "text"}, ["span", {"data-type": "leaf"}, "自动化文档完成。"]]], ["p", {
                        "list": {
                            "listId": "wno61ttrdi",
                            "level": 0,
                            "isOrdered": true,
                            "isTaskList": false,
                            "isChecked": false,
                            "listStyleType": "DEC_LEN_LROM_P",
                            "symbolStyle": {},
                            "listStyle": {"format": "decimal", "text": "%1.", "align": "left"},
                            "hideSymbol": false,
                            "extraData": {}
                        }, "ind": {"left": 0}, "uuid": "lmzzv1ih46bn7axky9b"
                    }, ["span", {"data-type": "text"}, ["span", {"data-type": "leaf"}, "指纹仿真度提升，继续推进。"]]], ["p", {
                        "list": {
                            "listId": "wno61ttrdi",
                            "level": 0,
                            "isOrdered": true,
                            "isTaskList": false,
                            "isChecked": false,
                            "listStyleType": "DEC_LEN_LROM_P",
                            "symbolStyle": {},
                            "listStyle": {"format": "decimal", "text": "%1.", "align": "left"},
                            "hideSymbol": false,
                            "extraData": {}
                        }, "ind": {"left": 0}, "uuid": "lmzzxy5pswytqysadgk"
                    }, ["span", {"data-type": "text"}, ["span", {"data-type": "leaf"}, "日常指令维护。"]]], ["p", {
                        "list": {
                            "listId": "wno61ttrdi",
                            "level": 0,
                            "isOrdered": true,
                            "isTaskList": false,
                            "isChecked": false,
                            "listStyleType": "DEC_LEN_LROM_P",
                            "symbolStyle": {},
                            "listStyle": {"format": "decimal", "text": "%1.", "align": "left"},
                            "hideSymbol": false,
                            "extraData": {}
                        }, "ind": {"left": 0}, "uuid": "lmzzvj78tph96gzrxcb"
                    }, ["span", {"data-type": "text"}, ["span", {"data-type": "leaf"}, "管理形式改变："]]], ["p", {
                        "list": {
                            "listId": "wno61ttrdi",
                            "level": 1,
                            "isOrdered": true,
                            "isTaskList": false,
                            "isChecked": false,
                            "listStyleType": "DEC_LEN_LROM_P",
                            "symbolStyle": {},
                            "listStyle": {"format": "lowerLetter", "text": "%2.", "align": "left"},
                            "hideSymbol": false,
                            "extraData": {}
                        }, "ind": {"left": 0}, "uuid": "lmzzw64ykn81iyb5sh"
                    }, ["span", {"data-type": "text"}, ["span", {"data-type": "leaf"}, "建设好人才梯队。"]]], ["p", {
                        "list": {
                            "listId": "wno61ttrdi",
                            "level": 1,
                            "isOrdered": true,
                            "isTaskList": false,
                            "isChecked": false,
                            "listStyleType": "DEC_LEN_LROM_P",
                            "symbolStyle": {},
                            "listStyle": {"format": "lowerLetter", "text": "%2.", "align": "left"},
                            "hideSymbol": false,
                            "extraData": {}
                        }, "ind": {"left": 0}, "uuid": "lmzzwfmaas1wsowax1"
                    }, ["span", {"data-type": "text"}, ["span", {"data-type": "leaf"}, "根据梯队，放权给对应人员。"]]]],
                    "footers": {},
                    "version": 1
                },
                "refs": {}
            }
        }
    };

// 导出 adoc → md 直接根据文档内容代码生成md内容。

// 导出 adoc → docx 流程
// upload_info
// submitExportJob
// queryExportJobInfo

// 导出 adoc → pdf 流程：
// upload_info
// createExportJob
// queryExportStatus
//

/**
 * 将钉钉文档导出为 markdown。 经过研究半天的研究，发现钉钉文档导出为markdown的情况是直接在浏览器中进行的，直接将文档数据通过
 * JavaScript代码拼装为markdown文本。
 *
 * 一开始我希望直接使用它网页中的代码来实现，但是那么多打包后的代码阅读起来实在是脑壳痛。翻来覆去在网页代码里面艰难爬行了半天
 * 最终abandon(放弃)了，还是直接直接根据文档元数据内容实现渲染吧~~。
 *
 * adoc的元数据来自 https://alidocs.dingtalk.com/api/document/data 接口的 data.documentContent.checkpoint.content 这里面。
 * 这个字段是一个字符串，字符串内容是一个json，parse即可得到文档元数据对象。在该对象的parts[0].data.body中保存了整个文档的每个段落，
 * 每句话，每个代码块每张图片区的内容信息。
 *
 * 格式是一个数组，数组定义内容如下：
 *
 * let frame = [
 *     "", // 第一个元素标识html节点名，比如：p, h1,h2,span 这些。 不过对于文档根节点， 这个必为 root
 *     {}, // 第二个元素是该节点的配置对象，里面根据不同的元素有不同的配置内容，比如：标题、颜色、坐标、间距信息等。
 *
 *     [], // 第三个及第三个之后所有的内容，都是该节点的子内容。子内容可以是：直接一个字符串文本内容，或者又是一个这种 frame 数据格式的数组。
 *     ...,
 *     ...
 * ]
 *
 *
 * @param docKey
 * @param dentryKey
 * @param name
 * @param dentryId
 */
async function downloadDingDoc2md(docKey, dentryKey, name, dentryId) {
    if (name.includes(".")) {
        let ns = name.split(".");
        ns.pop();
        name = ns.join(".").trim();
    }

    const {data: docData} = await getDocumentData(dentryKey, docKey);

    let [markdownTxt, warns, attachments] = adoc2md(docData.documentContent.checkpoint.content, `https://alidocs.dingtalk.com/i/nodes/${dentryId}`, {dentryId: dentryId});

    markdownTxt = `# ${name}\n\n${markdownTxt}`;

    const blob = new Blob([markdownTxt], { type: "text/plain" });
    return [URL.createObjectURL(blob), warns, attachments];
}

async function downloadDingDoc2pdf(docKey,dentryKey,name) {
    if (name.includes(".")) {
        let ns = name.split(".");
        ns.pop();
        name = ns.join(".").trim();
    }

    const {data: docData} = await getDocumentData(dentryKey, docKey);

    let nick = docData.fileMetaInfo.creator.nick;
    let corpId = docData.fileMetaInfo.corpId;
    let corpName = docData.userInfo.orgs.find(org => org.corpId === corpId).name;
    let watermark = "CLOSE";
    if (docData.fileMetaInfo.securityPolicyControl.watermarkEnable) {
        nick = docData.fileMetaInfo.securityPolicyControl.watermarkText.rowTwo;
        corpName = docData.fileMetaInfo.securityPolicyControl.watermarkText.rowOne;
        watermark = "OPEN";
    }

    const uploadBody = JSON.stringify({
        asl: docData.documentContent.checkpoint.content,
        optionsString: JSON.stringify({
            "openToken": {
                "docOpenToken": await getDocOpenToken(dentryKey, docKey, corpId),
                "corpId": corpId,
                "docKey": docKey
            },
            "isNew": true,
            "customConfig": {
                "content": "ONLYCONTENT",
                "mode": "PORTRAIT",
                "watermark": watermark,
                "nick": nick,
                "corpName": corpName,
                "link": "",
                "enableTableAutofitWidth": true
            },
            "fileName": name,
            "showDocTitle": true,
            "ctxVersion": docData.documentContent.checkpoint.baseVersion,
            "printStyle": {"backgroundColor": "var(--we_bg_default_color, rgba(255, 255, 255, 1))"},
            "version": 1,
            "appVersion": getDingWebAppVersion(),
            "exportType": "pdf",
            "corpId": corpId,
            "lang": "zh-CN"
        })
    });
    let {data: updata} = await doRequest({
        url: "/core/api/resources/9/upload_info",
        method: "POST",
        headers: {
            "a-doc-key": docKey,
            "a-host-doc-key": ""
        },
        data: {
            contentType: "",
            resourceName: docKey,
            size: uploadBody.length
        },
        nocorpid: true
    });


    // 将数据上传到oss
    await httpRequest({
        url: updata.uploadUrl,
        method: "put",
        headers: {
            "Content-Type": ""
        },
        data: uploadBody
    });

    // 创建导出任务
    let {data: jobData} = await doRequest({
        url: "/api/v2/files/createExportJob",
        method: "POST",
        headers: {
            "a-dentry-key": dentryKey,
            "a-doc-key": docKey,
        },
        data: {
            scene: "normal",
            storagePath: updata.storagePath
        },
        nocorpid: true
    });

    // 检查任务状态
    let done = false;
    let ossUrl = jobData.url;
    while (!done) {
        await utils.sleep(1000);
        let {data: exportData} = await doRequest({
            url: "/api/v2/files/queryExportStatus?jobId=" + jobData.jobId,
            method: "GET",
            headers: {
                "a-dentry-key": dentryKey,
                "a-doc-key": docKey,
            },
            nocorpid: true
        });
        done = exportData.done;
        if (done) {
            break;
        }
    }

    return ossUrl;
}


/**
 * 下载钉钉文件，包括：钉文档、钉表格；如果是钉文档那么下载为docx格式，如果是表格，那么下载为 .xlsx 格式
 */
async function downloadDingDoc(dentryUuid, docKey,dentryKey,contentType, name, size, exportType) {
    if (name.includes(".")) {
        let ns = name.split(".");
        ns.pop();
        name = ns.join(".").trim();
    }

    const {data: docData} = await getDocumentData(dentryKey, docKey);

    let uploadBody;
    if (exportType === "dingTalkdocTodocx") {
        uploadBody = JSON.stringify(Object.values(JSON.parse(docData.documentContent.checkpoint.content).parts).find(p => p.type === "application/x-alidocs-word").data);
    } else {
        let contentdata = JSON.parse(docData.documentContent.checkpoint.content);
        contentdata.setting.calc = {enableFormulaStatus: true};
        uploadBody = JSON.stringify({
            content: contentdata.content,
            customTabsMeta: contentdata.customTabsMeta,
            modules: {
                "asyncFunctionCache": [],
                "form": {},
                "dimensionMeta": {},
                "protectionRange": {},
                "follow": {},
                "tag": {},
                "dingtalkTask": [],
                "merge": {},
                "mention": {},
                "appLock": {},
                "lock": {},
                "float": {},
                "filter": {},
                "dataValidation": {},
                "reaction": {},
                "reminder": {},
                "comment": {},
                "filterView": {},
                "pivotTable": {},
                "conditionalFormatting": {},
                "calc": {"shared": {"exprs": []}},
                "externalLink": [],
                "table": {},
                "definedName": []
            },
            setting: contentdata.setting,
            sheetsMeta: contentdata.sheetsMeta,
            style: contentdata.style,
            tabs: contentdata.tabs,
            version: contentdata.version
        });
    }

    let {data: updata} = await doRequest({
        url: "/core/api/resources/9/upload_info",
        method: "POST",
        headers: {
            "a-doc-key": docKey,
            "a-host-doc-key": ""
        },
        data: {
            contentType: "",
            resourceName: name,
            size: uploadBody.length
        },
        nocorpid: true
    });

    await httpRequest({
        url: updata.uploadUrl,
        method: "put",
        headers: {
            "Content-Type": ""
        },
        data: uploadBody
    })

    let {data: jobData} = await doRequest({
        url: "/core/api/document/submitExportJob",
        method: "POST",
        headers: {
            "a-dentry-key": dentryKey,
            "a-doc-key": docKey,
        },
        data: {
            exportType: exportType,
            storagePath: updata.storagePath
        },
        nocorpid: true
    });

    let exportStatus = "";
    let ossUrl = "";
    while (exportStatus !== "success") {
        await utils.sleep(1000);
        let {data: exportData} = await doRequest({
            url: "/core/api/document/queryExportJobInfo?jobId=" + jobData.jobId,
            method: "GET",
            headers: {
                "a-dentry-key": dentryKey,
                "a-doc-key": docKey,
            },
            nocorpid: true
        });
        exportStatus = exportData.status;
        if (exportStatus === "success") {
            ossUrl = exportData.ossUrl;
        } else if (exportStatus === "failed") {
            throw new Error("导出失败");
        }
    }

    return ossUrl;
}

/**
 * 获取文档内容
 */
function getDocumentData(dentryKey, docKey = "", source = "") {
    let data = {dentryKey, pageMode: 2, fetchBody: true};
    if (source) {
        data["source"] = source;
    }
    return doRequest({
        url: "/api/document/data",
        method: "POST",
        headers: {
            "a-dentry-key": dentryKey,
            "a-doc-key": docKey || ""
        },
        data: data
    });
}

/**
 * 专用下载 amind 和 adraw
 * @param asl
 * @param optionsString
 * @return {Promise<*>}
 */
async function exportAsImg(asl, optionsString, scene = "", dentryKey, docKey) {
    let data = {
        asl: JSON.stringify(asl),
        optionsString: JSON.stringify(optionsString)
    };
    if (scene) {
        data['scene'] = scene;
    }

    let hd = {
        "a-dentry-key": dentryKey || "",
    };
    if (docKey) {
        hd["a-doc-key"] = docKey;
    }

    let {data: jobData} = await doRequest({
        url: "/api/v2/files/createExportJob",
        headers: hd,
        method: "post",
        data: data
    });

    let {jobId, done, url} = jobData;

    while (!done) {
        await utils.sleep(1000);
        let {data: jobStatus} = await doRequest({
            url: `/api/v2/files/queryExportStatus?jobId=${encodeURIComponent(jobId)}`,
            method: "get",
            headers: {
                "a-dentry-key": dentryKey,
                "a-doc-key": docKey
            },
        });
        done = jobStatus.done;
    }

    return url;
}

/**
 * 从钉钉文档内容中提取附件信息列表。
 * 用于 docx/pdf 导出时也能获取到附件资源。
 * @param dentryKey {string}
 * @param docKey {string}
 * @param dentryId {string}
 * @return {Promise<object[]>}
 */
async function extractAttachments(dentryKey, docKey, dentryId) {
    try {
        const {data: docData} = await getDocumentData(dentryKey, docKey);
        let docContent = JSON.parse(docData.documentContent.checkpoint.content);
        let wordPart = Object.values(docContent.parts).find(p => p.type === "application/x-alidocs-word");
        const attachments = [];

        // 调试：输出完整的文档内容结构
        console.log("[附件调试] docContent keys:", Object.keys(docContent));
        console.log("[附件调试] parts types:", Object.values(docContent.parts).map(p => p.type));
        console.log("[附件调试] wordPart refs:", JSON.stringify(wordPart && wordPart.refs ? wordPart.refs : "无refs"));
        console.log("[附件调试] wordPart data keys:", wordPart && wordPart.data ? Object.keys(wordPart.data) : "无data");

        // 调试：输出所有非 word 类型的 parts 的完整数据
        for (let partKey in docContent.parts) {
            let part = docContent.parts[partKey];
            if (part.type !== "application/x-alidocs-word") {
                console.log("[附件调试] 非word part, key:", partKey, "type:", part.type, "完整数据:", JSON.stringify(part).substring(0, 3000));
            }
        }

        // 扫描所有非 word 类型的 parts，提取附件信息
        for (let partKey in docContent.parts) {
            let part = docContent.parts[partKey];
            if (part.type === "application/x-alidocs-plugin-attachment") {
                // 附件类型的 part
                let attachInfo = _extractAttachmentFromPart(part, partKey, dentryId);
                if (attachInfo) {
                    attachments.push(attachInfo);
                }
            } else if (part.type !== "application/x-alidocs-word") {
                // 其他非 word 类型（可能是视频、音频等）
                let attachInfo = _extractAttachmentFromPart(part, partKey, dentryId);
                if (attachInfo) {
                    attachments.push(attachInfo);
                }
            }
        }

        if (wordPart && wordPart.refs) {
            let refs = wordPart.refs;
            for (let refKey in refs) {
                let ref = refs[refKey];
                console.log("[附件调试] ref key:", refKey, "ref内容:", JSON.stringify(ref));
                if (ref && ref.type && ref.type !== "application/x-alidocs-word") {
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
                        sourceDentryId: dentryId || "",
                        data: ref.data || null,
                    };
                    attachments.push(attachInfo);
                }
            }
        }

        // 扫描文档 body 中的 card 节点提取附件信息，并关联 parts 中的数据
        if (wordPart && wordPart.data && wordPart.data.body) {
            let body = wordPart.data.body;
            _collectCardAttachments(body, attachments, dentryId, docContent.parts);
        }

        console.log("[附件调试] 最终提取到的附件数量:", attachments.length, "附件列表:", JSON.stringify(attachments));

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

        console.log("[附件调试] 去重后附件数量:", dedupedAttachments.length);
        return dedupedAttachments;
    } catch (e) {
        console.log("提取附件信息失败: " + e.message);
        return [];
    }
}

/**
 * 从 part 中提取附件下载信息
 * @param part {object} docContent.parts 中的一个 part
 * @param partKey {string} part 的 key
 * @param dentryId {string}
 * @return {object|null}
 */
function _extractAttachmentFromPart(part, partKey, dentryId) {
    if (!part || !part.data) {
        console.log("[附件调试] part无data, key:", partKey);
        return null;
    }

    let data = part.data;
    console.log("[附件调试] 尝试从part提取附件, key:", partKey, "type:", part.type, "data keys:", Object.keys(data));

    // 附件数据可能在 data 的不同字段中
    let attachInfo = {
        type: part.type || "",
        partKey: partKey,
        dentryUuid: "",
        fileName: "",
        fileSize: 0,
        downloadUrl: "",
        extension: "",
        contentType: "",
        sourceDentryId: dentryId || "",
    };

    // 遍历 data 的所有字段，查找附件相关信息
    // 钉钉文档的附件数据结构可能嵌套在不同位置
    _deepExtractAttachmentInfo(data, attachInfo);

    console.log("[附件调试] 从part提取结果:", JSON.stringify(attachInfo));
    return attachInfo;
}

/**
 * 递归从数据对象中提取附件信息
 * @param obj 数据对象
 * @param attachInfo 附件信息对象（会被修改）
 */
function _deepExtractAttachmentInfo(obj, attachInfo) {
    if (!obj || typeof obj !== "object") return;

    if (Array.isArray(obj)) {
        for (let item of obj) {
            _deepExtractAttachmentInfo(item, attachInfo);
        }
        return;
    }

    // 检查常见字段名
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
    if (obj.downloadCode && !attachInfo.downloadUrl) attachInfo.downloadUrl = obj.downloadCode;
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
            "video/x-msvideo": "avi",
            "audio/mpeg": "mp3",
            "audio/wav": "wav",
            "image/png": "png",
            "image/jpeg": "jpg",
            "image/gif": "gif",
            "application/zip": "zip",
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document": "docx",
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": "xlsx",
            "application/vnd.openxmlformats-officedocument.presentationml.presentation": "pptx",
            "application/msword": "doc",
            "application/vnd.ms-excel": "xls",
            "application/vnd.ms-powerpoint": "ppt",
        };
        if (extMap[attachInfo.contentType]) {
            attachInfo.extension = extMap[attachInfo.contentType];
        }
    }

    // 继续递归（但限制深度避免无限循环）
    for (let key in obj) {
        if (typeof obj[key] === "object" && obj[key] !== null) {
            _deepExtractAttachmentInfo(obj[key], attachInfo);
        }
    }
}

/**
 * 递归扫描文档 body 中的 card 节点，提取附件信息
 * @param frame 文档节点
 * @param attachments {object[]} 附件收集列表
 * @param dentryId {string}
 */
function _collectCardAttachments(frame, attachments, dentryId, docContentParts) {
    if (!Array.isArray(frame)) return;

    let tagName = frame[0];
    let tagOption = frame[1];

    if (tagName === "card") {
        console.log("[附件调试] 发现card节点, tagOption:", JSON.stringify(tagOption));
    }

    if (tagName === "card" && tagOption) {
        let metadata = tagOption.metadata || {};
        let cardType = metadata.type || "";
        let cardTypeLower = cardType.toLowerCase();
        console.log("[附件调试] card metadata:", JSON.stringify(metadata));

        // 判断是否是附件类型的 card
        // 支持类型：application/x-alidocs-plugin-attachment, attachment, video, audio, file, pdf, document
        const isAttachment = cardTypeLower.includes("attachment") ||
            cardTypeLower.includes("video") ||
            cardTypeLower.includes("audio") ||
            cardTypeLower.includes("file") ||
            cardTypeLower.includes("pdf") ||
            cardTypeLower.includes("document") ||
            cardTypeLower.includes("image") ||
            cardTypeLower.includes("media");

        if (isAttachment) {
            let attachmentInfo = {
                type: cardType,
                dentryUuid: metadata.dentryUuid || metadata.dentryId || "",
                fileName: metadata.fileName || metadata.name || "",
                fileSize: metadata.fileSize || 0,
                downloadUrl: metadata.downloadUrl || metadata.url || "",
                extension: metadata.extension || "",
                contentType: metadata.contentType || "",
                sourceDentryId: dentryId || "",
            };

            // 如果 metadata 中有 id，尝试从 docContentParts 中查找对应的 part 数据
            if (metadata.id && docContentParts) {
                let part = docContentParts[metadata.id];
                if (part) {
                    console.log("[附件调试] 通过metadata.id找到part, type:", part.type, "data:", JSON.stringify(part.data).substring(0, 2000));
                    _deepExtractAttachmentInfo(part.data, attachmentInfo);
                } else {
                    // 尝试遍历所有 parts 查找匹配的
                    for (let partKey in docContentParts) {
                        let p = docContentParts[partKey];
                        if (p.type === cardType || p.id === metadata.id) {
                            console.log("[附件调试] 通过遍历找到匹配part, key:", partKey);
                            _deepExtractAttachmentInfo(p.data, attachmentInfo);
                            break;
                        }
                    }
                }
            }

            // 从 card 子内容中提取更多附件信息
            for (let i = 2; i < frame.length; i++) {
                let item = frame[i];
                if (Array.isArray(item) && item[1]) {
                    let itemOption = item[1];
                    if (itemOption.dentryUuid && !attachmentInfo.dentryUuid) attachmentInfo.dentryUuid = itemOption.dentryUuid;
                    if (itemOption.fileName && !attachmentInfo.fileName) attachmentInfo.fileName = itemOption.fileName;
                    if (itemOption.name && !attachmentInfo.fileName) attachmentInfo.fileName = itemOption.name;
                    if (itemOption.fileSize && !attachmentInfo.fileSize) attachmentInfo.fileSize = itemOption.fileSize;
                    if (itemOption.downloadUrl && !attachmentInfo.downloadUrl) attachmentInfo.downloadUrl = itemOption.downloadUrl;
                    if (itemOption.url && !attachmentInfo.downloadUrl) attachmentInfo.downloadUrl = itemOption.url;
                    if (itemOption.extension && !attachmentInfo.extension) attachmentInfo.extension = itemOption.extension;
                    if (itemOption.contentType && !attachmentInfo.contentType) attachmentInfo.contentType = itemOption.contentType;
                }
            }

            console.log("[附件调试] card附件提取结果:", JSON.stringify(attachmentInfo));
            attachments.push(attachmentInfo);
        }
    }

    // 递归处理子节点
    for (let i = 2; i < frame.length; i++) {
        if (Array.isArray(frame[i])) {
            // 调试：输出所有非标准节点
            let childTag = frame[i][0];
            if (childTag !== "p" && childTag !== "span" && childTag !== "h1" && childTag !== "h2" && childTag !== "h3" && childTag !== "h4" && childTag !== "h5" && childTag !== "root" && childTag !== "table" && childTag !== "tr" && childTag !== "tc" && childTag !== "code" && childTag !== "br" && childTag !== "hr" && childTag !== "a" && childTag !== "img" && childTag !== "container") {
                console.log("[附件调试] 非标准节点类型:", childTag, "内容:", JSON.stringify(frame[i]).substring(0, 500));
            }
            _collectCardAttachments(frame[i], attachments, dentryId, docContentParts);
        }
    }
}

module.exports = {
    /**
     * 获取文档信息
     *
     */
    getDocInfo(dentryUuid) {
        return doRequest({
            url: "/box/api/v2/dentry/info?dentryUuid=" + encodeURIComponent(dentryUuid),
            method: "GET",
        });
    },

    // 列出文档子级内容
    getDocList(dentryUuid, loadMoreId = "") {
        // loadMoreId
        let query = "pageSize=100&dentryUuid=" + encodeURIComponent(dentryUuid);
        if (loadMoreId) {
            query += `&loadMoreId=${encodeURIComponent(loadMoreId)}`;
        }
        return doRequest({
            url: "/box/api/v2/dentry/list?" + query,
            method: "GET"
        }).then(response => {
            // if (response.data.children && response.data.children.length > 0) {

            //     // 将文件夹放在前面，文件放在后面。
            //     let dirs = [];
            //     let files = [];
            //     for (let i = 0; i < response.data.children.length; i++) {
            //         if (response.data.children[i].dentryType === "folder") {
            //             dirs.push(response.data.children[i]);
            //         } else {
            //             files.push(response.data.children[i]);
            //         }
            //     }
            //     response.data.children = dirs.concat(files);
            // }

            return response;
        })
    },

    /**
     *  获取空间的 dentry 信息。如果传了空间id，那么获取指定空间id的信息。如果没传，那么获取自己的空间的信息。
     *
     * @param spaceId {string?}
     */
    getSpaceInfo(spaceId) {
        if (spaceId) {
            return doRequest({
                url: "/box/api/v1/space/info?id=" + encodeURIComponent(spaceId), method: "GET"
            })
        } else {
            return doRequest({
                url: "/box/api/v1/mine/space/info", method: "GET"
            });
        }
    },


    /**
     * 下载 用户自己上传的原始文件 文件，文件contentType类型不是 alidoc 的可以使用此方法。
     * @param dentryUuid
     * @return {Promise<string>} 返回文件下载链接
     */
    downloadDocument(dentryUuid) {
        return doRequest({
            url: "/box/api/v2/file/download?dentryUuid=" + encodeURIComponent(dentryUuid) + "&supportDownloadTypes=URL_PRE_SIGNATURE,HTTP_TO_CENTER&downloadType=URL_PRE_SIGNATURE",
            method: "GET"
        }).then(response => {
            return response.data.ossUrlPreSignatureInfo.preSignUrls[0];
        });
    },

    /**
     * 下载钉钉文档内嵌的附件资源。
     * 返回值可能是：1) 预签名下载URL字符串 2) {blob, fileName} 对象（直接拿到文件内容）
     * @param attachmentInfo {object} 附件信息对象
     * @param attachmentInfo.resourceId {string} 附件的 resourceId
     * @param attachmentInfo.dentryUuid {string} 附件的 dentryUuid
     * @param attachmentInfo.downloadUrl {string} 附件的 src/downloadUrl
     * @param attachmentInfo.fileName {string} 附件文件名
     * @param attachmentInfo.type {string} 附件类型
     * @param dentryKey {string} 所属文档的 dentryKey
     * @param docKey {string} 所属文档的 docKey
     * @return {Promise<string|object|null>}
     */
    async downloadAttachment(attachmentInfo, dentryKey, docKey) {
        console.log("[附件下载] 开始下载附件:", JSON.stringify(attachmentInfo).substring(0, 500));

        // 方式1：通过 resourceId 调用 /core/api/resources/{resourceId}/detail
        // 这个 API 直接返回文件二进制内容
        if (attachmentInfo.resourceId) {
            try {
                console.log("[附件下载] 尝试通过 resourceId 获取文件内容:", attachmentInfo.resourceId);
                const blob = await httpRequest({
                    url: getBase() + "/core/api/resources/" + attachmentInfo.resourceId + "/detail",
                    method: "GET",
                    headers: {
                        "A-Token": accessToken.value,
                        "corp-id": corpId.value,
                        "a-dentry-key": dentryKey || "",
                        "a-doc-key": docKey || "",
                    },
                    originResponse: true,
                });
                console.log("[附件下载] 通过 resourceId 获取文件内容成功, blob size:", blob.size, "type:", blob.type);
                return {blob: blob, fileName: attachmentInfo.fileName || ""};
            } catch (e) {
                console.log("[附件下载] 通过 resourceId 获取文件内容失败: " + e.message);
            }
        }

        // 方式2：通过 src 路径获取文件内容（同样是直接返回二进制）
        if (attachmentInfo.downloadUrl && attachmentInfo.downloadUrl.startsWith("/core/api/resources/")) {
            try {
                console.log("[附件下载] 尝试通过 src 路径获取文件内容:", attachmentInfo.downloadUrl);
                const blob = await httpRequest({
                    url: getBase() + attachmentInfo.downloadUrl,
                    method: "GET",
                    headers: {
                        "A-Token": accessToken.value,
                        "corp-id": corpId.value,
                        "a-dentry-key": dentryKey || "",
                        "a-doc-key": docKey || "",
                    },
                    originResponse: true,
                });
                console.log("[附件下载] 通过 src 路径获取文件内容成功, blob size:", blob.size);
                return {blob: blob, fileName: attachmentInfo.fileName || ""};
            } catch (e) {
                console.log("[附件下载] 通过 src 路径获取文件内容失败: " + e.message);
            }
        }

        // 方式3：通过 dentryUuid 获取预签名下载链接
        if (attachmentInfo.dentryUuid) {
            try {
                console.log("[附件下载] 尝试通过 dentryUuid 下载:", attachmentInfo.dentryUuid);
                return await module.exports.downloadDocument(attachmentInfo.dentryUuid);
            } catch (e) {
                console.log("[附件下载] 通过 dentryUuid 下载失败: " + e.message);
            }
        }

        // 方式4：直接使用 downloadUrl（如果是完整的 https URL）
        if (attachmentInfo.downloadUrl && attachmentInfo.downloadUrl.startsWith("http")) {
            return attachmentInfo.downloadUrl;
        }

        console.log("[附件下载] 所有下载方式均失败");
        return null;
    },

    /**
     * 下载 axls 文件
     * @param dentryUuid
     * @return {Promise<string>} 返回文件下载链接
     */
    async downloadAxls(dentryUuid, docKey,dentryKey,contentType, name, size) {
        return downloadDingDoc(dentryUuid, docKey, dentryKey, contentType, name, size , "dingTalksheetToxlsx");
    },


    /**
     * 下载 adoc 文件
     * @param dentryUuid
     * @param docKey
     * @param dentryKey
     * @param contentType
     * @param name
     * @param size
     * @param downloadFileType {".md"|".pdf"|".docx"} 下载后缀，adoc 类型的文件，支持下载为：.md, .pdf 和 .docx
     * @return {Promise<string|[string, string[], object[]]>}
     */
    async downloadAdoc(dentryUuid, docKey,dentryKey,contentType, name, size, downloadFileType) {
        if (downloadFileType === ".docx") {
            let url = await downloadDingDoc(dentryUuid, docKey, dentryKey, contentType, name, size, "dingTalkdocTodocx");
            // docx 格式也需要提取附件信息
            let attachments = await extractAttachments(dentryKey, docKey, dentryUuid);
            if (attachments.length > 0) {
                return [url, [], attachments];
            }
            return url;
        } else if (downloadFileType === ".pdf") {
            let url = await downloadDingDoc2pdf(docKey, dentryKey, name);
            // pdf 格式也需要提取附件信息
            let attachments = await extractAttachments(dentryKey, docKey, dentryUuid);
            if (attachments.length > 0) {
                return [url, [], attachments];
            }
            return url;
        } else if (downloadFileType === ".md") {
            return downloadDingDoc2md(docKey, dentryKey, name, dentryUuid);
        } else {
            throw new Error(`不支持导出为${downloadFileType}格式`);
        }
    },

    /**
     * 下载 amind 钉钉脑图文件。
     * @param dentryKey
     * @return {Promise<void>}
     */
    async downloadAmind(dentryKey, docKey) {

        let {data: docData} = await getDocumentData(dentryKey);
        let docContent = JSON.parse(docData.documentContent.checkpoint.content);
        let part = Object.values(docContent.parts).find(p => p.type === "application/x-alidocs-mind");
        let asl = part.data;

        return exportAsImg(asl, {
            "exportType": "snapshot",
            "appVersion": "1.28.0",
            "bizConfig": {
                "mode": 2,
                "collapseNodes": [],
                "padding": 50,
                "sheetId": "sheet1",
                "signConfig": {"weMind": "钉钉脑图"},
                "placeholder": "请输入文字",
                "scale": 2
            }
        }, "", dentryKey, docKey);
    },

    /**
     * 下载 adraw 钉钉白板文件
     * @return {Promise<void>}
     */
    async downloadBoard(dentryKey, docKey) {
        let {data: adrawData} = await getDocumentData(dentryKey, docKey, "adraw");
        let docContent = JSON.parse(adrawData.documentContent.checkpoint.content);
        let stage = Object.values(docContent.parts).find(p => p.type === "application/x-alidocs-draw");
        let stagedata = stage.data;

        // 计算画布大小
        let page = stagedata.pages[0];
        let minX=0,maxX=0,minY=0,maxY=0;
        for (let i = 0; i < page.shapes.length; i++) {
            let shap = page.shapes[i];
            if (shap.x < minX) {minX = shap.x;}
            if ((shap.x + shap.width) > maxX) {maxX = shap.x + shap.width}
            if (shap.y < minY) {minY = shap.y;}
            if ((shap.y + shap.height) > maxY) {maxY = shap.y + shap.height}
        }

        let width = Math.round(utils.numberRound(maxX - minX)) + 10;
        let height = Math.round(utils.numberRound(maxY - minY)) + 10;

        return exportAsImg(docContent, {
            "exportType": "snapshot",
            "bizConfig": {},
            "appVersion": "0.21.2",
            "width": width,
            "height": height
        }, "userExport", dentryKey, docKey);
    },

    /**
     *
     * @param url
     * @param fileHandler {FileSystemFileHandle}
     * @param cb
     * @return {Promise<void>}
     */
    async httpDownload(url, fileHandler, cb) {
        return new Promise((resolve, reject) => {

            async function save2File(response) {
                // console.log("开始写入文件", typeof response);
                const writer = await fileHandler.createWritable();
                await writer.write(new Blob([response]));
                await writer.close();
                // console.log("写入文件完成")
            }

            httpRequest({
                url: url,
                method: "get",
                originResponse: true,
                onBegin(loaded, total) {
                    cb({type: "begin", percent: utils.numberRound((loaded / total) * 100)})
                },
                onProgress(loaded, total) {
                    cb({type: "pending", percent: utils.numberRound((loaded / total) * 100)})
                },
                onEnd(error, response) {
                    if (error) {
                        cb({type: "error", error: error});
                        reject(new Error(error));
                    } else {
                        save2File(response).then(() => {
                            cb({type: "success"});
                            resolve();
                        }).catch(reject);
                    }
                }
            }).catch(reject);
        });
    }
}

