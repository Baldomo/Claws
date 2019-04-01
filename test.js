const resolveHtml = require('./src/scrapers/resolvers/resolveHtml');
const data = require('./test.json')

const results = resolveHtml(data).then((res) => console.log(res));