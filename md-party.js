// Utility methods
Vue.mixin({methods: {
    toPath:     str => str.replace(/[^a-z0-9]+/i, '_'),
    hashPage:   ()  => window.location.hash.substr(1), // 0: #
}})

// Manual router link that is aware of the current "page"
Vue.component('VLink', {
    template:   `<a :href="'#' + toPath(to)" :class="{active: active}">{{ to }}</a>`,
    props:      ['to'],
    data:       () => ({active: false}),
    methods:    {sync() {this.active = this.toPath(this.to) === this.hashPage()}},
    created()   {window.addEventListener('hashchange', this.sync); this.sync()},
})

// Let's get the party started!
new Vue({
    name: 'MDParty',
    el: '#app',

    template: `
        <p v-if="loading" id="message">Loading...</p>
        <div v-else id="md-party">
            <nav>
                <v-link v-for="page in sitemap" :key="page" :to="page"/>
            </nav>
            <main v-html="pageHTML"/></main>
        </div>
    `,

    data() { return {
        config: {},
        pages: {},
        sitemap: [],
        page: undefined,
        loading: true,
    }},

    computed: {

        homePath() {
            return this.toPath(this.sitemap[0]);
        },

        pageHTML() {
            if (this.pages[this.page])
                return this.pages[this.page].html;
            return '<p id="message">Page not found.</p>';
        },
    },

    methods: {

        pathName(p) {
            return this.sitemap.find(n => this.toPath(n) === p);
        },

        syncPage() {
            this.page = this.pathName(this.hashPage()) || 'Not found';
        },

        loadConfigFile() {
            return fetch('config.json')
                .then(res => res.json())
        },

        loadSiteMap() {
            return fetch(this.config.pages.sitemapYaml)
                .then(res => res.text())
                .then(yaml => jsyaml.load(yaml));
        },

        loadPage(name) {
            const path = '/' + this.toPath(name) + '.md';
            return fetch(this.config.pages.fetchPrefix + path)
                .then(res => res.text())
                .then(md => ({name: name, html: marked(md)}));
        },

        loadPages() {
            return Promise.all(this.sitemap.map(this.loadPage))
                .then(results => results.map(data => [data.name, data]))
                .then(pairs => Object.fromEntries(new Map(pairs)));
        },
    },

    async created() {
        this.config     = await this.loadConfigFile();
        this.sitemap    = await this.loadSiteMap();
        this.pages      = await this.loadPages();
        this.loading    = false;
        document.title  = this.config.title;

        // Set up "navigation"
        window.addEventListener('hashchange', this.syncPage);
        this.syncPage();

        // Go to home page
        if (! this.hashPage()) window.location.hash = '#' + this.homePath;
    },
})
