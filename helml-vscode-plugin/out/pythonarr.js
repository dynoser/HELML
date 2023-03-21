var pythonarr = function(data, indentLevel = 0) {
    const indent = ' '.repeat(indentLevel * 2);
  
    if (Array.isArray(data)) {
        const items = data.map(item => indent + '  ' + pythonarr(item, indentLevel + 1)).join(',\n');
      return items ? '[\n' + items + '\n' + indent + ']' : '[]';
    }
  
    if (typeof data === 'object' && data !== null) {
      const items = Object.entries(data)
        .map(([key, value]) => `${indent}  ${JSON.stringify(key)}: ${pythonarr(value, indentLevel + 1)}`)
        .join(',\n');
      return items ? '{\n' + items + '\n' + indent + '}' : '{}';
    }

    // Special number types
    if (Number.isNaN(data)) {
      return 'float("nan")';
    } else if (data === Infinity) {
      return 'float("inf")';
    } else if (data === -Infinity) {
      return 'float("-inf")';
    }
  
    // number, strinf, boolean, null
    return JSON.stringify(data);
  }

module.exports = pythonarr;