'use strict';

module.exports = exports = {
    movies: [
        require('./movies/Afdah'),
        require('./movies/AZMovies'),
        require('./movies/bfmovies'),
        new (require('./movies/StreamM4u'))(),
        require('./movies/MovieFiles')
    ],
    tv: [
        require('./tv/GoWatchSeries'),
        require('./tv/SeriesFree'),
        //require('./tv/AfdahTV'),
        require('./tv/SwatchSeries'),
        new (require('./tv/series8'))()
    ],
    anime: [
        new (require('./anime/MasterAnime'))(),
    ],
    universal: [
        require('./universal/123movie'),
        new (require('./anime/MasterAnime'))(),
        //require('./universal/5movies')
    ]
};
