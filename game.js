'use strict';

/* ================= 關卡資料 ================= */

const TILE = 64;

// 圖例：# 牆壁、. 地板、V 販賣機、D 上鎖的門、T 寶石
//       B 麵包店、M 市場、P 公園草地、H 家（起點）、X 樹
const LEVELS = [
  {
    titel: 'Der Schlüssel und der Diamant',
    tagline: '用德文句子命令勇者，拿到寶石！',
    grid: [
      '##########',
      '#......###',
      '######.###',
      '#V.....DT#',
      '##########',
    ],
    hero: { x: 1, y: 1, dir: 0 }, // dir：0 東、1 南、2 西、3 北
    coins: [{ x: 3, y: 1 }, { x: 3, y: 3 }],
    keyPrice: 2,
    maxSteps: 500,
  },
  {
    titel: 'Der Plan für den Tag',
    tagline: '用一句話計畫你的一天：Ich möchte zuerst …, dann … und danach …',
    grid: [
      '############',
      '#H...B...M.#',
      '#..#.....#X#',
      '#..#.PPP...#',
      '#.X..PPP.#.#',
      '############',
    ],
    hero: { x: 1, y: 1, dir: 0 },
    coins: [],
    keyPrice: 0,
    maxSteps: 500,
  },
  {
    titel: 'Mit dem Bus zur Bibliothek',
    tagline: '現在式動詞變位：Ich gehe …, fahre … und lerne …',
    grid: [
      '##############',
      '#H....#~~.L..#',
      '#....S#~~....#',
      '#==========..#',
      '#....X#~~..C.#',
      '#.X...#~~....#',
      '##############',
    ],
    hero: { x: 1, y: 1, dir: 0 },
    coins: [],
    keyPrice: 0,
    maxSteps: 500,
    busRoute: [{ x: 5, y: 3 }, { x: 6, y: 3 }, { x: 7, y: 3 }, { x: 8, y: 3 }, { x: 9, y: 3 }, { x: 10, y: 3 }],
    busAlight: { x: 10, y: 2 },
  },
  {
    titel: 'Das Treffen mit Anna',
    tagline: '複合句：Nachdem …, gehe ich …, um … zu …',
    grid: [
      '##############',
      '#============#',
      '#......RS....#',
      '#..QQQQQQQQ..#',
      '#..QQQFQQQQ..#',
      '#..QQQQQQQQ..#',
      '#.........AC.#',
      '##############',
    ],
    hero: { x: 1, y: 1, dir: 0 },
    coins: [],
    keyPrice: 0,
    maxSteps: 500,
    startImBus: true,
    busRoute: [{ x: 2, y: 1 }, { x: 3, y: 1 }, { x: 4, y: 1 }, { x: 5, y: 1 }, { x: 6, y: 1 }, { x: 7, y: 1 }, { x: 8, y: 1 }],
    busAlight: { x: 8, y: 2 },
  },
  {
    titel: 'Vor halb acht zur Arbeit',
    tagline: '情態動詞 muss＋halb acht＝7:30＋damit 目的句',
    grid: [
      '##############',
      '#rrrrr.......#',
      '#............#',
      '#..U.....K...#',
      '#............#',
      '#............#',
      '#xxxxxxxxxxxx#',
      '#..........W.#',
      '##############',
    ],
    hero: { x: 2, y: 2, dir: 1 },
    coins: [],
    keyPrice: 0,
    maxSteps: 500,
    uhrStart: 7 * 60 + 20, // 07:20
    zugWartet: [{ x: 1, y: 6 }, { x: 2, y: 6 }, { x: 3, y: 6 }],
    zugEinstieg: { x: 3, y: 5 },
    zugKopf: { x: 3, y: 6 },
    zugRoute: [{ x: 4, y: 6 }, { x: 5, y: 6 }, { x: 6, y: 6 }, { x: 7, y: 6 }, { x: 8, y: 6 }, { x: 9, y: 6 }, { x: 10, y: 6 }],
    zugAusstieg: { x: 10, y: 7 },
    zugAbfahrt: 7 * 60 + 30, // halb acht！
  },
  {
    titel: 'Obwohl es regnet …',
    tagline: '讓步子句 obwohl＋nach Hause／zu Hause',
    grid: [
      '##############',
      '#E........O..#',
      '#............#',
      '#....S.......#',
      '#============#',
      '#...........H#',
      '##############',
    ],
    hero: { x: 7, y: 2, dir: 2 },
    coins: [],
    keyPrice: 0,
    maxSteps: 500,
    regen: true,
    busEinstieg: { x: 5, y: 4 },
    busFahrt: [{ x: 6, y: 4 }, { x: 7, y: 4 }, { x: 8, y: 4 }, { x: 9, y: 4 }, { x: 10, y: 4 }, { x: 11, y: 4 }],
    busAusstieg: { x: 11, y: 5 },
  },
  {
    titel: 'Das Fahrrad und die Straßenbahn',
    tagline: '關係子句 das ich … gekauft habe＋mit der Straßenbahn',
    grid: [
      '##############',
      '#w...........#',
      '#............#',
      '#......S.....#',
      '#xxxxxxxxxxxx#',
      '#..........G.#',
      '##############',
    ],
    hero: { x: 6, y: 2, dir: 0 },
    coins: [],
    keyPrice: 0,
    maxSteps: 500,
    fahrrad: { x: 9, y: 2 },
    tramWartet: [{ x: 7, y: 4 }],
    tramEinstieg: { x: 7, y: 4 },
    tramFahrt: [{ x: 8, y: 4 }, { x: 9, y: 4 }, { x: 10, y: 4 }],
    tramAusstieg: { x: 10, y: 5 },
  },
  {
    titel: 'Der Tagtraum am Fluss',
    tagline: 'Konjunktiv II：hätte／würde ＋ 原形——作夢專用語法',
    grid: [
      '##############',
      '#~~~~~~~~~~~~#',
      '#~~~~~~~~~~~~#',
      '#............#',
      '#..X......X..#',
      '#.......NYYY.#',
      '#............#',
      '##############',
    ],
    hero: { x: 1, y: 3, dir: 0 },
    coins: [],
    keyPrice: 0,
    maxSteps: 500,
  },
  {
    titel: 'Deutschstadt – die offene Welt',
    tagline: '自由組句接任務，賺滿 12 Münzen 買下 Zauberstein！',
    grid: [
      '####################',
      '#H...B..M..V...R.E.#',
      '#..................#',
      '#PPX.C.......QFQ...#',
      '#PPP.........QAQ...#',
      '#.........S.....O..#',
      '#~~~~~~~~~x~~~~~~~~#',
      '#~~~~~~~~~x~~~~~~~~#',
      '#.........S........#',
      '#...L.........N....#',
      '#......G...........#',
      '####################',
    ],
    hero: { x: 1, y: 2, dir: 0 },
    coins: [],
    keyPrice: 0,
    maxSteps: 999,
    offeneWelt: true,
    tramNord: { x: 10, y: 5 },
    tramSued: { x: 10, y: 8 },
  },
];

