var credenciais = require('./sensivel/credenciais.json');
//var matrix = require('./sensivel/cartao-matriz.json');
//var contas = require('./sensivel/contas.json');

var webdriverio = require('webdriverio');



var options = {
    desiredCapabilities: {
        browserName: 'chrome'
    }
};

var keys = credenciais.password.split('');

webdriverio
    .remote(options)
    .init()
    .url('http://www.montepio.pt/SitePublico/pt_PT/particulares.page')
    .waitForExist('#loginid_IN', 1000)
    .setValue('#loginid_IN', credenciais.username)
    .click('#net24Submit')
    .waitForExist('#pinForm input[value="2"]', 1000)
    .click('.fldCheckConfirmation')
    .click('#pinForm input[value="' + keys[0] + '"]')
    .click('#pinForm input[value="' + keys[1] + '"]')
    .click('#pinForm input[value="' + keys[2] + '"]')
    .click('#pinForm input[value="' + keys[3] + '"]')
    .click('#pinForm input[value="' + keys[4] + '"]')
    .click('#pinForm input[value="' + keys[5] + '"]')
    .waitForExist('#net24Submit[value="SAIR"]', 1000)
    .url('https://net24.montepio.pt/Net24-Web/func/contasordem/ctaOrdemMovimentosCriterios.jsp')
    .setValue('select[name="seleccaoConta"]', '019100068360|019.10.006836-0 EU||EU')
    .click('input[name="pesquisaMovimentos"]')
