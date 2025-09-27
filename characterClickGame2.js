// ---- Three-Round Character Click Game ----
// Mobile-only, robust tap handling with responsive scaling

let characterImg;
let headingFont;

// gameStage: 0 = tap to start, 1 = instructions, 2 = playing,
//            3 = round-end, 4 = final win
let gameStage = 0;

let round = 1;
let roundTime   = [30, 20, 10];
let roundTarget = [45, 55, 65];
let score = 0;
let timerStart = 0;
let roundWon = false;

let chars = new Array(3);
let activeChar = null;

let clouds = [];
let numClouds = 18;

// canvas element reference
let canvas;

function preload() {
  headingFont = loadFont("https://bydaniellaf-codes.github.io/click-game-assets/Asteroid%203000.ttf");
  characterImg = loadImage("https://bydaniellaf-codes.github.io/click-game-assets/character.PNG");
}

function setup() {
  canvas = createCanvas(800, 600);
  canvas.elt.style.touchAction = 'none'; // prevent scrolling/zoom interference

  textAlign(CENTER, CENTER);
  textSize(20);

  for (let i = 0; i < numClouds; i++) {
    clouds[i] = new Cloud(random(-100, width + 100), random(30, 160), random(60, 160));
  }

  placeCharactersRandomly();

  adjustCanvasScale();
  window.addEventListener('resize', adjustCanvasScale);
}

function draw() {
  background(135, 206, 250);
  for (let c of clouds) c.display();

  switch (gameStage) {
    case 0: drawStartScreen(); break;
    case 1: drawInstructions(); break;
    case 2: drawGame(); break;
    case 3: drawRoundEnd(); break;
    case 4: drawFinalScreen(); break;
  }
}

function drawStartScreen() {
  textFont(headingFont);
  fill(50);
  textSize(32);
  text("Three-Round Click Challenge", width/2, height/2 - 80);
  textSize(20);
  text("Tap anywhere to begin!", width/2, height/2 + 20);
}

function drawInstructions() {
  textFont(headingFont);
  fill(30);
  textSize(26);
  text("Get ready!", width/2, 120);
  textSize(18);
  text(
    "Round 1: 30 s – 45 taps\n" +
    "Round 2: 20 s – 55 taps\n" +
    "Round 3: 10 s – 65 taps\n\n" +
    "Tap the highlighted character to score.\nTap anywhere to start Round " + round + ".",
    width/2, height/2
  );
}

function drawGame() {
  if (activeChar === null) {
    activeChar = random(chars);
    activeChar.highlight = true;
  }

  for (let c of chars) c.display();

  fill(0);
  textSize(20);
  text("Round " + round + " — Score: " + score + "/" + roundTarget[round-1], width/2, 30);

  let timeLeft = max(0, roundTime[round-1] - int((millis() - timerStart)/1000));
  text("Time left: " + timeLeft + " s", width/2, height - 24);

  if (timeLeft <= 0 || score >= roundTarget[round-1]) {
    roundWon = score >= roundTarget[round-1];
    gameStage = 3;
  }
}

function drawRoundEnd() {
  textFont(headingFont);
  fill(30);
  textSize(30);
  if (roundWon) {
    text("Round " + round + " complete!", width/2, height/2 - 20);
    textSize(18);
    if (round < 3) {
      text("Tap anywhere for Round " + (round + 1), width/2, height/2 + 40);
    } else {
      text("Tap anywhere to see final result", width/2, height/2 + 40);
    }
  } else {
    text("You missed the target.", width/2, height/2 - 20);
    textSize(18);
    text("Tap anywhere to retry Round " + round, width/2, height/2 + 40);
  }
}

function drawFinalScreen() {
  textFont(headingFont);
  fill(30);
  textSize(36);
  text("Congratulations, you beat all 3 rounds!", width/2, height/2 - 20);
  textSize(18);
  text("Tap anywhere to play again", width/2, height/2 + 40);
}

