// Utility methods
Vue.mixin({methods: {
    toPath:     str => str.replace(/[^a-z0-9]+/i, '_'),
    hashPage:   ()  => window.location.hash.substr(1), // 0: #
}})

// Let's get the party started!
new Vue({
    name: 'MDParty',
    el: '#app',

    template: `
        <p v-if="loading" id="message">Loading...</p>
        <div v-else id="md-party">
            <header v-if="layout.header" v-html="layout.header.html"></header>
            <nav>
                <span id="nav-title">{{ config.title }}</span>
                <a
                    v-for="page in sitemap"
                    :key="page"
                    :href="'#' + toPath(page)"
                    :class="{active: toPath(page) === hashPage()}"
                >{{ page }}</a>
            </nav>
            <main v-html="pageHTML"></main>
            <footer v-if="layout.footer" v-html="layout.footer.html"></footer>
        </div>
    `,

    data() { return {
        config: {},
        pages: {},
        sitemap: [],
        page: undefined,
        layout: {},
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

        // expects an array of {name, url}
        loadMarkdownResources(urls) {
            return Promise.all(urls.map(url => {
                return fetch(url.url)
                    .then(res => res.text())
                    .then(md => ({name: url.name, html: marked(md)}));
            }))
                .then(results => results.map(data => [data.name, data]))
                .then(pairs => Object.fromEntries(new Map(pairs)));
        },

        loadPages() {
            return this.loadMarkdownResources(this.sitemap.map(name => {
                const path  = '/' + this.toPath(name) + '.md';
                return {name: name, url: this.config.pages.fetchPrefix + path};
            }));
        },

        loadLayout() {
            return this.loadMarkdownResources(
                Object.keys(this.config.layout.parts).map(part => {
                    const path = '/' + this.config.layout.parts[part];
                    return {name: part, url: this.config.layout.fetchPrefix + path};
                })
            );
        },
    },

    async created() {
        this.config     = await this.loadConfigFile();
        this.sitemap    = await this.loadSiteMap();
        this.pages      = await this.loadPages();
        this.layout     = await this.loadLayout();
        this.loading    = false;
        document.title  = this.config.title;

        // Set up "navigation"
        window.addEventListener('hashchange', this.syncPage);
        this.syncPage();

        // Go to home page
        if (! this.hashPage()) window.location.hash = '#' + this.homePath;
    },
})
