new Vue({
    name: 'GHParty',
    el: '#app',

    data() { return {
        config: {},
    }},

    methods: {

        async loadConfigFile() {
            const res   = await fetch('config.json');
            this.config = await res.json();
        },

    },

    async created() {
        await this.loadConfigFile();
        document.title = this.config.title;
    },

})
