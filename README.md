
# initial setup

make a copy of the `private-example` to `private`

edit JSON files with your information

run:

    [sudo] npm install
    /node_modules/.bin/selenium-standalone install



# do scrap session

run:

    /node_modules/.bin/selenium-standalone start &
    node scrapper.js



# TODO

* support command line args for account name, start and end dates
* support pagination (fetch multiple pages)
* convert complex actions into webdriver custom commands (login, parse search page)
* login only in necessary
* inspect meaning of remaining fields
