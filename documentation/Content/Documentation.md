# Documentation

How to create a website from a markdown directory.

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
