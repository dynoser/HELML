"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class LineHELML {
    constructor(line) {
        this.level = 0;
        this.spc_left_cnt = 0;
        this.spc_right_cnt = 0;
        this.key = '';
        this.value = '';
        this.is_ignore = true;
        this.is_creat = false;
        this.is_list = false;
        this.is_layer = false;
        this.text = line;
        this.spc_left_cnt = 0;
        let strlen = line.length;
        // count spaces in the end of line
        while (strlen) {
            if (line[strlen - 1] !== ' ')
                break;
            strlen--;
            this.spc_right_cnt++;
        }
        if (!strlen) { // dont parse empty lines
            return; // is_ignore = true
        }
        // cut spaces from the end of line
        if (strlen !== line.length) {
            line = line.substring(0, strlen);
        }
        // count spaces from the begin of line and nested level
        let spc_cnt = 0;
        let level = 0;
        for (let i = 0; i < strlen; i++) {
            if (line[i] === ' ') {
                spc_cnt++;
            }
            else {
                for (let j = i; j < strlen; j++) {
                    if (line[j] === ':') {
                        level++;
                    }
                    else {
                        break;
                    }
                }
                break;
            }
        }
        this.spc_left_cnt = spc_cnt;
        this.level = level;
        if (line.charAt(spc_cnt) === '#') { // Ignore comment lines starting with '#'
            this.key = '#';
            return; // is_ignore = true
        }
        // We are here if the line is not empty and not a comment
        this.is_ignore = false;
        // search Key:Value divider
        const colonIndex = line.indexOf(':', spc_cnt + level + 1);
        const haveColonDiv = colonIndex > (spc_cnt + level);
        const onlyKeyNoDiv = (colonIndex < 0 && (spc_cnt + level) < strlen);
        this.is_list = haveColonDiv && (colonIndex === strlen - 1);
        if (colonIndex > 0) {
            this.key = line.substring(spc_cnt + level, colonIndex);
            this.value = line.substring(colonIndex + 1);
        }
        else if (onlyKeyNoDiv) {
            this.key = line.substring(spc_cnt + level);
        }
        if (this.key.startsWith('-+')) {
            if (this.key === '-+' || this.key === '-++') {
                this.is_layer = true;
            }
        }
        else if (this.is_list || onlyKeyNoDiv) {
            this.is_creat = true;
        }
    }
}
exports.default = LineHELML;
