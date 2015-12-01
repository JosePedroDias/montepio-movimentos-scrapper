var fs = require('fs');
var argv = require('yargs')
    .usage('Usage: $0 --in [file]')
    .demand(['in'])
    .argv;
//console.log('argv', argv);

var ARGS = {
    inFN  : argv.in,
    outFN : argv.in.replace('.json', '.csv')
};
//console.log('ARGS', ARGS);
//process.exit(0);



var cols = 'Date,Payee,Category,Memo,Outflow,Inflow'.split(',');



var SEP   = ',';
var DELIM = '"';
var NL    = '\n';



var mapCsvRow = function(arr) {
    arr = arr.map(function(s) {
        if (typeof s === 'number') { return '' + s; }
        return ( s.indexOf('\n') !== -1 || (/\s/).test(s) ) ? DELIM+s+DELIM : s;
    });
    return arr.join(SEP);
};

var toCSV = function(arr, cols) {
    var out = [];
    out.push( mapCsvRow(cols) );
    arr.forEach(function(row) {
        row = cols.map(function(col) { return row[col]; });
        out.push( mapCsvRow(row) );
    });
    return out.join(NL);
};


var _h = function(s, tst) {
    return (s.indexOf(tst) !== -1);
};

var _has = function(s, sOrArr) {
    if (typeof s === 'string') {
        return _h(s, sOrArr);
    }
    return sOrArr.some(function(tst) {
        return _h(s, tst);
    });
};

var categorize = function(o) { // CUSTOM LOGIC
    var d = o.desc;
    if (_has(d, 'FARMA'            )) { return 'Everyday Expenses: Medical'; }
    if (_has(d, 'REST'             )) { return 'Everyday Expenses: Restaurants'; }
    if (_has(d, ['GALP', 'REPSOL'] )) { return 'Everyday Expenses: Fuel'; }
    return '';
};

var payeeize = function(o) { // CUSTOM LOGIC
    var r = o.referenceP;
    // TODO
    return r;
};



var mtpToYnab = function(o) {
    return {
        'Date'   : o.date,
        Payee    : payeeize(o),
        Category : categorize(o),
        Memo     : o.desc,
        Outflow  : ( (o.amount < 0) ? -o.amount : ''),
        Inflow   : ( (o.amount > 0) ?  o.amount : '')
    };
};



var ops = fs.readFileSync(ARGS.inFN).toString();
ops = JSON.parse(ops);
var ops2 = ops.map(mtpToYnab);
fs.writeFileSync(ARGS.outFN,  toCSV(ops2, cols) );
