const a = [1, 2, 3, 4];

const b = a.map(value => {
  if (value % 2 === 0) {
    return value;
  }
});

console.log(b);
