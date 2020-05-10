# Color Machine #

Color Machine is a tool for creating color palettes. It uses a self-organizing
map to generate new color palettes.

## Usage ##

```bash
npm install
node random-palettes.js 4000 > palettes.json
node color-machine.js palettes.json
open color-machine.png
```

## Palette Format ##

Palettes are expressed as a set of RGB colors. Each color has the format
`[red, green, blue, weight]`. The red, green, and blue components are in the
range 0 to 255. The weight component is in the range 0 to 1; it's the percentage
of space in the palette the color takes up.

The example palette below is from...

```javascript
[
  [],
  [],
  [],
  [],
  [],
]
```

## License ##

All code is licensed under a MIT license. See the LICENSE file for more details.
