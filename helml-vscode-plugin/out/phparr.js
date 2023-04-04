"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class phparr {
    static toPHParr(data, space) {
        // prepare spaces
        if (typeof space === 'number') {
            if (space > 10) {
                space = 10;
            }
            space = ' '.repeat(space);
        }
        else {
            space = space.slice(0, 10);
        }
        // prepare ident function
        let indent = function (item) {
            return space
                ? item
                    .split('\n')
                    .map(function (line) { return space + line; })
                    .join('\n')
                : item;
        };
        let tpd = typeof data;
        switch (true) {
            case tpd === 'number':
                if (Number.isNaN(data)) {
                    return 'NAN';
                }
                else if (data === Infinity) {
                    return 'INF';
                }
                else if (data === -Infinity) {
                    return '-INF';
                }
            case tpd === 'string':
            case tpd === 'boolean':
            case data === null:
                return JSON.stringify(data);
            case Array.isArray(data):
                return ''
                    + (space ? '[\n' : '[')
                    + data
                        .map(function (item) { return phparr.toPHParr(item, space); })
                        .map(indent)
                        .join(space ? ',\n' : ',')
                    + (space ? '\n]' : ']');
            case tpd === 'object' && !Array.isArray(data):
                let items = [];
                for (var k in data) {
                    items.push(''
                        + JSON.stringify(k)
                        + (space ? ' => ' : '=>')
                        + phparr.toPHParr(data[k], space));
                }
                return ''
                    + (space ? '[\n' : '[')
                    + items
                        .map(indent)
                        .join(space ? ',\n' : ',')
                    + (space ? '\n]' : ']');
            default:
                throw new Error('parse error');
        }
    }
}
exports.default = phparr;
