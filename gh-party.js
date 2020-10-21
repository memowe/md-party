new Vue({
    name: 'GHParty',
    el: '#app',

    data() { return {
        config: {},
    }},

    async created() {

        // Load json config
        const res   = await fetch('config.json');
        const json  = await res.json();
        this.config = json;

        // Set title from config
        document.title = this.config.title;
    },

})
