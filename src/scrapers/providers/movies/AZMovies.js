const Promise = require('bluebird');
const RequestPromise = require('request-promise');
const cheerio = require('cheerio');
const tough = require('tough-cookie');
const randomUseragent = require('random-useragent');
const logger = require('../../../utils/logger');

const resolve = require('../../resolvers/resolve');

async function AZMovies(req, sse) {
    const clientIp = req.client.remoteAddress.replace('::ffff:', '').replace('::1', '');
    const movieTitle = req.query.title;
    const year = req.query.year;

    // These are all the same host I think. https://xmovies8.org isn't loading.
    const urls = ["https://azmovie.to"];
    const promises = [];

    const rp = RequestPromise.defaults(target => {
        if (sse.stopExecution) {
            return null;
        }

        return RequestPromise(target);
    });

    // Go to each url and scrape for links, then send the link to the client
    async function scrape(url) {
        const resolvePromises = [];

        try {
            const jar = rp.jar();
            const searchMovieUrl = `${url}/livesearch.php`;
            const referer = `https://azmovie.to/`;
            const userAgent = randomUseragent.getRandom();
            const headers = {
                referer,
                'user-agent': userAgent,
                'x-real-ip': clientIp,
                'x-forwarded-for': clientIp
            };

            let searchResults = await rp({
                uri: searchMovieUrl,
                method: 'POST',
                formData: {
                    searchVal: movieTitle,
                },
                headers,
                jar,
                followAllRedirects: true,
                timeout: 5000
            });

            let $ = cheerio.load(searchResults);

            let movieUrl = '';
            $('a').toArray().some(searchResultElement => {
                for (let childNode of searchResultElement.childNodes) {
                    if (childNode.data === `${movieTitle} (${year})` || childNode.data === movieTitle) {
                        movieUrl = `${url}/${$(searchResultElement).attr('href')}`;
                        return true;
                    }
                }

                return false;
            });

            if (!movieUrl) {
                return Promise.resolve();
            }

            let html = await rp({
                uri: movieUrl,
                headers,
                jar,
                followAllRedirects: true,
                timeout: 5000
            });

            let documentCookie = /document\.cookie\s*=\s*"(.*)=(.*)";/g.exec(html);
            while (documentCookie) {
                const cookie = new tough.Cookie({
                    key: documentCookie[1],
                    value: documentCookie[2]
                });
                jar.setCookie(cookie, url);
                html = html.replace('document.cookie', '');
                documentCookie = /document\.cookie\s*=\s*"(.*)=(.*)";/g.exec(html);
            }

            const videoPageHtml = await rp({
                uri: movieUrl,
                headers,
                jar,
                timeout: 5000
            });

            $ = cheerio.load(videoPageHtml);

            $('#serverul li a').toArray().forEach((element) => {
                const providerUrl = $(element).attr('href');
                resolvePromises.push(resolve(sse, providerUrl, 'AZMovies', jar, headers));
            });

        } catch (err) {
            if (!sse.stopExecution) {
                logger.error({source: 'AZMovies', sourceUrl: url, query: {title: req.query.title}, error: (err.message || err.toString()).substring(0, 100) + '...'});
            }
        }

        return Promise.all(resolvePromises);
    }

    // Asynchronously start all the scrapers for each url
    urls.forEach((url) => {
        promises.push(scrape(url));
    });

    return Promise.all(promises);
}

module.exports = exports = AZMovies;