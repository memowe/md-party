async function MDParty(sitemap, config = {}) {

    // Config: mix in defaults
    const defaultConfig = {
        "elementId":                "md-party-container",
        "title":                    "md-party",
        "fetchPrefix":              null,
        "pagesPrefix":              "Content",
        "layoutPrefix":             "Layout",
        "titleAsHome":              true,
        "primary-color":            "sienna",
        "secondary-color":          "wheat",
        "secondary-light-color":    "cornsilk",
        "cdnPrefix":                "https://cdn.jsdelivr.net/npm/",
        "vueDebug":                 false,
    };
    config = {...defaultConfig, ...config};

    // Action!
    await loadJSDependencies(config);
    await loadCSSDependencies(config);
    prepareVue(config, sitemap);
    prepareDOM(config);
    letsGetThePartyStarted(config);
};

function loadJSDependencies(config) {

    const deps = [
        config.cdnPrefix + (config.vueDebug ? 'vue/dist/vue.js' : 'vue'),
        config.cdnPrefix + 'showdown',
    ];

    const promises = deps.map(src => new Promise((resolve, reject) => {
        const script    = document.createElement('script');
        script.onload   = resolve;
        script.onerror  = reject;
        script.src      = src;
        document.body.appendChild(script);
    }));

    return Promise.all(promises);
}

function loadCSSDependencies(config) {

    const deps = [
        config.cdnPrefix + 'sanitize.css',
        [config.fetchPrefix, 'dist/md-party.css'].filter(x => x).join('/'),
    ];

    const promises = deps.map(href => new Promise((resolve, reject) => {
        const link      = document.createElement('link');
        link.onload    = resolve;
        link.onerror   = reject;
        link.async     = true;
        link.rel       = 'stylesheet';
        link.href      = href;
        document.head.appendChild(link);
    }));

    return Promise.all(promises);
}

function prepareVue(config, sitemap) {

    // Initialize markdown parser
    const sd = new showdown.Converter({
        metadata: true,
        parseImgDimensions: true,
        strikethrough: true,
        tables: true,
        simpleLineBreaks: true,
        openLinksInNewWindow: false,
    });

    // Utility methods
    Vue.mixin({methods: {
        getConfig:  ()  => config,
        getSitemap: ()  => sitemap,
        toPath:     str => str.replace(/[^a-zäöüß0-9]+/ig, '_'),
        hashPage:   ()  => decodeURI(window.location.hash.substr(1)), // 0: #
        parseMD:    md  => ({html: sd.makeHtml(md), meta: sd.getMetadata()}),
    }})
}

function prepareDOM(config) {

    // Prepare responsive layout
    if (! document.querySelector('head meta[name="viewport"]')) {
        const metaViewport      = document.createElement('meta');
        metaViewport.name       = 'viewport';
        metaViewport.content    = 'width=device-width, initial-scale=1.0';
        document.head.appendChild(metaViewport);
    }

    // Prepare DOM element
    const element   = document.createElement('div');
    element.id      = config.elementId;
    document.body.appendChild(element);
}

function letsGetThePartyStarted(config) {

    new Vue({
        name: 'MDParty',
        el: '#' + config.elementId,

        template: `
            <p v-if="loading" id="message">Loading...</p>
            <div v-else id="md-party">

                <nav>
                    <a
                        v-if="config.titleAsHome"
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
            config: this.getConfig(),
            pages: {},
            sitemap: this.getSitemap(),
            page: null,
            footer: null,
            loading: true,
            burgerMenu: false,
        }},

        computed: {

            naviPages() {
                return this.sitemap.slice(this.config.titleAsHome ? 1 : 0);
            },

            title() {
                return (this.page === this.config.title ? '' : this.page + ' - ')
                    + this.config.title;
            },
        },

        methods: {

            resourceUrl(...parts) {
                return [this.config.fetchPrefix, ...parts]
                    .filter(x => x).join('/');
            },

            pageMdUrl(name) {
                return this.resourceUrl(
                    this.config.pagesPrefix,
                    this.toPath(name) + '.md'
                );
            },

            layoutUrl(name) {
                return this.resourceUrl(
                    this.config.layoutPrefix,
                    this.toPath(name) + '.md'
                );
            },

            pathName(p) {
                return this.sitemap.find(n => this.toPath(n) === p);
            },

            syncPage() {
                this.page = this.pathName(this.hashPage()) || 'Not found';
                document.title = this.title;
                this.burgerMenu = false;
            },

            loadMarkdown(url) {
                return fetch(url)
                    .then(res => res.text())
                    .then(md => this.parseMD(md));
            },

            loadPages() {
                return Promise.all(this.sitemap.map(name => {
                    return this.loadMarkdown(this.pageMdUrl(name))
                        .then(data => ({name: name, ...data}));
                }))
                    .then(results => results.map(data => [data.name, data]))
                    .then(pairs => Object.fromEntries(new Map(pairs)));
            },

            setColorTheme() {
                ['primary', 'secondary', 'secondary-light'].forEach(col => {
                    document.documentElement.style.setProperty(
                        `--${col}-color`,
                        this.config[`${col}-color`],
                    );
                });
            },
        },

        async created() {
            this.pages      = await this.loadPages();
            this.footer     = await this.loadMarkdown(this.layoutUrl('footer'));
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
    });
}
