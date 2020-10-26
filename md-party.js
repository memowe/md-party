// Utility methods
Vue.mixin({methods: {
    toPath:     str => str.replace(/[^a-z0-9]+/i, '_'),
    hashPage:   ()  => window.location.hash.substr(1), // 0: #
}});

// Manual router link
Vue.component('VLink', {
    template:   `<a :href="'#' + toPath(to)" :class="{active: active}">{{ to }}</a>`,
    props:      ['to'],
    data:       () => ({active: false}),
    methods:    {sync() {this.active = this.toPath(this.to) === this.hashPage()}},
    created()   {
        window.addEventListener('hashchange', this.sync);
        this.sync();
    },
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
        pageHTML() {
            if (this.pages[this.page])
                return this.pages[this.page].html;
            return '<p id="message">Page not found.</p>';
        },
    },

    methods: {

        homePath() {
            return this.toPath(this.sitemap[0]);
        },

        pathName(p) {
            return this.sitemap.find(n => this.toPath(n) === p);
        },

        syncPage() {
            this.page = this.pathName(this.hashPage()) || 'Not found';
        },

        async loadConfigFile() {
            const res   = await fetch('config.json');
            this.config = await res.json();
        },

        async loadSiteMap() {
            const res       = await fetch(this.config.pages.sitemapYaml);
            this.sitemap    = jsyaml.load(await res.text());
        },

        loadPages() {
            return Promise.all(this.sitemap.map(name => {
                const path = '/' + this.toPath(name) + '.md';
                return fetch(this.config.pages.fetchPrefix + path)
                    .then(res => res.text())
                    .then(content => ({name: name, html: marked(content)}))
                    .then(data => this.pages[name] = data);
            }));
        },
    },

    async created() {

        // Load config and page data
        await this.loadConfigFile();
        await this.loadSiteMap();
        await this.loadPages();
        this.loading = false;
        document.title = this.config.title;

        // Setup "navigation"
        window.addEventListener('hashchange', this.syncPage);
        this.syncPage();

        // Go to home page
        if (! this.hashPage()) window.location.hash = '#' + this.homePath();
    },

})
