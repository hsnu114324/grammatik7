'use strict';

/* ================= 詞彙資料 ================= */

// 可以放進句子裡的名詞（受格 Akkusativ 為正解，因為都是動詞的直接受詞）
const VOCAB = {
  'Münze':     { genus: 'f', akkusativ: 'die', zh: '金幣', emoji: '🪙' },
  'Schlüssel': { genus: 'm', akkusativ: 'den', zh: '鑰匙', emoji: '🗝️' },
  'Tür':       { genus: 'f', akkusativ: 'die', zh: '門',   emoji: '🚪' },
};

// 單字表（主格顯示，含只出現在地圖上的字）
const WOERTER = [
  { artikel: 'der', wort: 'Held',      genus: 'm', zh: '勇者',   emoji: '🧙' },
  { artikel: 'die', wort: 'Münze',     genus: 'f', zh: '金幣',   emoji: '🪙' },
  { artikel: 'der', wort: 'Schlüssel', genus: 'm', zh: '鑰匙',   emoji: '🗝️' },
  { artikel: 'die', wort: 'Tür',       genus: 'f', zh: '門',     emoji: '🚪' },
  { artikel: 'der', wort: 'Automat',   genus: 'm', zh: '販賣機', emoji: '🥤' },
  { artikel: 'der', wort: 'Diamant',   genus: 'm', zh: '寶石',   emoji: '💎' },
  { artikel: 'die', wort: 'Wand',      genus: 'f', zh: '牆壁',   emoji: '🧱' },
];

const GENUS_ZH = { m: '陽性（der）', f: '陰性（die）', n: '中性（das）' };

// 第 2 關單字表
const WOERTER2 = [
  { artikel: 'die', wort: 'Bäckerei',  genus: 'f', zh: '麵包店', emoji: '🥐' },
  { artikel: 'der', wort: 'Markt',     genus: 'm', zh: '市場',   emoji: '🛒' },
  { artikel: 'der', wort: 'Park',      genus: 'm', zh: '公園',   emoji: '🌳' },
  { artikel: 'das', wort: 'Brot',      genus: 'n', zh: '麵包',   emoji: '🥖' },
  { artikel: 'das', wort: 'Obst',      genus: 'n', zh: '水果',   emoji: '🍎' },
  { artikel: 'das', wort: 'Frühstück', genus: 'n', zh: '早餐',   emoji: '☕' },
  { wort: 'zuerst', zh: '首先', emoji: '1️⃣' },
  { wort: 'dann',   zh: '然後', emoji: '2️⃣' },
  { wort: 'danach', zh: '之後', emoji: '3️⃣' },
];

const ORDINAL_ZH = { zuerst: '首先', dann: '然後', danach: '之後' };

/* ================= 德語發音（瀏覽器內建 TTS） ================= */

let deutscheStimme = null;

function _findeStimme() {
  const voices = window.speechSynthesis ? speechSynthesis.getVoices() : [];
  deutscheStimme = voices.find((v) => v.lang && v.lang.toLowerCase().startsWith('de')) || null;
}

if (window.speechSynthesis) {
  _findeStimme();
  speechSynthesis.addEventListener('voiceschanged', _findeStimme);
}

function sprich(text) {
  if (!window.speechSynthesis) return;
  speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text);
  u.lang = 'de-DE';
  u.rate = 0.85;
  if (deutscheStimme) u.voice = deutscheStimme;
  speechSynthesis.speak(u);
}

/* ================= 提示系統：依遊戲狀態算出下一句 ================= */

function _relativeRichtung(dir, dx, dy) {
  const d = DIRS[dir];
  if (d.dx === dx && d.dy === dy) return 'vorne';
  if (d.dx === -dx && d.dy === -dy) return 'hinten';
  const links = DIRS[(dir + 3) % 4];
  if (links.dx === dx && links.dy === dy) return 'links';
  return 'rechts';
}

function _findeTiles(game, ch) {
  const res = [];
  for (let y = 0; y < game.rows; y++) {
    for (let x = 0; x < game.cols; x++) {
      if (game.rawTile(x, y) === ch) res.push({ x, y });
    }
  }
  return res;
}

// BFS：回傳從勇者走向任一目標的第一步格子
function _bfsErsterSchritt(game, ziele) {
  const hero = game.state.hero;
  const key = (x, y) => `${x},${y}`;
  const zielSet = new Set(ziele.map((z) => key(z.x, z.y)));
  if (zielSet.has(key(hero.x, hero.y))) return null;
  const prev = new Map([[key(hero.x, hero.y), null]]);
  const queue = [{ x: hero.x, y: hero.y }];
  while (queue.length) {
    const cur = queue.shift();
    for (const d of DIRS) {
      const nx = cur.x + d.dx;
      const ny = cur.y + d.dy;
      const k = key(nx, ny);
      if (prev.has(k)) continue;
      if (!game._passable(game.tileAt(nx, ny))) continue;
      prev.set(k, cur);
      const hier = { x: nx, y: ny };
      if (zielSet.has(k)) {
        // 回溯到起點的下一步
        let node = hier;
        while (prev.get(key(node.x, node.y)) &&
               !(prev.get(key(node.x, node.y)).x === hero.x && prev.get(key(node.x, node.y)).y === hero.y)) {
          node = prev.get(key(node.x, node.y));
        }
        return node;
      }
      queue.push(hier);
    }
  }
  return null;
}

function _satzHinweis(typ, verb, nomen, zh) {
  const v = VOCAB[nomen];
  return {
    de: `${verb} ${v.akkusativ} ${nomen}!`,
    maskiert: `${verb} ___ ${nomen}!`,
    zh,
    mask: true,
    note: `想想冠詞：${nomen} 是${GENUS_ZH[v.genus]}名詞，動詞後面要用受格（Akkusativ）`,
    aktion: { typ, nomen },
  };
}

function _drehHinweis(rel, zielZh) {
  const de = rel === 'hinten' ? 'Dreh dich um!' : `Dreh dich nach ${rel}!`;
  const zh = rel === 'hinten' ? `向後轉，${zielZh}` : (rel === 'links' ? `向左轉，${zielZh}` : `向右轉，${zielZh}`);
  return { de, zh, mask: false, aktion: { typ: 'dreh', richtung: rel === 'hinten' ? 'um' : rel } };
}

function _laufHinweis(game, ziele, zielZh) {
  const schritt = _bfsErsterSchritt(game, ziele);
  if (!schritt) return null;
  const hero = game.state.hero;
  const rel = _relativeRichtung(hero.dir, schritt.x - hero.x, schritt.y - hero.y);
  if (rel === 'hinten') {
    return { de: 'Dreh dich um!', zh: `向後轉，${zielZh}`, mask: false, aktion: { typ: 'dreh', richtung: 'um' } };
  }
  const zhDir = { vorne: '向前走', links: '向左走', rechts: '向右走' }[rel];
  return { de: `Geh nach ${rel}!`, zh: `${zhDir}，${zielZh}`, mask: false, aktion: { typ: 'geh', richtung: rel } };
}

function _interaktionsHinweis(game, tileChar, typ, verb, nomen, zielZh) {
  const hero = game.state.hero;
  const ziel = _findeTiles(game, tileChar)[0];
  const dx = ziel.x - hero.x;
  const dy = ziel.y - hero.y;
  if (Math.abs(dx) + Math.abs(dy) === 1) {
    const rel = _relativeRichtung(hero.dir, dx, dy);
    if (rel === 'vorne') return _satzHinweis(typ, verb, nomen, zielZh);
    return _drehHinweis(rel, `面對${VOCAB[nomen] ? VOCAB[nomen].zh : ''}目標`);
  }
  const nachbarn = DIRS
    .map((d) => ({ x: ziel.x + d.dx, y: ziel.y + d.dy }))
    .filter((p) => game._passable(game.tileAt(p.x, p.y)));
  return _laufHinweis(game, nachbarn, zielZh);
}

function berechneHinweis(game) {
  const s = game.state;
  if (s.won) return null;
  const hero = s.hero;

  if (s.coins.some((c) => !c.taken && c.x === hero.x && c.y === hero.y)) {
    return _satzHinweis('nimm', 'Nimm', 'Münze', '撿起腳下的金幣');
  }
  const offeneMuenzen = s.coins.filter((c) => !c.taken);
  if (offeneMuenzen.length) {
    return _laufHinweis(game, offeneMuenzen, '去撿金幣');
  }
  if (!s.hasKey) {
    return _interaktionsHinweis(game, 'V', 'kaufe', 'Kaufe', 'Schlüssel', '向販賣機買鑰匙');
  }
  if (!s.doorOpen) {
    return _interaktionsHinweis(game, 'D', 'oeffne', 'Öffne', 'Tür', '打開大門');
  }
  return _laufHinweis(game, _findeTiles(game, 'T'), '走向寶石');
}

/* ================= 解答產生器：用提示引擎在模擬狀態上自動解關 ================= */

function loeseLevel(game) {
  const sim = {
    hero: { ...LEVEL.hero },
    coins: LEVEL.coins.map((c) => ({ ...c, taken: false })),
    purse: 0,
    coinsTaken: 0,
    hasKey: false,
    doorOpen: false,
    won: false,
  };
  const mock = {
    state: sim,
    rows: game.rows,
    cols: game.cols,
    rawTile: (x, y) => game.rawTile(x, y),
    tileAt(x, y) {
      const ch = this.rawTile(x, y);
      return (ch === 'D' && sim.doorOpen) ? '.' : ch;
    },
    _passable: (ch) => ch === '.' || ch === 'T',
  };

  const aktionen = [];
  for (let guard = 0; guard < 300 && !sim.won; guard++) {
    const h = berechneHinweis(mock);
    if (!h || !h.aktion) break;
    aktionen.push(h.aktion);
    _wendeAktionAn(sim, mock, h.aktion);
  }
  return sim.won ? aktionen : null;
}

function _wendeAktionAn(sim, mock, a) {
  const hero = sim.hero;
  switch (a.typ) {
    case 'geh': {
      if (a.richtung === 'links') hero.dir = (hero.dir + 3) % 4;
      if (a.richtung === 'rechts') hero.dir = (hero.dir + 1) % 4;
      const d = DIRS[hero.dir];
      hero.x += d.dx;
      hero.y += d.dy;
      if (mock.rawTile(hero.x, hero.y) === 'T') sim.won = true;
      break;
    }
    case 'dreh': {
      if (a.richtung === 'um') hero.dir = (hero.dir + 2) % 4;
      else if (a.richtung === 'links') hero.dir = (hero.dir + 3) % 4;
      else hero.dir = (hero.dir + 1) % 4;
      break;
    }
    case 'nimm': {
      const c = sim.coins.find((c) => !c.taken && c.x === hero.x && c.y === hero.y);
      if (c) { c.taken = true; sim.coinsTaken++; sim.purse++; }
      break;
    }
    case 'kaufe': {
      sim.hasKey = true;
      sim.purse -= LEVEL.keyPrice;
      break;
    }
    case 'oeffne': {
      sim.doorOpen = true;
      break;
    }
  }
}

/* ================= 指令層：把德文句子轉成遊戲動作 ================= */

class Kommandos {
  constructor(game) {
    this.game = game;
    this.ttsOn = true;
    this.onSentence = () => {};
  }

  _sag(de, zh) {
    this.onSentence(de, zh);
    if (this.ttsOn) sprich(de);
  }

  /* ---- 文法檢查：冠詞（受格） ---- */
  _checkNomen(obj, verb, beispiel) {
    if (!obj) {
      throw new GameError(`✏️ 句子不完整：「${verb}」後面要接一個名詞，例如「${beispiel}」。`);
    }
    const v = VOCAB[obj.nomen];
    if (obj.artikel === 'NONE') {
      throw new GameError(`❓「${obj.nomen}」前面少了冠詞！查查右邊的單字表：${obj.nomen} 是${GENUS_ZH[v.genus]}名詞。`);
    }
    if (obj.artikel !== v.akkusativ) {
      if (v.genus === 'm' && obj.artikel === 'der') {
        throw new GameError(`😮 只差一步！${obj.nomen} 是陽性名詞（der ${obj.nomen}），但它在這裡是受詞（Akkusativ 受格），陽性受格要變成「den」→ ${verb} den ${obj.nomen}!`);
      }
      throw new GameError(`🤔 勇者聽不懂「${obj.artikel} ${obj.nomen}」……${obj.nomen} 是${GENUS_ZH[v.genus]}名詞，這裡要用「${v.akkusativ}」試試看！`);
    }
  }

  /* ---- 移動 ---- */

  async geh(richtung) {
    if (!richtung) {
      throw new GameError('✏️ 句子不完整：「geh」後面要接方向，例如「nach vorne」。');
    }
    const zh = { vorne: '向前走！', links: '向左走！', rechts: '向右走！' }[richtung];
    this._sag(`Geh nach ${richtung}!`, zh);
    if (richtung === 'links') await this.game.turn(-1);
    if (richtung === 'rechts') await this.game.turn(1);
    await this.game.moveForward();
  }

  async drehDich(richtung) {
    if (!richtung) {
      throw new GameError('✏️ 句子不完整：「dreh dich」後面要接方向（nach links／nach rechts）。');
    }
    if (richtung === 'vorne') {
      throw new GameError('🤔「Dreh dich nach vorne」？你已經面向前方啦！轉身要用 nach links 或 nach rechts。');
    }
    this._sag(`Dreh dich nach ${richtung}!`, richtung === 'links' ? '向左轉！' : '向右轉！');
    await this.game.turn(richtung === 'links' ? -1 : 1);
  }

  async drehDichUm() {
    this._sag('Dreh dich um!', '向後轉！');
    await this.game.turn(1);
    await this.game.turn(1);
  }

  /* ---- 物品互動 ---- */

  async nimm(obj) {
    this._checkNomen(obj, 'nimm', 'die Münze');
    this._sag(`Nimm ${obj.artikel} ${obj.nomen}!`, `撿起${VOCAB[obj.nomen].zh}！`);
    if (obj.nomen === 'Schlüssel') {
      throw new GameError('🗝️ Der Schlüssel ist im Automaten!（鑰匙在販賣機裡，要用「kaufe」買才行）');
    }
    if (obj.nomen === 'Tür') {
      throw new GameError('😅 Die Tür ist zu schwer!（門太重了撿不動——用「öffne」開門吧）');
    }
    await this.game.pickUp();
  }

  async kaufe(obj) {
    this._checkNomen(obj, 'kaufe', 'den Schlüssel');
    this._sag(`Kaufe ${obj.artikel} ${obj.nomen}!`, `買${VOCAB[obj.nomen].zh}！`);
    if (obj.nomen === 'Münze') {
      throw new GameError('🥤 Der Automat verkauft keine Münzen!（販賣機不賣金幣，金幣要用撿的）');
    }
    if (obj.nomen === 'Tür') {
      throw new GameError('🥤 Türen gibt es hier nicht zu kaufen!（這裡買不到門啦）');
    }
    await this.game.buyKey();
  }

  async oeffne(obj) {
    this._checkNomen(obj, 'öffne', 'die Tür');
    this._sag(`Öffne ${obj.artikel} ${obj.nomen}!`, `打開${VOCAB[obj.nomen].zh}！`);
    if (obj.nomen === 'Münze') {
      throw new GameError('😅 Eine Münze kann man nicht öffnen.（金幣沒辦法打開）');
    }
    if (obj.nomen === 'Schlüssel') {
      throw new GameError('😅 Einen Schlüssel öffnet man nicht.（鑰匙是拿來開別的東西的）');
    }
    await this.game.openDoor();
  }
}

/* ================= 第 2 關：計畫句指令層 =================
   目標句型：Ich möchte zuerst zur Bäckerei gehen,
             dann auf dem Markt Obst kaufen
             und danach im Park frühstücken.               */

// 介係詞文法課（每個地點子句的正解與錯誤講解）
const PRAEP_LEKTIONEN = {
  baeckerei: {
    richtig: 'zur',
    NONE: '去某個地方用 zu + Dativ（與格）。Bäckerei 是陰性名詞……zu + der 縮寫成什麼？',
    zum: 'zum = zu + dem，是給陽性／中性名詞用的。Bäckerei 是陰性 → zu + der 縮寫成「zur」！',
    'nach der': 'nach 是去城市／國家用的（nach Berlin）。去店家要用 zu + Dativ → zur Bäckerei。',
    'zu das': 'Bäckerei 是陰性（die），而且 zu 後面要接 Dativ → zu der = zur。',
  },
  markt: {
    richtig: 'dem',
    NONE: '「在市場上買東西」是在那裡發生的事（Wo?）→ auf + Dativ。Markt 是陽性……Dativ 是哪個？',
    den: 'auf den Markt（Akkusativ）是「走到市場去」的方向（Wohin?）。但「在市場上買水果」是位置（Wo?）→ Dativ：auf dem Markt！',
    der: '「der」當 Dativ 用是陰性的。Markt 是陽性 → Dativ 是「dem」。',
  },
  park: {
    richtig: 'im',
    NONE: '「在公園裡」吃早餐是位置（Wo?）→ in + Dativ。Park 是陽性……in + dem 縮寫成什麼？',
    'in den': 'in den Park（Akkusativ）是「走進公園」的方向（Wohin?）。在公園裡吃早餐是位置（Wo?）→ in + dem = im！',
    am: 'am = an + dem，是「在……旁邊／邊上」。在公園「裡面」吃早餐 → in + dem = im。',
  },
};

class PlanKommandos {
  constructor(game) {
    this.game = game;
    this.ttsOn = true;
    this.onSentence = () => {};
  }

  _sag(de, zh) {
    this.onSentence(de, zh);
    if (this.ttsOn) sprich(de);
  }

  async ohneMoechte() {
    throw new GameError('✏️ 想做的事要接進「Ich möchte …」積木裡——德文表達計畫要用情態動詞 möchte 開頭，動詞原形放句尾！');
  }

  _phrase(t) {
    const ord = t.ordinal === 'NONE' ? '___' : t.ordinal;
    const p = t.praep === 'NONE' ? '___' : t.praep;
    switch (t.typ) {
      case 'baeckerei': return `${ord} ${p} Bäckerei gehen`;
      case 'markt': return `${ord} auf ${p} Markt Obst kaufen`;
      case 'park': return `${ord} ${p} Park frühstücken`;
    }
    return '';
  }

  _zhKurz(t) {
    return { baeckerei: '去麵包店', markt: '在市場買水果', park: '在公園吃早餐' }[t.typ];
  }

  _joinTeile(teile) {
    const phrasen = teile.map((t) => this._phrase(t));
    if (phrasen.length === 1) return phrasen[0];
    return phrasen.slice(0, -1).join(', ') + ' und ' + phrasen[phrasen.length - 1];
  }

  _checkOrdinal(t, index) {
    if (t.ordinal === 'NONE') {
      throw new GameError(`✏️ 「${this._phrase(t)}」少了順序詞！第一件事用 zuerst（首先），後面接 dann（然後）或 danach（之後）。`);
    }
    if (index === 0 && t.ordinal !== 'zuerst') {
      throw new GameError(`🤔 計畫的第一件事要用「zuerst」（首先），不是「${t.ordinal}」。`);
    }
    if (index > 0 && t.ordinal === 'zuerst') {
      throw new GameError('🤔 「zuerst」只能用在第一件事！後面的事用「dann」（然後）或「danach」（之後）。');
    }
  }

  _checkPraep(t) {
    const lektion = PRAEP_LEKTIONEN[t.typ];
    if (t.praep === lektion.richtig) return;
    const erklaerung = lektion[t.praep] || lektion.NONE;
    throw new GameError(`🤔 「${this._phrase(t)}」不太對——${erklaerung}`);
  }

  _nachbarnVon(ch) {
    const t = _findeTiles(this.game, ch)[0];
    return DIRS
      .map((d) => ({ x: t.x + d.dx, y: t.y + d.dy }))
      .filter((p) => this.game._passable(this.game.tileAt(p.x, p.y)));
  }

