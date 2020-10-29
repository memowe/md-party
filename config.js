var mdPartyConfig = {

    // A title for the website. Appears in the title and in the navigation bar.
    "title": "md-party",

    // Regarding the markdown source pages...
    "pages": {

        // Defines the file name of a YAML file. This YAML file defines the
        // list of pages and their order.
        "sitemapYaml":  "sitemap.yml",

        // Defines the markdown source directory. This can be a simple local
        // directory or a full URL, for example to raw github file resources.
        "fetchPrefix":  "Content",
    },

    // Regarding the generated page navigation...
    "navigation": {

        // When this is set to true, the first item on the sitemap (considered
        // "home page") will be hidden and the page title in the navigation bar
        // becomes a link to the home page.
        // When set to true, the navigation is full and the title does nothing.
        "useTitleAsHome": true,
    },

    // Regarding the presentation...
    "design": {

        // Custom design colors...
        "colors": {

            // Dark primary color, for text highlights on light backgrounds
            "primary": "sienna",

            // Light secondary color, for navigation bars and footer
            "secondary": "wheat",

            // Ligher secondary color
            "secondary-light": "cornsilk",
        },
    },
};
