// Utility methods
Vue.mixin({methods: {
    loadConfig: ()  => mdPartyConfig,
    toPath:     str => str.replace(/[^a-zäöüß0-9]+/ig, '_'),
    hashPage:   ()  => decodeURI(window.location.hash.substr(1)), // 0: #
}})

// Let's get the party started!
new Vue({
    name: 'MDParty',
    el: '#app',

    template: `
        <p v-if="loading" id="message">Loading...</p>
        <div v-else id="md-party">

            <nav>
                <a
                    v-if="config.navigation.useTitleAsHome"
                    id="nav-title"
                    :href="'#' + this.toPath(this.sitemap[0])"
                >{{ config.title }}</a>
                <span
                    v-else
                    id="nav-title"
                >{{ config.title }}</span>

                <div id="nav-burger">
                    <button @click="burgerMenu = ! burgerMenu">&#9776;</button>
                </div>

                <ul id="nav-items" :class="{'active-burger': burgerMenu}">
                    <li
                        v-for="page in naviPages"
                        :key="page"
                        :class="{active: toPath(page) === hashPage()}"
                    ><a :href="'#' + toPath(page)">{{ page }}</a></li>
                </ul>
            </nav>

            <main v-if="pages[page]" v-html="pages[page].html"></main>
            <p v-else id="message">Page not found</p>

            <footer v-html="footer.html"></footer>
        </div>
    `,

    data() { return {
        config: this.loadConfig(),
        pages: {},
        sitemap: [],
        page: null,
        footer: null,
        loading: true,
        burgerMenu: false,
    }},

    computed: {
        naviPages() {
            return this.sitemap.slice(
                this.config.navigation.useTitleAsHome ? 1 : 0
            );
        }
    },

    methods: {

        pathName(p) {
            return this.sitemap.find(n => this.toPath(n) === p);
        },

        syncPage() {
            this.page = this.pathName(this.hashPage()) || 'Not found';
            document.title = this.page + ' - ' + this.config.title;
            this.burgerMenu = false;
        },

        loadSiteMap() {
            return fetch(this.config.pages.sitemapYaml)
                .then(res => res.text())
                .then(yaml => jsyaml.load(yaml));
        },

        loadMarkdown(url) {
            return fetch(url)
                .then(res => res.text())
                .then(md => yamlFront.loadFront(md))
                .then(fm => ({meta: fm, html: marked(fm.__content)}));
        },

        loadPages() {
            return Promise.all(this.sitemap.map(name => {
                const path  = '/' + this.toPath(name) + '.md';
                return this.loadMarkdown(this.config.pages.fetchPrefix + path)
                    .then(data => ({name: name, ...data}));
            }))
                .then(results => results.map(data => [data.name, data]))
                .then(pairs => Object.fromEntries(new Map(pairs)));
        },

        setColorTheme() {
            ['primary', 'secondary', 'secondary-light'].forEach(col => {
                document.documentElement.style.setProperty(
                    `--${col}-color`,
                    this.config.design.colors[col],
                );
            });
        },
    },

    async created() {
        this.sitemap    = await this.loadSiteMap();
        this.pages      = await this.loadPages();
        this.footer     = await this.loadMarkdown('footer.md');
        this.loading    = false;

        // Inject color theme from config into the root node
        this.setColorTheme();

        // Set up "navigation"
        window.addEventListener('hashchange', this.syncPage);
        this.syncPage();

        // Go to home page (first page of the sitemap)
        if (! this.hashPage())
            window.location.hash = '#' + this.toPath(this.sitemap[0]);
    },
})
