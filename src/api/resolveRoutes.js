'use strict';

// Import dependencies
const SSE = require('express-sse');
const rp = require('request-promise');
const {verifyToken} = require('../utils');
const logger = require('../utils/logger')

// Load providers
const resolveHtml = require('../scrapers/resolvers/resolveHtml');

// Declare new router and start defining routes:
const resolveRoutes = require('express').Router();

/**
 * /api/v1/search/movies
 * ------
 * Allows you to search for movies.
 */
resolveRoutes.post('/:resolver', async (req, res) => {
    // need to parse cookie possibly
    const jar = rp.jar();
    try {
        const data = await resolveHtml(Buffer.from(req.body.html, 'base64').toString(), req.params.resolver, jar, req.body.headers)
        res.json(data);
    } catch(err) {
        res.status(500).send();
        logger.error(err.message);
    }
});

module.exports = resolveRoutes;