import {Plugin, registerPlugin} from 'enmity/managers/plugins'
import {React} from 'enmity/metro/common'
import {create} from 'enmity/patcher'
// @ts-ignore
import manifest, {name as plugin_name} from '../manifest.json'
import Settings from "./components/Settings"
import {getByProps} from "enmity/modules"
// @ts-ignore
import Prism from './prismjs'
import {get, set} from "enmity/api/settings";
import {getByKeyword, getByName} from "enmity/metro";
import {sendCommand} from "../../K2geLocker/src/utils/native";

const Patcher = create('HighlightCode')

const ReactNative = getByProps("View")
const {DCDChatManager} = ReactNative.NativeModules

// https://github.com/PrismJS/prism/blob/master/themes/prism.css
const theme = {
    "punctuation": "#959da5",
    "class-name": "#fb8532",
    "keyword": "#ff7b72",
    "boolean": "#ff7b72",
    "parameter": "#f6f8fa",
    "function": "#b392f0",
    "property": "#b392f0",
    "comment": "#8b949e",
    "operator": "#79c0ff",
    "constant": "#79c0ff",
    "number": "#79c0ff",
    "string": "#79b8ff",
    "selector": "#79b8ff",
    "builtin": "#79b8ff",
}
const decorator = {
    "bold": "strong",
    "important": "strong",
    "italic": "em",
}
// https://prismjs.com/#supported-languages
const supportedLangs = Object.keys(Prism.languages)
const langList = {
    "html": ["html", true],
    "css": ["CSS", true],
    "javascript": ["JavaScript", true],
    "js": ["JavaScript", true],
    "python": ["Python", true],
    "py": ["Python", true],
    "bash": ["bash", true],
    "sh": ["bash", true],
    "shell": ["bash", true],
    "typescript": ["TypeScript", true],
    "ts": ["TypeScript", true],
    "tsx": ["React TSX", false],
    "c": ["c", true],
    "markdown": ["markdown", true],
    "md": ["markdown", true],
    "go": ["Go", true],
    "json": ["JSON", true],
    "swift": ["Swift", true],
    "perl": ["Perl", false],
    "ruby": ["Ruby", true],
    "rb": ["Ruby", true],
    "php": ["PHP", true],
    "java": ["Java", true],
    "jsx": ["React JSX", false],
    "lua": ["Lua", true],
    "kt": ["Kotlin", true],
    "kts": ["Kotlin", true],
    "objc": ["Objective-C", false],
    "objectivec": ["Objective-C", false]
}

function initVariable(name, defVal, force = false) {
    if (force) {
        set(plugin_name, name, defVal)
    } else if (get(plugin_name, name) === undefined) {
        set(plugin_name, name, defVal)
    }
}