  async fuehrePlanAus(teile, highlight) {
    if (!teile || !teile.length) {
      throw new GameError('✏️ Ich möchte……接著呢？把活動積木接進「Ich möchte」裡面！');
    }
    // 先唸整句計畫
    const satz = 'Ich möchte ' + this._joinTeile(teile) + '.';
    this._sag(satz, '我想要：' + teile.map((t) => this._zhKurz(t)).join('、'));
    await this.game._wait(800);

    for (let i = 0; i < teile.length; i++) {
      const t = teile[i];
      if (highlight) highlight(t.id);
      this._checkOrdinal(t, i);
      this._checkPraep(t);
      await this['_' + t.typ](t);
    }
  }

  async _baeckerei(t) {
    this._sag(`${t.ordinal} zur Bäckerei gehen`, `${ORDINAL_ZH[t.ordinal]}去麵包店`);
    await this.game.walkTo(this._nachbarnVon('B'), 'Bäckerei');
    const b = _findeTiles(this.game, 'B')[0];
    this.game.faceTile(b.x, b.y);
    const s = this.game.state;
    if (!s.brot) {
      s.brot = true;
      this.game.onHudChange();
      this.game._float(s.hero.x, s.hero.y, '+1 🥖');
      this.game.onHint('🥖 Frisches Brot aus der Bäckerei!（拿到新鮮麵包！）');
    } else {
      this.game.onHint('🥖 Noch ein Brot? Du hast schon eins!（你已經有麵包囉）');
    }
    await this.game._wait(400);
  }

  async _markt(t) {
    this._sag(`${t.ordinal} auf dem Markt Obst kaufen`, `${ORDINAL_ZH[t.ordinal]}在市場買水果`);
    await this.game.walkTo(this._nachbarnVon('M'), 'Markt');
    const m = _findeTiles(this.game, 'M')[0];
    this.game.faceTile(m.x, m.y);
    const s = this.game.state;
    if (!s.obst) {
      s.obst = true;
      this.game.onHudChange();
      this.game._float(s.hero.x, s.hero.y, '+1 🍎');
      this.game.onHint('🍎 Frisches Obst vom Markt!（買到水果！）');
    } else {
      this.game.onHint('🍎 Du hast schon Obst.（水果已經買過囉）');
    }
    await this.game._wait(400);
  }

  async _park(t) {
    this._sag(`${t.ordinal} im Park frühstücken`, `${ORDINAL_ZH[t.ordinal]}在公園吃早餐`);
    await this.game.walkTo(_findeTiles(this.game, 'P'), 'Park');
    const s = this.game.state;
    if (!s.brot || !s.obst) {
      const fehlt = [!s.brot && 'Brot（麵包）', !s.obst && 'Obst（水果）'].filter(Boolean).join(' 和 ');
      throw new GameError(`😋 Ohne Essen kein Frühstück!（還沒有 ${fehlt}，怎麼野餐！先把食物準備好）`);
    }
    s.won = true;
    this.game.onHudChange();
    this.game._float(s.hero.x, s.hero.y, '🧺 Guten Appetit!');
    await this.game._wait(500);
    throw new WinSignal();
  }
}

/* ================= 第 3 關：現在式句子指令層 =================
   目標句型：Ich gehe zuerst zur Bushaltestelle,
             fahre dann mit dem Bus zur Bibliothek
             und lerne danach im Café.                        */

const WOERTER3 = [
  { artikel: 'die', wort: 'Bushaltestelle', genus: 'f', zh: '公車站', emoji: '🚏' },
  { artikel: 'der', wort: 'Bus',            genus: 'm', zh: '公車',   emoji: '🚌' },
  { artikel: 'die', wort: 'Bibliothek',     genus: 'f', zh: '圖書館', emoji: '🏛️' },
  { artikel: 'das', wort: 'Buch',           genus: 'n', zh: '書',     emoji: '📖' },
  { artikel: 'das', wort: 'Café',           genus: 'n', zh: '咖啡店', emoji: '☕' },
  { wort: 'gehen → ich gehe',   zh: '走',   emoji: '🚶' },
  { wort: 'fahren → ich fahre', zh: '搭乘', emoji: '🚗' },
  { wort: 'lernen → ich lerne', zh: '學習', emoji: '📚' },
];

// 動詞變位課（ich 形是正解）
const VERB_LEKTIONEN = {
  haltestelle: { richtig: 'gehe', inf: 'gehen', du: 'gehst', er: 'geht', extra: '' },
  bus: {
    richtig: 'fahre', inf: 'fahren', du: 'fährst', er: 'fährt',
    extra: '（fahren 是強變化動詞：du fährst、er fährt 母音變 ä，但 ich fahre 不變！）',
  },
  cafe: { richtig: 'lerne', inf: 'lernen', du: 'lernst', er: 'lernt', extra: '' },
};

// 介係詞課
const PRAEP_LEKTIONEN3 = {
  haltestelle: {
    richtig: 'zur',
    NONE: '去某個地方用 zu + Dativ。Bushaltestelle 是陰性名詞……zu + der 縮寫成什麼？',
    zum: 'zum = zu + dem，是給陽性／中性用的。Bushaltestelle 是陰性 → zu + der = zur！',
    'nach der': 'nach 是去城市／國家用的（nach Berlin）。去公車站要用 zu + Dativ → zur Bushaltestelle。',
  },
  bus: {
    richtig: 'dem',
    NONE: 'mit（搭乘／使用工具）永遠接 Dativ。Bus 是陽性……Dativ 冠詞是哪個？',
    den: 'mit 永遠接 Dativ，沒有例外！der Bus 是陽性 → Dativ 是 dem：mit dem Bus。',
    der: '「der」當 Dativ 用是陰性的。Bus 是陽性 → Dativ 是「dem」。',
  },
  cafe: {
    richtig: 'im',
    NONE: '「在咖啡店裡」唸書是位置（Wo?）→ in + Dativ。Café 是中性（das Café）……in + dem 縮寫成什麼？',
    ins: 'ins = in + das（Akkusativ），是「走進咖啡店」的方向（Wohin?）。在裡面唸書是位置（Wo?）→ in + dem = im！',
    am: 'am = an + dem，是「在……旁邊」。在咖啡店「裡面」唸書 → in + dem = im。',
  },
};

class PraesensKommandos {
  constructor(game) {
    this.game = game;
    this.ttsOn = true;
    this.onSentence = () => {};
  }

  _sag(de, zh) {
    this.onSentence(de, zh);
    if (this.ttsOn) sprich(de);
  }

  async ohneIch() {
    throw new GameError('✏️ 句子少了主詞！把它接進「Ich」積木裡——動詞要跟著主詞變位（ich gehe、ich fahre……）。');
  }

  _phrase(t) {
    const v = t.verb === 'NONE' ? '___' : t.verb;
    const o = t.ordinal === 'NONE' ? '___' : t.ordinal;
    const p = t.praep === 'NONE' ? '___' : t.praep;
    switch (t.typ) {
      case 'haltestelle': return `${v} ${o} ${p} Bushaltestelle`;
      case 'bus': return `${v} ${o} mit ${p} Bus zur Bibliothek`;
      case 'cafe': return `${v} ${o} ${p} Café`;
    }
    return '';
  }

  _zhKurz(t) {
    return { haltestelle: '走到公車站', bus: '搭公車去圖書館', cafe: '在咖啡店唸書' }[t.typ];
  }

  _joinTeile(teile) {
    const phrasen = teile.map((t) => this._phrase(t));
    if (phrasen.length === 1) return phrasen[0];
    return phrasen.slice(0, -1).join(', ') + ' und ' + phrasen[phrasen.length - 1];
  }

  _checkOrdinal(t, index) {
    if (t.ordinal === 'NONE') {
      throw new GameError(`✏️ 「${this._phrase(t)}」少了順序詞！第一件事用 zuerst，後面接 dann 或 danach。`);
    }
    if (index === 0 && t.ordinal !== 'zuerst') {
      throw new GameError(`🤔 一天的第一件事要用「zuerst」（首先），不是「${t.ordinal}」。`);
    }
    if (index > 0 && t.ordinal === 'zuerst') {
      throw new GameError('🤔 「zuerst」只能用在第一件事！後面用「dann」或「danach」。');
    }
  }

  _checkVerb(t) {
    const info = VERB_LEKTIONEN[t.typ];
    if (t.verb === info.richtig) return;
    if (t.verb === 'NONE') {
      throw new GameError(`✏️ 「${this._phrase(t)}」少了動詞！主詞是 ich，動詞要變位成 ich 的形式。`);
    }
    if (t.verb === info.inf) {
      throw new GameError(`🤔 「${info.inf}」是動詞原形（字典形）。現在式動詞要跟著主詞變位：ich → ${info.richtig}！（原形是搭配情態動詞用的——還記得第 2 關的 Ich möchte … ${info.inf} 嗎？）`);
    }
    if (t.verb === info.du) {
      throw new GameError(`🤔 「${info.du}」是 du（你）的形式。這句的主詞是 ich → ${info.richtig}。${info.extra}`);
    }
    if (t.verb === info.er) {
      throw new GameError(`🤔 「${info.er}」是 er／sie／es（他／她／它）的形式。這句的主詞是 ich → ${info.richtig}。${info.extra}`);
    }
  }

  _checkPraep(t) {
    const lektion = PRAEP_LEKTIONEN3[t.typ];
    if (t.praep === lektion.richtig) return;
    const erklaerung = lektion[t.praep] || lektion.NONE;
    throw new GameError(`🤔 「${this._phrase(t)}」不太對——${erklaerung}`);
  }

  _nachbarnVon(ch) {
    const t = _findeTiles(this.game, ch)[0];
    return DIRS
      .map((d) => ({ x: t.x + d.dx, y: t.y + d.dy }))
      .filter((p) => this.game._passable(this.game.tileAt(p.x, p.y)));
  }

  async fuehreSatzAus(teile, highlight) {
    if (!teile || !teile.length) {
      throw new GameError('✏️ Ich……然後呢？把句子積木接進「Ich」裡面！');
    }
    const satz = 'Ich ' + this._joinTeile(teile) + '.';
    this._sag(satz, '我：' + teile.map((t) => this._zhKurz(t)).join('、'));
    await this.game._wait(800);

    for (let i = 0; i < teile.length; i++) {
      const t = teile[i];
      if (highlight) highlight(t.id);
      this._checkOrdinal(t, i);
      this._checkVerb(t);
      this._checkPraep(t);
      await this['_' + t.typ](t);
    }
  }

  async _haltestelle(t) {
    this._sag(`${t.ordinal} gehe ich zur Bushaltestelle`, `${ORDINAL_ZH[t.ordinal]}走到公車站`);
    const stop = _findeTiles(this.game, 'S')[0];
    const s = this.game.state;
    if (s.hero.x === stop.x && s.hero.y === stop.y) {
      this.game.onHint('🚏 Du bist schon da!（已經在公車站啦）');
    } else {
      await this.game.walkTo([stop], 'Bushaltestelle');
    }
    s.anDerHaltestelle = true;
    this.game.onHudChange();
    this.game.onHint('🚏 An der Bushaltestelle. Der Bus kommt gleich!（到公車站了，公車馬上來！）');
    await this.game._wait(400);
  }

  async _bus(t) {
    const s = this.game.state;
    const stop = _findeTiles(this.game, 'S')[0];
    if (s.hero.x !== stop.x || s.hero.y !== stop.y) {
      throw new GameError('🚏 Du bist nicht an der Bushaltestelle!（你不在公車站，公車不會停！先「gehe zuerst zur Bushaltestelle」）');
    }
    this._sag(`${t.ordinal} fahre ich mit dem Bus zur Bibliothek`, `${ORDINAL_ZH[t.ordinal]}搭公車去圖書館`);
    const route = this.game.level.busRoute;
    this.game._float(s.hero.x, s.hero.y, '🚌 Brumm!');
    s.inBus = true;
    try {
      await this._fahrSchritt(route[0], 260);
      for (let i = 1; i < route.length; i++) {
        await this._fahrSchritt(route[i], 150);
      }
    } finally {
      s.inBus = false;
    }
    await this._fahrSchritt(this.game.level.busAlight, 260);
    const bib = _findeTiles(this.game, 'L')[0];
    this.game.faceTile(bib.x, bib.y);
    if (!s.buch) {
      s.buch = true;
      this.game.onHudChange();
      this.game._float(s.hero.x, s.hero.y, '+1 📖');
      this.game.onHint('📖 Ein Buch aus der Bibliothek!（在圖書館借到一本書！）');
    }
    await this.game._wait(400);
  }

  async _fahrSchritt(ziel, dauer) {
    const g = this.game;
    const t = g.token;
    g._countStep();
    const hero = g.state.hero;
    const dx = Math.sign(ziel.x - hero.x);
    const dy = Math.sign(ziel.y - hero.y);
    const idx = DIRS.findIndex((d) => d.dx === dx && d.dy === dy);
    if (idx >= 0) hero.dir = idx;
    await g._walkTween(ziel.x, ziel.y, dauer, false);
    g._ensure(t);
    hero.x = ziel.x;
    hero.y = ziel.y;
  }

  async _cafe(t) {
    this._sag(`${t.ordinal} lerne ich im Café`, `${ORDINAL_ZH[t.ordinal]}在咖啡店唸書`);
    const ziele = this._nachbarnVon('C');
    if (!this.game._bfsPfad(ziele)) {
      throw new GameError('🌊 Das Café ist auf der anderen Seite des Flusses!（咖啡店在河對岸，走路過不去——要先搭公車！）');
    }
    await this.game.walkTo(ziele, 'Café');
    const cafe = _findeTiles(this.game, 'C')[0];
    this.game.faceTile(cafe.x, cafe.y);
    const s = this.game.state;
    if (!s.buch) {
      throw new GameError('📚 Ohne Buch kein Lernen!（沒有書要怎麼唸書！先搭公車去圖書館借一本）');
    }
    s.won = true;
    this.game.onHudChange();
    this.game._float(s.hero.x, s.hero.y, '📚 Streber!');
    await this.game._wait(500);
    throw new WinSignal();
  }
}

/* ---------- 第 3 關提示 ---------- */

function berechneHinweis3(game) {
  const s = game.state;
  if (s.won) return null;
  const stop = _findeTiles(game, 'S')[0];
  const amStop = s.hero.x === stop.x && s.hero.y === stop.y;
  if (!s.buch && !amStop) {
    return {
      de: 'gehe zuerst zur Bushaltestelle',
      maskiert: '___ zuerst zur Bushaltestelle',
      zh: '首先走到公車站（記得接進 Ich 裡）',
      mask: true,
      note: '動詞要跟著主詞 ich 變位：gehen → ？',
    };
  }
  if (!s.buch) {
    return {
      de: 'fahre dann mit dem Bus zur Bibliothek',
      maskiert: 'fahre dann mit ___ Bus zur Bibliothek',
      zh: '然後搭公車去圖書館',
      mask: true,
      note: 'mit 永遠接 Dativ！der Bus 是陽性……',
    };
  }
  return {
    de: 'lerne danach im Café',
    maskiert: 'lerne danach ___ Café',
    zh: '之後在咖啡店唸書',
    mask: true,
    note: 'Café 是中性（das）：in + dem 縮寫成？',
  };
}

/* ================= 第 4 關：複合句指令層 =================
   目標句型：Nachdem ich am Rathaus ausgestiegen bin,
             gehe ich über den Platz zum Café,
             um Anna zu treffen.                              */

const WOERTER4 = [
  { artikel: 'das', wort: 'Rathaus', genus: 'n', zh: '市政廳', emoji: '🏢' },
  { artikel: 'der', wort: 'Platz',   genus: 'm', zh: '廣場',   emoji: '⛲' },
  { artikel: 'das', wort: 'Café',    genus: 'n', zh: '咖啡店', emoji: '☕' },
  { wort: 'Anna', zh: '安娜（朋友）', emoji: '👩‍🦰' },
  { wort: 'aussteigen → bin ausgestiegen', zh: '下車', emoji: '🚌' },
  { wort: 'treffen', zh: '見面', emoji: '🤝' },
  { wort: 'nachdem', zh: '在…之後', emoji: '⏰' },
  { wort: 'um … zu …', zh: '為了…', emoji: '🎯' },
];

const NACHDEM_LEKTIONEN = {
  praep: {
    richtig: 'am',
    NONE: '「在市政廳（那裡）」下車是位置（Wo?）→ an + Dativ。Rathaus 是中性（das）……an + dem 縮寫成什麼？',
    im: 'im = in + dem，是「在市政廳裡面」。公車站在市政廳「旁邊」→ an + dem = am Rathaus。',
    zum: 'zum 是「往…去」的方向。這裡說的是在哪裡下車（位置 Wo?）→ an + dem = am。',
  },
  partizip: {
    richtig: 'ausgestiegen',
    NONE: 'Nachdem 子句描述「已經完成」的事 → 用 Perfekt（完成式），需要過去分詞。aus|steigen 的過去分詞是？',
    aussteigen: '「aussteigen」是原形。Perfekt 要用過去分詞——可分離動詞把 ge- 插在中間：aus·ge·stiegen → ausgestiegen！',
    'steige aus': '這是現在式（我下車）。Nachdem 子句描述已完成的事 → Perfekt：ausgestiegen ＋ 助動詞。',
  },
  aux: {
    richtig: 'bin',
    NONE: 'Perfekt ＝ 助動詞 ＋ 過去分詞。aussteigen 是移動動詞……助動詞用 haben 還是 sein？',
    habe: '重要規則：移動／狀態改變的動詞，Perfekt 用 sein 不用 haben！→ ich bin ausgestiegen。',
    ist: '「ist」是 er／sie／es 的形式。主詞是 ich → bin。',
  },
};

const HAUPTSATZ_LEKTIONEN = {
  wo: {
    richtig: 'gehe ich',
    NONE: 'Nachdem-子句佔了整句的「第一位」，主句的動詞要放第二位……逗號後面是「gehe ich」還是「ich gehe」？',
    'ich gehe': 'Nachdem-子句已經佔據句子的第一位，所以主句要倒裝——動詞緊跟在逗號後面：「…, gehe ich …」（動詞第二位規則！）',
  },
  art: {
    richtig: 'den',
    NONE: 'über 是 Wechselpräposition：「穿過廣場」是移動（Wohin?）→ 用 Akkusativ。Platz 是陽性……',
    dem: '這次相反囉！「穿過廣場」是移動方向（Wohin?）→ über + Akkusativ：über den Platz。（第 2、3 關的「在某處」才用 Dativ）',
    der: 'Platz 是陽性名詞。穿越的移動用 Akkusativ → den。',
  },
  praep2: {
    richtig: 'zum',
    NONE: '去咖啡店用 zu + Dativ。Café 是中性（das）……zu + dem 縮寫成什麼？',
    zur: 'zur = zu + der，是給陰性用的。Café 是中性（das）→ zu + dem = zum！',
    'zu das': 'zu 後面永遠接 Dativ：das → dem，而且要縮寫：zu dem = zum。',
  },
};

const ZWECK_LEKTIONEN = {
  treffen: {
    richtig: 'zu treffen',
    NONE: '表達目的用 um … zu ＋ 動詞原形：um Anna ___ ___？',
    treffen: 'um…zu 句型不能少了 zu！→ um Anna zu treffen。',
    'zu treffe': 'zu 後面要接動詞原形（Infinitiv），不用變位：zu treffen。',
    getroffen: 'getroffen 是過去分詞（Perfekt 用的）。um…zu 後面接原形 → zu treffen。',
  },
};

class NebensatzKommandos {
  constructor(game) {
    this.game = game;
    this.ttsOn = true;
    this.onSentence = () => {};
  }

  _sag(de, zh) {
    this.onSentence(de, zh);
    if (this.ttsOn) sprich(de);
  }

  async ohneNachdem() {
    throw new GameError('✏️ 這個句子要從「Nachdem …」子句開始！把主句和 um…zu 接在 Nachdem 積木後面。');
  }

  _w(v) { return v === 'NONE' ? '___' : v; }

  _phrase(t) {
    switch (t.typ) {
      case 'nachdem':
        return `Nachdem ich ${this._w(t.praep)} Rathaus ${this._w(t.partizip)} ${this._w(t.aux)}`;
      case 'hauptsatz':
        return `${this._w(t.wo)} über ${this._w(t.art)} Platz ${this._w(t.praep2)} Café`;
      case 'zweck':
        return `um Anna ${this._w(t.treffen)}`;
    }
    return '';
  }

