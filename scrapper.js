var fs          = require('fs');
var webdriverio = require('webdriverio');
var argv = require('yargs')
    .usage('Usage: $0 --account=[accName] --start=[yyyymmdd] --end=[yyyymmdd] --endNegGap=1 --nrDays=7')
    .demand(['account'])
    .argv;

var credentiais = require('./private/credentiais.json');



var pad0 = function(n) {
    return (n < 10 ? '0' : '') + n;
};

var normalizeDesc = function(s) { // 'ABC++DEF' -> 'ABC DEF'
    return decodeURIComponent( s.replace(/\++/g, ' ') );
};

var normalizeTime = function(s) { // '1234' -> '12:34'
    var a = s.split('');
    a.splice(2, 0, ':');
    return a.join('');
};

var normalizeDate = function(s) { // '20150123' -> '2015-01-23'
    var a = s.split('');
    a.splice(6, 0, '-');
    a.splice(4, 0, '-');
    return a.join('');
};



//console.log('argv', argv);

if (!('nrDays'    in argv)) { argv.nrDays    = '1'; }
if (!('endNegGap' in argv)) { argv.endNegGap = '7'; }

var ARGS = {
    nrDays          : -parseInt(argv.nrDays,    10),
    deltaDaysEnd    : -parseInt(argv.endNegGap, 10),
    accountToChoose :           argv.account
};

var DAY = 1000 * 60 * 60 * 24;

var nowTS = (new Date()).valueOf();

if ('end' in argv) {
    ARGS.endDate = new Date( argv.end );
}
else {
    ARGS.endDate = new Date( nowTS + DAY*ARGS.deltaDaysEnd );
}

if ('start' in argv) {
    ARGS.startDate = new Date( argv.start );
}
else {
    ARGS.startDate = new Date( ARGS.endDate.valueOf() + DAY*ARGS.nrDays );
}

//console.log('ARGS', ARGS);
//process.exit(0);



var accountValue;
var keys = credentiais.password.split('');



var client = webdriverio
    .remote({ desiredCapabilities: { browserName: 'chrome' } })
    .init();

client
    .url('http://www.montepio.pt/SitePublico/pt_PT/particulares.page')
    .waitForExist('#loginid_IN', 1000)
    .setValue('#loginid_IN', credentiais.username)
    .click('#net24Submit')

    //.waitForExist('.fldCheckConfirmation', 1000)
    .click('.fldCheckConfirmation')

    .waitForExist('#pinForm input[value="2"]', 2000)
    .click('#pinForm input[value="' + keys[0] + '"]')
    .click('#pinForm input[value="' + keys[1] + '"]')
    .click('#pinForm input[value="' + keys[2] + '"]')
    .click('#pinForm input[value="' + keys[3] + '"]')
    .click('#pinForm input[value="' + keys[4] + '"]')
    .click('#pinForm input[value="' + keys[5] + '"]')

    //.waitForExist('div', 100)

    .url('https://net24.montepio.pt/Net24-Web/func/contasordem/ctaOrdemMovimentosCriterios.jsp')
    //.waitForExist('#net24Submit[value="SAIR"]', 1000)
    .waitForExist('[name="seleccaoConta"] option', 1000)
    .selectorExecute('[name="seleccaoConta"] option', function(optEls) {
        return optEls.map(function(optEl, i) {
            return {index:i, value:optEl.value, text:optEl.text};
        });
    })
    .then(function(results) {
        //console.log('accountsData', results);
        results.forEach(function(r) {
            if (r.text.indexOf(ARGS.accountToChoose) !== -1) {
                accountValue = r.value;
                //console.log('CHOSEN ACCOUNT WITH VALUE %s', accountValue);
            }
        });

        client
            .selectByValue('select[name="seleccaoConta"]', accountValue)
            .click('input[name="pesquisaMovimentos"]')

            // datas de início e fim
            .selectByValue('#agendamentoIniAno', '' +       ARGS.startDate.getFullYear()  )
            .selectByValue('#agendamentoIniMes', '' + pad0( ARGS.startDate.getMonth()+1 ) )
            .selectByValue('#agendamentoIniDia', '' + pad0( ARGS.startDate.getDate()    ) )
            .selectByValue('#agendamentoFimAno', '' +         ARGS.endDate.getFullYear()  )
            .selectByValue('#agendamentoFimMes', '' + pad0(   ARGS.endDate.getMonth()+1 ) )
            .selectByValue('#agendamentoFimDia', '' + pad0(   ARGS.endDate.getDate()    ) )
            .click('input[name="consultar"]')

            // movimentos
            .selectorExecute('#printable > table > tbody > tr:nth-child(6) tr', function(trEls) {
                trEls = (function(lst) {
                    var l = lst.length; var arr = new Array(l);
                    for (var i = 0; i < l; ++i) { arr[i] = lst[i]; } return arr;
                })(trEls);

                trEls.shift();
                trEls.pop();

                return trEls.map(function(trEl) {
                    try {
                        var oc = trEl.children[2].children[0].getAttribute('onclick');
                        var oc2 = oc.substring(13, oc.length-15);
                        var a = JSON.parse('[' + oc2.replace(/\'/g, '"') + ']');
                        return {
                            desc         : a[ 0],
                            amount       : a[ 1],
                            amountP      : a[ 2],
                            currencyP    : a[ 3],
                            balance      : a[ 4],
                            local        : a[ 5],
                            date         : a[ 6],
                            dateP        : a[ 7],
                            time         : a[ 8],
                            checkP       : a[ 9],
                            referenceP   : a[10],
                            currencyC    : a[11],
                            operation    : a[12],
                            branchC      : a[13],
                            accountNo    : a[14],
                            term         : a[15],
                            journal      : a[16]
                        };
                    } catch(ex) {
                        return undefined;
                    }
                });
            }).then(function(data) {
                data = data.filter(function(o) { return o; }); // remove failed rows
                data = data.map(function(o) {
                    o.desc  = normalizeDesc(o.desc);
                    o.date  = normalizeDate(o.date);
                    o.dateP = normalizeDate(o.dateP);
                    o.time  = normalizeTime(o.time);
                    return o;
                });
                //console.log('data', data);

                var fn = 'results/' + [
                    ARGS.accountToChoose,
                    ARGS.startDate.toISOString().substring(0, 10),
                      ARGS.endDate.toISOString().substring(0, 10)
                ].join('_');

                fs.writeFileSync(fn + '.json', JSON.stringify(data));

                client.end();
                console.log('ALL DONE! (' + data.length + ' rows scrapped)');
            })
    });
