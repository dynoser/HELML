export default class LineHELML {
    public text: string;

    public level: number = 0;
    public spc_left_cnt: number = 0;
    public spc_right_cnt: number = 0;

    public key: string = '';
    public value: string = '';

    public is_ignore = true;
    public is_creat = false;
    public is_list = false;
    public is_layer = false;

    constructor(line: string) {
        this.text = line;
        this.spc_left_cnt = 0;
        let strlen = line.length;

        // count spaces in the end of line
        while(strlen) {
            const ch = line[strlen-1];
            if (ch !== ' ' && ch !== "\t") break;
            strlen--;
            this.spc_right_cnt++
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
            const ch = line[i];
            if (ch === ' ' || ch === "\t") {
                spc_cnt++;
            } else {
                for (let j = i; j < strlen; j++) {
                    if (line[j] === ':') {
                        level++;
                    } else {
                        break;
                    }
                }
                break;
            }
        }
        this.spc_left_cnt = spc_cnt;
        this.level = level;

        const fc = line.charAt(spc_cnt);
        if (fc === '"' || fc === '[' || fc === '{' || fc === ']' || fc ==='}' || fc === ',' || fc === '/') {
            return; //is_ignore = true, for skip JSON prefixes
        }
        if (fc === '#') { // Ignore comment lines starting with '#'
            this.key = '#';
            return; // is_ignore = true
        }

        // We are here if the line is not empty and not a comment
        this.is_ignore = false;

        // search Key:Value divider
        const colonIndex = line.indexOf(':', spc_cnt + level + 1);
        const haveColonDiv = colonIndex > (spc_cnt + level);
        const onlyKeyNoDiv = (colonIndex < 0 && (spc_cnt + level) < strlen);
        const is_arr = haveColonDiv && (colonIndex === strlen - 1);

        if (colonIndex > 0) {
            this.key = line.substring(spc_cnt + level, colonIndex).trim();
            if (!this.key.length) {
                this.is_ignore = true;
                return;
            }
            this.value = line.substring(colonIndex + 1);
        }
        else if (onlyKeyNoDiv) {
            this.is_list = true;
            this.key = line.substring(spc_cnt + level);
        }
        if (this.key.startsWith('-+')) {
            if (this.key === '-+' || this.key === '-++') {
                this.is_layer = true;
            }
        } else if (is_arr || this.is_list) {
            this.is_creat = true;
        }
    }
}