  _checkFeld(t, feld, lektionen) {
    const l = lektionen[feld];
    const wert = t[feld];
    if (wert === l.richtig) return;
    const erklaerung = l[wert] || l.NONE;
    throw new GameError(`🤔 「${this._phrase(t)}」不太對——${erklaerung}`);
  }

  async fuehreSatz4Aus(teile, highlight) {
    const erwartet = ['nachdem', 'hauptsatz', 'zweck'];
    const namen = {
      nachdem: 'Nachdem-子句（在市政廳下車之後）',
      hauptsatz: '主句（穿過廣場走到咖啡店）',
      zweck: 'um…zu 目的（見 Anna）',
    };
    if (teile.length > 3) {
      throw new GameError('✏️ 句子太長了！結構是：① Nachdem-子句 → ② 主句 → ③ um…zu 目的，各一次。');
    }
    for (let i = 0; i < teile.length; i++) {
      if (teile[i].typ !== erwartet[i]) {
        throw new GameError(`✏️ 句子的第 ${i + 1} 部分應該是「${namen[erwartet[i]]}」。完整結構：① Nachdem-子句 → ② 主句 → ③ um…zu。`);
      }
    }

    const satz = teile.map((t) => this._phrase(t)).join(', ') + '.';
    this._sag(satz, '在市政廳下車後，穿過廣場去咖啡店見 Anna');
    await this.game._wait(900);

    for (const t of teile) {
      if (highlight) highlight(t.id);
      await this['_' + t.typ](t);
    }
  }

  async _nachdem(t) {
    this._checkFeld(t, 'praep', NACHDEM_LEKTIONEN);
    this._checkFeld(t, 'partizip', NACHDEM_LEKTIONEN);
    this._checkFeld(t, 'aux', NACHDEM_LEKTIONEN);
    this._sag('Nachdem ich am Rathaus ausgestiegen bin …', '在市政廳下車之後……');
    const s = this.game.state;
    const route = this.game.level.busRoute;
    for (const halt of route) {
      await this._fahrSchritt(halt, 160);
    }
    s.inBus = false;
    await this._fahrSchritt(this.game.level.busAlight, 280);
    const rathaus = _findeTiles(this.game, 'R')[0];
    this.game.faceTile(rathaus.x, rathaus.y);
    s.ausgestiegen = true;
    this.game.onHudChange();
    this.game._float(s.hero.x, s.hero.y, '🚌 Tschüss!');
    this.game.onHint('🏢 Am Rathaus ausgestiegen!（在市政廳下車了）');
    await this.game._wait(400);
  }

  async _hauptsatz(t) {
    this._checkFeld(t, 'wo', HAUPTSATZ_LEKTIONEN);
    this._checkFeld(t, 'art', HAUPTSATZ_LEKTIONEN);
    this._checkFeld(t, 'praep2', HAUPTSATZ_LEKTIONEN);
    this._sag('Jetzt gehe ich über den Platz zum Café.', '現在穿過廣場走到咖啡店');
    const cafe = _findeTiles(this.game, 'C')[0];
    const ziele = DIRS
      .map((d) => ({ x: cafe.x + d.dx, y: cafe.y + d.dy }))
      .filter((p) => this.game._passable(this.game.tileAt(p.x, p.y)));
    await this.game.walkTo(ziele, 'Café');
    this.game.faceTile(cafe.x, cafe.y);
    const s = this.game.state;
    s.amCafe = true;
    this.game.onHudChange();
    this.game.onHint('☕ Am Café!（到咖啡店了……Anna 在哪呢？）');
    await this.game._wait(400);
  }

  async _zweck(t) {
    this._checkFeld(t, 'treffen', ZWECK_LEKTIONEN);
    const anna = _findeTiles(this.game, 'A')[0];
    const ziele = DIRS
      .map((d) => ({ x: anna.x + d.dx, y: anna.y + d.dy }))
      .filter((p) => this.game._passable(this.game.tileAt(p.x, p.y)));
    await this.game.walkTo(ziele, 'Anna');
    this.game.faceTile(anna.x, anna.y);
    const s = this.game.state;
    this._sag('Hallo Anna! Schön, dich zu sehen!', '哈囉 Anna！見到妳真好！');
    s.won = true;
    this.game.onHudChange();
    this.game._float(anna.x, anna.y, '💕');
    await this.game._wait(500);
    throw new WinSignal();
  }

  async _fahrSchritt(ziel, dauer) {
    const g = this.game;
    const t = g.token;
    g._countStep();
    const hero = g.state.hero;
    const dx = Math.sign(ziel.x - hero.x);
    const dy = Math.sign(ziel.y - hero.y);
    const idx = DIRS.findIndex((d) => d.dx === dx && d.dy === dy);
    if (idx >= 0) hero.dir = idx;
    await g._walkTween(ziel.x, ziel.y, dauer, false);
    g._ensure(t);
    hero.x = ziel.x;
    hero.y = ziel.y;
  }
}

/* ---------- 第 4 關提示 ---------- */

function berechneHinweis4(game) {
  const s = game.state;
  if (s.won) return null;
  if (!s.ausgestiegen) {
    return {
      de: 'Nachdem ich am Rathaus ausgestiegen bin, …',
      maskiert: 'Nachdem ich am Rathaus ausgestiegen ___, …',
      zh: '先說：「在市政廳下車之後……」（Nachdem 子句）',
      mask: true,
      note: 'aussteigen 是移動動詞——Perfekt 的助動詞用 sein 還是 haben？',
    };
  }
  if (!s.amCafe) {
    return {
      de: '…, gehe ich über den Platz zum Café, …',
      maskiert: '…, gehe ich über ___ Platz zum Café, …',
      zh: '穿過廣場走到咖啡店（主句要倒裝）',
      mask: true,
      note: 'über＋「穿過」是移動方向（Wohin?）→ 用 Akkusativ，Platz 是陽性',
    };
  }
  return {
    de: '…, um Anna zu treffen.',
    maskiert: '…, um Anna ___ treffen.',
    zh: '為了見 Anna（目的句）',
    mask: true,
    note: 'um…zu 句型——zu 別忘了，後面接動詞原形！',
  };
}

/* ================= 第 5 關：情態動詞指令層 =================
   目標句型：Ich muss zuerst in die blaue Linie umsteigen
             und dann den Zug vor halb acht erwischen,
             damit ich pünktlich zur Arbeit komme.           */

const WOERTER5 = [
  { artikel: 'die', wort: 'Linie',  genus: 'f', zh: '路線', emoji: '🚇' },
  { artikel: 'der', wort: 'Zug',    genus: 'm', zh: '火車', emoji: '🚆' },
  { artikel: 'die', wort: 'Arbeit', genus: 'f', zh: '工作', emoji: '💼' },
  { wort: 'müssen → ich muss', zh: '必須', emoji: '❗' },
  { wort: 'umsteigen', zh: '轉乘', emoji: '🔁' },
  { wort: 'erwischen', zh: '趕上（車）', emoji: '🏃' },
  { wort: 'halb acht = 7:30', zh: '七點半！', emoji: '🕢' },
  { wort: 'pünktlich', zh: '準時', emoji: '⏰' },
  { wort: 'damit', zh: '為了讓…', emoji: '🎯' },
];

const MODAL_LEKTIONEN = {
  richtig: 'muss',
  NONE: '「必須」＝ müssen，但要跟著主詞 ich 變位……情態動詞的 ich 形是？',
  musst: '「musst」是 du 的形式。主詞是 ich → ich muss。',
  'müssen': '「müssen」是原形（也是 wir／sie／Sie 的形式）。ich 要變位 → muss。',
};

const LINIE_LEKTIONEN = {
  kasus: {
    richtig: 'in die',
    NONE: 'umsteigen「轉進」藍線是方向（Wohin?）→ in ＋ 哪個格？Linie 是陰性（die）……',
    'in der': '「轉進去」藍線是移動方向（Wohin?）→ Wechselpräposition 用 Akkusativ：in die！（in der 是 Dativ「在裡面」）',
    'in das': 'die Linie 是陰性名詞！das 是中性用的 → in die Linie。',
  },
  adj: {
    richtig: 'blaue',
    NONE: '定冠詞 die 後面的形容詞要加字尾……die blau__ Linie？',
    blauen: '定冠詞 die（陰性單數 Akkusativ）後面的形容詞字尾是 -e：die blaue Linie。（-en 是 Dativ 或複數的字尾）',
    blaues: '-es 是不定冠詞＋中性才用的（ein blaues Auto）。die 後面 → blaue。',
  },
  verb: {
    richtig: 'umsteigen',
    NONE: '情態動詞 muss 已經變位了，第二個動詞用什麼形式、放哪裡？',
    umzusteigen: '情態動詞（muss）直接接原形，不加 zu！（um…zu 才需要 zu——那是上一關的事囉）→ muss … umsteigen。',
    'steige um': 'muss 已經變位了，第二個動詞要用原形放句尾：muss … umsteigen（不拆開）。',
  },
};

const ZUG_LEKTIONEN = {
  art: {
    richtig: 'den',
    NONE: 'erwischen（趕上）的受詞要用 Akkusativ。Zug 是陽性（der）……受格變成？',
    der: 'der Zug 是主格。這裡 Zug 是 erwischen 的受詞 → Akkusativ：den Zug！',
    dem: 'dem 是 Dativ。erwischen 接直接受詞（Akkusativ）→ den Zug。',
  },
  zeit: {
    richtig: 'vor halb acht',
    NONE: '看看時刻表：Abfahrt 7:30。7:30 的德文怎麼說？（提示：不是「acht」開頭的整點！）',
    'vor halb neun': 'halb neun 是 8:30！德文的 halb 是「往下一個整點走到一半」：halb acht ＝ 7:30。等到 8:30 火車早開走啦！',
    'vor acht': '火車 7:30（halb acht）就開了！說「vor acht（8 點前）」的話，7:45 才到月台也算數——但火車早跑了。要說 vor halb acht。',
    'nach halb acht': 'nach ＝ 之後。7:30 之後才到，火車已經開走了！趕車要說 vor halb acht（7:30 之前）。',
  },
  verb: {
    richtig: 'erwischen',
    NONE: 'muss 後面的第二個動詞用原形放句尾……',
    erwische: 'muss 已經變位了，第二個動詞用原形：muss … erwischen（erwische 是沒有情態動詞時的 ich 形）。',
    erwischt: 'erwischt 是 er／sie 形（或過去分詞）。情態動詞後面接原形 → erwischen。',
  },
};

const DAMIT_LEKTIONEN = {
  konj: {
    richtig: 'damit',
    NONE: '表達目的、而且子句裡有主詞 ich ——用哪個連接詞？',
    um: 'um…zu 句型不能帶主詞！要說「為了讓我…」（帶 ich）就用 damit ＋ 動詞變位放最後。（um 的用法：um pünktlich zur Arbeit zu kommen——沒有 ich！）',
    dass: 'dass 是「說／知道…」的內容子句。表達目的（為了讓…）要用 damit。',
  },
  praep: {
    richtig: 'zur',
    NONE: '去上班＝ zu + Arbeit。die Arbeit 是陰性……zu + der 縮寫成？',
    zum: 'zum = zu + dem（陽性／中性）。die Arbeit 是陰性 → zu + der = zur！',
    'in die': '「去上班」慣用 zu + Dativ：zur Arbeit。（in die Arbeit 不是慣用說法）',
  },
  verb: {
    richtig: 'komme',
    NONE: 'damit 子句的動詞要跟著主詞變位、放在最後。主詞是 ich → ？',
    kommen: 'damit 子句跟 um…zu 不一樣：動詞要「變位」不是原形！主詞 ich → komme（放句尾）。',
    kommt: 'kommt 是 er／sie／es 形。damit 子句的主詞是 ich → komme。',
  },
};

class ModalKommandos {
  constructor(game) {
    this.game = game;
    this.ttsOn = true;
    this.onSentence = () => {};
  }

  _sag(de, zh) {
    this.onSentence(de, zh);
    if (this.ttsOn) sprich(de);
  }

  async ohneMuss() {
    throw new GameError('✏️ 這些是「Ich muss …」計畫的一部分——把它們接進「Ich muss」積木裡！（情態動詞＋原形放句尾）');
  }

  _w(v) { return v === 'NONE' ? '___' : v; }

  _phrase(t) {
    switch (t.typ) {
      case 'linie':
        return `zuerst ${this._w(t.kasus)} ${this._w(t.adj)} Linie ${this._w(t.verb)}`;
      case 'zug':
        return `und dann ${this._w(t.art)} Zug ${this._w(t.zeit)} ${this._w(t.verb)}`;
      case 'damit':
        return `${this._w(t.konj)} ich pünktlich ${this._w(t.praep)} Arbeit ${this._w(t.verb)}`;
    }
    return '';
  }

  _satzText(modal, teile) {
    let s = `Ich ${this._w(modal)}`;
    for (const t of teile) {
      const p = this._phrase(t);
      s += p.startsWith('und') ? ` ${p}` : (t.typ === 'damit' ? `, ${p}` : ` ${p}`);
    }
    return s + '.';
  }

  _checkFeld(t, feld, lektionen) {
    const l = lektionen[feld];
    const wert = t[feld];
    if (wert === l.richtig) return;
    const erklaerung = l[wert] || l.NONE;
    throw new GameError(`🤔 「${this._phrase(t)}」不太對——${erklaerung}`);
  }

  async fuehreSatz5Aus(modal, teile, highlight) {
    if (modal !== 'muss') {
      const erklaerung = MODAL_LEKTIONEN[modal] || MODAL_LEKTIONEN.NONE;
      throw new GameError(`🤔 「Ich ${this._w(modal)} …」不太對——${erklaerung}`);
    }
    const erwartet = ['linie', 'zug', 'damit'];
    const namen = {
      linie: '轉乘藍線（zuerst in die blaue Linie umsteigen）',
      zug: '趕火車（und dann den Zug vor halb acht erwischen）',
      damit: 'damit 目的句（damit ich pünktlich zur Arbeit komme）',
    };
    if (teile.length === 0) {
      throw new GameError('✏️ Ich muss …——必須做什麼呢？把計畫接進來！');
    }
    if (teile.length > 3) {
      throw new GameError('✏️ 句子太長了！結構是：① 轉乘藍線 → ② 趕火車 → ③ damit 目的句，各一次。');
    }
    for (let i = 0; i < teile.length; i++) {
      if (teile[i].typ !== erwartet[i]) {
        throw new GameError(`✏️ 句子的第 ${i + 1} 部分應該是「${namen[erwartet[i]]}」。完整結構：① 轉乘 → ② 趕車 → ③ damit。`);
      }
    }

    this._sag(this._satzText(modal, teile), '我必須先轉乘藍線，再趕上七點半前的火車，才能準時上班');
    await this.game._wait(900);

    for (const t of teile) {
      if (highlight) highlight(t.id);
      await this['_' + t.typ](t);
    }
  }

  async _linie(t) {
    this._checkFeld(t, 'kasus', LINIE_LEKTIONEN);
    this._checkFeld(t, 'adj', LINIE_LEKTIONEN);
    this._checkFeld(t, 'verb', LINIE_LEKTIONEN);
    this._sag('Zuerst in die blaue Linie umsteigen!', '先轉乘藍線！');
    const g = this.game;
    await g.walkTo([g.level.zugEinstieg], 'Blaue Linie');
    g.faceTile(g.level.zugKopf.x, g.level.zugKopf.y);
    g.state.umgestiegen = true;
    g.onHudChange();
    g.onHint(`🔁 Umgestiegen! Blaue Linie, ${g.uhrText()} Uhr.（轉乘完成，現在 ${g.uhrText()}——時刻表寫著 Ab 7:30！）`);
    await g._wait(400);
  }

  async _zug(t) {
    this._checkFeld(t, 'art', ZUG_LEKTIONEN);
    this._checkFeld(t, 'zeit', ZUG_LEKTIONEN);
    this._checkFeld(t, 'verb', ZUG_LEKTIONEN);
    const g = this.game;
    const s = g.state;
    this._sag('Und dann den Zug vor halb acht erwischen!', '趕上七點半前的火車！');
    await g._wait(300);
    // 上車：跳上車頭
    await this._fahrSchritt(g.level.zugKopf, 260);
    g._tickUhr();
    s.imZug = true;
    s.zugWeg = true;
    g.onHudChange();
    g._float(s.hero.x, s.hero.y, '🚪 Türen zu!');
    g.onHint(`🚆 ${g.uhrText()} Uhr — vor halb acht, geschafft!（${g.uhrText()} 上車，趕在 7:30 之前！）`);
    await g._wait(450);
  }

  async _damit(t) {
    this._checkFeld(t, 'konj', DAMIT_LEKTIONEN);
    this._checkFeld(t, 'praep', DAMIT_LEKTIONEN);
    this._checkFeld(t, 'verb', DAMIT_LEKTIONEN);
    const g = this.game;
    const s = g.state;
    this._sag('Abfahrt! Nächster Halt: Arbeit.', '發車！下一站：公司');
    for (const halt of g.level.zugRoute) {
      await this._fahrSchritt(halt, 150);
      g._tickUhr();
    }
    s.imZug = false;
    await this._fahrSchritt(g.level.zugAusstieg, 280);
    g._tickUhr();
    const buero = _findeTiles(g, 'W')[0];
    const ziele = DIRS
      .map((d) => ({ x: buero.x + d.dx, y: buero.y + d.dy }))
      .filter((p) => g._passable(g.tileAt(p.x, p.y)));
    await g.walkTo(ziele, 'Arbeit');
    g.faceTile(buero.x, buero.y);
    this._sag(`Geschafft! ${g.uhrText()} Uhr — pünktlich zur Arbeit!`, `${g.uhrText()} 到公司，8 點上班——準時！`);
    s.won = true;
    g.onHudChange();
    g._float(s.hero.x, s.hero.y, '💼 Pünktlich!');
    await g._wait(500);
    throw new WinSignal();
  }

  async _fahrSchritt(ziel, dauer) {
    const g = this.game;
    const t = g.token;
    g._countStep();
    const hero = g.state.hero;
    const dx = Math.sign(ziel.x - hero.x);
    const dy = Math.sign(ziel.y - hero.y);
    const idx = DIRS.findIndex((d) => d.dx === dx && d.dy === dy);
    if (idx >= 0) hero.dir = idx;
    await g._walkTween(ziel.x, ziel.y, dauer, false);
    g._ensure(t);
    hero.x = ziel.x;
    hero.y = ziel.y;
  }
}

/* ---------- 第 5 關提示 ---------- */

function berechneHinweis5(game) {
  const s = game.state;
  if (s.won) return null;
  if (!s.umgestiegen) {
    return {
      de: 'Ich muss zuerst in die blaue Linie umsteigen …',
      maskiert: 'Ich muss zuerst in ___ ___ Linie umsteigen …',
      zh: '先轉乘到藍線月台（在下面！）',
      mask: true,
      note: '「轉進」藍線是方向（Wohin?）→ in + Akkusativ；die 後面的形容詞字尾是 -e',
    };
  }
  if (!s.imZug) {
    return {
      de: '… und dann den Zug vor halb acht erwischen …',
      maskiert: '… und dann den Zug vor ___ ___ erwischen …',
      zh: '在 7:30 前趕上火車',
      mask: true,
      note: '看時刻表：Abfahrt 7:30——7:30 的德文是「halb ＋ 哪個數字」？（不是 sieben！）',
    };
  }
  return {
    de: '…, damit ich pünktlich zur Arbeit komme.',
    maskiert: '…, damit ich pünktlich zur Arbeit ___.',
    zh: '為了讓我準時到公司（damit 目的句）',
    mask: true,
    note: 'damit 子句：動詞要跟 ich 變位、放在最後（跟 um…zu 不一樣！）',
  };
}

/* ================= 第 6 關：讓步子句指令層 =================
   目標句型：Obwohl es stark regnet, gehe ich zuerst zur Apotheke,
             danach zur Post und fahre schließlich mit dem Bus
             nach Hause.                                        */

