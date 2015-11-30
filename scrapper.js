var fs          = require('fs');
var webdriverio = require('webdriverio');



var credentiais = require('./private/credentiais.json');



var ARGS = {
    nrDays          : 7,
    deltaDaysEnd    : -1,
    accountToChoose : 'EU' // EU BLAZIS
};

var DAY = 1000 * 60 * 60 * 24;

var nowTS = (new Date()).valueOf();
var endDate   = new Date( nowTS + DAY*ARGS.deltaDaysEnd );
var startDate = new Date( nowTS + DAY*(ARGS.nrDays * -1) );
//console.log('startDate', startDate.toISOString() );
//console.log('endDate  ',   endDate.toISOString() );



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

var toCSV = function(arr) {
    var cols = 'dateMov time reference amount desc'.split(' ');
    //"dateMov":"2015-11-23","reference":"153260738661598","amount":"-7.99","dateVal":"2015-11-23","saldo":"5563.94","time":"04:58","desc":"COMPRA NETFLIX.COM"}
    var out = [];
    out.push( '"' + cols.join('","') + '"');
    arr.forEach(function(row) {
        row = cols.map(function(col) { return row[col]; });
        out.push( '"' + row.join('","') + '"');
    });
    return out.join('\n');
};



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
            .selectByValue('#agendamentoIniAno', '' +       startDate.getFullYear()  )
            .selectByValue('#agendamentoIniMes', '' + pad0( startDate.getMonth()+1 ) )
            .selectByValue('#agendamentoIniDia', '' + pad0( startDate.getDate()    ) )
            .selectByValue('#agendamentoFimAno', '' +         endDate.getFullYear()  )
            .selectByValue('#agendamentoFimMes', '' + pad0(   endDate.getMonth()+1 ) )
            .selectByValue('#agendamentoFimDia', '' + pad0(   endDate.getDate()    ) )
            .click('input[name="consultar"]')

            // movimentos
            /*
            var o = {
                desc      : arr[ 0], // 'COMPRA+++NETFLIX.COM'
                amount    : arr[ 1], // '-7.99'
                //'2'     : arr[ 2], // '-7.99'
                //'3'     : arr[ 3], // 'EUR'
                saldo     : arr[ 4], // '5563.94'
                //'5'     : arr[ 5], // '018'
                dateMov   : arr[ 6], // '20151123'
                dateVal   : arr[ 7], // '20151123'
                time      : arr[ 8], // '0458'
                //'9'     : arr[ 9], // '0'
                reference : arr[10], // '153260738661598'
                //'11'    : arr[11], // 'EUR'
                //'12'    : arr[12], // 'SM2'
                //'13'    : arr[13], // '019'
                //'14'    : arr[14], // '100068360'
                //'15'    : arr[15], // 'DST5'
                //'16'    : arr[16]  // '570565'
            };
            */
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
                            desc      : a[ 0],
                            amount    : a[ 1],
                            saldo     : a[ 4],
                            dateMov   : a[ 6],
                            dateVal   : a[ 7],
                            time      : a[ 8],
                            reference : a[10],
                        };
                    } catch(ex) {
                        return undefined;
                    }
                });
            }).then(function(data) {
                data = data.filter(function(o) { return o; }); // remove failed rows
                data = data.map(function(o) {
                    o.desc    = normalizeDesc(o.desc);
                    o.dateMov = normalizeDate(o.dateMov);
                    o.dateVal = normalizeDate(o.dateVal);
                    o.time    = normalizeTime(o.time);
                    return o;
                });
                //console.log('data', data);

                var fn = 'results/' + [
                    ARGS.accountToChoose,
                    startDate.toISOString().substring(0, 10),
                      endDate.toISOString().substring(0, 10)
                ].join('_');

                fs.writeFileSync(fn + '.json', JSON.stringify(data));
                fs.writeFileSync(fn + '.csv',  toCSV(         data));

                client.end();
                console.log('ALL DONE! (' + data.length + ' rows scrapped)');
            })
    });
