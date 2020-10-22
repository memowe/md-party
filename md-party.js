new Vue({
    name: 'MDParty',
    el: '#app',

    data() { return {
        config: {},
        pages: {},
        sitemap: [],
    }},

    methods: {

        pathify: name => name.replace(/[^a-z0-9]+/i, '_'),

        async loadConfigFile() {
            const res   = await fetch('config.json');
            this.config = await res.json();
        },

        async loadSiteMap() {
            const res       = await fetch(this.config.pages.sitemapYaml);
            this.sitemap    = jsyaml.load(await res.text());
        },

        async loadPages() {
            for (const name of this.sitemap) {
                const path = '/' + this.pathify(name) + '.md';
                fetch(this.config.pages.fetchPrefix + path)
                    .then(res => res.text())
                    .then(content => ({name: name, html: marked(content)}))
                    .then(data => this.pages[name] = data);
            }
        },
    },

    async created() {
        await this.loadConfigFile();
        await this.loadSiteMap();
        await this.loadPages();
        document.title = this.config.title;
    },

})
