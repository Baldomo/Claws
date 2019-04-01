const resolveHtml = require('./src/scrapers/resolvers/resolveHtml');
const data = require('./test.json')

const results = resolveHtml(Buffer.from(data.html, 'base64').toString(), data.resolver, data.headers, data.cookie).then((res) => console.log(res));