const HighlightCode: Plugin = {
    ...manifest,
    onStart() {
        const metas = [["change_font", false], ["font_size", 10]]
        metas.forEach((meta) => {
            // @ts-ignore
            initVariable(...meta)
        })

        // const RowManager = getByName("RowManager")
        // Patcher.before(RowManager.prototype, "generate", (self, args, res) => {
        //     console.log("-------------")
        //     console.log(args)
        // })

        function highlightText(text, lang) {
            if (get(plugin_name, "show_line_num", false)) {
                text = text.split("\n").map((code, idx) => `${(idx + 1).toString().padStart(3)}  ${code}`).join("\n");
            }
            const res = Prism.highlight(text, Prism.languages[lang], lang)
            const contents = []
            res.forEach(part => {
                if (typeof part === "object") {
                    let style = part.alias ? part.alias : part.type
                    if (theme[style]) {
                        const color = theme[style]
                        contents.push({
                            content: [{type: 'text', content: part.content}],
                            target: 'usernameOnClick',
                            context: {
                                username: 1,
                                usernameOnClick: {
                                    linkColor: ReactNative.processColor(color)
                                },
                                medium: true
                            },
                            type: 'link'
                        })
                    } else if (decorator[style]) {
                        contents.push({type: decorator[style], content: part.content})
                    } else {
                        contents.push({type: 'text', content: part.content})
                    }
                } else {
                    contents.push({type: 'text', content: part})
                }
            })
            return contents
        }

        function walkContent(content) {
            let embeds = []
            content = content.map((obj) => {
                if (typeof obj.content === "object") {
                    obj.content = walkContent(obj.content)[0]
                }
                if (obj.type === "codeBlock" && supportedLangs.includes(obj.lang)) {
                    const meta = Object.keys(langList).includes(obj.lang) && langList[obj.lang][1] ? langList[obj.lang][0] : "Code"
                    const iconURL = `https://raw.githubusercontent.com/m4fn3/HighlightCode/master/logos/${meta}.png`
                    let embed
                    let rawContent = [{content: highlightText(obj.content, obj.lang), type: "paragraph"}, {content: "-- By CodeHighlight", type: "text"}]
                    // embed = {
                    //     titleColor: 4294112245,
                    //     borderColor: 4043309055,
                    //     backgroundColor: 4281019697,
                    //     thumbnailCornerRadius: 15,
                    //     // embedCanBeTapped: true, acceptLabelBackgroundColor: 4283322456, acceptLabelColor: 4294967295, acceptLabelIcon: 'file://', acceptLabelText: '', badgeIcon: 'file:///', channelIcon: 'file:///', channelName: '', guildName: '', headerIcon: 'file:///',
                    //     badgeCount: Object.keys(langList).includes(obj.lang) ? langList[obj.lang][0] : obj.lang,
                    //     content: rawContent,
                    //     // titleText: '', subtitle: '',
                    //     setIndex: 10,
                    //     creatorAvatar: iconURL,
                    //     extendedType: 1,
                    //     headerColor: 4287929591,
                    //     headerText: '',
                    //     headerTextColor: 4290099905,
                    //     isRsvped: true,
                    //     type: 0
                    // }
                    embed = {
                        type: 'rich',
                        description: rawContent,
                        author: {
                            name: Object.keys(langList).includes(obj.lang) ? langList[obj.lang][0] : obj.lang,
                            iconURL: iconURL,
                            iconProxyURL: iconURL
                        },
                        borderLeftColor: ReactNative.processColor("#e0e0ff"),
                        providerColor: ReactNative.processColor("#e0e0ff"),
                        headerTextColor: 4294967295,
                        bodyTextColor: 4292599521
                    }
                    embeds.push(embed)
                    obj.type = "text"
                    obj.content = ""
                }
                return obj
            })
            return [content, embeds]
        }

        Patcher.before(DCDChatManager, "updateRows", (_, args, __) => {
            const rows = JSON.parse(args[1])
            for (const row of rows) {
                if (row?.message?.content) {
                    let res = walkContent(row.message.content)
                    row.message.content = res[0]
                    // row.message.codedLinks ? row.message.codedLinks.push(...res[1]) : row.message.codedLinks = res[1]
                    row.message.embeds ? row.message.embeds.push(...res[1]) : row.message.embeds = res[1]
                }
                // coloring with
                //     row.message.content.push({
                //             type: 'mention',
                //             roleId: '0',
                //             roleColor: 7396088,
                //             content: [{type: 'text', content: '\nHighlightCodeing!'}]
                //         }
                //     )
            }
            args[1] = JSON.stringify(rows)
        })

        set(plugin_name, "_isK2genmity", false)
        sendCommand("K2geLocker", ["check"], (data) => {
            set(plugin_name, "_isK2genmity", true)
            if (data == "yes") {
                set(plugin_name, "_hasBiometricsPerm", true)
            }
        })
    },
    onStop() {
        Patcher.unpatchAll()
    }
    ,
    getSettingsPanel({settings}) {
        return <Settings settings={settings}/>
    }
}

registerPlugin(HighlightCode)