const WOERTER6 = [
  { artikel: 'die', wort: 'Apotheke', genus: 'f', zh: '藥局', emoji: '💊' },
  { artikel: 'die', wort: 'Post',     genus: 'f', zh: '郵局', emoji: '📮' },
  { artikel: 'der', wort: 'Bus',      genus: 'm', zh: '公車', emoji: '🚌' },
  { artikel: 'der', wort: 'Regen',    genus: 'm', zh: '雨',   emoji: '🌧️' },
  { wort: 'es regnet', zh: '下雨（無人稱 es）', emoji: '☔' },
  { wort: 'obwohl', zh: '雖然', emoji: '🤷' },
  { wort: 'schließlich', zh: '最後、終於', emoji: '🏁' },
  { wort: 'nach Hause', zh: '回家（方向）', emoji: '🏠' },
  { wort: 'zu Hause', zh: '在家（位置）', emoji: '🛋️' },
];

const OBWOHL_LEKTIONEN = {
  konj: {
    richtig: 'Obwohl',
    NONE: '「雖然雨下很大，我還是要出門」——表達「雖然／儘管」用哪個連接詞？',
    Weil: 'weil ＝ 因為。「因為下大雨所以出門跑三個地方」？邏輯怪怪的吧！表達「雖然（明明）下雨還是去」→ Obwohl。',
    Wenn: 'wenn ＝ 如果／當…的時候。這裡要說的是「雖然（儘管）下著大雨」→ Obwohl。',
  },
  verb: {
    richtig: 'regnet',
    NONE: '下雨的主詞是無人稱的 es：es ＋ regnen 的第三人稱單數形是？（子句動詞放最後！）',
    regnen: 'regnen 是原形。obwohl 子句的動詞要變位：es → regnet（而且放在子句最後）。',
    regne: '-e 是 ich 的字尾。下雨的主詞是 es（第三人稱單數）→ regnet。',
  },
};

const APOTHEKE_LEKTIONEN = {
  wo: {
    richtig: 'gehe ich',
    NONE: 'Obwohl-子句佔了整句的第一位，逗號後面主句動詞要放第二位……「gehe ich」還是「ich gehe」？',
    'ich gehe': 'Obwohl-子句已經佔據句子的第一位，所以主句要倒裝——動詞緊跟在逗號後面：「…, gehe ich …」（動詞第二位規則，第 4 關複習！）',
  },
  praep: {
    richtig: 'zur',
    NONE: '去店家用 zu + Dativ。die Apotheke 是陰性……zu + der 縮寫成？',
    zum: 'zum = zu + dem（陽性／中性用）。die Apotheke 是陰性 → zu + der = zur！',
    'nach der': 'nach 是給城市、國家和 nach Hause 用的！去店家／建築物 → zu + Dativ：zur Apotheke。',
  },
};

const POST_LEKTIONEN = {
  praep: {
    richtig: 'zur',
    NONE: 'die Post 也是陰性名詞……去郵局＝ zu + der = ？',
    zum: 'die Post 是陰性（die）→ zu + der = zur Post！',
    'bei der': 'bei ＝「在…那裡」（位置 Wo?）。這裡是「去」郵局（方向 Wohin?）→ zur Post。',
  },
};

const HAUSE_LEKTIONEN = {
  ordinal: {
    richtig: 'schließlich',
    NONE: '這是行程的最後一段——「最後、終於」的德文是？',
    zuerst: 'zuerst ＝ 首先，已經用在藥局那段了。最後一段 → schließlich（最後）。',
    danach: 'danach 已經用在郵局那段了。行程的最後一段用 schließlich（最後／終於）。',
  },
  art: {
    richtig: 'dem',
    NONE: 'mit 永遠接 Dativ！der Bus 的 Dativ 形是……？',
    den: 'mit 永遠接 Dativ（第 3 關複習！）：der Bus → mit dem Bus。',
    der: 'der 是主格。mit + Dativ → mit dem Bus。',
  },
  hause: {
    richtig: 'nach Hause',
    NONE: '「回家」是方向（Wohin?）——德文的慣用語是 ___ Hause？',
    'zu Hause': 'zu Hause ＝「在家」（位置 Wo?）。「回家」（方向 Wohin?）要說 nach Hause！這對雙胞胎超常考。',
    'zum Haus': 'zum Haus ＝ 去某一棟房子（建築物）。「回（自己的）家」慣用 nach Hause。',
  },
};

class KonzessivKommandos {
  constructor(game) {
    this.game = game;
    this.ttsOn = true;
    this.onSentence = () => {};
  }

  _sag(de, zh) {
    this.onSentence(de, zh);
    if (this.ttsOn) sprich(de);
  }

  async ohneObwohl() {
    throw new GameError('✏️ 這個句子要從「Obwohl …」子句開始——把行程接在 Obwohl 積木後面！');
  }

  _w(v) { return v === 'NONE' ? '___' : v; }

  _phrase(t) {
    switch (t.typ) {
      case 'obwohl':
        return `${this._w(t.konj)} es stark ${this._w(t.verb)}`;
      case 'apotheke':
        return `${this._w(t.wo)} zuerst ${this._w(t.praep)} Apotheke`;
      case 'post':
        return `danach ${this._w(t.praep)} Post`;
      case 'bus':
        return `und fahre ${this._w(t.ordinal)} mit ${this._w(t.art)} Bus ${this._w(t.hause)}`;
    }
    return '';
  }

  _satzText(teile) {
    let s = '';
    for (const t of teile) {
      const p = this._phrase(t);
      if (!s) s = p;
      else s += p.startsWith('und') ? ` ${p}` : `, ${p}`;
    }
    return s + '.';
  }

  _checkFeld(t, feld, lektionen) {
    const l = lektionen[feld];
    const wert = t[feld];
    if (wert === l.richtig) return;
    const erklaerung = l[wert] || l.NONE;
    throw new GameError(`🤔 「${this._phrase(t)}」不太對——${erklaerung}`);
  }

  async fuehreSatz6Aus(teile, highlight) {
    const erwartet = ['obwohl', 'apotheke', 'post', 'bus'];
    const namen = {
      obwohl: 'Obwohl-子句（雖然下大雨）',
      apotheke: '第一站：藥局（gehe ich zuerst zur Apotheke）',
      post: '第二站：郵局（danach zur Post）',
      bus: '最後：搭公車回家（und fahre schließlich mit dem Bus nach Hause）',
    };
    if (teile.length > 4) {
      throw new GameError('✏️ 句子太長了！結構是：① Obwohl-子句 → ② 藥局 → ③ 郵局 → ④ 搭公車回家，各一次。');
    }
    for (let i = 0; i < teile.length; i++) {
      if (teile[i].typ !== erwartet[i]) {
        throw new GameError(`✏️ 句子的第 ${i + 1} 部分應該是「${namen[erwartet[i]]}」。完整結構：① Obwohl → ② 藥局 → ③ 郵局 → ④ 回家。`);
      }
    }

    this._sag(this._satzText(teile), '雖然下大雨，我還是先去藥局、再去郵局，最後搭公車回家');
    await this.game._wait(900);

    for (const t of teile) {
      if (highlight) highlight(t.id);
      await this['_' + t.typ](t);
    }
  }

  _nachbarnVon(ch) {
    const t = _findeTiles(this.game, ch)[0];
    return DIRS
      .map((d) => ({ x: t.x + d.dx, y: t.y + d.dy }))
      .filter((p) => this.game._passable(this.game.tileAt(p.x, p.y)));
  }

  async _obwohl(t) {
    this._checkFeld(t, 'konj', OBWOHL_LEKTIONEN);
    this._checkFeld(t, 'verb', OBWOHL_LEKTIONEN);
    this._sag('Obwohl es stark regnet …', '雖然雨下得很大……');
    const s = this.game.state;
    this.game._float(s.hero.x, s.hero.y, '☂️');
    await this.game._wait(600);
  }

  async _apotheke(t) {
    this._checkFeld(t, 'wo', APOTHEKE_LEKTIONEN);
    this._checkFeld(t, 'praep', APOTHEKE_LEKTIONEN);
    this._sag('Zuerst gehe ich zur Apotheke.', '先去藥局');
    const g = this.game;
    await g.walkTo(this._nachbarnVon('E'), 'Apotheke');
    const ziel = _findeTiles(g, 'E')[0];
    g.faceTile(ziel.x, ziel.y);
    g.state.medikament = true;
    g.onHudChange();
    g._float(g.state.hero.x, g.state.hero.y, '+1 💊');
    g.onHint('💊 Medikamente geholt!（在藥局拿到藥了！）');
    await g._wait(400);
  }

  async _post(t) {
    this._checkFeld(t, 'praep', POST_LEKTIONEN);
    this._sag('Danach gehe ich zur Post.', '接著去郵局');
    const g = this.game;
    await g.walkTo(this._nachbarnVon('O'), 'Post');
    const ziel = _findeTiles(g, 'O')[0];
    g.faceTile(ziel.x, ziel.y);
    g.state.paket = true;
    g.onHudChange();
    g._float(g.state.hero.x, g.state.hero.y, '📦');
    g.onHint('📦 Paket abgeschickt!（把包裹寄出去了！）');
    await g._wait(400);
  }

  async _bus(t) {
    this._checkFeld(t, 'ordinal', HAUSE_LEKTIONEN);
    this._checkFeld(t, 'art', HAUSE_LEKTIONEN);
    this._checkFeld(t, 'hause', HAUSE_LEKTIONEN);
    this._sag('Und schließlich fahre ich mit dem Bus nach Hause!', '最後搭公車回家！');
    const g = this.game;
    const s = g.state;
    const stop = _findeTiles(g, 'S')[0];
    await g.walkTo([stop], 'Bushaltestelle');
    g.faceTile(g.level.busEinstieg.x, g.level.busEinstieg.y);
    await g._wait(350);
    // 上車
    await this._fahrSchritt(g.level.busEinstieg, 260);
    s.inBus = true;
    g._float(s.hero.x, s.hero.y, '🚌 Brumm!');
    await g._wait(300);
    for (const halt of g.level.busFahrt) {
      await this._fahrSchritt(halt, 160);
    }
    s.inBus = false;
    await this._fahrSchritt(g.level.busAusstieg, 280);
    const haus = _findeTiles(g, 'H')[0];
    g.faceTile(haus.x, haus.y);
    this._sag('Endlich zu Hause!', '終於到家了！（到了家，「在家」就說 zu Hause 囉）');
    s.won = true;
    g.onHudChange();
    g._float(s.hero.x, s.hero.y, '🏠');
    await g._wait(500);
    throw new WinSignal();
  }

  async _fahrSchritt(ziel, dauer) {
    const g = this.game;
    const t = g.token;
    g._countStep();
    const hero = g.state.hero;
    const dx = Math.sign(ziel.x - hero.x);
    const dy = Math.sign(ziel.y - hero.y);
    const idx = DIRS.findIndex((d) => d.dx === dx && d.dy === dy);
    if (idx >= 0) hero.dir = idx;
    await g._walkTween(ziel.x, ziel.y, dauer, false);
    g._ensure(t);
    hero.x = ziel.x;
    hero.y = ziel.y;
  }
}

/* ---------- 第 6 關提示 ---------- */

function berechneHinweis6(game) {
  const s = game.state;
  if (s.won) return null;
  if (!s.medikament) {
    return {
      de: 'Obwohl es stark regnet, gehe ich zuerst zur Apotheke …',
      maskiert: 'Obwohl es stark ___, gehe ich zuerst ___ Apotheke …',
      zh: '雖然下大雨，還是先去藥局',
      mask: true,
      note: 'obwohl 子句動詞放最後（es → regn__?）；die Apotheke 陰性 → zu + der = ?',
    };
  }
  if (!s.paket) {
    return {
      de: '… danach zur Post …',
      maskiert: '… danach ___ Post …',
      zh: '接著去郵局寄包裹',
      mask: true,
      note: 'die Post 也是陰性——「去」某處（方向）用 zu + Dativ 的縮寫',
    };
  }
  return {
    de: '… und fahre schließlich mit dem Bus nach Hause.',
    maskiert: '… und fahre ___ mit ___ Bus ___ ___.',
    zh: '最後搭公車回家',
    mask: true,
    note: '「最後」的德文？mit 永遠接 Dativ！「回家」是 nach Hause（zu Hause 是「在家」——別搞混）',
  };
}

/* ================= 第 7 關：關係子句指令層 =================
   目標句型：Ich bringe das Fahrrad, das ich gestern gekauft
             habe, zuerst zur Werkstatt und fahre danach mit
             der Straßenbahn zur Universität.                 */

const WOERTER7 = [
  { artikel: 'das', wort: 'Fahrrad',     genus: 'n', zh: '腳踏車',   emoji: '🚲' },
  { artikel: 'die', wort: 'Werkstatt',   genus: 'f', zh: '修車行',   emoji: '🔧' },
  { artikel: 'die', wort: 'Straßenbahn', genus: 'f', zh: '路面電車', emoji: '🚋' },
  { artikel: 'die', wort: 'Universität', genus: 'f', zh: '大學',     emoji: '🎓' },
  { wort: 'bringen', zh: '把…送去', emoji: '🤲' },
  { wort: 'kaufen → gekauft', zh: '買（過去分詞）', emoji: '🛒' },
  { wort: 'gestern', zh: '昨天', emoji: '📅' },
  { wort: 'das（關係代名詞）', zh: '「那台…的」', emoji: '🔗' },
];

const RELSATZ_LEKTIONEN = {
  rel: {
    richtig: 'das',
    NONE: '關係代名詞要跟「先行詞」同性別：das Fahrrad 是中性……',
    der: 'der 是陽性。關係代名詞要跟先行詞同性別：das Fahrrad（中性）→ das！',
    den: 'den 是「陽性」的 Akkusativ。Fahrrad 是中性——中性的 Akkusativ 長得跟主格一樣，還是 das！',
    die: 'die 是陰性（或複數）。das Fahrrad 是中性 → das。',
  },
  perf: {
    richtig: 'gekauft habe',
    NONE: '「昨天買的」＝過去的事 → Perfekt。關係子句是子句：過去分詞＋變位動詞放最後……',
    'gekauft bin': 'kaufen 不是移動／變化動詞！買東西的 Perfekt 用 haben → gekauft habe。（bin 是給 aussteigen 那種動詞用的——第 4 關複習！）',
    'habe gekauft': '順序反了！關係子句是「子句」——變位動詞要放到最後面：… gestern gekauft habe。（habe gekauft 是主句的語序）',
    kaufe: '「昨天」買的是過去的事 → 用 Perfekt：gekauft habe（kaufe 是現在式）。',
  },
  praep: {
    richtig: 'zur',
    NONE: 'die Werkstatt 是陰性。送去修車行＝ zu + Dativ ＝ ？',
    zum: 'zum = zu + dem（陽性／中性）。die Werkstatt 是陰性 → zu + der = zur！',
    'zu die': 'zu 後面永遠接 Dativ：die → der，而且要縮寫：zu der = zur。',
  },
};

const TRAM_LEKTIONEN = {
  art: {
    richtig: 'der',
    NONE: 'mit 接 Dativ 沒錯——但 die Straßenbahn 是「陰性」！陰性的 Dativ 是……？',
    dem: '小心陷阱！mit + Dativ 沒錯，但「mit dem」是給陽性／中性用的（mit dem Bus）。die Straßenbahn 是陰性——陰性 Dativ → mit der Straßenbahn！',
    die: 'mit 永遠接 Dativ：die（陰性）→ der。mit der Straßenbahn！',
  },
  praep2: {
    richtig: 'zur',
    NONE: 'die Universität 也是陰性……去大學＝ zu + der = ？',
    zum: 'die Universität 是陰性（die）→ zu + der = zur Universität！',
    'an die': '去大學（上課）慣用 zu + Dativ：zur Universität。（an die 是「到…邊上」的方向用法）',
  },
};

class RelativKommandos {
  constructor(game) {
    this.game = game;
    this.ttsOn = true;
    this.onSentence = () => {};
  }

  _sag(de, zh) {
    this.onSentence(de, zh);
    if (this.ttsOn) sprich(de);
  }

  async ohneIch() {
    throw new GameError('✏️ 句子要從「Ich」開始——把部件接進「Ich」積木裡！');
  }

  async relsatzAllein() {
    throw new GameError('🔗 關係子句不能單獨存在——把「, das ich gestern gekauft habe ,」塞進 Fahrrad 後面的圓洞裡！');
  }

  _w(v) { return v === 'NONE' ? '___' : v; }

  _phrase(t) {
    switch (t.typ) {
      case 'bringen':
        return `bringe das Fahrrad, ${this._w(t.rel)} ich gestern ${this._w(t.perf)}, zuerst ${this._w(t.praep)} Werkstatt`;
      case 'tram':
        return `und fahre danach mit ${this._w(t.art)} Straßenbahn ${this._w(t.praep2)} Universität`;
    }
    return '';
  }

  _satzText(teile) {
    let s = 'Ich';
    for (const t of teile) s += ` ${this._phrase(t)}`;
    return s + '.';
  }

  _checkFeld(t, feld, lektionen) {
    const l = lektionen[feld];
    const wert = t[feld];
    if (wert === l.richtig) return;
    const erklaerung = l[wert] || l.NONE;
    throw new GameError(`🤔 「${this._phrase(t)}」不太對——${erklaerung}`);
  }

  async fuehreSatz7Aus(teile, highlight) {
    const erwartet = ['bringen', 'tram'];
    const namen = {
      bringen: '先送修腳踏車（Ich bringe das Fahrrad … zuerst zur Werkstatt）',
      tram: '再搭電車去大學（und fahre danach mit der Straßenbahn zur Universität）',
    };
    if (teile.length === 0) {
      throw new GameError('✏️ Ich ——然後呢？把句子部件接進「Ich」積木裡！');
    }
    if (teile.length > 2) {
      throw new GameError('✏️ 句子太長了！結構是：① 送修腳踏車 → ② 搭電車去大學，各一次。');
    }
    for (let i = 0; i < teile.length; i++) {
      if (teile[i].typ !== erwartet[i]) {
        throw new GameError(`✏️ 句子的第 ${i + 1} 部分應該是「${namen[erwartet[i]]}」。`);
      }
    }

    this._sag(this._satzText(teile), '我先把昨天買的腳踏車送去修車行，然後搭路面電車去大學');
    await this.game._wait(900);

    for (const t of teile) {
      if (highlight) highlight(t.id);
      await this['_' + t.typ](t);
    }
  }

  async _bringen(t) {
    if (!t.hatRelsatz) {
      throw new GameError('🚲 哪一台腳踏車？句子裡少了關係子句——把「, das ich gestern gekauft habe ,」塞進 Fahrrad 後面的圓洞！');
    }
    this._checkFeld(t, 'rel', RELSATZ_LEKTIONEN);
    this._checkFeld(t, 'perf', RELSATZ_LEKTIONEN);
    this._checkFeld(t, 'praep', RELSATZ_LEKTIONEN);
    this._sag('Ich bringe das Fahrrad zuerst zur Werkstatt.', '先把腳踏車送去修車行');
    const g = this.game;
    const s = g.state;
    // 去牽（昨天買的）腳踏車
    await g.walkTo([g.level.fahrrad], 'Fahrrad');
    s.fahrradDabei = true;
    g.onHudChange();
    g._float(s.hero.x, s.hero.y, '🚲');
    g.onHint('🚲 Das Fahrrad von gestern!（牽起昨天買的腳踏車）');
    await g._wait(350);
    // 推去修車行
    const werkstatt = _findeTiles(g, 'w')[0];
    const ziele = DIRS
      .map((d) => ({ x: werkstatt.x + d.dx, y: werkstatt.y + d.dy }))
      .filter((p) => g._passable(g.tileAt(p.x, p.y)));
    await g.walkTo(ziele, 'Werkstatt');
    g.faceTile(werkstatt.x, werkstatt.y);
    s.fahrradDabei = false;
    s.fahrradAbgegeben = true;
    g.onHudChange();
    g._float(s.hero.x, s.hero.y, '🔧 Bis morgen!');
    g.onHint('🔧 Fahrrad abgegeben!（腳踏車送修了，明天來拿）');
    await g._wait(400);
  }

