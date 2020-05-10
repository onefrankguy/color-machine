#!/usr/bin/env node

const fs = require('fs');
const SOM = require('ml-som');
const PNG = require('pngjs').PNG;

const colorToInt = ([r, g, b]) => (256 * 256 * r) + (256 * g) + b;

const loadPalettes = (file) => {
  let result = [];

  try {
    const data = fs.readFileSync(file);

    result = JSON.parse(data);
  } catch (error) {
    console.error(error);
  }

  return result;
};

const sortPalette = (palette) => {
  const colors = palette.slice();

  colors.sort((color1, color2) => {
    const weight1 = color1[3] || 0;
    const weight2 = color2[3] || 0;

    return weight2 - weight1;
  });

  return colors;
};

const normalizePalette = (palette, size) => {
  const colors = palette.slice();

  while (colors.length < size) {
    colors.push([255, 255, 255, 0]);
  }

  return sortPalette(colors);
};

const paletteToSomData = (palette) => {
  const result = {};

  for (let i = 0; i < palette.length; i += 1) {
    result[`c${i}`] = colorToInt(palette[i]);
  }

  return result;
};

const buildSomTrainingSet = (palettes) => {
  const size = Math.max(...palettes.map(({length}) => length));

  return palettes.map((palette) => ({
    ...paletteToSomData(normalizePalette(palette, size)),
    metadata: sortPalette(palette),
  }));
};

const buildSomOptions = (trainingSet) => {
  const maxColor = colorToInt([255, 255, 255]);
  const minColor = colorToInt([0, 0, 0]);

  const result = {
    fields: [],
    gridType: 'hexa',
    torus: false,
    height: Math.min(trainingSet.length, 20),
    width: Math.min(trainingSet.length, 20),
  };

  Object.keys(trainingSet[0]).forEach((name) => {
    if (name !== 'metadata') {
      result.fields.push({
        name,
        range: [minColor, maxColor],
      })
    }
  })

  return result;
};

const buildSom = ({width, height, ...somOptions}) => new SOM(width, height, somOptions);

const getSomIndex = (som, somData) => {
  const toSomIndex = ([x, y]) => (y * som.y) + x;

  return toSomIndex(som.predict(somData));
};

const buildSomLookupTable = (som, trainingSet) => {
  const result = [];

  trainingSet.forEach((somData) => {
    const somIndex = getSomIndex(som, somData);

    if (!result[somIndex]) {
      result[somIndex] = [];
    }

    result[somIndex].push(somData.metadata);
  });

  return result;
};

const buildPaletteLookup = (som, lookupTable) => (palette) => {
  const size = som.options.fields.length;
  const somData = paletteToSomData(normalizePalette(palette, size));
  const somIndex = getSomIndex(som, somData);

  return lookupTable[somIndex] || [];
};

const file = process.argv[2];

const rawPalettes = loadPalettes(file);
const trainingSet = buildSomTrainingSet(rawPalettes)
const somOptions = buildSomOptions(trainingSet);
const som = buildSom(somOptions);

som.train(trainingSet);

const lookupTable = buildSomLookupTable(som, trainingSet);
const findSimilarPalettes = buildPaletteLookup(som, lookupTable);

console.log(`Trained SOM on ${rawPalettes.length} palettes.`);

const allColors = [].concat(...rawPalettes);
const randomColorIndex = Math.floor(Math.random() * allColors.length);
const [startR, startG, startB] = allColors[randomColorIndex];

console.log(`Using rgb(${startR},${startG},${startB}) to generate palettes.`);

const similarPalettes = findSimilarPalettes([[startR, startG, startB]]);

console.log(`Found ${similarPalettes.length} similar palettes.`);

const newPalettes = [];

while (newPalettes.length < 8) {
  const newPalette = []

  let colorIndex = 0;
  let size = similarPalettes[Math.floor(Math.random() * similarPalettes.length)].length;
  while (newPalette.length < size) {
    const newColors = similarPalettes.map((palette) => palette[colorIndex]).filter((p) => p);
    const newColorIndex = Math.floor(Math.random() * newColors.length);
    const newColor = newColors[newColorIndex].slice();
    const newWeightIndex = Math.floor(Math.random() * newColors.length);
    const newWeight = newColors[newWeightIndex][3];
    newColor[3] = Number(newWeight.toFixed(2));
    newPalette.push(newColor);

    colorIndex += 1;
  }

  for (let i = 0; i < newPalette.length; i += 1) {
    newPalette[i][3] = Math.floor(newPalette[i][3] * 100);
  }

  let colorFill = newPalette.reduce((acc, color) => acc + color[3], 0);

  colorIndex = newPalette.length - 1;
  while (colorFill < 100) {
    newPalette[colorIndex][3] += 1;

    colorIndex -= 1;
    if (colorIndex < 0) {
      colorIndex = newPalette.length - 1;
    }

    colorFill = newPalette.reduce((acc, color) => acc + color[3], 0);
  }

  colorFill = newPalette.reduce((acc, color) => acc + color[3], 0);
  colorIndex = 0;
  while (colorFill > 100) {
    newPalette[colorIndex][3] -= 1;

    colorIndex += 1;
    if (colorIndex >= newPalette.length) {
      colorIndex = 0;
    }

    colorFill = newPalette.reduce((acc, color) => acc + color[3], 0);
  }

  newPalettes.push(newPalette);
}

const paletteWidth = 300;
const paletteHeight = 30;

const png = new PNG({
  width: paletteWidth,
  height: paletteHeight * newPalettes.length,
});

for (let y = 0; y < png.height; y += 1) {
  const paletteIndex = Math.floor(y / paletteHeight);

  for (let x = 0; x < png.width; x += 1) {
    let colorIndex = 0;
    let percent = 0;
    for (colorIndex = 0; colorIndex < newPalettes[paletteIndex].length; colorIndex += 1) {
      percent += newPalettes[paletteIndex][colorIndex][3];
      if (percent >= ((x + 1) / paletteWidth) * 100) {
        break;
      }
    }

    const [r, g, b] = newPalettes[paletteIndex][colorIndex];
    const idx = (png.width * y + x) << 2;

    png.data[idx + 0] = r;
    png.data[idx + 1] = g;
    png.data[idx + 2] = b;
    png.data[idx + 3] = 0xff;
  }
}

const buffer = PNG.sync.write(png);
fs.writeFileSync('color-machine.png', buffer);

console.log('Done!');
