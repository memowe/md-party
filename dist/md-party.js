import ScriptImporter from 'https://cdn.jsdelivr.net/gh/memowe/script-importer@v0.3/script-importer.min.js';

export default async function MDParty(sitemap, config = {}) {

    // Prepare dependency loading from jsDelivr CDN
    const importer = new ScriptImporter('https://cdn.jsdelivr.net/npm/');

    // Config: mix in defaults
    const defaultConfig = {
        "elementId":                "md-party-container",
        "title":                    "md-party",
        "fetchPrefix":              null,
        "pagesPrefix":              "Content",
        "layoutPrefix":             "Content",
        "titleAsHome":              true,
        "primary-color":            "sienna",
        "secondary-color":          "wheat",
        "secondary-light-color":    "cornsilk",
        "vueDebug":                 false,
    };
    await importer.load('js-yaml');
    config = {...defaultConfig, ...(await loadYAML(config))};

    // Load other dependencies
    await importer.load([
        (config.vueDebug ? 'vue/dist/vue.js' : 'vue') + '@2.6.14',
        'showdown'
    ]);

    // Load sitemap, if neccessary
    sitemap = await loadYAML(sitemap);

    // Action!
    prepareDOM(config);
    initVue(config, sitemap);
};

function loadYAML(something) {
    return typeof something === 'object' ? something :
        fetch(something).then(res => res.text())
            .then(yaml => jsyaml.load(yaml));
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

function initVue(config, sitemap) {

    // Initialize markdown parser
    const sd = new showdown.Converter({
        metadata: true,
        parseImgDimensions: true,
        strikethrough: true,
        tables: true,
        simpleLineBreaks: true,
        openLinksInNewWindow: false,
    });

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
                <div
                    v-if="burgerMenu"
                    id="burger-nav-items-background"
                    @click="burgerMenu = false"
                ></div>

                <main v-if="pages[page]" v-html="pages[page].html"></main>
                <p v-else id="message">Page not found</p>

                <footer v-html="footer.html"></footer>
            </div>
        `,

        data: () => ({
            config: config,
            pages: {},
            sitemap: sitemap,
            page: null,
            footer: null,
            loading: true,
            burgerMenu: false,
        }),

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

            // Static utility "methods"
            toPath:     str => str.replace(/[^a-zäöüß0-9]+/ig, '_'),
            hashPage:   ()  => decodeURI(window.location.hash.substr(1)), // 0: #
            parseMD:    md  => ({html: sd.makeHtml(md), meta: sd.getMetadata()}),

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
                window.scroll({top: 0, left: 0});
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

                // Provide custom properties in CSS
                ['primary', 'secondary', 'secondary-light'].forEach(col => {
                    document.documentElement.style.setProperty(
                        `--${col}-color`,
                        this.config[`${col}-color`],
                    );
                });

                // Use theme color as user interface on modern browsers
                const metaTheme     = document.createElement('meta');
                metaTheme.name      = 'theme-color';
                metaTheme.content   = this.config['primary-color'];
                document.head.appendChild(metaTheme);
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