  async _tram(t) {
    this._checkFeld(t, 'art', TRAM_LEKTIONEN);
    this._checkFeld(t, 'praep2', TRAM_LEKTIONEN);
    this._sag('Und danach fahre ich mit der Straßenbahn zur Universität.', '然後搭路面電車去大學');
    const g = this.game;
    const s = g.state;
    const stop = _findeTiles(g, 'S')[0];
    await g.walkTo([stop], 'Haltestelle');
    g.faceTile(g.level.tramEinstieg.x, g.level.tramEinstieg.y);
    await g._wait(350);
    // 上電車
    await this._fahrSchritt(g.level.tramEinstieg, 260);
    s.imTram = true;
    s.tramWeg = true;
    g.onHudChange();
    g._float(s.hero.x, s.hero.y, '🚋 Ding ding!');
    await g._wait(300);
    for (const halt of g.level.tramFahrt) {
      await this._fahrSchritt(halt, 170);
    }
    s.imTram = false;
    await this._fahrSchritt(g.level.tramAusstieg, 280);
    const uni = _findeTiles(g, 'G')[0];
    g.faceTile(uni.x, uni.y);
    this._sag('An der Universität! Zeit für die Vorlesung.', '到大學了！該去上課囉');
    s.won = true;
    g.onHudChange();
    g._float(s.hero.x, s.hero.y, '🎓');
    await g._wait(500);
    throw new WinSignal();
  }

  async _fahrSchritt(ziel, dauer) {
    const g = this.game;
    const t = g.token;
    g._countStep();
    const hero = g.state.hero;
    const dx = Math.sign(ziel.x - hero.x);
    const dy = Math.sign(ziel.y - hero.y);
    const idx = DIRS.findIndex((d) => d.dx === dx && d.dy === dy);
    if (idx >= 0) hero.dir = idx;
    await g._walkTween(ziel.x, ziel.y, dauer, false);
    g._ensure(t);
    hero.x = ziel.x;
    hero.y = ziel.y;
  }
}

/* ---------- 第 7 關提示 ---------- */

function berechneHinweis7(game) {
  const s = game.state;
  if (s.won) return null;
  if (!s.fahrradAbgegeben) {
    return {
      de: 'Ich bringe das Fahrrad, das ich gestern gekauft habe, zuerst zur Werkstatt …',
      maskiert: 'Ich bringe das Fahrrad, ___ ich gestern gekauft ___, zuerst zur Werkstatt …',
      zh: '先把（昨天買的那台）腳踏車送去修車行',
      mask: true,
      note: '關係代名詞跟先行詞同性別（das Fahrrad → ?）；子句裡的變位動詞放最後——kaufen 的 Perfekt 用 haben 還是 sein？',
    };
  }
  return {
    de: '… und fahre danach mit der Straßenbahn zur Universität.',
    maskiert: '… und fahre danach mit ___ Straßenbahn zur Universität.',
    zh: '再搭路面電車去大學',
    mask: true,
    note: 'mit 接 Dativ——但 die Straßenbahn 是陰性！陰性的 Dativ 可不是 dem 喔',
  };
}

/* ================= 第 8 關：假設語氣指令層 =================
   目標句型：Wenn ich mehr Zeit hätte, würde ich am Fluss
             entlang zum Museum laufen und anschließend die
             neue Ausstellung besuchen.                       */

const WOERTER8 = [
  { artikel: 'der', wort: 'Fluss',       genus: 'm', zh: '河',       emoji: '🏞️' },
  { artikel: 'das', wort: 'Museum',      genus: 'n', zh: '博物館',   emoji: '🏛️' },
  { artikel: 'die', wort: 'Ausstellung', genus: 'f', zh: '特展',     emoji: '🖼️' },
  { artikel: 'die', wort: 'Zeit',        genus: 'f', zh: '時間',     emoji: '⏳' },
  { wort: 'hätte（← haben）', zh: '「要是有」假設語氣', emoji: '💭' },
  { wort: 'würde ＋ 原形', zh: '「就會…」', emoji: '💫' },
  { wort: 'entlang', zh: '沿著', emoji: '➰' },
  { wort: 'anschließend', zh: '接著、隨後', emoji: '⏭️' },
  { wort: 'neu → die neue', zh: '新的（形容詞字尾）', emoji: '✨' },
];

const WENN_LEKTIONEN = {
  haette: {
    richtig: 'hätte',
    NONE: '「要是我『有』更多時間」——與現實相反的假設要用 Konjunktiv II：haben 變成……？',
    habe: '「habe」是直陳式（我真的有）。「要是有更多時間」是與現實相反的白日夢 → Konjunktiv II：hätte！',
    hatte: '就差兩個小點！hatte（沒有變音）是過去式「那時有」；假設語氣要加變音 → hätte（ä）。',
    'hätten': 'hätten 是 wir／sie／Sie 的形式。主詞是 ich → hätte。',
  },
};

const LAUFEN_LEKTIONEN = {
  wuerde: {
    richtig: 'würde',
    NONE: '白日夢的主句：「就會……」用哪個助動詞？（＋動詞原形放句尾）',
    werde: 'werde 是「將會」（Futur，真的會發生）。這裡是白日夢（要是…就會…）→ Konjunktiv II：würde ＋ 原形！',
    will: 'will 是「想要」（wollen 的變位）。假設「就會…」→ würde。',
  },
  fluss: {
    richtig: 'am Fluss',
    NONE: '「沿著河」＝ entlang 前面搭 an + Dativ。der Fluss 是陽性……an + dem = ？',
    'an den Fluss': 'entlang 前面用 an + Dativ：am Fluss entlang。（想用 Akkusativ 的話要直接說「den Fluss entlang」——不加 an！）',
    'im Fluss': 'im Fluss ＝ 在河「裡面」！你是要沿著河邊散步，不是游泳 🏊 → am Fluss entlang。',
  },
  zum: {
    richtig: 'zum',
    NONE: 'das Museum 是中性。zu + dem 縮寫成……？（小心：前兩關 zur 用太順了！）',
    zur: 'zur 是陰性用的（zur Post、zur Uni）。das Museum 是中性 → zu + dem = zum！',
    ins: 'ins = in + das「走進裡面」。先說走「到」博物館這個地點 → zu + Dativ = zum。',
  },
};

const BESUCHEN_LEKTIONEN = {
  anschl: {
    richtig: 'anschließend',
    NONE: '「接著、隨後」的副詞是 anschließen 加一個字母……？',
    'anschließen': 'anschließen 是動詞原形「連接」！副詞「接著、隨後」要加 -d → anschließend。',
    'anschließt': 'anschließt 是動詞變位（er schließt an）。這裡要用副詞 → anschließend。',
  },
  neue: {
    richtig: 'die neue',
    NONE: 'die Ausstellung 是陰性、當受詞（Akkusativ）。定冠詞後面的形容詞字尾是……？',
    'die neuen': '定冠詞 die（陰性單數 Akkusativ）後面的形容詞字尾是 -e：die neue Ausstellung。（-en 是複數或 Dativ——第 5 關 die blaue Linie 的複習！）',
    'das neue': 'die Ausstellung 是陰性！das 是中性用的 → die neue Ausstellung。',
  },
  verb: {
    richtig: 'besuchen',
    NONE: 'würde 已經變位了——第二個動詞用什麼形式、放哪裡？',
    besuche: 'würde 已經變位了！第二個動詞用原形放句尾：würde … besuchen（跟第 5 關 muss … umsteigen 同一個道理）。',
    besucht: 'besucht 是 er／sie 形（或過去分詞）。würde + 原形 → besuchen。',
  },
};

class KonjunktivKommandos {
  constructor(game) {
    this.game = game;
    this.ttsOn = true;
    this.onSentence = () => {};
  }

  _sag(de, zh) {
    this.onSentence(de, zh);
    if (this.ttsOn) sprich(de);
  }

  async ohneWenn() {
    throw new GameError('✏️ 白日夢要從「Wenn ich mehr Zeit hätte」開始——把積木接在 Wenn 後面！');
  }

  _w(v) { return v === 'NONE' ? '___' : v; }

  _phrase(t) {
    switch (t.typ) {
      case 'wenn':
        return `Wenn ich mehr Zeit ${this._w(t.haette)}`;
      case 'laufen':
        return `${this._w(t.wuerde)} ich ${this._w(t.fluss)} entlang ${this._w(t.zum)} Museum laufen`;
      case 'besuchen':
        return `und ${this._w(t.anschl)} ${this._w(t.neue)} Ausstellung besuchen`;
    }
    return '';
  }

  _satzText(teile) {
    let s = '';
    for (const t of teile) {
      const p = this._phrase(t);
      if (!s) s = p;
      else s += p.startsWith('und') ? ` ${p}` : `, ${p}`;
    }
    return s + '.';
  }

  _checkFeld(t, feld, lektionen) {
    const l = lektionen[feld];
    const wert = t[feld];
    if (wert === l.richtig) return;
    const erklaerung = l[wert] || l.NONE;
    throw new GameError(`🤔 「${this._phrase(t)}」不太對——${erklaerung}`);
  }

  async fuehreSatz8Aus(teile, highlight) {
    const erwartet = ['wenn', 'laufen', 'besuchen'];
    const namen = {
      wenn: 'Wenn-子句（要是我有更多時間）',
      laufen: '主句（würde ich am Fluss entlang zum Museum laufen）',
      besuchen: '接著（und anschließend die neue Ausstellung besuchen）',
    };
    if (teile.length > 3) {
      throw new GameError('✏️ 句子太長了！結構是：① Wenn-子句 → ② würde … laufen → ③ und anschließend …，各一次。');
    }
    for (let i = 0; i < teile.length; i++) {
      if (teile[i].typ !== erwartet[i]) {
        throw new GameError(`✏️ 句子的第 ${i + 1} 部分應該是「${namen[erwartet[i]]}」。`);
      }
    }

    this._sag(this._satzText(teile), '要是我有更多時間，就會沿著河走到博物館，接著參觀新的特展');
    await this.game._wait(900);

    for (const t of teile) {
      if (highlight) highlight(t.id);
      await this['_' + t.typ](t);
    }
  }

  async _wenn(t) {
    this._checkFeld(t, 'haette', WENN_LEKTIONEN);
    this._sag('Wenn ich mehr Zeit hätte …', '要是我有更多時間……');
    const g = this.game;
    const s = g.state;
    s.traum = true;
    g.onHudChange();
    g._float(s.hero.x, s.hero.y, '💭');
    g.onHint('💭 Der Tagtraum beginnt …（進入白日夢模式——Konjunktiv II 的世界！）');
    await g._wait(700);
  }

  async _laufen(t) {
    this._checkFeld(t, 'wuerde', LAUFEN_LEKTIONEN);
    this._checkFeld(t, 'fluss', LAUFEN_LEKTIONEN);
    this._checkFeld(t, 'zum', LAUFEN_LEKTIONEN);
    this._sag('Dann würde ich am Fluss entlang zum Museum laufen.', '就會沿著河散步到博物館');
    const g = this.game;
    const museum = _findeTiles(g, 'N')[0];
    const ziele = DIRS
      .map((d) => ({ x: museum.x + d.dx, y: museum.y + d.dy }))
      .filter((p) => g._passable(g.tileAt(p.x, p.y)));
    await g.walkTo(ziele, 'Museum');
    g.faceTile(museum.x, museum.y);
    g.state.amMuseum = true;
    g.onHudChange();
    g._float(g.state.hero.x, g.state.hero.y, '🏛️');
    g.onHint('🏛️ Am Museum!（沿著河散步到博物館——夢裡的風景真好）');
    await g._wait(400);
  }

  async _besuchen(t) {
    this._checkFeld(t, 'anschl', BESUCHEN_LEKTIONEN);
    this._checkFeld(t, 'neue', BESUCHEN_LEKTIONEN);
    this._checkFeld(t, 'verb', BESUCHEN_LEKTIONEN);
    this._sag('Und anschließend würde ich die neue Ausstellung besuchen.', '接著參觀新的特展');
    const g = this.game;
    const s = g.state;
    // 站到展牆正前方
    const bilder = _findeTiles(g, 'Y');
    const ziele = bilder
      .map((b) => ({ x: b.x, y: b.y + 1 }))
      .filter((p) => g._passable(g.tileAt(p.x, p.y)));
    await g.walkTo(ziele, 'Ausstellung');
    g.faceTile(s.hero.x, s.hero.y - 1);
    this._sag('Wie schön! Die neue Ausstellung!', '好美！新的特展！');
    s.won = true;
    g.onHudChange();
    g._float(s.hero.x, s.hero.y, '🖼️ Wunderschön!');
    await g._wait(500);
    throw new WinSignal();
  }
}

/* ---------- 第 8 關提示 ---------- */

function berechneHinweis8(game) {
  const s = game.state;
  if (s.won) return null;
  if (!s.traum) {
    return {
      de: 'Wenn ich mehr Zeit hätte, …',
      maskiert: 'Wenn ich mehr Zeit ___, …',
      zh: '先開始作夢：「要是我有更多時間……」',
      mask: true,
      note: '與現實相反的假設用 Konjunktiv II——haben 變成？（注意變音的兩個小點！hatte 是過去式喔）',
    };
  }
  if (!s.amMuseum) {
    return {
      de: '…, würde ich am Fluss entlang zum Museum laufen …',
      maskiert: '…, ___ ich ___ ___ entlang zum Museum laufen …',
      zh: '就會沿著河走到博物館',
      mask: true,
      note: '「就會」用哪個助動詞？（werde 是真的會發生）；「沿著河」＝ an + Dativ ＋ entlang',
    };
  }
  return {
    de: '… und anschließend die neue Ausstellung besuchen.',
    maskiert: '… und anschließend ___ ___ Ausstellung besuchen.',
    zh: '接著參觀新的特展',
    mask: true,
    note: 'die Ausstellung 陰性 Akkusativ——定冠詞後面的形容詞字尾是？（die neu_?）',
  };
}

/* ---------- 第 2 關提示 ---------- */

function berechneHinweis2(game) {
  const s = game.state;
  if (s.won) return null;
  if (!s.brot) {
    return {
      de: 'zuerst zur Bäckerei gehen',
      maskiert: 'zuerst ___ Bäckerei gehen',
      zh: '首先去麵包店拿麵包（記得包進 Ich möchte 裡）',
      mask: true,
      note: 'zu + der Bäckerei（陰性 Dativ）要縮寫成什麼？',
    };
  }
  if (!s.obst) {
    return {
      de: 'dann auf dem Markt Obst kaufen',
      maskiert: 'dann auf ___ Markt Obst kaufen',
      zh: '然後在市場買水果',
      mask: true,
      note: '在市場上是位置（Wo?）→ auf + Dativ，Markt 是陽性',
    };
  }
  return {
    de: 'danach im Park frühstücken',
    maskiert: 'danach ___ Park frühstücken',
    zh: '之後在公園吃早餐',
    mask: true,
    note: 'in + dem Park（陽性 Dativ）要縮寫成什麼？',
  };
}

/* ================= 開放世界：Deutschstadt 指令層 =================
   沒有固定句子——玩家用三種積木自由組句：
     Ich gehe [副詞] [介係詞] [地點].
     Ich fahre [副詞] mit der Straßenbahn [介係詞] [地點].
     Ich [動詞] [冠詞] [東西].
   介係詞、冠詞、動詞全部依「所選的地點／東西的性別」動態驗證。
   完成任務 +3 Münzen，存滿 12 枚買下 Zauberstein 過關。      */

const OW_ORTE = {
  baeckerei:   { key: 'baeckerei',   tile: 'B', nomen: 'Bäckerei',    zh: '麵包店',   genus: 'f', richtig: 'zur' },
  markt:       { key: 'markt',       tile: 'M', nomen: 'Markt',       zh: '市場',     genus: 'm', richtig: 'zum' },
  cafe:        { key: 'cafe',        tile: 'C', nomen: 'Café',        zh: '咖啡廳',   genus: 'n', richtig: 'zum', auchIns: true },
  brunnen:     { key: 'brunnen',     tile: 'F', nomen: 'Brunnen',     zh: '噴泉',     genus: 'm', richtig: 'zum' },
  park:        { key: 'park',        tile: 'P', nomen: 'Park',        zh: '公園',     genus: 'm', richtig: 'in den', betreten: true },
  apotheke:    { key: 'apotheke',    tile: 'E', nomen: 'Apotheke',    zh: '藥局',     genus: 'f', richtig: 'zur' },
  post:        { key: 'post',        tile: 'O', nomen: 'Post',        zh: '郵局',     genus: 'f', richtig: 'zur' },
  rathaus:     { key: 'rathaus',     tile: 'R', nomen: 'Rathaus',     zh: '市政廳',   genus: 'n', richtig: 'zum', auchIns: true },
  automat:     { key: 'automat',     tile: 'V', nomen: 'Automaten',   zh: '販賣機',   genus: 'm', richtig: 'zum' },
  haltestelle: { key: 'haltestelle', tile: 'S', nomen: 'Haltestelle', zh: '電車站',   genus: 'f', richtig: 'zur', betreten: true },
  hause:       { key: 'hause',       tile: 'H', nomen: 'Hause',       zh: '家',       genus: null, richtig: 'nach', betreten: true },
  bibliothek:  { key: 'bibliothek',  tile: 'L', nomen: 'Bibliothek',  zh: '圖書館',   genus: 'f', richtig: 'zur' },
  museum:      { key: 'museum',      tile: 'N', nomen: 'Museum',      zh: '博物館',   genus: 'n', richtig: 'zum', auchIns: true },
  uni:         { key: 'uni',         tile: 'G', nomen: 'Universität', zh: '大學',     genus: 'f', richtig: 'zur' },
};

const OW_OBJEKTE = {
  brot: {
    key: 'brot', nomen: 'Brot', zh: '麵包', emoji: '🥖', genus: 'n', artikel: 'ein',
    ort: 'baeckerei', wo: 'in der Bäckerei', flag: 'owBrot', verben: ['kaufe'], verbZh: '買',
    verbFehler: { trinke: '🥖 麵包用喝的？Brot kauft man——kaufe！', hole: '🥖 麵包店的麵包要付錢買——kaufe！' },
  },
  brezel: {
    key: 'brezel', nomen: 'Brezel', zh: '蝴蝶餅', emoji: '🥨', genus: 'f', artikel: 'eine',
    ort: 'baeckerei', wo: 'in der Bäckerei', flag: 'owBrezel', verben: ['kaufe'], verbZh: '買',
    verbFehler: { trinke: '🥨 Brezel 是拿來咬的，不是喝的！kaufe eine Brezel。', hole: '🥨 要付錢喔——kaufe！' },
  },
  blume: {
    key: 'blume', nomen: 'Blume', zh: '花', emoji: '🌸', genus: 'f', artikel: 'eine',
    ort: 'markt', wo: 'auf dem Markt', flag: 'owBlume', verben: ['kaufe'], verbZh: '買',
    verbFehler: { trinke: '🌸 花不能喝啦！kaufe eine Blume。', hole: '🌸 市場的花要付錢——kaufe！' },
  },
  kaffee: {
    key: 'kaffee', nomen: 'Kaffee', zh: '咖啡', emoji: '☕', genus: 'm', artikel: 'einen',
    ort: 'cafe', wo: 'im Café', flag: 'owKaffee', verben: ['trinke'], verbZh: '喝',
    verbFehler: { kaufe: '☕ 買了不喝嗎？這句要說「喝」：trinke einen Kaffee！', hole: '☕ 咖啡是用喝的：trinke！' },
  },
  medikament: {
    key: 'medikament', nomen: 'Medikament', zh: '藥', emoji: '💊', genus: 'n', artikel: 'ein',
    ort: 'apotheke', wo: 'in der Apotheke', flag: 'owMedikament', verben: ['kaufe', 'hole'], verbZh: '買',
    verbFehler: { trinke: '💊 藥不是拿來乾杯的！kaufe（或 hole）ein Medikament。' },
  },
  paket: {
    key: 'paket', nomen: 'Paket', zh: '包裹', emoji: '📦', genus: 'n', artikel: 'ein',
    ort: 'post', wo: 'bei der Post', flag: 'owPaket', verben: ['hole'], verbZh: '領',
    verbFehler: { kaufe: '📦 包裹本來就是你的，不用買——去「領」：hole！', trinke: '📦 包裹怎麼喝！hole ein Paket。' },
  },
  buch: {
    key: 'buch', nomen: 'Kunstbuch', zh: '藝術書', emoji: '📖', genus: 'n', artikel: 'ein',
    ort: 'bibliothek', wo: 'in der Bibliothek', flag: 'owBuch', verben: ['hole'], verbZh: '借',
    verbFehler: { kaufe: '📚 圖書館的書不用買，是用借（拿）的：hole！', trinke: '📖 書沾了咖啡會被圖書館罵！hole ein Kunstbuch。' },
  },
  zauberstein: {
    key: 'zauberstein', nomen: 'Zauberstein', zh: '魔法寶石', emoji: '💎', genus: 'm', artikel: 'den',
    ort: 'automat', wo: 'am Automaten', flag: null, preis: 12, verben: ['kaufe'], verbZh: '買',
    verbFehler: { hole: '💎 直接拿走是偷竊！寶石要付 12 Münzen：kaufe！', trinke: '💎 寶石很硬，不好喝。kaufe den Zauberstein！' },
  },
};

