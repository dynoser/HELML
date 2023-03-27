'use strict';
const HELML = require('./HELML');

class htmlvshelml {

    static nonClosedHTMLTags = ['area','base','br','col','embed','hr','img','input','link','meta','param','source','track','wbr'];

    static html_to_helml(htmlString) {
        const regex = /<(\/?)([a-zA-Z][-\w]*)\s*([^>]*)>/g;
        const attributeRegex = /([a-zA-Z][-\w]*)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|(\S+)))?/g;

        let results_arr = [];
        
    
        function outElement(level, elementName, attributes) {
            const indent = ':'.repeat(level > 0 ? level : 0);
            results_arr.push(indent + '--');
            results_arr.push(indent + ':--: ' + elementName);

            if (attributes.length) {
                //results_arr.push(indent + ':-+');
                for (let attribute of attributes) {
                    if (typeof attribute === 'string') {
                        results_arr.push(indent + ':--: ' + attribute);
                    } else {
                        results_arr.push(indent + ':' + attribute.name + ': ' + attribute.value);
                    }
                }
            }
        }

        function parseAttributes(attributeString) {
            let match;
            const attributes = [];

            if (attributeString.length) {
                while ((match = attributeRegex.exec(attributeString)) !== null) {
                    const attrName = match[1];
                    const attrValue = match[2] || match[3] || match[4] || true;

                    if (attrValue === true) {
                        attributes.push(attrName);
                    } else {
                        attributes.push({
                            "name": attrName,
                            "value": attrValue
                        });
                    }
                }
            }
        
            return attributes;
        }
    
        let match;
        let level = 0;
        let lastIndex = 0;
    
        while ((match = regex.exec(htmlString)) !== null) {
            const isClosingTag = match[1] === "/";
            const isSelfClosed = match[0].endsWith("/>");
            const tagName = match[2];
            const tagLowerCase = tagName.toLowerCase()
            const attributeString = match[3];

            const internalText = htmlString.slice(lastIndex, match.index).trim();
            if (internalText) {
                outElement(level + 1, "_=" + internalText, []);
            }
            
            lastIndex = regex.lastIndex;
            
            if (!isClosingTag) {
                const attributes = parseAttributes(attributeString);
                outElement(level, tagName, attributes);
                if (!isSelfClosed && !htmlvshelml.nonClosedHTMLTags.includes(tagLowerCase)) {
                    level++;
                }
            } else {
                level--;
            }
        }

        if (htmlString.slice(lastIndex).trim()) {
            outElement(level, "_=", [htmlString.slice(lastIndex).trim()]);
        }

        return results_arr;
    }

    static helml_to_html(h_ml) {
        let tags_arr = HELML.decode(h_ml);
        let html_arr = [];
        htmlvshelml._tag_to_html(tags_arr, html_arr, 0);
        return html_arr.join("\n");
    }
    
    static _tag_to_html(tags_arr, html_arr, level) {
        for (let key in tags_arr) {
            let inTagArr = tags_arr[key];
            let resArr = [];
            if (typeof inTagArr !== 'object') continue;
    
            if (!("0" in inTagArr)) continue;
            let tagName = inTagArr[0];
            if (typeof tagName === "string") {
                if (tagName.startsWith('_=')) {
                    html_arr.push("\t".repeat(level) + tagName.slice(2));
                    continue;
                }
            } else {
                console.log("Bad tagName:");
                console.log(tagName);
                console.log(inTagArr);
                continue;
            }
            let subLevelsCnt = 0;
            for(let InTagKey in inTagArr) {
                if (typeof inTagArr[InTagKey] !== "string") {
                    subLevelsCnt++;
                    continue;
                }
                if (isNaN(InTagKey)) {
                    resArr.push(InTagKey + '="' + inTagArr[InTagKey] + '"');
                } else {
                    resArr.push(inTagArr[InTagKey]);
                }
            }
            let tagStr = "\t".repeat(level) + '<' + resArr.join(' ') + '>';
    
            html_arr.push(tagStr);
    
            if (subLevelsCnt) {
                htmlvshelml._tag_to_html(inTagArr, html_arr, level+1);
                tagStr = "\t".repeat(level) + '</' + tagName + '>';
                html_arr.push(tagStr);
            }
        }
    }
}

module.exports = htmlvshelml;
