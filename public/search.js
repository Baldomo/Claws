import SearchResult from './searchResult.js'
import infiniteScroll from './infiniteScroll.js'

const {h, keyed} = stage0

// Create view template.
// Mark dynamic references with a #-syntax where needed.

const view = h /* syntax: html */ `
    <section>
        <div class="input-field">
            <input #title id="search" type="text">
            <label for="search">Search</label>
        </div>
        <div #list class="search-results-list"></div>
    </section>
`
function Search(state, context, action) {
    const root = view

    // Collect references to dynamic parts
    const {title, list} = view.collect(root)

    // TODO: Go 1.12 will eliminate the need for this Promise callback. Check Go's latest version in Febuary 2019
    const infiniteScrollOptions = {
        action,
        distance: 200,
        callback: async function(done) {
            // 1. fetch data from the server
            // 2. insert it into the document
            // 3. call done when we are done
            if (state.pageNumber < state.totalPages) {
                const response = await new Promise((resolve) => fetchSearchResults(resolve, title.value, state.pageNumber + 1))
                state.results = state.results.concat(response.results)
                state.pageNumber = response.page
                state.totalPages = response.total_pages
                update()
            }
            done()
        }
    }

    if (state.results.length) {
        infiniteScroll(infiniteScrollOptions);
    }

    title.oninput = () => {
        state.title = title.value
    }

    // TODO: Go 1.12 will eliminate the need for this Promise callback. Check Go's latest version in Febuary 2019
    title.onkeydown = async (e) => {
        if (e.which == 13 || e.keyCode == 13) {
            const response = await new Promise((resolve) => fetchSearchResults(resolve, title.value, 1))
            state.results = response.results
            state.pageNumber = response.page
            state.totalPages = response.total_pages
            // setup infinite scroll
            infiniteScroll(infiniteScrollOptions);
            update()
        }
    }

    function update() {
        console.log('Rendered Search')

        // Stupid hack for focus to work
        setTimeout(() => title.focus(), 0)

        let components = []

        keyed(
            'id',
            list,
            state.lastResults,
            state.results.slice(),
            result => {
                const Component = SearchResult(result, state, context)
                components.push(Component)
                return Component
            },
            (Component, result) => Component.update()
        )

        components.forEach(Component => setTimeout(() => Component.update(), 0))

        state.lastResults = state.results.slice()
    }
    update()

    root.cleanup = function() {
        infiniteScroll({action: 'remove'})
    }

    return root
}

export default Search