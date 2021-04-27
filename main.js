const svgns = "http://www.w3.org/2000/svg";

async function getMedia(constraints) {
  let stream = null;

  try {
    stream = await navigator.mediaDevices.getUserMedia(constraints);
  } catch (err) {
    console.log(err);
  }
  return stream;
}

const canvas = document.querySelector("#canvas");

let size = parseInt(window.location.hash.substr(1), 10) || 20;

const imgCanvas = document.querySelector("#tmp");
const imgCtx = imgCanvas.getContext("2d");
const video = document.querySelector("#stream");
let radius = 1;

function resizeCanvas() {
  imgCanvas.width = size;
  imgCanvas.height = size;
  radius = 500 / imgCanvas.width;
  canvas.setAttribute("transform", `translate(${radius} ${radius})`);
  while (canvas.firstChild) {
    canvas.firstChild.remove();
  }
  for (let y = 0; y < imgCanvas.height; y++) {
    dots[y] = [];
    for (let x = 0; x < imgCanvas.width; x++) {
      const path = getSquircle();
      doSquircle(path, 1, x, y);
      canvas.append(path);
      dots[y][x] = path;
    }
  }
}

function getSquircle() {
  const path = document.createElementNS(svgns, "path");
  return path;
}

function doSquircle(path, r, x, y) {
  const d = r * radius;
  const d2 = d * 2;
  const o = 0.5;
  path.setAttribute(
    "d",
    `M 0, ${d}
  C 0, ${o} ${o}, 0 ${d}, 0
  S ${d2}, ${o} ${d2}, ${d}
  ${d2 - o}, ${d2} ${d}, ${d2}
  0, ${d2 - o} 0, ${d}`
  );
  path.setAttribute(
    "transform",
    `translate(${x * 2 * radius - d}, ${y * 2 * radius - d})`
  );
}

const dots = [];

function render() {
  imgCtx.drawImage(video, 0, 0);
  const data = imgCtx.getImageData(0, 0, imgCanvas.width, imgCanvas.height);

  if (data.data) {
    let ptr = 0;
    for (let y = 0; y < imgCanvas.height; y++) {
      for (let x = 0; x < imgCanvas.width; x++) {
        const r = data.data[ptr];
        const g = data.data[ptr + 1];
        const b = data.data[ptr + 2];
        const l = 0.2126 * r + 0.7152 * g + 0.0722 * b;
        const cRadius = 1 - l / 255;
        if (cRadius > 0.01) {
          doSquircle(dots[y][x], 1.5 * cRadius, x, y);
          dots[y][x].setAttribute("fill", `rgb(${r}, ${g}, ${b})`);
          dots[y][x].setAttribute("visibility", "visible");
        } else {
          dots[y][x].setAttribute("visibility", "hidden");
        }
        ptr += 4;
      }
    }
  }
  requestAnimationFrame(render);
}

async function updateStream() {
  const stream = await getMedia({
    video: { width: imgCanvas.width, height: imgCanvas.height },
  });
  if (stream) {
    canvas.style.display = "block";
    video.srcObject = stream;
    video.play();
  }
}

async function init() {
  resizeCanvas();
  await updateStream();
  render();
}

let theme = 0;
window.addEventListener("click", (e) => {
  theme = 1 - theme;
  if (theme === 0) {
    document.body.style.backgroundColor = "#ffffff";
  } else {
    document.body.style.backgroundColor = "#111111";
  }
});

document.querySelector("#options").addEventListener("click", async (e) => {
  size = parseInt(e.target.getAttribute("data-size"), 10);
  canvas.style.display = "none";
  resizeCanvas();
  requestAnimationFrame(() => {
    updateStream();
  });
  e.stopPropagation();
});

init();
