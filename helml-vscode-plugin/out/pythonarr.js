export default class pythonarr {
    static toPythonArr(data, indentLevel = 0) {
        const indent = ' '.repeat(indentLevel * 2);
        if (Array.isArray(data)) {
            const items = data.map((item) => indent + '  ' + this.toPythonArr(item, indentLevel + 1)).join(',\n');
            return items ? '[\n' + items + '\n' + indent + ']' : '[]';
        }
        if (typeof data === 'object' && data !== null) {
            const items = Object.entries(data)
                .map(([key, value]) => `${indent}  ${JSON.stringify(key)}: ${this.toPythonArr(value, indentLevel + 1)}`)
                .join(',\n');
            return items ? '{\n' + items + '\n' + indent + '}' : '{}';
        }
        // Special number types
        if (Number.isNaN(data)) {
            return 'float("nan")';
        }
        else if (data === Infinity) {
            return 'float("inf")';
        }
        else if (data === -Infinity) {
            return 'float("-inf")';
        }
        else if (data === null) {
            return 'None';
        }
        else if (data === true) {
            return 'True';
        }
        else if (data === false) {
            return 'False';
        }
        // number, string, boolean
        return JSON.stringify(data);
    }
}