const OW_AUFGABEN = [
  { id: 'fruehstueck', emoji: '🥐', belohnung: 3,
    de: 'Kauf ein Brot in der Bäckerei und trink einen Kaffee im Café.',
    zh: '早餐時光：麵包店買麵包＋咖啡廳喝咖啡',
    fertig: (s) => s.owBrot && s.owKaffee },
  { id: 'anna', emoji: '💐', belohnung: 3,
    de: 'Kauf eine Blume auf dem Markt und triff Anna am Brunnen.',
    zh: '在市場買一朵花，送給噴泉旁的 Anna',
    fertig: (s) => s.owAnnaGetroffen },
  { id: 'oma', emoji: '👵', belohnung: 3,
    de: 'Oma ist krank! Kauf ein Medikament in der Apotheke und bring es nach Hause.',
    zh: '奧瑪生病了：去藥局買藥送回家',
    fertig: (s) => s.owMedikamentGeliefert },
  { id: 'paket', emoji: '📦', belohnung: 3,
    de: 'Hol ein Paket bei der Post und bring es zum Rathaus.',
    zh: '到郵局領包裹，送去市政廳',
    fertig: (s) => s.owPaketGeliefert },
  { id: 'uni', emoji: '🎓', belohnung: 3,
    de: 'Fahr mit der Straßenbahn zur Universität!',
    zh: '搭路面電車過河去大學',
    fertig: (s) => s.owAnUni },
  { id: 'museum', emoji: '🖼️', belohnung: 3,
    de: 'Hol ein Kunstbuch in der Bibliothek und besuch dann das Museum.',
    zh: '在圖書館借藝術書，再去博物館看展',
    fertig: (s) => s.owMuseumBesucht },
  { id: 'traum', emoji: '💭', belohnung: 3,
    de: 'Mach eine Pause und träum: „Wenn ich mehr Zeit hätte, …“',
    zh: '停下來作一場白日夢（Konjunktiv II）',
    fertig: (s) => s.owTagtraum },
  { id: 'nebensatz', emoji: '📎', belohnung: 3,
    de: 'Sag einen Satz mit „weil/obwohl“ oder mit einem Relativsatz.',
    zh: '用子句說一句話（weil／obwohl 或關係子句）',
    fertig: (s) => s.owNebensatzGesagt },
  { id: 'modal', emoji: '📝', belohnung: 3,
    de: 'Sag, was du machen möchtest oder musst (Modalverb + Infinitiv).',
    zh: '用情態動詞說計畫（möchte／muss ＋ 原形）',
    fertig: (s) => s.owModalGesagt },
];

/* 開放世界的 weil／obwohl 子句：可選的「事實」與其狀態檢查 */
const OW_FAKTEN = {
  'Oma krank': {
    verb: 'ist', zh: '奧瑪生病',
    wahr: (s) => !s.owMedikamentGeliefert,
    sonst: '👵 Oma ist schon wieder gesund!（藥已經送到，奧瑪好了——這個理由過期囉，換一個吧）',
    verbLektion: {
      bin: '主詞是 Oma（她，第三人稱）→ ist！（bin 是 ich 專用的）',
      habe: 'krank 是形容詞——「生病」用 sein：Oma krank IST！（haben 是接名詞的，像 Hunger）',
    },
  },
  'ich Hunger': {
    verb: 'habe', zh: '我餓了',
    wahr: (s) => !s.owBelohnt.fruehstueck,
    sonst: '🥐 Du hast doch gerade gefrühstückt!（你才剛吃完早餐——不餓了吧！換個理由）',
    verbLektion: {
      bin: 'Hunger 是「名詞」——德文說「有餓」：ich Hunger HABE！（sein 是接形容詞的，像 müde）',
      ist: '主詞是 ich → habe！（ist 是 er／sie／es 的形）',
    },
  },
  'Anna auf mich': {
    verb: 'wartet', zh: 'Anna 在等我',
    wahr: (s) => !s.owAnnaGetroffen,
    sonst: '💐 Anna hast du schon getroffen!（你已經見過 Anna、送過花了——她沒在等囉）',
    verbLektion: {
      ist: '「等待」是動詞 warten——Anna 是第三人稱：wartet！',
      habe: '在等的人是 Anna（不是你）——warten 變位成第三人稱：wartet！',
    },
  },
  'ich müde': {
    verb: 'bin', zh: '我累了',
    wahr: () => true,
    sonst: '',
    verbLektion: {
      ist: '主詞是 ich → bin！（ist 是 er／sie／es 的形）',
      habe: 'müde 是「形容詞」——用 sein：ich müde BIN！（haben 是接名詞的，像 Hunger）',
    },
  },
  'es heute': {
    verb: 'regnet', zh: '今天下雨',
    wahr: () => false,
    sonst: '🌞 Es regnet doch gar nicht — die Sonne scheint!（今天 Deutschstadt 是大晴天，哪來的雨！想淋雨請回第 6 關 ☔）',
    verbLektion: {},
  },
};

const OW_KONJ_ZH = { weil: '因為', obwohl: '雖然' };
const OW_REL_ZH = { 'ich brauche': '我需要', 'mir gefällt': '我喜歡', 'Oma braucht': '奧瑪需要' };

/* 目的子句（第 4、5 關）：um…zu ＝ 主詞相同、damit ＝ 主詞不同 */
const OW_ZWECKE = {
  'Anna zu treffen': {
    konj: 'um', zh: '去見 Anna',
    wahr: (s) => !s.owAnnaGetroffen,
    sonst: '💐 Anna hast du schon getroffen!（已經見過 Anna 啦——換個目的吧）',
  },
  'ein Kunstbuch zu holen': {
    konj: 'um', zh: '去借藝術書',
    wahr: (s) => !s.owBuch,
    sonst: '📖 Das Kunstbuch hast du schon!（藝術書已經在背包裡了）',
  },
  'Oma gesund wird': {
    konj: 'damit', zh: '讓奧瑪好起來',
    wahr: (s) => !s.owMedikamentGeliefert,
    sonst: '👵 Oma ist schon wieder gesund!（奧瑪已經好了——目的達成了！）',
  },
  'Anna sich freut': {
    konj: 'damit', zh: '讓 Anna 開心',
    wahr: () => true,
    sonst: '',
  },
};

/* 時間子句（第 4 關）：nachdem ＋ Perfekt——事情要「真的發生過」！ */
const OW_NACHDEM = {
  'das Brot gekauft': {
    aux: 'habe', zh: '買了麵包',
    passiert: (s) => s.owBrot || !!(s.owBelohnt && s.owBelohnt.fruehstueck),
    sonst: '🥖 Hast du noch gar nicht!（你今天還沒買麵包——nachdem 是「在…之後」，事情要真的發生過！）',
  },
  'Anna getroffen': {
    aux: 'habe', zh: '見了 Anna',
    passiert: (s) => s.owAnnaGetroffen,
    sonst: '💐 Anna hast du heute noch nicht getroffen!（今天還沒見到 Anna 呢——先去噴泉吧）',
  },
  'aus der Bahn ausgestiegen': {
    aux: 'bin', zh: '下了電車',
    passiert: (s) => s.owGefahren,
    sonst: '🚋 Du bist heute noch gar nicht Bahn gefahren!（今天根本還沒搭過電車，哪來的「下車之後」！）',
  },
};

const WOERTER_OW = [
  { artikel: 'die', wort: 'Bäckerei',    genus: 'f', zh: '麵包店',   emoji: '🥖' },
  { artikel: 'der', wort: 'Markt',       genus: 'm', zh: '市場',     emoji: '🍎' },
  { artikel: 'das', wort: 'Café',        genus: 'n', zh: '咖啡廳',   emoji: '☕' },
  { artikel: 'der', wort: 'Brunnen',     genus: 'm', zh: '噴泉',     emoji: '⛲' },
  { artikel: 'der', wort: 'Park',        genus: 'm', zh: '公園',     emoji: '🌳' },
  { artikel: 'die', wort: 'Apotheke',    genus: 'f', zh: '藥局',     emoji: '💊' },
  { artikel: 'die', wort: 'Post',        genus: 'f', zh: '郵局',     emoji: '📯' },
  { artikel: 'das', wort: 'Rathaus',     genus: 'n', zh: '市政廳',   emoji: '🏢' },
  { artikel: 'der', wort: 'Automat',     genus: 'm', zh: '販賣機（zum Automaten！）', emoji: '🎰' },
  { artikel: 'die', wort: 'Haltestelle', genus: 'f', zh: '電車站',   emoji: '🚏' },
  { artikel: 'die', wort: 'Bibliothek',  genus: 'f', zh: '圖書館',   emoji: '📚' },
  { artikel: 'das', wort: 'Museum',      genus: 'n', zh: '博物館',   emoji: '🏛️' },
  { artikel: 'die', wort: 'Universität', genus: 'f', zh: '大學',     emoji: '🎓' },
  { artikel: 'die', wort: 'Straßenbahn', genus: 'f', zh: '路面電車', emoji: '🚋' },
  { wort: 'nach Hause', zh: '回家（固定用法）', emoji: '🏠' },
  { artikel: 'das', wort: 'Brot',        genus: 'n', zh: '麵包',     emoji: '🥖' },
  { artikel: 'die', wort: 'Brezel',      genus: 'f', zh: '蝴蝶餅',   emoji: '🥨' },
  { artikel: 'die', wort: 'Blume',       genus: 'f', zh: '花',       emoji: '🌸' },
  { artikel: 'der', wort: 'Kaffee',      genus: 'm', zh: '咖啡',     emoji: '☕' },
  { artikel: 'das', wort: 'Medikament',  genus: 'n', zh: '藥',       emoji: '💊' },
  { artikel: 'das', wort: 'Paket',       genus: 'n', zh: '包裹',     emoji: '📦' },
  { artikel: 'das', wort: 'Kunstbuch',   genus: 'n', zh: '藝術書',   emoji: '📖' },
  { artikel: 'der', wort: 'Zauberstein', genus: 'm', zh: '魔法寶石（den！）', emoji: '💎' },
  { wort: 'kaufen／trinken／holen', zh: '買／喝／拿、領', emoji: '🛍️' },
  { wort: 'die Münze（+3 pro Aufgabe）', zh: '金幣（每個任務 +3）', emoji: '🪙' },
  { wort: 'hätte／würde（Konjunktiv II）', zh: '「要是…就會…」夢境語法', emoji: '💭' },
  { wort: 'würde … gehen／fahren／kaufen', zh: '夢裡動作：原形放句尾！', emoji: '💤' },
  { wort: 'weil ／ obwohl（動詞置尾）', zh: '因為／雖然（子句）', emoji: '📎' },
  { wort: 'der／die／das／den（關係代名詞）', zh: '同先行詞性別＋看子句裡的格', emoji: '🔗' },
  { wort: 'möchte ／ muss ＋ 原形', zh: '想要／必須（情態動詞）', emoji: '📝' },
  { wort: 'um … zu ／ damit', zh: '為了（同主詞／不同主詞）', emoji: '🎯' },
  { wort: 'nachdem … habe／bin', zh: '在…之後（Perfekt）', emoji: '⏮️' },
];

const OW_ADV_ZH = {
  NONE: '', zuerst: '首先', dann: '然後', danach: '接著', anschließend: '隨後', schließlich: '最後',
};

// 介係詞選錯時的教學訊息（依地點性別動態產生）
function owPraepLektion(o, g) {
  const art = { m: 'der', f: 'die', n: 'das' }[o.genus];
  const gzh = { m: '陽性', f: '陰性', n: '中性' }[o.genus];
  const name = `${art} ${o.key === 'automat' ? 'Automat' : o.nomen}`;
  if (o.key === 'hause') {
    if (g === 'NONE') return '回家有個特別的說法……第 6 關學過：___ Hause！';
    return `回家不說「${g} Hause」！固定講法：nach Hause（第 6 關的複習）。`;
  }
  if (g === 'NONE') {
    if (o.key === 'park') return 'der Park 是陽性，而且是要「走進去」的地方——in + Akkusativ = ？';
    return `${name} 是${gzh}——zu + Dativ 要縮寫成什麼？（查右邊的單字表！）`;
  }
  if (g === 'nach') return 'nach 只用在城市、國家和 nach Hause！去店家或建築物要用 zu + Dativ（zur／zum）。';
  if (o.key === 'park') {
    if (g === 'ins') return '公園是 der Park（陽性）！「走進去」用 in + Akkusativ → in den Park（ins 是中性用的）。';
    return '公園要「走進去」才算數：in + Akkusativ = in den Park！（待在裡面才說 im Park——第 2 關的複習）';
  }
  if (g === 'in den') return `in den（走進…裡面）只有 Park 這樣用！去 ${o.nomen} 用 zu + Dativ 就好。`;
  if (g === 'zur') return `${name} 是${gzh}——zu + dem = zum！（zur 是陰性專用）`;
  if (g === 'zum') return `${name} 是陰性——zu + der = zur！`;
  if (g === 'ins') {
    return o.genus === 'f'
      ? `ins = in + das（中性專用）！${name} 是陰性 → zur。`
      : `ins = in + das（中性）。${name} 是陽性 → zum。`;
  }
  return '再想想介係詞！';
}

// 冠詞選錯時的教學訊息（Akkusativ）
function owArtikelLektion(o, g) {
  const art = { m: 'der', f: 'die', n: 'das' }[o.genus];
  const gzh = { m: '陽性（einen）', f: '陰性（eine）', n: '中性（ein）' }[o.genus];
  if (o.key === 'zauberstein') {
    if (g === 'NONE') return '這可是「那顆」傳說中的寶石——獨一無二的東西用定冠詞：der Zauberstein 陽性 Akkusativ → ？';
    return 'Es gibt nur EINEN — den berühmten Zauberstein! 獨一無二的東西用定冠詞：陽性 Akkusativ → den。';
  }
  if (g === 'den') return `den 是定冠詞（特定的那一個）——買個新的用不定冠詞：${o.artikel} ${o.nomen}！`;
  if (g === 'NONE') return `${art} ${o.nomen} 是${gzh.slice(0, 2)}——Akkusativ 的不定冠詞是？（查單字表！）`;
  const falsch = { einen: '陽性', eine: '陰性', ein: '中性' }[g];
  return `${art} ${o.nomen} 是${gzh}——不是 ${g}（${falsch}用的）！`;
}

class OffeneWeltKommandos {
  constructor(game) {
    this.game = game;
    this.ttsOn = true;
    this.onSentence = () => {};
    this._token = -1;
    this._satzNr = 0;
  }

  _sag(de, zh) {
    this.onSentence(de, zh);
    if (this.ttsOn) sprich(de);
  }

  _w(v) { return !v || v === 'NONE' ? '___' : v; }

  // 每次執行（token 改變）就重新從第 1 句開始數
  _neuerSatz() {
    if (this._token !== this.game.token) {
      this._token = this.game.token;
      this._satzNr = 0;
    }
    this._satzNr++;
    return this._satzNr;
  }

  _heroSeite() { return this.game.state.hero.y <= 5 ? 'nord' : 'sued'; }

  _ortSeite(key) {
    if (key === 'haltestelle') return null; // 兩岸都有
    const t = _findeTiles(this.game, OW_ORTE[key].tile)[0];
    return t.y <= 5 ? 'nord' : 'sued';
  }

  _gehSatz(t) {
    const adv = t.adv && t.adv !== 'NONE' ? `${t.adv} ` : '';
    const o = OW_ORTE[t.ort];
    return `Ich gehe ${adv}${this._w(t.praep)} ${o ? o.nomen : '___'}`;
  }

  _fahrSatz(t) {
    const adv = t.adv && t.adv !== 'NONE' ? `${t.adv} ` : '';
    const o = OW_ORTE[t.ort];
    return `Ich fahre ${adv}${this._w(t.mit)} Straßenbahn ${this._w(t.praep)} ${o ? o.nomen : '___'}`;
  }

  _kaufSatz(t) {
    const o = OW_OBJEKTE[t.obj];
    return `Ich ${this._w(t.verb)} ${this._w(t.art)} ${o ? o.nomen : '___'}`;
  }

  /* ---------- 子句（weil／obwohl ＋ 關係子句） ---------- */

  async relsatzAllein() {
    throw new GameError('🔗 關係子句要插進 kaufe 積木「名詞後面」的圓洞——先選一樣東西，再形容它是「哪一個」！');
  }

  async nebensatzAllein() {
    throw new GameError('📎 子句積木（weil／obwohl／um…zu／damit／nachdem）要插進句子「句尾」的洞——它不能自己當一句話！');
  }

  _nebenTeil(neben) {
    if (neben.art === 'zweck') return `, ${this._w(neben.konj)} ${this._w(neben.ziel)}`;
    if (neben.art === 'nachdem') return `, nachdem ich ${this._w(neben.inhalt)} ${this._w(neben.aux)}`;
    return `, ${this._w(neben.konj)} ${this._w(neben.fakt)} ${this._w(neben.verb)}`;
  }

  _relTeil(rel) {
    return `, ${this._w(rel.rel)} ${this._w(rel.inhalt)}`;
  }

  _nebenZh(neben) {
    if (!neben) return '';
    if (neben.art === 'zweck') {
      const z = OW_ZWECKE[neben.ziel];
      return `，${neben.konj === 'damit' ? '好' : '為了'}${z ? z.zh : ''}`;
    }
    if (neben.art === 'nachdem') {
      const n = OW_NACHDEM[neben.inhalt];
      return `，在${n ? n.zh : ''}之後`;
    }
    const f = OW_FAKTEN[neben.fakt];
    return `，${OW_KONJ_ZH[neben.konj] || ''}${f ? f.zh : ''}`;
  }

  _sagteNebensatz() {
    this.game.state.owNebensatzGesagt = true;
  }

  _checkNebensatz(neben, satz) {
    if (neben.art === 'zweck') return this._checkZweck(neben, satz);
    if (neben.art === 'nachdem') return this._checkNachdem(neben, satz);
    if (!neben.konj || neben.konj === 'NONE') {
      throw new GameError(`🤔 「${satz}」——子句要用哪個連接詞？「因為」weil、「雖然」obwohl（它們都會把動詞踢到子句最後！）`);
    }
    if (neben.konj === 'und' || neben.konj === 'aber') {
      throw new GameError(`🤔 「${satz}」不太對——und／aber 是「對等」連接詞，動詞不會跑到最後！說理由用 weil、說「雖然」用 obwohl——這種「從屬」連接詞才會把動詞踢到子句句尾（第 6 關的複習）。`);
    }
    if (!neben.fakt || neben.fakt === 'NONE') {
      throw new GameError(`🤔 「${satz}」——子句的內容呢？選一個理由或情況！`);
    }
    const f = OW_FAKTEN[neben.fakt];
    if (!neben.verb || neben.verb === 'NONE') {
      throw new GameError(`🤔 「${satz}」——Nebensatz 的動詞放在子句「最後」——「${neben.fakt} …」的動詞是哪個？`);
    }
    if (neben.verb !== f.verb) {
      throw new GameError(`🤔 「${satz}」不太對——${f.verbLektion[neben.verb] || `「${neben.fakt} …」的動詞是 ${f.verb}（記得放子句最後！）`}`);
    }
    if (!f.wahr(this.game.state)) {
      throw new GameError(`🤔 「${satz}」——${f.sonst}`);
    }
  }

