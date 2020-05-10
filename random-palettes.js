#!/usr/bin/env node

const randomBetween = (min, max) => {
  return Math.random() * (max - min) + min;
};

const randomItem = (array) => {
  const index = Math.floor(randomBetween(0, array.length));

  return array[index];
};

const randomColor = () => {
  const r = Math.floor(randomBetween(0, 256));
  const g = Math.floor(randomBetween(0, 256));
  const b = Math.floor(randomBetween(0, 256));

  return [r, g, b];
};

const randomPalette = () => {
  const result = [];
  const size = randomItem([3, 4, 5, 6]);

  while (result.length < size) {
    result.push(randomColor());
  }

  let maxWeight = 100 - size;
  const weights = [];
  while (weights.length < size - 1) {
    const weight = Math.floor(randomBetween(1, maxWeight));
    weights.push(weight);
    maxWeight -= weight;
  }

  let totalWeight = weights.reduce((acc, w) => acc + w, 0);
  weights.push(100 - totalWeight);

  weights.forEach((weight, index) => {
    const percent = Number((weight / 100).toFixed(2));
    result[index] = result[index].concat(percent);
  });

  return result;
};

const randomPalettes = (count) => {
  const result = [];

  for (let i = 0; i < count; i += 1) {
    result.push(randomPalette());
  }

  return result;
}

const size = Number(process.argv[2] || 1);
const palettes = randomPalettes(size);
const json = JSON.stringify(palettes, null, 2);

console.log(json);
