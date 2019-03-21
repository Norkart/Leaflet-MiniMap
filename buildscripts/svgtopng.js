const fs = require("pn/fs"); // https://www.npmjs.com/package/pn
const svg2png = require("svg2png");

fs.readFile("src/images/toggle.svg")
    .then(svg2png)
    .then(buffer => fs.writeFile("dist/images/toggle.png", buffer))
    .catch(e => console.error(e));