  // um…zu（主詞相同）vs damit（主詞不同）——第 4、5 關的核心對比
  _checkZweck(neben, satz) {
    if (!neben.konj || neben.konj === 'NONE') {
      throw new GameError(`🤔 「${satz}」——目的子句用哪個？主詞相同（都是我）→ um … zu；主詞是別人 → damit（第 4、5 關的複習）！`);
    }
    if (!neben.ziel || neben.ziel === 'NONE') {
      throw new GameError(`🤔 「${satz}」——目的是什麼？選一個！`);
    }
    const z = OW_ZWECKE[neben.ziel];
    if (neben.konj !== z.konj) {
      const lektion = z.konj === 'um'
        ? `「${neben.ziel}」做動作的還是「我」（主詞相同）→ um … zu ＋ 原形！damit 是留給「不同主詞」用的。`
        : `um…zu 的隱藏主詞永遠是「我」——但「${neben.ziel}」的主詞是別人（Oma／Anna）！不同主詞 → damit ＋ 變位動詞（第 5 關的重點）。`;
      throw new GameError(`🤔 「${satz}」不太對——${lektion}`);
    }
    if (!z.wahr(this.game.state)) {
      throw new GameError(`🤔 「${satz}」——${z.sonst}`);
    }
  }

  // nachdem ＋ Perfekt：haben/sein 助動詞＋「事情要真的發生過」
  _checkNachdem(neben, satz) {
    if (!neben.inhalt || neben.inhalt === 'NONE') {
      throw new GameError(`🤔 「${satz}」——「在…之後」：之後於哪件事？選一件（今天真的做過的）事！`);
    }
    const n = OW_NACHDEM[neben.inhalt];
    if (!neben.aux || neben.aux === 'NONE') {
      throw new GameError(`🤔 「${satz}」——Perfekt＝Partizip＋助動詞，助動詞放子句「最後」——這個動詞配 haben 還是 sein？`);
    }
    if (neben.aux !== n.aux) {
      let lektion;
      if (neben.aux === 'hat' || neben.aux === 'ist') {
        lektion = `主詞是 ich → habe／bin！（hat／ist 是 er/sie/es 的形）`;
      } else if (n.aux === 'bin') {
        lektion = 'aussteigen 是「移動、位置變化」的動詞——Perfekt 用 sein：… ausgestiegen BIN！（第 4 關的重點）';
      } else {
        lektion = 'kaufen／treffen 是一般及物動詞——Perfekt 用 haben：… gekauft／getroffen HABE！（sein 是移動動詞用的）';
      }
      throw new GameError(`🤔 「${satz}」不太對——${lektion}`);
    }
    if (!n.passiert(this.game.state)) {
      throw new GameError(`🤔 「${satz}」——${n.sonst}`);
    }
  }

  _checkRelsatz(rel, o, satz) {
    if (!rel.inhalt || rel.inhalt === 'NONE') {
      throw new GameError(`🤔 「${satz}」——關係子句要說什麼？ich brauche（我需要的）／mir gefällt（我喜歡的）／Oma braucht（奧瑪需要的）！`);
    }
    const nominativ = rel.inhalt === 'mir gefällt';
    const richtig = (nominativ ? { m: 'der', f: 'die', n: 'das' } : { m: 'den', f: 'die', n: 'das' })[o.genus];
    if (rel.rel === richtig) return;
    const art = { m: 'der', f: 'die', n: 'das' }[o.genus];
    const gzh = { m: '陽性', f: '陰性', n: '中性' }[o.genus];
    if (!rel.rel || rel.rel === 'NONE') {
      throw new GameError(`🤔 「${satz}」——關係代名詞跟先行詞同性別（${art} ${o.nomen} 是${gzh}），還要看它在「${rel.inhalt}」裡當主詞還是受詞……是哪個呢？`);
    }
    if (rel.rel === 'dem') {
      throw new GameError(`🤔 「${satz}」不太對——dem 是 Dativ！關係代名詞在「${rel.inhalt}」裡當${nominativ ? '主詞（Nominativ）' : '受詞（Akkusativ）'} → ${richtig}。`);
    }
    if (o.genus === 'm' && rel.rel === 'der' && !nominativ) {
      throw new GameError(`🤔 「${satz}」不太對——在「${rel.inhalt}」裡，關係代名詞是「被需要的東西」（受詞）→ 陽性 Akkusativ：den！（第 7 關只練過中性 das——這是陽性進階版！）`);
    }
    if (o.genus === 'm' && rel.rel === 'den' && nominativ) {
      throw new GameError(`🤔 「${satz}」不太對——在「mir gefällt」裡，關係代名詞是子句的「主詞」（是它讓我喜歡）→ 陽性 Nominativ：der！`);
    }
    throw new GameError(`🤔 「${satz}」不太對——關係代名詞跟先行詞同性別：${art} ${o.nomen} 是${gzh} → ${richtig}！`);
  }

  _checkAdv(t, satz) {
    const nr = this._neuerSatz();
    if (t.adv === 'zuerst' && nr > 1) {
      throw new GameError(`🤔 「${satz}」——zuerst＝「首先」，但這已經是今天的第 ${nr} 句了！改用 dann／danach／anschließend／schließlich。`);
    }
  }

  _checkOrtUndPraep(t, satz) {
    if (!t.ort || t.ort === 'NONE') {
      throw new GameError('🧭 要去哪裡呢？先在積木裡選一個地點——右邊的單字表就是你的地圖！');
    }
    const o = OW_ORTE[t.ort];
    const ok = t.praep === o.richtig || (o.auchIns && t.praep === 'ins');
    if (!ok) {
      throw new GameError(`🤔 「${satz}」不太對——${owPraepLektion(o, t.praep)}`);
    }
  }

  // 走到指定地點（含面向、抵達事件、任務結算）
  async _laufZu(key) {
    const g = this.game;
    const s = g.state;
    const o = OW_ORTE[key];
    const tiles = _findeTiles(g, o.tile);
    const ziele = o.betreten
      ? tiles
      : tiles
          .flatMap((tl) => DIRS.map((d) => ({ x: tl.x + d.dx, y: tl.y + d.dy })))
          .filter((p) => g._passable(g.tileAt(p.x, p.y)));
    await g.walkTo(ziele, o.nomen);
    if (!o.betreten) {
      let nah = tiles[0];
      let best = 1e9;
      for (const tl of tiles) {
        const dist = Math.abs(tl.x - s.hero.x) + Math.abs(tl.y - s.hero.y);
        if (dist < best) { best = dist; nah = tl; }
      }
      g.faceTile(nah.x, nah.y);
    }
    await this._ankunft(key);
    await g._wait(300);
  }

  // 抵達事件：Anna、送藥回家、包裹送市政廳、大學、博物館
  async _ankunft(key) {
    const g = this.game;
    const s = g.state;
    if (key === 'brunnen') {
      const anna = _findeTiles(g, 'A')[0];
      if (!s.owAnnaGetroffen && s.owBlume) {
        g.faceTile(anna.x, anna.y);
        s.owBlume = false;
        s.owAnnaGetroffen = true;
        this._sag('Anna: Oh, eine Blume für mich? Danke schön!', 'Anna：這朵花是送我的嗎？謝謝！');
        g._float(anna.x, anna.y, '💐');
      } else if (!s.owAnnaGetroffen) {
        g.onHint('👩‍🦰 Anna wartet am Brunnen …（Anna 在噴泉邊等著——空手來有點害羞？聽說市場有賣花 🌸）');
      }
    }
    if (key === 'hause' && s.owMedikament && !s.owMedikamentGeliefert) {
      s.owMedikament = false;
      s.owMedikamentGeliefert = true;
      this._sag('Oma sagt: Danke, mein Schatz!', '奧瑪說：謝謝寶貝！吃了藥很快就會好');
      g._float(s.hero.x, s.hero.y, '👵💕');
    }
    if (key === 'rathaus' && s.owPaket && !s.owPaketGeliefert) {
      s.owPaket = false;
      s.owPaketGeliefert = true;
      this._sag('Das Paket ist angekommen!', '包裹送到市政廳了！');
      g._float(s.hero.x, s.hero.y, '📦✅');
    }
    if (key === 'uni' && !s.owAnUni) {
      s.owAnUni = true;
      g._float(s.hero.x, s.hero.y, '🎓');
    }
    if (key === 'museum') {
      if (s.owBuch && !s.owMuseumBesucht) {
        s.owMuseumBesucht = true;
        this._sag('Mit dem Kunstbuch verstehst du jedes Bild!', '有了藝術書，每幅畫都看得懂！');
        g._float(s.hero.x, s.hero.y, '🖼️');
      } else if (!s.owMuseumBesucht) {
        g.onHint('🏛️ Ohne Kunstbuch verstehst du nur die Hälfte …（先去圖書館 hole ein Kunstbuch，再來看展才算完成任務！）');
      }
    }
    g.onHudChange();
    this._pruefeAufgaben();
  }

  // 任務結算：完成一個 +3 Münzen
  _pruefeAufgaben() {
    const s = this.game.state;
    for (const a of OW_AUFGABEN) {
      if (s.owBelohnt[a.id] || !a.fertig(s)) continue;
      s.owBelohnt[a.id] = true;
      s.purse += a.belohnung;
      this.game._float(s.hero.x, s.hero.y, `✅ +${a.belohnung} Münzen`);
      this.game.onHint(`✅ Aufgabe geschafft: „${a.de}“ +${a.belohnung} Münzen!（任務完成：${a.zh}！目前 ${s.purse} 枚 🪙）`);
    }
    this.game.onHudChange();
  }

  /* ---------- 積木呼叫的三個動作 ---------- */

  async gehe(t) {
    let satz = this._gehSatz(t);
    if (t.neben) satz += this._nebenTeil(t.neben);
    this._checkAdv(t, satz);
    this._checkOrtUndPraep(t, satz);
    if (t.neben) {
      this._checkNebensatz(t.neben, satz);
      this._sagteNebensatz();
    }
    const o = OW_ORTE[t.ort];
    this._sag(`${satz}.`, `${OW_ADV_ZH[t.adv] || ''}去${o.zh}${this._nebenZh(t.neben)}`);
    await this._geheWirklich(t.ort);
  }

  async fahre(t) {
    let satz = this._fahrSatz(t);
    if (t.neben) satz += this._nebenTeil(t.neben);
    this._checkAdv(t, satz);
    if (!t.ort || t.ort === 'NONE') {
      throw new GameError('🧭 電車要載你去哪呢？先在積木裡選一個地點！');
    }
    this._checkMit(t.mit, satz);
    this._checkOrtUndPraep(t, satz);
    if (t.neben) {
      this._checkNebensatz(t.neben, satz);
      this._sagteNebensatz();
    }
    const o = OW_ORTE[t.ort];
    this._sag(`${satz}.`, `${OW_ADV_ZH[t.adv] || ''}搭電車去${o.zh}${this._nebenZh(t.neben)}`);
    await this._fahreWirklich(t.ort);
  }

  async kaufe(t) {
    this._neuerSatz();
    let satz = this._kaufSatz(t);
    if (t.rel) satz += this._relTeil(t.rel);
    if (t.neben) satz += this._nebenTeil(t.neben);
    if (!t.obj || t.obj === 'NONE') {
      throw new GameError('🛍️ 要買（喝、拿）什麼呢？先在積木裡選一樣東西！');
    }
    const o = OW_OBJEKTE[t.obj];
    if (!t.verb || t.verb === 'NONE') {
      throw new GameError(`🤔 「${satz}」——想對 ${o.nomen} 做什麼？買（kaufe）、喝（trinke）還是拿／領（hole）？`);
    }
    if (!o.verben.includes(t.verb)) {
      throw new GameError(`🤔 「${satz}」不太對——${o.verbFehler[t.verb] || '這個動詞跟這樣東西不搭！'}`);
    }
    this._checkKaufArtikel(t, o, satz);
    if (t.neben) {
      this._checkNebensatz(t.neben, satz);
      this._sagteNebensatz();
    }
    this._sag(`${satz}.`, `${o.verbZh}${t.rel ? `${OW_REL_ZH[t.rel.inhalt] || ''}的` : ''}${o.zh}${this._nebenZh(t.neben)}`);
    await this._kaufeWirklich(t.obj);
  }

  // 冠詞檢查（現實與情態框架共用）：有關係子句 → 定冠詞
  _checkKaufArtikel(t, o, satz) {
    if (t.rel) {
      this._checkRelsatz(t.rel, o, satz);
      const def = { m: 'den', f: 'die', n: 'das' }[o.genus];
      if (t.art !== def) {
        throw new GameError(`🤔 「${satz}」不太對——加了關係子句＝在指「特定的那一個」→ 用定冠詞：${def} ${o.nomen}！（不定冠詞 ein… 是「隨便一個」，跟「${OW_REL_ZH[t.rel.inhalt] || ''}的那個」矛盾啦）`);
      }
      this._sagteNebensatz();
    } else if (t.art !== o.artikel) {
      throw new GameError(`🤔 「${satz}」不太對——${owArtikelLektion(o, t.art)}`);
    }
  }

  /* ---------- 真實世界執行器（直陳句與情態動詞框架共用） ---------- */

  async _geheWirklich(ort) {
    const o = OW_ORTE[ort];
    const zielSeite = this._ortSeite(ort);
    if (zielSeite && zielSeite !== this._heroSeite()) {
      throw new GameError(`🌊 Zu Fuß kommst du nicht über den Fluss!（${o.zh}在河對岸，走路過不去！先 zur Haltestelle，再 mit der Straßenbahn 🚋）`);
    }
    await this._laufZu(ort);
  }

  async _fahreWirklich(ort) {
    const g = this.game;
    const s = g.state;
    const o = OW_ORTE[ort];
    // 必須先站在（或緊鄰）電車站
    const stops = _findeTiles(g, 'S');
    const beiStop = stops.find((st) => Math.abs(st.x - s.hero.x) + Math.abs(st.y - s.hero.y) <= 1);
    if (!beiStop) {
      throw new GameError('🚏 Ohne Haltestelle keine Bahn!（要先到電車站才能上車！加一句「Ich gehe zur Haltestelle」）');
    }
    // 電車只過河：同岸目的地請用走的
    const zielSeite = this._ortSeite(ort);
    if (zielSeite && zielSeite === this._heroSeite()) {
      throw new GameError(`🤔 ${o.nomen} ist auf DIESER Seite vom Fluss!（${o.zh}就在這一岸，用走的就好：Ich gehe …。電車只負責過河 🚋）`);
    }
    const andere = stops.find((st) => st.x !== beiStop.x || st.y !== beiStop.y);

    // 電車若停在對岸，先開過來接你
    if (s.tramXY && (s.tramXY.x !== beiStop.x || s.tramXY.y !== beiStop.y)) {
      g.onHint('🚋 Die Bahn kommt gleich …（電車正從對岸開過來……）');
      await this._tramFaehrt(this._gleisPfad(andere, beiStop));
    }
    // 上車、過河
    await g.walkTo([beiStop], 'Haltestelle');
    s.imTram = true;
    s.tramXY = null;
    g.onHudChange();
    g._float(s.hero.x, s.hero.y, '🚋 Ding ding!');
    await g._wait(300);
    for (const halt of this._gleisPfad(beiStop, andere)) {
      await this._fahrSchritt(halt, 200);
    }
    s.imTram = false;
    s.tramXY = { x: andere.x, y: andere.y };
    s.owGefahren = true;
    g.onHudChange();
    // 下車，繼續走到目的地
    if (ort === 'haltestelle') {
      await this._ankunft(ort);
      await g._wait(300);
    } else {
      await this._laufZu(ort);
    }
  }

  async _kaufeWirklich(objKey) {
    const g = this.game;
    const s = g.state;
    const o = OW_OBJEKTE[objKey];
    const ortCfg = OW_ORTE[o.ort];
    const tiles = _findeTiles(g, ortCfg.tile);
    const daneben = tiles.find((tl) => Math.abs(tl.x - s.hero.x) + Math.abs(tl.y - s.hero.y) <= 1);
    if (!daneben) {
      throw new GameError(`🧭 ${o.emoji} ${o.nomen} gibt es nur ${o.wo}!（${o.zh}要到${ortCfg.zh}才${o.verbZh}得到——先「Ich gehe ${ortCfg.richtig} ${ortCfg.nomen}」！）`);
    }
    g.faceTile(daneben.x, daneben.y);

    // 魔法寶石：終極目標
    if (objKey === 'zauberstein') {
      if (s.purse < o.preis) {
        throw new GameError(`💰 Der Zauberstein kostet ${o.preis} Münzen — du hast erst ${s.purse}!（錢不夠！完成任務賺 Münzen：每個 +3）`);
      }
      s.purse -= o.preis;
      s.won = true;
      g.onHudChange();
      this._sag('Der Zauberstein gehört mir!', '魔法寶石到手！');
      g._float(s.hero.x, s.hero.y, '💎✨');
      await g._wait(600);
      throw new WinSignal();
    }

    if (objKey === 'kaffee') {
      if (s.owKaffee) {
        g.onHint('☕ Noch einen? Du zitterst ja schon!（再一杯？你已經咖啡因過量在發抖了啦）');
      } else {
        s.owKaffee = true;
        g._float(s.hero.x, s.hero.y, '☕ Lecker!');
      }
    } else if (s[o.flag]) {
      g.onHint(`${o.emoji} Du hast schon ${o.artikel === 'eine' ? 'eine' : 'eins'}!（${o.zh}已經有了，不用再${o.verbZh}）`);
    } else {
      s[o.flag] = true;
      g._float(s.hero.x, s.hero.y, `+1 ${o.emoji}`);
    }
    g.onHudChange();
    this._pruefeAufgaben();
    await g._wait(400);
  }

  /* ---------- 白日夢（Konjunktiv II：würde ＋ 原形，模組化） ----------
     框架積木 ow_traum 提供「Wenn … hätte, würde ich …」，
     容器裡自由接夢境動作積木（原形版 gehen／fahren／kaufen）。
     夢裡：水面能走、電車不用車站、買東西不用錢——
     醒來：人彈回原地，什麼都沒真的發生（Konjunktiv II！）。   */

  async ohneWuerde() {
    throw new GameError('🧩 「… gehen／fahren／kaufen」（原形）要接進框架裡才能用——「Ich möchte／muss …」（真的做）或「Wenn ich mehr Zeit hätte, würde ich …」（作夢）！直述句請用「Ich gehe／fahre／kaufe」。');
  }

  _checkMit(mit, satz) {
    if (mit === 'mit der') return;
    const lektion = mit === 'NONE'
      ? 'mit 永遠接 Dativ——die Straßenbahn 是陰性，陰性的 Dativ 是……？（第 7 關的複習！）'
      : mit === 'mit dem'
        ? 'die Straßenbahn 是陰性——陰性 Dativ 是 der：mit der Straßenbahn！（dem 是陽性／中性用的）'
        : 'mit 永遠接 Dativ！die 是 Nominativ／Akkusativ——陰性 Dativ → der。';
    throw new GameError(`🤔 「${satz}」不太對——${lektion}`);
  }

  // 面向最近的一格目標（betreten 型地點不用轉頭）
  _schauZu(tiles, betreten) {
    if (betreten) return;
    const s = this.game.state;
    let nah = tiles[0];
    let best = 1e9;
    for (const tl of tiles) {
      const dist = Math.abs(tl.x - s.hero.x) + Math.abs(tl.y - s.hero.y);
      if (dist < best) { best = dist; nah = tl; }
    }
    this.game.faceTile(nah.x, nah.y);
  }

