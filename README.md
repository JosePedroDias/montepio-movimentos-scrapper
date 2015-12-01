
# initial setup

make a copy of the `private-example` to `private`

edit JSON files with your information

run:

    [sudo] npm install
    /node_modules/.bin/selenium-standalone install



# do scrap session

run:

    /node_modules/.bin/selenium-standalone start &
    node scrapper.js --account=EU
    node to_ynab.js --in=results/2015-11_23_2015-11-24.json



# TODO

* support pagination (fetch multiple pages)
* convert complex actions into webdriver custom commands (login, parse search page)
* login only in necessary
* exporters for
    * [YNAB](https://www.youneedabudget.com/support/article/csv-file-importing) DONE
    * [gnucash](http://wiki.gnucash.org/wiki/GnuCash_XML_format) (can be imported from the YNAB csv)
