var credenciais = require('./private/credenciais.json');
//var matrix      = require('./private/cartao-matriz.json');
//var contas      = require('./private/contas.json');

var webdriverio = require('webdriverio');



var options = {
    desiredCapabilities: {
        browserName: 'chrome'
    }
};

var keys = credenciais.password.split('');

var accountsData;
var accountToChoose = 'EU';
var accountValue;

var client = webdriverio
    .remote(options)
    .init();

client
    .url('http://www.montepio.pt/SitePublico/pt_PT/particulares.page')
    .waitForExist('#loginid_IN', 1000)
    .setValue('#loginid_IN', credenciais.username)
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
        accountsData = results;
        console.log('accountsData', results);
        results.forEach(function(r) {
            if (r.text.indexOf(accountToChoose) !== -1) {
                accountValue = r.value;
                console.log('CHOSE ACCOUNT WITH VALUE %s', accountValue);
            }
        });

        client
            .selectByValue('select[name="seleccaoConta"]', accountValue)
            .click('input[name="pesquisaMovimentos"]');
    })
