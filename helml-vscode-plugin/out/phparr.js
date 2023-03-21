var phparr = function(data, space) {
    switch (true) {
        case typeof space === 'number':
            var len = Math.max(Math.min(space, 10), 0);
            space = '';
            while (len--) { space += ' ' }
            break;
        case typeof space === 'string':
            space = space.slice(0, 10);
            break;
        default:
            space = undefined;
    }
  
    var indent = function(item) {
        return space
            ? item
                .split('\n')
                .map(function(line) { return space + line })
                .join('\n')
            : item;
    };

    tpd = typeof data; 
    switch (true) {
        case tpd === 'number':
            if (Number.isNaN(data)) {
                return 'NAN';
              } else if (data === Infinity) {
                return 'INF';
              } else if (data === -Infinity) {
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
                .map(function(item) { return phparr(item, space) })
                .map(indent)
                .join(space ? ',\n' : ',')
                + (space ? '\n]' : ']');
        case tpd === 'object' && data !== null && !Array.isArray(data):
            var items = [];
            for (var k in data) {
                items.push(''
                + JSON.stringify(k)
                + (space ? ' => ' : '=>')
                + phparr(data[k], space)
                );
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
  };

  module.exports = phparr;
