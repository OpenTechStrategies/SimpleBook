# SimpleBook PDF Printing API

Simplebook uses our node.js command line app in the subdirectory `mw2pdf/`.

This project uses [pipenv](https://pipenv.pypa.io/en/latest/) which you should use to install all necessary dependencies.

We use puppeteer which boots headless chrome. While the node.js package should handle the installation of chrome itself, it does [require existing dependencies installed](https://github.com/puppeteer/puppeteer/blob/main/docs/troubleshooting.md#chrome-headless-doesnt-launch-on-unix).

The API uses [redis](https://redis.io/) and expects you to have a redis server running on `localhost:6379`

#### Environment Variables

If login is required to view the printed pages, you can store your secrets in the environment variables `WIKI_USER` and `WIKI_PASSWORD`