  _traumPhrase(teil) {
    const adv = teil.adv && teil.adv !== 'NONE' ? `${teil.adv} ` : '';
    const neben = teil.neben ? this._nebenTeil(teil.neben) : '';
    if (teil.typ === 'kaufen') {
      const o = OW_OBJEKTE[teil.obj];
      const rel = teil.rel ? `${this._relTeil(teil.rel)},` : '';
      return `${this._w(teil.art)} ${o ? o.nomen : '___'}${rel} ${this._w(teil.verb)}${neben}`;
    }
    const o = OW_ORTE[teil.ort];
    const nomen = o ? o.nomen : '___';
    if (teil.typ === 'fahren') {
      return `${adv}${this._w(teil.mit)} Straßenbahn ${this._w(teil.praep)} ${nomen} fahren${neben}`;
    }
    return `${adv}${this._w(teil.praep)} ${nomen} gehen${neben}`;
  }

  _phrasenText(teile) {
    const phrasen = (teile || [])
      .filter((x) => x.typ === 'gehen' || x.typ === 'fahren' || x.typ === 'kaufen')
      .map((x) => this._traumPhrase(x));
    let rest = phrasen.length ? phrasen[0] : '…';
    for (let i = 1; i < phrasen.length; i++) {
      rest += (i === phrasen.length - 1 ? ' und ' : ', ') + phrasen[i];
    }
    return rest;
  }

  _traumSatz(t) {
    return `Wenn ich mehr Zeit ${this._w(t.haette)}, ${this._w(t.wuerde)} ich ${this._phrasenText(t.teile)}`;
  }

  _modalSatz(t) {
    return `Ich ${this._w(t.modal)} ${this._phrasenText(t.teile)}`;
  }

  // 原形片語的共同文法檢查（夢境框架與情態動詞框架共用）
  _checkTraumKauf(teil, satz) {
    if (!teil.obj || teil.obj === 'NONE') {
      throw new GameError('🛍️ 要買（喝、拿）什麼呢？先在積木裡選一樣東西！');
    }
    const o = OW_OBJEKTE[teil.obj];
    if (!teil.verb || teil.verb === 'NONE') {
      throw new GameError(`🤔 「${satz}」——想對 ${o.nomen} 做什麼？kaufen／trinken／holen（原形！）`);
    }
    // 選到變位形（kaufe／trinke／hole）→ 原形課
    if (teil.verb === 'kaufe' || teil.verb === 'trinke' || teil.verb === 'hole') {
      throw new GameError(`🤔 「${satz}」不太對——第一個動詞（würde／möchte／muss）已經變位了！第二個動詞用「原形」放句尾（-n 結尾）：kaufen／trinken／holen——跟第 8 關的 besuchen 同一個道理。`);
    }
    // 原形與物品的搭配（kaufen→kaufe 查現實版的教學表）
    const akzeptiert = o.verben.map((v) => v + 'n');
    if (!akzeptiert.includes(teil.verb)) {
      const grund = o.verbFehler[teil.verb.slice(0, -1)];
      const richtig = o.verben[0] + 'n';
      throw new GameError(`🤔 「${satz}」不太對——${grund ? `${grund}（這裡用原形：${richtig}！）` : `${o.nomen} 搭配的原形是 ${richtig}！`}`);
    }
    if (teil.rel) {
      // 關係子句＝指「特定那一個」→ 定冠詞！
      this._checkRelsatz(teil.rel, o, satz);
      const def = { m: 'den', f: 'die', n: 'das' }[o.genus];
      if (teil.art !== def) {
        throw new GameError(`🤔 「${satz}」不太對——加了關係子句＝在指「特定的那一個」→ 用定冠詞：${def} ${o.nomen}！`);
      }
    } else if (teil.art !== o.artikel) {
      throw new GameError(`🤔 「${satz}」不太對——${owArtikelLektion(o, teil.art)}`);
    }
    if (teil.neben) this._checkNebensatz(teil.neben, satz);
  }

  // 框架內每一段原形片語的驗證（兩種框架共用；rahmen＝'traum' 或 'modal'）
  _checkTeile(t, satzFn, rahmen) {
    for (let i = 0; i < t.teile.length; i++) {
      const teil = t.teile[i];
      if (teil.typ === 'indikativ') {
        throw new GameError(rahmen === 'traum'
          ? '💭 夢裡不能用直陳式！「Ich gehe／fahre／kaufe」是真的去做——würde 後面要接「原形放句尾」的積木（… gehen／fahren／kaufen）。'
          : '📝 情態動詞後面要用原形！「Ich gehe／fahre／kaufe」已經變位了——möchte／muss 的第二個動詞用原形放句尾（… gehen／fahren／kaufen 積木）。');
      }
      if (teil.typ === 'fremd') {
        throw new GameError('🧩 這塊積木不屬於這個框架——裡面只能接原形動作積木（gehen／fahren／kaufen）。');
      }
      if (teil.adv === 'zuerst' && i > 0) {
        throw new GameError(`🤔 「${satzFn()}」——zuerst 只有第一件事能用！後面用 dann／danach／anschließend。`);
      }
      if (teil.typ === 'gehen') {
        this._checkOrtUndPraep(teil, satzFn());
        if (teil.neben) this._checkNebensatz(teil.neben, satzFn());
      } else if (teil.typ === 'fahren') {
        this._checkMit(teil.mit, satzFn());
        this._checkOrtUndPraep(teil, satzFn());
        if (teil.neben) this._checkNebensatz(teil.neben, satzFn());
      } else {
        this._checkTraumKauf(teil, satzFn());
      }
    }
    // 框架句也是句子——用了子句照樣完成 📎 任務
    if (t.teile.some((x) => x.neben || x.rel)) this._sagteNebensatz();
  }

  async traeume(t, highlight) {
    this._neuerSatz();
    // ① 框架文法：hätte（Wenn 子句動詞置尾）＋ würde（主句倒裝）
    if (t.haette !== WENN_LEKTIONEN.haette.richtig) {
      throw new GameError(`🤔 「${this._traumSatz(t)}」不太對——${WENN_LEKTIONEN.haette[t.haette] || WENN_LEKTIONEN.haette.NONE}`);
    }
    if (t.wuerde !== LAUFEN_LEKTIONEN.wuerde.richtig) {
      throw new GameError(`🤔 「${this._traumSatz(t)}」不太對——${LAUFEN_LEKTIONEN.wuerde[t.wuerde] || LAUFEN_LEKTIONEN.wuerde.NONE}`);
    }
    if (!t.teile || !t.teile.length) {
      throw new GameError('💭 空空的夢？在「würde ich …」裡接上想做的事——夢裡的動作用「原形」積木：… gehen／fahren／kaufen！');
    }
    // ② 夢中每一段的文法（夢是假設的，但句子真的說出口了——子句任務照樣算）
    this._checkTeile(t, () => this._traumSatz(t), 'traum');

    const g = this.game;
    const s = g.state;
    this._sag(`${this._traumSatz(t)}.`, '要是我有更多時間，就會……（進入白日夢）');
    // 記住醒著時站的位置——夢不會真的帶你去任何地方！
    const wach = { x: s.hero.x, y: s.hero.y, dir: s.hero.dir };
    s.traum = true;
    g.onHudChange();
    g._float(s.hero.x, s.hero.y, '💭');
    await g._wait(800);

    try {
      for (const teil of t.teile) {
        if (highlight) highlight(teil.id);
        if (teil.typ === 'gehen') await this._traumGehen(teil);
        else if (teil.typ === 'fahren') await this._traumFahren(teil);
        else await this._traumKaufen(teil);
      }
      await g._wait(400);
    } finally {
      // 醒來：Konjunktiv II ＝ 與現實相反，人還在原地、什麼都沒發生！
      s.traum = false;
      s.imTram = false;
      s.hero.x = wach.x;
      s.hero.y = wach.y;
      s.hero.dir = wach.dir;
      s.px = (wach.x + 0.5) * TILE;
      s.py = (wach.y + 0.5) * TILE;
    }

    s.owTagtraum = true;
    g._float(wach.x, wach.y, '⏰ Oh!');
    this._sag('Aber ich habe ja KEINE Zeit! Zurück an die Arbeit!', '……可是我根本「沒有」更多時間啊！醒醒，回去做事！');
    g.onHudChange();
    this._pruefeAufgaben();
    g.onHint('💭 Schön geträumt! 作夢任務 +3——但夢裡做的事「都不算數」（背包、金幣、任務都沒變）：Konjunktiv II＝與現實相反！');
    await g._wait(400);
  }

  async _traumGehen(teil) {
    const g = this.game;
    const s = g.state;
    const o = OW_ORTE[teil.ort];
    this._sag(`… ${this._traumPhrase(teil)}`, `（夢）${OW_ADV_ZH[teil.adv] || ''}走去${o.zh}${this._nebenZh(teil.neben)}`);
    const tiles = _findeTiles(g, o.tile);
    const ziele = o.betreten
      ? tiles
      : tiles
          .flatMap((tl) => DIRS.map((d) => ({ x: tl.x + d.dx, y: tl.y + d.dy })))
          .filter((p) => g._passable(g.tileAt(p.x, p.y)));
    await g.walkTo(ziele, o.nomen);   // traum 模式：水面、軌道都能走！
    this._schauZu(tiles, o.betreten);
    g._float(s.hero.x, s.hero.y, '💭');
    await g._wait(300);
  }

  async _traumFahren(teil) {
    const g = this.game;
    const s = g.state;
    const o = OW_ORTE[teil.ort];
    this._sag(`… ${this._traumPhrase(teil)}`, `（夢）${OW_ADV_ZH[teil.adv] || ''}搭電車去${o.zh}${this._nebenZh(teil.neben)}`);
    // 夢裡的電車不用車站、不用軌道——直接從腳下出發！
    s.imTram = true;
    g.onHudChange();
    g._float(s.hero.x, s.hero.y, '🚋💭 Ding ding!');
    const tiles = _findeTiles(g, o.tile);
    const ziele = o.betreten
      ? tiles
      : tiles
          .flatMap((tl) => DIRS.map((d) => ({ x: tl.x + d.dx, y: tl.y + d.dy })))
          .filter((p) => g._passable(g.tileAt(p.x, p.y)));
    await g.walkTo(ziele, o.nomen);
    s.imTram = false;
    g.onHudChange();
    this._schauZu(tiles, o.betreten);
    await g._wait(300);
  }

  async _traumKaufen(teil) {
    const g = this.game;
    const s = g.state;
    const o = OW_OBJEKTE[teil.obj];
    const ortCfg = OW_ORTE[o.ort];
    this._sag(`… ${this._traumPhrase(teil)}`, `（夢）${o.verbZh}${teil.rel ? `${OW_REL_ZH[teil.rel.inhalt] || ''}的` : ''}${o.zh}${this._nebenZh(teil.neben)}`);
    // 夢裡自動飄到店門口——不用錢、不用排隊，但醒來東西就沒了
    const tiles = _findeTiles(g, ortCfg.tile);
    const ziele = tiles
      .flatMap((tl) => DIRS.map((d) => ({ x: tl.x + d.dx, y: tl.y + d.dy })))
      .filter((p) => g._passable(g.tileAt(p.x, p.y)));
    await g.walkTo(ziele, ortCfg.nomen);
    this._schauZu(tiles, false);
    g._float(s.hero.x, s.hero.y, `${o.emoji}💭`);
    await g._wait(300);
  }

  /* ---------- 情態動詞框架（第 2、5 關：möchte／muss ＋ 原形）----------
     跟夢境框架用同一套原形積木——但這是「真的去做」：
     照現實規則走路、搭車、花錢，任務照算！                    */

  async plane(t, highlight) {
    this._neuerSatz();
    // ① 情態動詞變位（第 2、5 關的複習）
    if (!t.modal || t.modal === 'NONE') {
      throw new GameError('📝 想（möchte）還是必須（muss）？先選一個情態動詞——後面的動作全部用原形放句尾！');
    }
    if (t.modal === 'möchten') {
      throw new GameError(`🤔 「${this._modalSatz(t)}」不太對——möchten 是 wir／sie／Sie 的形。主詞是 ich → möchte！`);
    }
    if (t.modal === 'musst') {
      throw new GameError(`🤔 「${this._modalSatz(t)}」不太對——musst 是 du 的形。主詞是 ich → muss！（第 5 關的複習）`);
    }
    if (!t.teile || !t.teile.length) {
      throw new GameError('📝 計畫是空的！在「Ich möchte／muss …」裡接上原形動作積木（… gehen／fahren／kaufen）。');
    }
    // ② 每一段原形片語的文法（與夢境共用檢查）
    this._checkTeile(t, () => this._modalSatz(t), 'modal');

    const g = this.game;
    const s = g.state;
    const zhModal = t.modal === 'muss' ? '必須' : '想要';
    this._sag(`${this._modalSatz(t)}.`, `我${zhModal}……（說到就要做到！）`);
    s.owModalGesagt = true;
    await g._wait(800);

    // ③ 真的去做：走路、搭車、買東西都照現實規則
    for (const teil of t.teile) {
      if (highlight) highlight(teil.id);
      if (teil.typ === 'gehen') {
        const o = OW_ORTE[teil.ort];
        this._sag(`… ${this._traumPhrase(teil)}`, `${OW_ADV_ZH[teil.adv] || ''}去${o.zh}${this._nebenZh(teil.neben)}`);
        await this._geheWirklich(teil.ort);
      } else if (teil.typ === 'fahren') {
        const o = OW_ORTE[teil.ort];
        this._sag(`… ${this._traumPhrase(teil)}`, `${OW_ADV_ZH[teil.adv] || ''}搭電車去${o.zh}${this._nebenZh(teil.neben)}`);
        await this._fahreWirklich(teil.ort);
      } else {
        const o = OW_OBJEKTE[teil.obj];
        this._sag(`… ${this._traumPhrase(teil)}`, `${o.verbZh}${teil.rel ? `${OW_REL_ZH[teil.rel.inhalt] || ''}的` : ''}${o.zh}${this._nebenZh(teil.neben)}`);
        await this._kaufeWirklich(teil.obj);
      }
    }
    this._pruefeAufgaben();
    await this.game._wait(300);
  }

  /* ---------- 電車動畫 ---------- */

  _gleisPfad(von, nach) {
    const pfad = [];
    const step = Math.sign(nach.y - von.y);
    for (let y = von.y + step; y !== nach.y + step; y += step) {
      pfad.push({ x: von.x, y });
    }
    return pfad;
  }

  // 空車開過來（只動電車，不動勇者）
  async _tramFaehrt(pfad) {
    const g = this.game;
    const t = g.token;
    for (const p of pfad) {
      const from = { ...g.state.tramXY };
      await g._tween(160 / g.speed, (pr) => {
        g.state.tramXY.x = from.x + (p.x - from.x) * pr;
        g.state.tramXY.y = from.y + (p.y - from.y) * pr;
      });
      g._ensure(t);
      g.state.tramXY = { ...p };
    }
  }

  async _fahrSchritt(ziel, dauer) {
    const g = this.game;
    const t = g.token;
    g._countStep();
    const hero = g.state.hero;
    const dx = Math.sign(ziel.x - hero.x);
    const dy = Math.sign(ziel.y - hero.y);
    const idx = DIRS.findIndex((d) => d.dx === dx && d.dy === dy);
    if (idx >= 0) hero.dir = idx;
    await g._walkTween(ziel.x, ziel.y, dauer, false);
    g._ensure(t);
    hero.x = ziel.x;
    hero.y = ziel.y;
  }
}

/* ---------- 開放世界提示 ---------- */

function berechneHinweisOW(game) {
  const s = game.state;
  if (s.won) return null;
  const artikelVoll = { m: 'der', f: 'die', n: 'das' };
  const gzh = { m: '陽性', f: '陰性', n: '中性' };
  const sued = s.hero.y > 5;
  const neben = (ch) => _findeTiles(game, ch).some((p) => Math.abs(p.x - s.hero.x) + Math.abs(p.y - s.hero.y) <= 1);

  const gehHin = (key) => {
    const o = OW_ORTE[key];
    const note = key === 'hause'
      ? '回家的固定講法——第 6 關學過的！'
      : key === 'park'
        ? 'der Park——「走進去」用 in + Akkusativ'
        : `${artikelVoll[o.genus]} ${o.key === 'automat' ? 'Automat' : o.nomen} 是${gzh[o.genus]}——zu + Dativ 怎麼縮？`;
    return { de: `Ich gehe ${o.richtig} ${o.nomen}.`, maskiert: `Ich gehe ___ ${o.nomen}.`, zh: `去${o.zh}`, mask: true, note };
  };
  const kaufDa = (key) => {
    const o = OW_OBJEKTE[key];
    const v = o.verben[0];
    const note = key === 'zauberstein'
      ? '獨一無二的寶石——定冠詞陽性 Akkusativ！'
      : `${artikelVoll[o.genus]} ${o.nomen} 是${gzh[o.genus]}——Akkusativ 的不定冠詞是？`;
    return { de: `Ich ${v} ${o.artikel} ${o.nomen}.`, maskiert: `Ich ${v} ___ ${o.nomen}.`, zh: `${o.verbZh}${o.zh}`, mask: true, note };
  };
  const fahrNach = (key) => {
    const o = OW_ORTE[key];
    return {
      de: `Ich fahre mit der Straßenbahn ${o.richtig} ${o.nomen}.`,
      maskiert: `Ich fahre mit ___ Straßenbahn ${o.richtig} ${o.nomen}.`,
      zh: `搭電車去${o.zh}`,
      mask: true,
      note: 'die Straßenbahn 是陰性——mit + Dativ 是？（第 7 關的複習）',
    };
  };
  // 目的地在對岸→先到站牌／直接搭車；同岸→用走的
  const dorthin = (key) => {
    const o = OW_ORTE[key];
    const t0 = _findeTiles(game, o.tile)[0];
    const zielSued = t0.y > 5;
    if (key !== 'haltestelle' && zielSued !== sued) {
      return neben('S') ? fahrNach(key) : gehHin('haltestelle');
    }
    return gehHin(key);
  };

  if (s.purse >= 12) {
    if (sued) return neben('S') ? fahrNach('automat') : gehHin('haltestelle');
    return neben('V') ? kaufDa('zauberstein') : gehHin('automat');
  }
  const b = s.owBelohnt;
  if (!b.fruehstueck) {
    if (!s.owBrot) return neben('B') ? kaufDa('brot') : dorthin('baeckerei');
    return neben('C') ? kaufDa('kaffee') : dorthin('cafe');
  }
  if (!b.anna) {
    if (!s.owBlume) return neben('M') ? kaufDa('blume') : dorthin('markt');
    return dorthin('brunnen');
  }
  if (!b.oma) {
    if (!s.owMedikament) return neben('E') ? kaufDa('medikament') : dorthin('apotheke');
    return dorthin('hause');
  }
  if (!b.paket) {
    if (!s.owPaket) return neben('O') ? kaufDa('paket') : dorthin('post');
    return dorthin('rathaus');
  }
  if (!b.uni) return dorthin('uni');
  if (!b.museum) {
    if (!s.owBuch) return neben('L') ? kaufDa('buch') : dorthin('bibliothek');
    return dorthin('museum');
  }
  if (!b.nebensatz) {
    return {
      de: 'Ich gehe in den Park, obwohl ich müde bin.（📎 子句積木插進句尾的洞）',
      maskiert: 'Ich gehe in den Park, ___ ich müde ___.',
      zh: '用 weil／obwohl 子句說一句話',
      mask: true,
      note: '「雖然」的連接詞是？它會把動詞（bin）踢到子句「最後」——第 6 關的複習！',
    };
  }
  if (!b.modal) {
    return {
      de: 'Ich möchte in den Park gehen.（📝 情態動詞框架＋原形積木）',
      maskiert: 'Ich ___ in den Park gehen.',
      zh: '用情態動詞說計畫（想要？必須？）',
      mask: true,
      note: 'ich 的情態動詞形——möchte／muss（原形 gehen 放句尾！第 2、5 關的複習）',
    };
  }
  if (!b.traum) {
    return {
      de: 'Wenn ich mehr Zeit hätte, würde ich zum Museum gehen.（💭 夢境框架＋原形動作積木）',
      maskiert: 'Wenn ich mehr Zeit ___, ___ ich zum Museum gehen.',
      zh: '停下來作一場白日夢（紫色框架裡接原形動作）',
      mask: true,
      note: 'Konjunktiv II：hätte（變音！）＋ würde……夢裡的動詞用原形放句尾（gehen）——第 8 關的複習',
    };
  }
  return null;
}
