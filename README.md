# Sunflower Map Points

## Developement

### Language Files

#### Plugin

1. create / update .pot file for the plugin strings
```
wp i18n make-pot --domain=sunflower-map-points . --exclude=src languages/sunflower-map-points.pot
```

2. edit / update the language files

poedit sunflower-map-points-de_DE.po
--> Update with sunflower-map-points.pot

#### Blocks

1. create / update .pot file for map block
```
wp i18n make-pot --domain=sunflower-map-points-map . --exclude=src languages/sunflower-map-points-map.pot
```

2. edit / update the language files

poedit sunflower-map-points-map-de_DE.po
--> Update with sunflower-map-points-map.pot

3. create / update language files for backend editor

```
wp i18n make-json languages/ --no-purge
```
