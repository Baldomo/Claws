'use strict';

const providers =
	{
		movies: [
            require('./movies/Afdah'),
            require('./movies/AZMovies'),
            require('./movies/bfmovies'),
            require('./movies/StreamM4u'),
			require('./movies/MovieFiles'),
		],
		tv: [
			require('./tv/GoWatchSeries'),
			require('./tv/SeriesFree'),
			require('./tv/AfdahTV'),
			require('./tv/Series8'),
			require('./tv/SwatchSeries'),
		],
		anime: [
            new (require('./anime/MasterAnime'))(),
		],
		universal: [
			require('./universal/123movie'),
            //require('./universal/5movies')
		]
	};

module.exports = exports = providers;