let LEVEL = LEVELS[0]; // 目前關卡（由 Game.loadLevel 切換）

const DIRS = [
  { dx: 1, dy: 0 },  // 東
  { dx: 0, dy: 1 },  // 南
  { dx: -1, dy: 0 }, // 西
  { dx: 0, dy: -1 }, // 北
];

const EMOJI_FONT = '"Noto Sans TC", "Apple Color Emoji", "Segoe UI Emoji", "Noto Color Emoji", sans-serif';

/* ================= 執行控制用的訊號 ================= */

class GameError extends Error {}   // 違反遊戲規則（撞牆、錢不夠……），程式停止
class WinSignal extends Error {}   // 抵達寶石，過關
class AbortRun extends Error {}    // 使用者按下重置，安靜地中斷執行

/* ================= 遊戲本體 ================= */

class Game {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.speed = 1;
    this.token = 0;
    this.onHudChange = () => {};
    this.onHint = () => {};
    this._tweens = [];
    this._floaters = [];
    this._lastTick = 0;
    this.loadLevel(0);
    requestAnimationFrame((t) => this._frame(t));
    // 分頁在背景時 rAF 會暫停，改用計時器繼續推進動畫，避免程式卡住
    setInterval(() => {
      const now = performance.now();
      if (now - this._lastTick > 120) this._tick(now);
    }, 40);
  }

  _setupCanvas() {
    const dpr = window.devicePixelRatio || 1;
    this.canvas.width = this.cols * TILE * dpr;
    this.canvas.height = this.rows * TILE * dpr;
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  loadLevel(index) {
    this.levelIndex = index;
    this.level = LEVELS[index];
    LEVEL = this.level;
    this.cols = this.level.grid[0].length;
    this.rows = this.level.grid.length;
    this._setupCanvas();
    this.reset();
  }

  /* ---------- 狀態 ---------- */

  reset() {
    this.token++;
    // 喚醒還在等動畫的舊程式；它們醒來後會發現 token 不對而自行中斷
    this._tweens.forEach((tw) => tw.resolve());
    this._tweens = [];
    this._floaters = [];
    this.state = {
      hero: { ...LEVEL.hero },
      px: (LEVEL.hero.x + 0.5) * TILE,
      py: (LEVEL.hero.y + 0.5) * TILE,
      bob: 0,
      shakeX: 0,
      shakeY: 0,
      coins: LEVEL.coins.map((c) => ({ ...c, taken: false })),
      purse: 0,
      coinsTaken: 0,
      hasKey: false,
      doorOpen: false,
      brot: false,
      obst: false,
      buch: false,
      inBus: !!LEVEL.startImBus,
      anDerHaltestelle: false,
      ausgestiegen: false,
      amCafe: false,
      uhr: LEVEL.uhrStart ?? null,
      umgestiegen: false,
      imZug: false,
      zugWeg: false,
      medikament: false,
      paket: false,
      fahrradDabei: false,
      fahrradAbgegeben: false,
      imTram: false,
      tramWeg: false,
      traum: false,
      amMuseum: false,
      // 開放世界（Deutschstadt）
      tramXY: LEVEL.tramNord ? { ...LEVEL.tramNord } : null,
      owBrot: false,
      owBrezel: false,
      owBlume: false,
      owKaffee: false,
      owMedikament: false,
      owMedikamentGeliefert: false,
      owPaket: false,
      owPaketGeliefert: false,
      owBuch: false,
      owAnnaGetroffen: false,
      owAnUni: false,
      owMuseumBesucht: false,
      owTagtraum: false,
      owNebensatzGesagt: false,
      owModalGesagt: false,
      owGefahren: false,
      owBelohnt: {},
      won: false,
      steps: 0,
    };
    this.onHudChange();
  }

  rawTile(x, y) {
    if (x < 0 || y < 0 || x >= this.cols || y >= this.rows) return '#';
    return LEVEL.grid[y][x];
  }

  // 把「已開的門」視為地板
  tileAt(x, y) {
    const ch = this.rawTile(x, y);
    if (ch === 'D' && this.state.doorOpen) return '.';
    return ch;
  }

  _passable(ch) {
    if (ch === '.' || ch === 'T' || ch === 'P' || ch === 'H' || ch === 'S' || ch === 'Q') return true;
    // 白日夢裡（Konjunktiv II）連水面和軌道都能走——與現實相反嘛！
    if (this.state && this.state.traum && (ch === '~' || ch === 'x')) return true;
    return false;
  }

  _front() {
    const { hero } = this.state;
    const d = DIRS[hero.dir];
    return { x: hero.x + d.dx, y: hero.y + d.dy };
  }

  _coinAt(x, y) {
    return this.state.coins.find((c) => !c.taken && c.x === x && c.y === y);
  }

  _ensure(token) {
    if (token !== this.token) throw new AbortRun();
  }

  _countStep() {
    this.state.steps++;
    if (this.state.steps > LEVEL.maxSteps) {
      throw new GameError(`⏱️ 動作超過 ${LEVEL.maxSteps} 步的上限，檢查看看是不是重複太多次了！`);
    }
  }

  /* ---------- 積木呼叫的動作 API ---------- */

  async moveForward() {
    const t = this.token;
    this._countStep();
    const { hero } = this.state;
    const f = this._front();
    const ch = this.tileAt(f.x, f.y);

    if (!this._passable(ch)) {
      await this._shake();
      this._ensure(t);
      if (ch === 'D') throw new GameError('🚪 Die Tür ist verschlossen!（門鎖著走不過去！先站在門前用「öffne die Tür」）');
      if (ch === 'V') throw new GameError('🥤 Das ist der Automat!（那是販賣機，不能穿過去）');
      throw new GameError('💥 Autsch! Da ist eine Wand!（撞到牆壁了！程式停止，按「重置」再試）');
    }

    await this._walkTween(f.x, f.y);
    this._ensure(t);
    hero.x = f.x;
    hero.y = f.y;

    if (this.rawTile(hero.x, hero.y) === 'T') {
      this.state.won = true;
      this.onHudChange();
      this._float(hero.x, hero.y, '🎉');
      await this._wait(400);
      throw new WinSignal();
    }
    if (this._coinAt(hero.x, hero.y)) {
      this.onHint('💡 Hier liegt eine Münze!（腳下有金幣！用「nimm die Münze」撿起來）');
    }
  }

  async turn(delta) {
    const t = this.token;
    this._countStep();
    this.state.hero.dir = (this.state.hero.dir + delta + 4) % 4;
    await this._wait(150);
    this._ensure(t);
  }

  async pickUp() {
    const t = this.token;
    this._countStep();
    const { hero } = this.state;
    const coin = this._coinAt(hero.x, hero.y);
    if (!coin) {
      await this._shake();
      this._ensure(t);
      throw new GameError('✋ Hier liegt nichts.（這裡沒有東西可以撿，要站在金幣上面才行）');
    }
    coin.taken = true;
    this.state.purse++;
    this.state.coinsTaken++;
    this.onHudChange();
    this._float(hero.x, hero.y, '+1 Münze');
    await this._wait(260);
    this._ensure(t);
  }

  async buyKey() {
    const t = this.token;
    this._countStep();
    const f = this._front();
    if (this.rawTile(f.x, f.y) !== 'V') {
      await this._shake();
      this._ensure(t);
      throw new GameError('🥤 Hier ist kein Automat.（前方沒有販賣機，要走到它前面、面對它才能買）');
    }
    if (this.state.hasKey) {
      throw new GameError('🗝️ Du hast schon einen Schlüssel.（你已經有鑰匙了，不用再買）');
    }
    if (this.state.purse < LEVEL.keyPrice) {
      await this._shake();
      this._ensure(t);
      throw new GameError(`🪙 Zu wenig Geld!（金幣不夠！鑰匙要 ${LEVEL.keyPrice} 枚金幣，你只有 ${this.state.purse} 枚，先去撿金幣）`);
    }
    this.state.purse -= LEVEL.keyPrice;
    this.state.hasKey = true;
    this.onHudChange();
    this._float(this.state.hero.x, this.state.hero.y, `-${LEVEL.keyPrice} Münzen`);
    await this._wait(320);
    this._ensure(t);
    this._float(f.x, f.y, '🗝️ Klonk!');
    this.onHint('🗝️ Super! Du hast den Schlüssel!（買到鑰匙了！去開那扇上鎖的門吧）');
    await this._wait(320);
    this._ensure(t);
  }

  async openDoor() {
    const t = this.token;
    this._countStep();
    const f = this._front();
    if (this.rawTile(f.x, f.y) !== 'D') {
      await this._shake();
      this._ensure(t);
      throw new GameError('🚪 Hier ist keine Tür.（前方沒有門，沒東西好開的）');
    }
    if (this.state.doorOpen) {
      throw new GameError('🚪 Die Tür ist schon offen!（門已經開了，直接走過去吧）');
    }
    if (!this.state.hasKey) {
      await this._shake();
      this._ensure(t);
      throw new GameError('🔒 Ohne Schlüssel geht es nicht!（門鎖得緊緊的，你需要一把鑰匙！聽說販賣機有賣……）');
    }
    this.state.doorOpen = true;
    this.onHudChange();
    this._float(f.x, f.y, '🔓 Klick!');
    await this._wait(350);
    this._ensure(t);
  }

  /* ---------- 自動走路（第 2 關：計畫句） ---------- */

  // 走到任一目標格（BFS 最短路徑，一格一格動畫）
  async walkTo(ziele, zielName) {
    const t = this.token;
    const pfad = this._bfsPfad(ziele);
    if (!pfad) {
      throw new GameError(`🚧 Kein Weg dorthin!（走不到${zielName || '那裡'}……地圖被擋住了？）`);
    }
    for (const schritt of pfad) {
      this._countStep();
      const hero = this.state.hero;
      const dx = schritt.x - hero.x;
      const dy = schritt.y - hero.y;
      const idx = DIRS.findIndex((d) => d.dx === dx && d.dy === dy);
      if (idx >= 0) hero.dir = idx;
      await this._walkTween(schritt.x, schritt.y);
      this._ensure(t);
      hero.x = schritt.x;
      hero.y = schritt.y;
      this._tickUhr();
    }
  }

  // 有車站大鐘的關卡：每走一步，時間就前進一分鐘
  _tickUhr(min = 1) {
    if (typeof this.state.uhr === 'number') {
      this.state.uhr += min;
      this.onHudChange();
    }
  }

  uhrText() {
    const u = this.state.uhr;
    return `${Math.floor(u / 60)}:${String(u % 60).padStart(2, '0')}`;
  }

  _bfsPfad(ziele) {
    const hero = this.state.hero;
    const key = (x, y) => `${x},${y}`;
    const zielSet = new Set(ziele.map((z) => key(z.x, z.y)));
    if (zielSet.has(key(hero.x, hero.y))) return [];
    const prev = new Map([[key(hero.x, hero.y), null]]);
    const queue = [{ x: hero.x, y: hero.y }];
    while (queue.length) {
      const cur = queue.shift();
      for (const d of DIRS) {
        const nx = cur.x + d.dx;
        const ny = cur.y + d.dy;
        const k = key(nx, ny);
        if (prev.has(k)) continue;
        if (!this._passable(this.tileAt(nx, ny))) continue;
        prev.set(k, cur);
        if (zielSet.has(k)) {
          const pfad = [{ x: nx, y: ny }];
          let node = cur;
          while (node && !(node.x === hero.x && node.y === hero.y)) {
            pfad.unshift(node);
            node = prev.get(key(node.x, node.y));
          }
          return pfad;
        }
        queue.push({ x: nx, y: ny });
      }
    }
    return null;
  }

  faceTile(x, y) {
    const hero = this.state.hero;
    const dx = Math.sign(x - hero.x);
    const dy = Math.sign(y - hero.y);
    const idx = DIRS.findIndex((d) => d.dx === dx && d.dy === dy);
    if (idx >= 0) hero.dir = idx;
  }

  /* ---------- 感測（給條件積木用，同步） ---------- */

  frontIsBlocked() {
    const f = this._front();
    return !this._passable(this.tileAt(f.x, f.y));
  }

  onCoin() {
    const { hero } = this.state;
    return !!this._coinAt(hero.x, hero.y);
  }

  /* ---------- 動畫系統 ---------- */

  _tween(dur, apply) {
    return new Promise((resolve) => {
      this._tweens.push({ start: performance.now(), dur, apply, resolve });
    });
  }

  _wait(ms) {
    return this._tween(ms / this.speed, () => {});
  }

  _walkTween(tx, ty, dur = 300, hop = true) {
    const s = this.state;
    const from = { x: s.px, y: s.py };
    const to = { x: (tx + 0.5) * TILE, y: (ty + 0.5) * TILE };
    return this._tween(dur / this.speed, (p) => {
      const e = p < 0.5 ? 2 * p * p : 1 - Math.pow(-2 * p + 2, 2) / 2; // easeInOutQuad
      s.px = from.x + (to.x - from.x) * e;
      s.py = from.y + (to.y - from.y) * e;
      s.bob = hop ? -Math.abs(Math.sin(p * Math.PI)) * 6 : 0; // 小跳步
    }).then(() => { s.bob = 0; });
  }

  _shake() {
    const s = this.state;
    const d = DIRS[s.hero.dir];
    return this._tween(320 / this.speed, (p) => {
      const mag = Math.sin(p * Math.PI * 6) * 5 * (1 - p);
      s.shakeX = d.dx * mag;
      s.shakeY = d.dy * mag;
    }).then(() => { s.shakeX = 0; s.shakeY = 0; });
  }

  _float(tileX, tileY, text) {
    this._floaters.push({
      x: (tileX + 0.5) * TILE,
      y: tileY * TILE + 8,
      text,
      start: performance.now(),
      dur: 950,
    });
  }

  _frame(now) {
    this._tick(now);
    requestAnimationFrame((t) => this._frame(t));
  }

  _tick(now) {
    this._lastTick = now;
    this._tweens = this._tweens.filter((tw) => {
      const p = Math.min(1, (now - tw.start) / tw.dur);
      tw.apply(p);
      if (p >= 1) { tw.resolve(); return false; }
      return true;
    });
    this._floaters = this._floaters.filter((f) => now - f.start < f.dur);
    this._draw(now);
  }

  /* ---------- 繪圖 ---------- */

  _emoji(text, x, y, size, alpha = 1) {
    const c = this.ctx;
    c.save();
    c.globalAlpha = alpha;
    c.font = `${size}px ${EMOJI_FONT}`;
    c.textAlign = 'center';
    c.textBaseline = 'middle';
    c.fillText(text, x, y);
    c.restore();
  }

  _draw(now) {
    const c = this.ctx;
    const s = this.state;
    c.clearRect(0, 0, this.cols * TILE, this.rows * TILE);

    // 地板 + 地形
    for (let y = 0; y < this.rows; y++) {
      for (let x = 0; x < this.cols; x++) {
        const px = x * TILE;
        const py = y * TILE;
        c.fillStyle = (x + y) % 2 === 0 ? '#f6f1e3' : '#eee7d3';
        c.fillRect(px, py, TILE, TILE);

        const ch = this.rawTile(x, y);
        if (ch === '#') this._drawWall(px, py);
        else if (ch === 'V') this._drawVending(px, py);
        else if (ch === 'D') this._drawDoor(px, py, now);
        else if (ch === 'T') this._drawGem(px, py, now);
        else if (ch === 'B') this._drawBaeckerei(px, py);
        else if (ch === 'M') this._drawMarkt(px, py);
        else if (ch === 'P') this._drawGras(px, py, x, y);
        else if (ch === 'H') this._drawHaus(px, py);
        else if (ch === 'X') this._drawBaum(px, py);
        else if (ch === '~') this._drawWasser(px, py, x, y, now);
        else if (ch === '=') this._drawStrasse(px, py, x, y);
        else if (ch === 'S') this._drawHaltestelle(px, py);
        else if (ch === 'L') this._drawBibliothek(px, py);
        else if (ch === 'C') this._drawCafe(px, py);
        else if (ch === 'R') this._drawRathaus(px, py);
        else if (ch === 'Q') this._drawPlatz(px, py, x, y);
        else if (ch === 'F') this._drawBrunnen(px, py, x, y, now);
        else if (ch === 'A') this._drawAnna(px, py, now);
        else if (ch === 'x') this._drawGleis(px, py);
        else if (ch === 'r') { this._drawGleis(px, py); this._emoji('🚋', px + TILE / 2, py + TILE / 2 - 4, 46); }
        else if (ch === 'K') this._drawUhr(px, py);
        else if (ch === 'U') this._drawTafel(px, py);
        else if (ch === 'W') this._drawBuero(px, py);
        else if (ch === 'E') this._drawApotheke(px, py);
        else if (ch === 'O') this._drawPost(px, py);
        else if (ch === 'w') this._drawWerkstatt(px, py);
        else if (ch === 'G') this._drawUni(px, py);
        else if (ch === 'N') this._drawMuseum(px, py);
        else if (ch === 'Y') this._drawAusstellung(px, py, x);
      }
    }

    // 第 5 關：在月台等待的藍線列車（發車後就不再畫了）
    if (this.level.zugWartet && !s.zugWeg) {
      const wagen = this.level.zugWartet;
      for (let i = 0; i < wagen.length; i++) {
        const istKopf = i === wagen.length - 1;
        this._emoji(istKopf ? '🚆' : '🚃', (wagen[i].x + 0.5) * TILE, (wagen[i].y + 0.5) * TILE - 4, istKopf ? 48 : 44);
      }
    }

    // 第 7 關：停在路邊的腳踏車、等待的路面電車
    if (this.level.fahrrad && !s.fahrradDabei && !s.fahrradAbgegeben) {
      const bob = Math.sin(now / 500) * 1.5;
      this._emoji('🚲', (this.level.fahrrad.x + 0.5) * TILE, (this.level.fahrrad.y + 0.5) * TILE + bob, 40);
    }
    if (this.level.tramWartet && !s.tramWeg) {
      for (const t of this.level.tramWartet) {
        this._emoji('🚋', (t.x + 0.5) * TILE, (t.y + 0.5) * TILE - 4, 48);
      }
    }

    // 開放世界：等待中的路面電車（會在兩岸之間開來開去）
    if (this.level.offeneWelt && s.tramXY && !s.imTram) {
      this._emoji('🚋', (s.tramXY.x + 0.5) * TILE, (s.tramXY.y + 0.5) * TILE - 4, 48);
    }

    // 金幣（上下漂浮）
    for (const coin of s.coins) {
      if (coin.taken) continue;
      const bobY = Math.sin(now / 320 + coin.x * 1.7) * 3;
      this._drawCoin((coin.x + 0.5) * TILE, (coin.y + 0.5) * TILE + bobY);
    }

    // 勇者
    const hx = s.px + s.shakeX;
    const hy = s.py + s.shakeY + s.bob;
    c.save();
    c.fillStyle = 'rgba(0,0,0,.18)';
    c.beginPath();
    c.ellipse(s.px, s.py + 22, 16, 6, 0, 0, Math.PI * 2);
    c.fill();
    c.restore();

    if (s.inBus) {
      // 搭公車中：畫公車，勇者在車裡
      this._emoji('🚌', hx, hy - 4, 52);
    } else if (s.imZug) {
      // 搭火車中：畫藍線列車
      this._emoji('🚆', hx, hy - 4, 52);
    } else if (s.imTram) {
      // 搭路面電車中
      this._emoji('🚋', hx, hy - 4, 52);
    } else {
      // 推著腳踏車走
      if (s.fahrradDabei) {
        const d = DIRS[s.hero.dir];
        this._emoji('🚲', hx + d.dx * 20, hy + 8, 34);
      }
      // 開放世界：隨身帶著的東西
      if (s.owPaket) this._emoji('📦', hx - 16, hy + 8, 20);
      if (s.owBuch) this._emoji('📖', hx + 16, hy + 10, 16);
      if (s.owBlume) this._emoji('🌸', hx + 14, hy - 16, 16);
      if (s.owMedikament) this._emoji('💊', hx - 14, hy - 16, 14);
      this._emoji('🧙‍♂️', hx, hy - 2, 44);
      // 雨天自動撐傘
      if (this.level.regen) this._emoji('☂️', hx + 15, hy - 24, 28);

      // 面向指示（金色小三角）
      const d = DIRS[s.hero.dir];
      const tx = hx + d.dx * 24;
      const ty = hy + d.dy * 24;
      const ang = Math.atan2(d.dy, d.dx);
      c.save();
      c.translate(tx, ty);
      c.rotate(ang);
      c.fillStyle = '#f0a821';
      c.strokeStyle = '#b97e0e';
      c.lineWidth = 1.5;
      c.beginPath();
      c.moveTo(7, 0);
      c.lineTo(-4, -6);
      c.lineTo(-4, 6);
      c.closePath();
      c.fill();
      c.stroke();
      c.restore();
    }

    // 第 2 關過關：野餐！
    if (s.won && this.levelIndex === 1) {
      this._emoji('🧺', s.px + 20, s.py + 14, 20);
      this._emoji('☕', s.px - 18, s.py + 14, 16);
    }

    // 第 3 關過關：在咖啡店唸書！
    if (s.won && this.levelIndex === 2) {
      this._emoji('📖', s.px + 20, s.py + 14, 20);
      this._emoji('☕', s.px - 18, s.py + 14, 16);
    }

    // 第 4 關過關：見到 Anna！
    if (s.won && this.levelIndex === 3) {
      const d = DIRS[s.hero.dir];
      this._emoji('💕', s.px + d.dx * 34, s.py + d.dy * 34 - 34, 24);
    }

    // 第 5 關過關：準時上班！
    if (s.won && this.levelIndex === 4) {
      this._emoji('💼', s.px + 20, s.py + 12, 20);
      this._emoji('✅', s.px - 20, s.py - 26, 18);
    }

    // 第 6 關過關：到家了！
    if (s.won && this.levelIndex === 5) {
      this._emoji('🎉', s.px - 20, s.py - 28, 20);
    }

    // 第 7 關過關：到大學了！
    if (s.won && this.levelIndex === 6) {
      this._emoji('🎓', s.px - 20, s.py - 28, 22);
    }

    // 第 8 關過關：白日夢裡看展！
    if (s.won && this.levelIndex === 7) {
      this._emoji('💭', s.px + 22, s.py - 30, 22);
    }

    // 開放世界過關：買到魔法寶石！
    if (s.won && this.levelIndex === 8) {
      this._emoji('💎', s.px, s.py - 34, 26);
      this._emoji('✨', s.px - 24, s.py - 20, 16);
      this._emoji('✨', s.px + 24, s.py - 24, 14);
    }

    // 雨天特效（畫在場景之上、漂浮文字之下）
    if (this.level.regen) this._drawRegen(now);

    // 白日夢特效（Konjunktiv II 夢境模式）
    if (s.traum) this._drawTraum(now);

    // 漂浮文字（+1 🪙、🔓……）
    for (const f of this._floaters) {
      const p = (now - f.start) / f.dur;
      c.save();
      c.globalAlpha = 1 - p;
      c.font = `bold 18px ${EMOJI_FONT}`;
      c.textAlign = 'center';
      c.textBaseline = 'middle';
      c.lineWidth = 3;
      c.strokeStyle = 'rgba(255,255,255,.85)';
      c.strokeText(f.text, f.x, f.y - p * 26);
      c.fillStyle = '#5b4a12';
      c.fillText(f.text, f.x, f.y - p * 26);
      c.restore();
    }
  }

  _drawCoin(cx, cy) {
    const c = this.ctx;
    c.save();
    c.fillStyle = 'rgba(0,0,0,.12)';
    c.beginPath();
    c.ellipse(cx, cy + 16, 11, 4, 0, 0, Math.PI * 2);
    c.fill();
    c.fillStyle = '#f5c542';
    c.strokeStyle = '#c9861a';
    c.lineWidth = 3;
    c.beginPath();
    c.arc(cx, cy, 13, 0, Math.PI * 2);
    c.fill();
    c.stroke();
    c.fillStyle = '#c9861a';
    c.font = `bold 15px ${EMOJI_FONT}`;
    c.textAlign = 'center';
    c.textBaseline = 'middle';
    c.fillText('$', cx, cy + 1);
    c.fillStyle = 'rgba(255,255,255,.75)';
    c.beginPath();
    c.arc(cx - 5, cy - 6, 2.5, 0, Math.PI * 2);
    c.fill();
    c.restore();
  }

  _drawWall(px, py) {
    const c = this.ctx;
    c.fillStyle = '#9a6b45';
    c.fillRect(px, py, TILE, TILE);
    c.fillStyle = 'rgba(255,255,255,.14)';
    c.fillRect(px, py, TILE, 4);
    // 磚縫
    c.fillStyle = '#7c5334';
    for (let row = 0; row < 4; row++) {
      const y = py + row * 16;
      c.fillRect(px, y + 14, TILE, 2);
      const offset = row % 2 === 0 ? 0 : 32;
      c.fillRect(px + ((offset + 16) % 64), y, 2, 14);
      c.fillRect(px + ((offset + 48) % 64), y, 2, 14);
    }
  }

  _drawVending(px, py) {
    const c = this.ctx;
    c.save();
    // 機身
    c.fillStyle = '#c0392b';
    c.beginPath();
    c.roundRect(px + 9, py + 5, 46, 54, 6);
    c.fill();
    c.fillStyle = 'rgba(255,255,255,.22)';
    c.fillRect(px + 9, py + 5, 46, 6);
    // 展示窗
    c.fillStyle = '#fdf6ec';
    c.beginPath();
    c.roundRect(px + 15, py + 13, 22, 26, 3);
    c.fill();
    // 開放世界的販賣機賣的是魔法寶石
    this._emoji(this.level.offeneWelt ? '💎' : '🗝️', px + 26, py + 26, 15);
    if (this.level.offeneWelt) {
      c.fillStyle = '#ffd94d';
      c.font = 'bold 9px "Noto Sans TC", sans-serif';
      c.textAlign = 'center';
      c.textBaseline = 'middle';
      c.fillText('12', px + 26, py + 49);
    }
    // 投幣口與按鈕
    c.fillStyle = '#2d3436';
    c.fillRect(px + 42, py + 16, 8, 12);
    c.fillStyle = '#f1c40f';
    c.beginPath();
    c.arc(px + 46, py + 36, 3.5, 0, Math.PI * 2);
    c.fill();
    // 出貨口
    c.fillStyle = '#7f2d22';
    c.beginPath();
    c.roundRect(px + 15, py + 44, 34, 10, 2);
    c.fill();
    c.restore();
  }

  _drawDoor(px, py, now) {
    const c = this.ctx;
    if (this.state.doorOpen) {
      c.fillStyle = 'rgba(124, 83, 52, .25)';
      c.fillRect(px, py, 5, TILE);
      c.fillRect(px + TILE - 5, py, 5, TILE);
      this._emoji('🔓', px + TILE / 2, py + 12, 14, 0.55);
    } else {
      this._emoji('🚪', px + TILE / 2, py + TILE / 2 - 2, 50);
      const pulse = 0.55 + Math.sin(now / 400) * 0.25;
      this._emoji('🔒', px + TILE / 2 + 16, py + TILE / 2 + 14, 16, pulse);
    }
  }

  _drawGem(px, py, now) {
    const c = this.ctx;
    c.save();
    c.shadowColor = '#63c7f0';
    c.shadowBlur = 10 + Math.sin(now / 300) * 6;
    this._emoji('💎', px + TILE / 2, py + TILE / 2, 40);
    c.restore();
  }

  /* ---------- 第 2 關的地圖元素 ---------- */

  _drawBaeckerei(px, py) {
    const c = this.ctx;
    c.save();
    c.fillStyle = '#e8c39e';
    c.fillRect(px + 6, py + 18, 52, 42);
    c.fillStyle = '#a3542c';
    c.beginPath();
    c.moveTo(px + 2, py + 20);
    c.lineTo(px + 32, py + 2);
    c.lineTo(px + 62, py + 20);
    c.closePath();
    c.fill();
    c.fillStyle = '#7a4a20';
    c.fillRect(px + 25, py + 42, 14, 18);
    c.fillStyle = '#fdf6ec';
    c.fillRect(px + 12, py + 26, 12, 10);
    this._emoji('🥖', px + 42, py + 32, 17);
    c.restore();
  }

  _drawMarkt(px, py) {
    const c = this.ctx;
    c.save();
    c.fillStyle = '#6d4c41';
    c.fillRect(px + 9, py + 22, 4, 34);
    c.fillRect(px + 51, py + 22, 4, 34);
    c.fillStyle = '#8d6e63';
    c.fillRect(px + 6, py + 38, 52, 18);
    for (let i = 0; i < 6; i++) {
      c.fillStyle = i % 2 === 0 ? '#e74c3c' : '#fdf6ec';
      c.fillRect(px + 5 + i * 9, py + 10, 9, 13);
    }
    this._emoji('🍎', px + 22, py + 44, 15);
    this._emoji('🍐', px + 42, py + 44, 15);
    c.restore();
  }

  _drawGras(px, py, x, y) {
    const c = this.ctx;
    c.fillStyle = (x + y) % 2 === 0 ? '#b9dfa1' : '#aed696';
    c.fillRect(px, py, TILE, TILE);
    if ((x * 7 + y * 13) % 4 === 0) this._emoji('🌼', px + TILE * 0.72, py + TILE * 0.3, 12);
  }

  _drawHaus(px, py) {
    this._emoji('🏠', px + TILE / 2, py + TILE / 2, 42, 0.45);
  }

  _drawBaum(px, py) {
    this._emoji('🌳', px + TILE / 2, py + TILE / 2 - 4, 50);
  }

  /* ---------- 第 3 關的地圖元素 ---------- */

  _drawWasser(px, py, x, y, now) {
    const c = this.ctx;
    c.fillStyle = (x + y) % 2 === 0 ? '#83c6ec' : '#79bde4';
    c.fillRect(px, py, TILE, TILE);
    c.save();
    c.strokeStyle = 'rgba(255,255,255,.55)';
    c.lineWidth = 2;
    const w = Math.sin(now / 600 + x * 1.3 + y * 2.1) * 4;
    c.beginPath();
    c.arc(px + 20 + w, py + 22, 7, Math.PI * 0.15, Math.PI * 0.85);
    c.stroke();
    c.beginPath();
    c.arc(px + 42 - w, py + 46, 7, Math.PI * 0.15, Math.PI * 0.85);
    c.stroke();
    c.restore();
  }

  _drawStrasse(px, py, x, y) {
    const c = this.ctx;
    c.fillStyle = '#6f7378';
    c.fillRect(px, py, TILE, TILE);
    // 中央虛線
    c.fillStyle = '#e8e4d8';
    c.fillRect(px + 6, py + TILE / 2 - 2, 20, 4);
    c.fillRect(px + 38, py + TILE / 2 - 2, 20, 4);
    // 過河的橋：加欄杆
    if (this.rawTile(x, y - 1) === '~' || this.rawTile(x, y + 1) === '~') {
      c.fillStyle = '#8a5a33';
      c.fillRect(px, py, TILE, 6);
      c.fillRect(px, py + TILE - 6, TILE, 6);
    }
  }

  _drawHaltestelle(px, py) {
    this._emoji('🚏', px + TILE - 16, py + 22, 30);
  }

  _drawBibliothek(px, py) {
    const c = this.ctx;
    c.save();
    c.fillStyle = 'rgba(0,0,0,.1)';
    c.beginPath();
    c.ellipse(px + TILE / 2, py + TILE - 8, 24, 6, 0, 0, Math.PI * 2);
    c.fill();
    c.restore();
    this._emoji('🏛️', px + TILE / 2, py + TILE / 2 - 2, 52);
  }

  _drawCafe(px, py) {
    const c = this.ctx;
    c.save();
    c.fillStyle = '#6d4c41';
    c.fillRect(px + 9, py + 22, 4, 34);
    c.fillRect(px + 51, py + 22, 4, 34);
    c.fillStyle = '#efe6d8';
    c.fillRect(px + 8, py + 34, 48, 22);
    for (let i = 0; i < 6; i++) {
      c.fillStyle = i % 2 === 0 ? '#2a9d8f' : '#fdf6ec';
      c.fillRect(px + 5 + i * 9, py + 10, 9, 13);
    }
    this._emoji('☕', px + 32, py + 45, 18);
    c.restore();
  }

  /* ---------- 第 4 關的地圖元素 ---------- */

  _drawRathaus(px, py) {
    const c = this.ctx;
    c.save();
    // 主體
    c.fillStyle = '#ddcfb4';
    c.fillRect(px + 6, py + 24, 52, 36);
    // 屋頂
    c.fillStyle = '#8b5e3c';
    c.beginPath();
    c.moveTo(px + 2, py + 26);
    c.lineTo(px + 32, py + 10);
    c.lineTo(px + 62, py + 26);
    c.closePath();
    c.fill();
    // 鐘塔
    c.fillStyle = '#c9b790';
    c.fillRect(px + 26, py + 2, 12, 14);
    c.fillStyle = '#fff';
    c.beginPath();
    c.arc(px + 32, py + 8, 4, 0, Math.PI * 2);
    c.fill();
    c.strokeStyle = '#333';
    c.lineWidth = 1;
    c.beginPath();
    c.moveTo(px + 32, py + 8);
    c.lineTo(px + 32, py + 5);
    c.moveTo(px + 32, py + 8);
    c.lineTo(px + 34.5, py + 8);
    c.stroke();
    // 門與旗
    c.fillStyle = '#6b4a2b';
    c.fillRect(px + 26, py + 44, 12, 16);
    this._emoji('🇩🇪', px + 14, py + 34, 12);
    c.restore();
  }

  _drawPlatz(px, py, x, y) {
    const c = this.ctx;
    c.fillStyle = (x + y) % 2 === 0 ? '#e5ded0' : '#dcd4c2';
    c.fillRect(px, py, TILE, TILE);
    c.strokeStyle = 'rgba(0,0,0,.06)';
    c.lineWidth = 1;
    c.strokeRect(px + 4, py + 4, TILE - 8, TILE - 8);
  }

  _drawBrunnen(px, py, x, y, now) {
    this._drawPlatz(px, py, x, y);
    const c = this.ctx;
    c.save();
    c.fillStyle = '#9fcbe8';
    c.beginPath();
    c.arc(px + TILE / 2, py + TILE / 2 + 8, 22, 0, Math.PI * 2);
    c.fill();
    c.strokeStyle = '#7c8a94';
    c.lineWidth = 3;
    c.stroke();
    c.restore();
    this._emoji('⛲', px + TILE / 2, py + TILE / 2 - 6, 40);
  }

  _drawAnna(px, py, now) {
    const c = this.ctx;
    const bobY = Math.sin(now / 400) * 2;
    c.save();
    c.fillStyle = 'rgba(0,0,0,.15)';
    c.beginPath();
    c.ellipse(px + TILE / 2, py + TILE - 12, 14, 5, 0, 0, Math.PI * 2);
    c.fill();
    c.restore();
    this._emoji('👩‍🦰', px + TILE / 2, py + TILE / 2 + bobY, 38);
    // 開放世界：收到花之後，Anna 手上捧著花束
    if (this.state.owAnnaGetroffen) this._emoji('💐', px + 46, py + 44, 15);
    // 名牌
    c.save();
    c.fillStyle = 'rgba(255,255,255,.9)';
    c.beginPath();
    c.roundRect(px + 16, py + 2, 32, 14, 6);
    c.fill();
    c.fillStyle = '#8a3ab9';
    c.font = `bold 10px ${EMOJI_FONT}`;
    c.textAlign = 'center';
    c.textBaseline = 'middle';
    c.fillText('Anna', px + 32, py + 9);
    c.restore();
  }

  /* ---------- 第 5 關的地圖元素 ---------- */

  _drawGleis(px, py) {
    const c = this.ctx;
    c.save();
    // 道床
    c.fillStyle = '#b6ac97';
    c.fillRect(px, py, TILE, TILE);
    // 枕木
    c.fillStyle = '#7a6a52';
    for (let i = 0; i < 4; i++) c.fillRect(px + 4 + i * 16, py + 14, 8, 36);
    // 鐵軌
    c.fillStyle = '#5b6770';
    c.fillRect(px, py + 20, TILE, 4);
    c.fillRect(px, py + 40, TILE, 4);
    c.restore();
  }

  _drawUhr(px, py) {
    const c = this.ctx;
    const u = typeof this.state.uhr === 'number' ? this.state.uhr : 440;
    c.save();
    // 柱子
    c.fillStyle = '#6b7b8c';
    c.fillRect(px + 29, py + 30, 6, 30);
    // 鐘面
    const cx = px + TILE / 2;
    const cy = py + 24;
    c.fillStyle = '#fff';
    c.beginPath();
    c.arc(cx, cy, 17, 0, Math.PI * 2);
    c.fill();
    c.strokeStyle = '#33424f';
    c.lineWidth = 3;
    c.stroke();
    // 指針
    const h = (u / 60) % 12;
    const m = u % 60;
    const hAng = (h / 12) * Math.PI * 2 - Math.PI / 2;
    const mAng = (m / 60) * Math.PI * 2 - Math.PI / 2;
    c.strokeStyle = '#22303b';
    c.lineWidth = 2.5;
    c.beginPath();
    c.moveTo(cx, cy);
    c.lineTo(cx + Math.cos(hAng) * 8, cy + Math.sin(hAng) * 8);
    c.stroke();
    c.strokeStyle = '#d64545';
    c.lineWidth = 1.8;
    c.beginPath();
    c.moveTo(cx, cy);
    c.lineTo(cx + Math.cos(mAng) * 13, cy + Math.sin(mAng) * 13);
    c.stroke();
    // 數字時間
    c.fillStyle = '#33424f';
    c.font = 'bold 11px "Noto Sans TC", sans-serif';
    c.textAlign = 'center';
    c.textBaseline = 'middle';
    c.fillText(`${Math.floor(u / 60)}:${String(u % 60).padStart(2, '0')}`, cx, py + 52);
    c.restore();
  }

  _drawTafel(px, py) {
    const c = this.ctx;
    c.save();
    c.fillStyle = '#5d6a75';
    c.fillRect(px + 29, py + 40, 6, 20);
    c.fillStyle = '#1d2b3a';
    c.beginPath();
    c.roundRect(px + 4, py + 6, 56, 36, 5);
    c.fill();
    c.strokeStyle = '#42566b';
    c.lineWidth = 2;
    c.stroke();
    c.textAlign = 'center';
    c.textBaseline = 'middle';
    c.fillStyle = '#ffd94d';
    c.font = 'bold 10px "Noto Sans TC", sans-serif';
    c.fillText('Blaue Linie', px + 32, py + 15);
    c.fillStyle = '#9fd8ff';
    c.fillText('→ Arbeit', px + 32, py + 25);
    c.fillStyle = '#ff9f43';
    c.fillText('Ab 7:30', px + 32, py + 35);
    c.restore();
  }

  _drawBuero(px, py) {
    const c = this.ctx;
    c.save();
    // 大樓
    c.fillStyle = '#8fa3b8';
    c.fillRect(px + 8, py + 6, 48, 54);
    c.fillStyle = '#d7e5f2';
    for (let ry = 0; ry < 3; ry++) {
      for (let rx = 0; rx < 3; rx++) {
        c.fillRect(px + 13 + rx * 14, py + 11 + ry * 13, 9, 8);
      }
    }
    // 門與招牌
    c.fillStyle = '#3d5166';
    c.fillRect(px + 25, py + 48, 14, 12);
    c.fillStyle = '#ffd94d';
    c.font = 'bold 9px "Noto Sans TC", sans-serif';
    c.textAlign = 'center';
    c.textBaseline = 'middle';
    c.fillText('ARBEIT', px + 32, py + 3);
    this._emoji('💼', px + 48, py + 52, 12);
    c.restore();
  }

  /* ---------- 第 6 關的地圖元素 ---------- */

  _drawApotheke(px, py) {
    const c = this.ctx;
    c.save();
    // 白色店面
    c.fillStyle = '#f4f9f4';
    c.fillRect(px + 6, py + 18, 52, 42);
    c.strokeStyle = '#bcd4c2';
    c.lineWidth = 2;
    c.strokeRect(px + 6, py + 18, 52, 42);
    // 屋簷
    c.fillStyle = '#2fa35c';
    c.fillRect(px + 3, py + 12, 58, 9);
    // 大綠十字（藥局標誌）
    c.fillStyle = '#2fa35c';
    c.fillRect(px + 26, py + 26, 12, 26);
    c.fillRect(px + 19, py + 33, 26, 12);
    // 門
    c.fillStyle = '#88a891';
    c.fillRect(px + 44, py + 44, 10, 16);
    c.restore();
  }

  _drawPost(px, py) {
    const c = this.ctx;
    c.save();
    // 黃色郵局
    c.fillStyle = '#f7c948';
    c.fillRect(px + 6, py + 16, 52, 44);
    c.fillStyle = '#4a3c1e';
    c.fillRect(px + 3, py + 10, 58, 9);
    // 招牌
    c.fillStyle = '#4a3c1e';
    c.font = 'bold 11px "Noto Sans TC", sans-serif';
    c.textAlign = 'center';
    c.textBaseline = 'middle';
    c.fillText('POST', px + 32, py + 28);
    // 郵政號角
    this._emoji('📯', px + 32, py + 44, 18);
    // 門
    c.fillStyle = '#6b5a2c';
    c.fillRect(px + 44, py + 46, 10, 14);
    c.restore();
  }

  /* ---------- 第 7 關的地圖元素 ---------- */

  _drawWerkstatt(px, py) {
    const c = this.ctx;
    c.save();
    // 車庫主體
    c.fillStyle = '#9aa5ad';
    c.fillRect(px + 5, py + 14, 54, 46);
    // 屋頂
    c.fillStyle = '#5d6a75';
    c.fillRect(px + 2, py + 8, 60, 9);
    // 鐵捲門
    c.fillStyle = '#c3ccd2';
    c.fillRect(px + 12, py + 26, 40, 34);
    c.strokeStyle = '#8b969e';
    c.lineWidth = 2;
    for (let i = 0; i < 5; i++) {
      c.beginPath();
      c.moveTo(px + 12, py + 32 + i * 6);
      c.lineTo(px + 52, py + 32 + i * 6);
      c.stroke();
    }
    // 招牌
    this._emoji('🔧', px + 32, py + 20, 15);
    c.restore();
  }

  _drawUni(px, py) {
    const c = this.ctx;
    c.save();
    // 台階
    c.fillStyle = '#c9c2b2';
    c.fillRect(px + 4, py + 52, 56, 8);
    // 主體與山牆
    c.fillStyle = '#efe9da';
    c.fillRect(px + 8, py + 24, 48, 30);
    c.fillStyle = '#d8cfba';
    c.beginPath();
    c.moveTo(px + 4, py + 26);
    c.lineTo(px + 32, py + 8);
    c.lineTo(px + 60, py + 26);
    c.closePath();
    c.fill();
    // 圓柱
    c.fillStyle = '#fbf7ec';
    for (let i = 0; i < 4; i++) c.fillRect(px + 13 + i * 11, py + 28, 6, 24);
    this._emoji('🎓', px + 32, py + 20, 14);
    c.restore();
  }

  /* ---------- 第 8 關的地圖元素 ---------- */

  _drawMuseum(px, py) {
    const c = this.ctx;
    c.save();
    // 台階與主體
    c.fillStyle = '#cfc6b0';
    c.fillRect(px + 4, py + 52, 56, 8);
    c.fillStyle = '#f2ecdd';
    c.fillRect(px + 8, py + 26, 48, 28);
    // 山牆
    c.fillStyle = '#d9cfb6';
    c.beginPath();
    c.moveTo(px + 4, py + 28);
    c.lineTo(px + 32, py + 10);
    c.lineTo(px + 60, py + 28);
    c.closePath();
    c.fill();
    // 圓柱
    c.fillStyle = '#fbf7ec';
    for (let i = 0; i < 3; i++) c.fillRect(px + 15 + i * 14, py + 30, 7, 22);
    // 「NEU!」新特展布條
    c.fillStyle = '#c0392b';
    c.fillRect(px + 22, py + 14, 20, 10);
    c.fillStyle = '#fff';
    c.font = 'bold 8px "Noto Sans TC", sans-serif';
    c.textAlign = 'center';
    c.textBaseline = 'middle';
    c.fillText('NEU!', px + 32, py + 19);
    c.restore();
  }

  _drawAusstellung(px, py, x) {
    const c = this.ctx;
    c.save();
    // 展牆
    c.fillStyle = '#7d3b4c';
    c.fillRect(px + 2, py + 8, 60, 48);
    c.strokeStyle = '#5d2937';
    c.lineWidth = 2;
    c.strokeRect(px + 2, py + 8, 60, 48);
    // 金框
    c.fillStyle = '#d4af37';
    c.fillRect(px + 14, py + 16, 36, 32);
    c.fillStyle = '#fdf6ec';
    c.fillRect(px + 18, py + 20, 28, 24);
    // 畫作（每格不同）
    this._emoji(['🖼️', '🎨', '🌻'][x % 3], px + 32, py + 32, 20);
    c.restore();
  }

  _drawTraum(now) {
    const c = this.ctx;
    const w = this.cols * TILE;
    const h = this.rows * TILE;
    c.save();
    // 夢境粉紫色調
    c.fillStyle = 'rgba(190, 165, 250, .10)';
    c.fillRect(0, 0, w, h);
    c.restore();
    // 往上飄的小星星
    for (let i = 0; i < 16; i++) {
      const x = ((i * 167) % w) + Math.sin((now + i * 500) / 1300) * 10;
      const y = h - (((i * 97 + now * 0.03) % (h + 20)) - 10);
      const a = 0.3 + 0.3 * Math.sin(now / 300 + i * 2);
      this._emoji('✨', x, y, 11 + (i % 3) * 4, Math.max(0.15, a));
    }
  }

  _drawRegen(now) {
    const c = this.ctx;
    const w = this.cols * TILE;
    const h = this.rows * TILE;
    c.save();
    // 陰天色調
    c.fillStyle = 'rgba(70, 90, 125, .10)';
    c.fillRect(0, 0, w, h);
    // 雨絲
    c.strokeStyle = 'rgba(130, 160, 200, .5)';
    c.lineWidth = 1.4;
    c.beginPath();
    for (let i = 0; i < 60; i++) {
      const sp = 0.22 + (i % 4) * 0.05;
      const x = ((i * 149) % w) + Math.sin((now + i * 320) / 900) * 6;
      const y = ((i * 211 + now * sp) % (h + 24)) - 12;
      c.moveTo(x, y);
      c.lineTo(x - 4, y + 12);
    }
    c.stroke();
    c.restore();
  }
}