// ---- MOBILE TAP HANDLER ----
function touchStarted() {
  // get canvas bounding box
  const rect = canvas.elt.getBoundingClientRect();
  const touchX = touches[0].clientX;
  const touchY = touches[0].clientY;

  // map to internal coordinates
  const sx = (touchX - rect.left) * (canvas.width / rect.width);
  const sy = (touchY - rect.top) * (canvas.height / rect.height);

  handleTapInternal(sx, sy);

  return false; // prevent scrolling
}

// ---- INTERNAL GAME LOGIC ----
function handleTapInternal(sx, sy) {
  if (gameStage === 0) { gameStage = 1; return; }
  if (gameStage === 1) { startRound(round); return; }
  if (gameStage === 2 && activeChar !== null) {
    if (activeChar.clicked(sx, sy)) {
      score++;
      activeChar.startJump();
      activeChar.highlight = false;
      activeChar = null;
      return;
    }
  }
  if (gameStage === 3) {
    if (roundWon) { round < 3 ? startRound(round + 1) : gameStage = 4; }
    else startRound(round);
    return;
  }
  if (gameStage === 4) { resetGame(); return; }
}

function startRound(r) {
  round = r;
  score = 0;
  timerStart = millis();
  placeCharactersRandomly();
  activeChar = null;
  gameStage = 2;
}

function resetGame() {
  round = 1;
  score = 0;
  gameStage = 0;
}

// ---- CHARACTERS ----
function placeCharactersRandomly() {
  let pos = [];
  let minDist = 160;
  for (let i = 0; i < chars.length; i++) {
    let placed = false;
    let tries = 0;
    while (!placed && tries < 300) {
      let x = random(100, width - 100);
      let y = random(height/2 + 50, height - 140);
      let ok = true;
      for (let p of pos) if (dist(x, y, p.x, p.y) < minDist) { ok = false; break; }
      if (ok) { pos.push(createVector(x, y)); placed = true; }
      tries++;
    }
    if (!placed) pos.push(createVector((i+1)*width/(chars.length+1), height - 200));
  }
  for (let i = 0; i < chars.length; i++) chars[i] = new Character(pos[i].x, pos[i].y);
}

class Character {
  constructor(x0, y0) {
    this.baseX = x0; this.baseY = y0;
    this.x = x0; this.y = y0;
    let desiredW = 90;
    let scale = desiredW / characterImg.width;
    this.w = characterImg.width * scale;
    this.h = characterImg.height * scale;
    this.highlight = false;
    this.jumping = false;
    this.velY = 0;
  }
  display() {
    if (this.jumping) {
      this.y += this.velY;
      this.velY += 0.6;
      if (this.y >= this.baseY) { this.y = this.baseY; this.velY = 0; this.jumping = false; }
    }
    if (this.highlight) { noStroke(); fill(255, 230, 80, 150); ellipse(this.x, this.y, this.w*1.35, this.h*1.35); }
    imageMode(CENTER);
    image(characterImg, this.x, this.y, this.w, this.h);
  }
  clicked(px, py) {
    return px > this.x - this.w/2 && px < this.x + this.w/2 &&
           py > this.y - this.h/2 && py < this.y + this.h/2;
  }
  startJump() { if (!this.jumping) { this.jumping = true; this.velY = -10; } }
}

// ---- CLOUDS ----
class Cloud {
  constructor(x0, y0, w0) { this.x = x0; this.y = y0; this.w = w0; }
  display() {
    noStroke(); fill(255);
    ellipse(this.x, this.y, this.w, this.w*0.6);
    ellipse(this.x + this.w*0.28, this.y + 8, this.w*0.6, this.w*0.35);
    ellipse(this.x - this.w*0.28, this.y + 5, this.w*0.45, this.w*0.3);
  }
}

// ---- RESPONSIVE VISUAL SCALING ----
function adjustCanvasScale() {
  const w = window.innerWidth;
  const h = window.innerHeight;
  const factor = Math.min(w / 800, h / 600);
  if (canvas && canvas.elt) {
    canvas.elt.style.width = (800 * factor) + 'px';
    canvas.elt.style.height = (600 * factor) + 'px';
    canvas.elt.style.transformOrigin = 'top left';
  }
}

function windowResized() {
  adjustCanvasScale();
}

