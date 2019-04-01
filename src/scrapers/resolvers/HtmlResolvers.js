const createEvent = require('../../utils/createEvent');


const HtmlResolver = class HtmlResolver {
    constructor(resolver, name) {
        this.resolverFunction = resolver;
        this.resolverName = name;
    }

    async resolve(html, jar, headers, cookie) {
        this.headers = headers;
        this.cookie = cookie;
        console.log(html)
        this.resolvedData = await this.resolverFunction(html, jar, headers);
        const videoLinks = this.getUrl();

        return this.createWsEvent(createWsEvent);
    }

    createWsEvent(dataObjects) {
        return dataObjects.map((data) => {
            return createEvent(data, false, {}, { quality: '', resolver: this.resolverName, cookie, isResultOfScrape: true })
        })
    }

}

const OpenLoad = class OpenLoad extends HtmlResolver {
    getUrl() {
        return [this.data];
    }
}

const Streamango = class Streamango extends HtmlResolver {
    getUrl() {
        return [this.data];
    }
}

const VShare = class VShare extends HtmlResolver {
    getUrl() {
        return [this.data];
    }
}

const GamoVideo = class GamoVideo extends HtmlResolver {
    getUrl() {
        return [this.data]
    }
}

const PowVideo = class PowVideo extends HtmlResolver {
    getUrl() {
        return this.data.map((dataObject => {
            return !!dataObject.file ? dataObject.file : dataObject.link
        }))
    }
}

const Vidoza = class Vidoza extends HtmlResolver {
    getUrl() {
        return this.data.map((dataObject => {
            return dataObject.src;
        }))
    }
}

const GoogleDrive = class GoogleDrive extends HtmlResolver {
    getUrl() {
        return this.data.map((dataObject => {
            return dataObject.link;
        }))
    }
}

module.exports = {
    OpenLoad,
    Streamango,
    VShare,
    GamoVideo,
    PowVideo,
    Vidoza,
    GoogleDrive
};
