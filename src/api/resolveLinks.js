'use strict';

// Load providers
const providers = require('../scrapers/providers');

/**
 * Sends the current time in milliseconds.
 */
const sendInitialStatus = (sse) => sse.send({ data: [`${new Date().getTime()}`], event: 'status'}, 'result');

/**
 * Return request handler for certain media types.
 * @param data media query
 * @param ws web socket
 * @param req request
 * @return {Function}
 */
const resolveLinks = async (data, ws, req) => {
    const type = data.type;
    const sse = {
        send: (data) => {
            try {
                ws.send(JSON.stringify(data));
            } catch (err) {
                console.log("WS client disconnected, can't send data");
            }
        },
        stopExecution: false
    }
    sendInitialStatus(sse);

    ws.on('close', () => {
        sse.stopExecution = true;
    });

    const promises = [];

    req.query = {...data, type};

    // Get available providers.
    [...providers[type], ...providers.universal].forEach(provider => promises.push(provider(req, sse)));

    await Promise.all(promises);

    sse.send({event: 'done'}, 'done');
};

module.exports = resolveLinks;