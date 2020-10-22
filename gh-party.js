new Vue({
    name: 'GHParty',
    el: '#app',

    data() { return {
        config: {},
        pages: {},
    }},

    methods: {

        async loadConfigFile() {
            const res   = await fetch('config.json');
            this.config = await res.json();
        },

        async loadPages() {

            // Retrieve Content directory files
            const ghu   = this.config.github.user, ghr = this.config.github.repository;
            const url   = `https://api.github.com/repos/${ghu}/${ghr}/contents/Content`;
            const files = await fetch(url).then(r => r.json());
            const pages = files.filter(f => f.name.endsWith('md'));

            // Process all markdown files: extract data, fetch content, inject page data
            for (const p of pages) {
                const url = this.config.github.pagesUrl + p.path;
                fetch(url).then(res => res.text())
                    .then(content => ({
                            name: p.name.slice(0, -3),
                            html: marked(content),
                    }))
                    .then(data => this.pages[data.name] = data)
            }
        },
    },

    async created() {
        await this.loadConfigFile();
        document.title = this.config.title;
        await this.loadPages();
    },

})
