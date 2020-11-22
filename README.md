MD-Party - markdown page gathering
==================================

**A lightweight library to dynamically generate a full website from markdown files.**

## Concepts

MD-Party generates a fast, clean and responsive website from your markdown files. For a given directory, accessible via HTTP on the same server or somewhere else, the complete website can be built with minimum effort:

**`Content` directory of markdown files** (alphabetical order):

```
Content:
  |- About_us.md
  |- Concepts.md
  |- One_upon_a_time.md
  |- Partners.md
  `- Welcome.md
```

**Minimal container website `index.html`** including navigation order definition and configuration:

```html
<!doctype html>
<html>
  <head>
    <meta charset="utf-8"/>
    <title></title>
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/memowe/md-party@0.2/dist/md-party.min.css">
  </head>
  <body>

    <script src="https://cdn.jsdelivr.net/gh/memowe/md-party@0.2/dist/md-party.min.js"></script>
    <script>
      MDParty([
        'Welcome',
        'Once upon a time',
        'Concepts',
        'About us',
        'Partners',
      ], {
        title: 'Awesome thing 2000',
      });
    </script>

  </body>
</html>
```

Both arguments can be replaced with (local or remote) URLs to YAML files:

**`index.html`**:

```html
MDParty('sitemap.yml', 'config.yml');
```

**`sitemap.yml`**:

```yaml
- Welcome
- Once upon a time
- Concepts
- About us
- Partners
```

**`config.yml`**:

```yaml
title: Awesome thing 2000
```

**Note**: a footer markdown part can be loaded from a file `footer.md`, by default from `Content` as well.

## Example and further documentation

This repository contains a [documentation](documentation) directory with such a `Content` directory and `index.html` file, which renders this project's documentation website on GitHub Pages: [mirko.westermeier.de/md-party/documentation](https://mirko.westermeier.de/md-party/documentation/).

## Author and License

Copyright (c) [Mirko Westermeier][mirko] ([\@memowe][mgh], [mirko@westermeier.de][mmail])

Released under the MIT (X11) license. See [LICENSE][mit] for details.

[mirko]: http://mirko.westermeier.de
[mgh]: https://github.com/memowe
[mmail]: mailto:mirko@westermeier.de
[mit]: LICENSE
