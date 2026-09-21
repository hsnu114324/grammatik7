'use strict';

/* ================= Blockly 初始化 ================= */

const jsGen = (typeof javascript !== 'undefined')
  ? javascript.javascriptGenerator
  : Blockly.JavaScript;

const workspace = Blockly.inject('blockly-div', {
  toolbox: TOOLBOX,
  renderer: 'zelos',
  media: 'https://cdn.jsdelivr.net/npm/blockly@10.4.3/media/',
  grid: { spacing: 24, length: 2, colour: '#e9e3d4', snap: true },
  zoom: { controls: true, wheel: false, startScale: 0.8, maxScale: 1.3, minScale: 0.55 },
  move: { scrollbars: true, drag: true, wheel: true },
  trashcan: true,
});

// 執行時逐塊高亮
jsGen.STATEMENT_PREFIX = 'highlightBlock(%1);\n';
jsGen.addReservedWords('highlightBlock,cmd,cmd2,cmd3,cmd4,cmd5,cmd6,cmd7,cmd8,cmd9');

window.addEventListener('resize', () => Blockly.svgResize(workspace));

/* ================= 遊戲與指令層 ================= */

const game = new Game(document.getElementById('game-canvas'));
const cmd = new Kommandos(game);
const cmd2 = new PlanKommandos(game);
const cmd3 = new PraesensKommandos(game);
const cmd4 = new NebensatzKommandos(game);
const cmd5 = new ModalKommandos(game);
const cmd6 = new KonzessivKommandos(game);
const cmd7 = new RelativKommandos(game);
const cmd8 = new KonjunktivKommandos(game);
const cmd9 = new OffeneWeltKommandos(game);

const el = {
  run: document.getElementById('btn-run'),
  reset: document.getElementById('btn-reset'),
  again: document.getElementById('btn-again'),
  hint: document.getElementById('btn-hint'),
  solution: document.getElementById('btn-solution'),
  tts: document.getElementById('btn-tts'),
  speed: document.getElementById('speed'),
  speedLabel: document.getElementById('speed-label'),
  subtitle: document.getElementById('subtitle'),
  levelNav: document.getElementById('level-nav'),
  statusBar: document.getElementById('status-bar'),
  message: document.getElementById('message'),
  missionList: document.getElementById('mission-list'),
  missionHint: document.getElementById('mission-hint'),
  vocabList: document.getElementById('vocab-list'),
  vocabNote: document.getElementById('vocab-note'),
  sentenceDe: document.getElementById('sentence-de'),
  sentenceZh: document.getElementById('sentence-zh'),
  winOverlay: document.getElementById('win-overlay'),
  winStats: document.getElementById('win-stats'),
};

function setMessage(type, text) {
  el.message.className = `message ${type}`;
  el.message.textContent = text;
}

function setSentence(de, zh) {
  el.sentenceDe.textContent = de;
  el.sentenceZh.textContent = zh ? `（${zh}）` : '';
}

cmd.onSentence = setSentence;
cmd2.onSentence = setSentence;
cmd3.onSentence = setSentence;
cmd4.onSentence = setSentence;
cmd5.onSentence = setSentence;
cmd6.onSentence = setSentence;
cmd7.onSentence = setSentence;
cmd8.onSentence = setSentence;
cmd9.onSentence = setSentence;

/* ================= 關卡設定 ================= */

// 第 1 關的解答：用提示引擎自動解關（見 commands.js 的 loeseLevel）
function blockFuerAktion(a) {
  switch (a.typ) {
    case 'geh':
      return { type: 'de_geh', inputs: { RICHTUNG: { block: { type: `de_nach_${a.richtung}` } } } };
    case 'dreh':
      return a.richtung === 'um'
        ? { type: 'de_dreh_um' }
        : { type: 'de_dreh', inputs: { RICHTUNG: { block: { type: `de_nach_${a.richtung}` } } } };
    case 'nimm':
      return { type: 'de_nimm', inputs: { NOMEN: { block: { type: 'de_muenze', fields: { ARTIKEL: 'die' } } } } };
    case 'kaufe':
      return { type: 'de_kaufe', inputs: { NOMEN: { block: { type: 'de_schluessel', fields: { ARTIKEL: 'den' } } } } };
    case 'oeffne':
      return { type: 'de_oeffne', inputs: { NOMEN: { block: { type: 'de_tuer', fields: { ARTIKEL: 'die' } } } } };
  }
}

// 連續 3 次以上同方向的 geh 壓縮成 wiederhole 迴圈
function aktionenZuWorkspaceJson(aktionen) {
  const items = [];
  let i = 0;
  while (i < aktionen.length) {
    const a = aktionen[i];
    if (a.typ === 'geh') {
      let j = i;
      while (j < aktionen.length && aktionen[j].typ === 'geh' && aktionen[j].richtung === a.richtung) j++;
      const n = j - i;
      if (n >= 3) {
        items.push({
          type: 'controls_repeat_ext',
          inputs: {
            TIMES: { shadow: { type: 'math_number', fields: { NUM: n } } },
            DO: { block: blockFuerAktion(a) },
          },
        });
        i = j;
        continue;
      }
    }
    items.push(blockFuerAktion(a));
    i++;
  }
  for (let k = items.length - 2; k >= 0; k--) items[k].next = { block: items[k + 1] };
  const root = items[0];
  root.x = 24;
  root.y = 24;
  return { blocks: { languageVersion: 0, blocks: [root] } };
}

const LEVEL_META = [
  {
    toolbox: TOOLBOX,
    saveKey: 'blockly-rpg-de-level1',
    woerter: WOERTER,
    missionHint: '提示：要站在金幣上才能撿、面對販賣機才能買、面對門才能開。',
    vocabNote: '📐 小文法：動詞的受詞要用受格（Akkusativ）——陽性 der 會變成 den，其他不變！',
    starter: {
      blocks: {
        languageVersion: 0,
        blocks: [{ type: 'de_geh', x: 24, y: 24, inputs: { RICHTUNG: { shadow: { type: 'de_nach_vorne' } } } }],
      },
    },
    goals() {
      const s = game.state;
      const total = game.level.coins.length;
      return [
        { label: `撿到 ${total} 枚金幣（die Münze）`, done: s.coinsTaken === total, progress: `${s.coinsTaken}/${total}` },
        { label: '向販賣機（der Automat）買鑰匙（der Schlüssel）', done: s.hasKey },
        { label: '打開上鎖的大門（die Tür）', done: s.doorOpen },
        { label: '拿到寶石（der Diamant）', done: s.won },
      ];
    },
    hudItems() {
      const s = game.state;
      return [
        `🪙 金幣：<b>${s.purse}</b>`,
        `🗝️ 鑰匙：<b>${s.hasKey ? '有 🗝️' : '無'}</b>`,
        `👣 動作：<b>${s.steps}</b>`,
      ];
    },
    hinweis: () => berechneHinweis(game),
    loesungJson() {
      const aktionen = loeseLevel(game);
      return aktionen ? aktionenZuWorkspaceJson(aktionen) : null;
    },
  },
  {
    toolbox: TOOLBOX2,
    saveKey: 'blockly-rpg-de-level2',
    woerter: WOERTER2,
    missionHint: '提示：計畫句＝Ich möchte ＋ zuerst…, dann…, danach…（動詞原形放在每一段的最後！）',
    vocabNote: '📐 小文法：說「在哪裡」（Wo?）要用 Dativ——zu der→zur、in dem→im、auf dem Markt。',
    starter: {
      blocks: {
        languageVersion: 0,
        blocks: [
          { type: 'de2_moechte', x: 24, y: 24 },
          { type: 'de2_baeckerei', x: 72, y: 150 },
        ],
      },
    },
    goals() {
      const s = game.state;
      return [
        { label: '去麵包店拿麵包（die Bäckerei → das Brot）', done: s.brot },
        { label: '在市場買水果（der Markt → das Obst）', done: s.obst },
        { label: '在公園吃早餐（der Park → das Frühstück）', done: s.won },
      ];
    },
    hudItems() {
      const s = game.state;
      return [
        `🥖 麵包：<b>${s.brot ? '有' : '無'}</b>`,
        `🍎 水果：<b>${s.obst ? '有' : '無'}</b>`,
        `👣 動作：<b>${s.steps}</b>`,
      ];
    },
    hinweis: () => berechneHinweis2(game),
    loesungJson() {
      return {
        blocks: {
          languageVersion: 0,
          blocks: [{
            type: 'de2_moechte',
            x: 24,
            y: 24,
            inputs: {
              PLAN: {
                block: {
                  type: 'de2_baeckerei',
                  fields: { ORDINAL: 'zuerst', PRAEP: 'zur' },
                  next: {
                    block: {
                      type: 'de2_markt',
                      fields: { ORDINAL: 'dann', PRAEP: 'dem' },
                      next: {
                        block: { type: 'de2_park', fields: { ORDINAL: 'danach', PRAEP: 'im' } },
                      },
                    },
                  },
                },
              },
            },
          }],
        },
      };
    },
  },
  {
    toolbox: TOOLBOX3,
    saveKey: 'blockly-rpg-de-level3',
    woerter: WOERTER3,
    missionHint: '提示：句型＝Ich ＋ 動詞（ich 形）＋ zuerst/dann/danach ＋ 地點。河對岸走路到不了，要搭公車！',
    vocabNote: '📐 小文法：動詞跟著 ich 變位（gehe／fahre／lerne）；mit 永遠接 Dativ——mit dem Bus！',
    starter: {
      blocks: {
        languageVersion: 0,
        blocks: [
          { type: 'de3_ich', x: 24, y: 24 },
          { type: 'de3_bushaltestelle', x: 72, y: 150 },
        ],
      },
    },
    goals() {
      const s = game.state;
      return [
        { label: '走到公車站（die Bushaltestelle）', done: s.anDerHaltestelle },
        { label: '搭公車去圖書館借書（mit dem Bus → das Buch）', done: s.buch },
        { label: '在咖啡店唸書（im Café lernen）', done: s.won },
      ];
    },
    hudItems() {
      const s = game.state;
      return [
        `📖 書：<b>${s.buch ? '有' : '無'}</b>`,
        `👣 動作：<b>${s.steps}</b>`,
      ];
    },
    hinweis: () => berechneHinweis3(game),
    loesungJson() {
      return {
        blocks: {
          languageVersion: 0,
          blocks: [{
            type: 'de3_ich',
            x: 24,
            y: 24,
            inputs: {
              SATZ: {
                block: {
                  type: 'de3_bushaltestelle',
                  fields: { VERB: 'gehe', ORDINAL: 'zuerst', PRAEP: 'zur' },
                  next: {
                    block: {
                      type: 'de3_bus',
                      fields: { VERB: 'fahre', ORDINAL: 'dann', PRAEP: 'dem' },
                      next: {
                        block: { type: 'de3_cafe', fields: { VERB: 'lerne', ORDINAL: 'danach', PRAEP: 'im' } },
                      },
                    },
                  },
                },
              },
            },
          }],
        },
      };
    },
  },
  {
    toolbox: TOOLBOX4,
    saveKey: 'blockly-rpg-de-level4',
    woerter: WOERTER4,
    missionHint: '提示：句子結構＝① Nachdem-子句 → ② 主句（倒裝：gehe ich）→ ③ um…zu 目的。你一開始就坐在公車上！',
    vocabNote: '📐 小文法：Nachdem 子句動詞放最後（… ausgestiegen bin）；移動動詞的 Perfekt 用 sein；über＋穿越（Wohin?）用 Akkusativ。',
    starter: {
      blocks: {
        languageVersion: 0,
        blocks: [
          { type: 'de4_nachdem', x: 24, y: 24 },
          { type: 'de4_hauptsatz', x: 48, y: 130 },
        ],
      },
    },
    goals() {
      const s = game.state;
      return [
        { label: '在市政廳下車（am Rathaus aussteigen）', done: s.ausgestiegen },
        { label: '穿過廣場走到咖啡店（über den Platz zum Café）', done: s.amCafe },
        { label: '見到 Anna（um Anna zu treffen）', done: s.won },
      ];
    },
    hudItems() {
      const s = game.state;
      return [
        `🚌 下車：<b>${s.ausgestiegen ? '✓' : '還在車上'}</b>`,
        `☕ 咖啡店：<b>${s.amCafe ? '到了' : '還沒'}</b>`,
        `👣 動作：<b>${s.steps}</b>`,
      ];
    },
    hinweis: () => berechneHinweis4(game),
    loesungJson() {
      return {
        blocks: {
          languageVersion: 0,
          blocks: [{
            type: 'de4_nachdem',
            x: 24,
            y: 24,
            fields: { PRAEP: 'am', PARTIZIP: 'ausgestiegen', AUX: 'bin' },
            next: {
              block: {
                type: 'de4_hauptsatz',
                fields: { WO: 'gehe ich', ART: 'den', PRAEP2: 'zum' },
                next: {
                  block: { type: 'de4_zweck', fields: { TREFFEN: 'zu treffen' } },
                },
              },
            },
          }],
        },
      };
    },
  },
  {
    toolbox: TOOLBOX5,
    saveKey: 'blockly-rpg-de-level5',
    woerter: WOERTER5,
    missionHint: '提示：Ich muss ＋ 兩件事（動詞原形放句尾，不加 zu！）＋ damit 目的句。看好時刻表：Ab 7:30 ＝ halb acht！',
    vocabNote: '📐 小文法：情態動詞 muss ＋ 原形放句尾；halb acht ＝ 7:30（不是 8:30！）；damit 子句動詞變位放最後。',
    starter: {
      blocks: {
        languageVersion: 0,
        blocks: [
          { type: 'de5_muss', x: 24, y: 24 },
          { type: 'de5_linie', x: 72, y: 150 },
        ],
      },
    },
    goals() {
      const s = game.state;
      return [
        { label: '轉乘到藍線月台（in die blaue Linie umsteigen）', done: s.umgestiegen },
        { label: '在 halb acht（7:30）前上車（den Zug erwischen）', done: s.imZug || s.won },
        { label: '準時到公司（pünktlich zur Arbeit）', done: s.won },
      ];
    },
    hudItems() {
      const s = game.state;
      return [
        `⏰ 時間：<b>${game.uhrText()} Uhr</b>`,
        `🚆 火車：<b>${s.won ? '到站' : (s.imZug ? '搭乘中' : '還沒上車')}</b>`,
        `👣 動作：<b>${s.steps}</b>`,
      ];
    },
    hinweis: () => berechneHinweis5(game),
    loesungJson() {
      return {
        blocks: {
          languageVersion: 0,
          blocks: [{
            type: 'de5_muss',
            x: 24,
            y: 24,
            fields: { MODAL: 'muss' },
            inputs: {
              SATZ: {
                block: {
                  type: 'de5_linie',
                  fields: { KASUS: 'in die', ADJ: 'blaue', VERB: 'umsteigen' },
                  next: {
                    block: {
                      type: 'de5_zug',
                      fields: { ART: 'den', ZEIT: 'vor halb acht', VERB: 'erwischen' },
                      next: {
                        block: { type: 'de5_damit', fields: { KONJ: 'damit', PRAEP: 'zur', VERB: 'komme' } },
                      },
                    },
                  },
                },
              },
            },
          }],
        },
      };
    },
  },
  {
    toolbox: TOOLBOX6,
    saveKey: 'blockly-rpg-de-level6',
    woerter: WOERTER6,
    missionHint: '提示：Obwohl-子句開頭（動詞放最後）→ 主句倒裝，行程 zuerst → danach → schließlich。放心，勇者自帶雨傘 ☂️。',
    vocabNote: '📐 小文法：obwohl 子句動詞放最後（… regnet）；回家＝nach Hause（方向 Wohin?），在家＝zu Hause（位置 Wo?）。',
    starter: {
      blocks: {
        languageVersion: 0,
        blocks: [
          { type: 'de6_obwohl', x: 24, y: 24 },
          { type: 'de6_apotheke', x: 48, y: 130 },
        ],
      },
    },
    goals() {
      const s = game.state;
      return [
        { label: '冒雨去藥局拿藥（zur Apotheke）', done: s.medikament },
        { label: '到郵局寄包裹（zur Post）', done: s.paket },
        { label: '搭公車回家（mit dem Bus nach Hause）', done: s.won },
      ];
    },
    hudItems() {
      const s = game.state;
      return [
        `🌧️ 天氣：<b>大雨</b>`,
        `💊 藥：<b>${s.medikament ? '有' : '無'}</b>`,
        `📦 包裹：<b>${s.paket ? '已寄出' : '還沒寄'}</b>`,
        `👣 動作：<b>${s.steps}</b>`,
      ];
    },
    hinweis: () => berechneHinweis6(game),
    loesungJson() {
      return {
        blocks: {
          languageVersion: 0,
          blocks: [{
            type: 'de6_obwohl',
            x: 24,
            y: 24,
            fields: { KONJ: 'Obwohl', VERB: 'regnet' },
            next: {
              block: {
                type: 'de6_apotheke',
                fields: { WO: 'gehe ich', PRAEP: 'zur' },
                next: {
                  block: {
                    type: 'de6_post',
                    fields: { PRAEP: 'zur' },
                    next: {
                      block: { type: 'de6_bus', fields: { ORDINAL: 'schließlich', ART: 'dem', HAUSE: 'nach Hause' } },
                    },
                  },
                },
              },
            },
          }],
        },
      };
    },
  },
  {
    toolbox: TOOLBOX7,
    saveKey: 'blockly-rpg-de-level7',
    woerter: WOERTER7,
    missionHint: '提示：關係子句積木要塞進 Fahrrad 後面的圓洞！行程＝先送修（zuerst）→ 再搭電車（danach）。電車軌道走不過去喔。',
    vocabNote: '📐 小文法：關係代名詞跟先行詞同性別（das Fahrrad → das）；子句動詞組放最後（… gekauft habe）；mit der Straßenbahn——陰性 Dativ 是 der！',
    starter: {
      blocks: {
        languageVersion: 0,
        blocks: [
          { type: 'de7_ich', x: 24, y: 24 },
          { type: 'de7_bringen', x: 48, y: 130 },
          { type: 'de7_relsatz', x: 72, y: 230 },
        ],
      },
    },
    goals() {
      const s = game.state;
      return [
        { label: '牽起昨天買的腳踏車（das Fahrrad, das ich gestern gekauft habe）', done: s.fahrradDabei || s.fahrradAbgegeben },
        { label: '把腳踏車送到修車行（zur Werkstatt bringen）', done: s.fahrradAbgegeben },
        { label: '搭路面電車去大學（mit der Straßenbahn zur Universität）', done: s.won },
      ];
    },
    hudItems() {
      const s = game.state;
      const rad = s.fahrradAbgegeben ? '已送修 🔧' : (s.fahrradDabei ? '推著走' : '停在路邊');
      return [
        `🚲 腳踏車：<b>${rad}</b>`,
        `🚋 電車：<b>${s.won ? '到站' : (s.imTram ? '搭乘中' : '還沒搭')}</b>`,
        `👣 動作：<b>${s.steps}</b>`,
      ];
    },
    hinweis: () => berechneHinweis7(game),
    loesungJson() {
      return {
        blocks: {
          languageVersion: 0,
          blocks: [{
            type: 'de7_ich',
            x: 24,
            y: 24,
            inputs: {
              SATZ: {
                block: {
                  type: 'de7_bringen',
                  fields: { PRAEP: 'zur' },
                  inputs: {
                    RELSATZ: {
                      block: { type: 'de7_relsatz', fields: { REL: 'das', PERF: 'gekauft habe' } },
                    },
                  },
                  next: {
                    block: { type: 'de7_tram', fields: { ART: 'der', PRAEP2: 'zur' } },
                  },
                },
              },
            },
          }],
        },
      };
    },
  },
  {
    toolbox: TOOLBOX8,
    saveKey: 'blockly-rpg-de-level8',
    woerter: WOERTER8,
    missionHint: '提示：這是一場白日夢！Wenn-子句（hätte 放最後）→ würde ich …（原形 laufen 放句尾）→ und anschließend …。',
    vocabNote: '📐 小文法：Konjunktiv II 表「與現實相反的假設」——hätte（注意變音 ä！）、würde ＋ 原形放句尾；am Fluss entlang（an + Dativ）。',
    starter: {
      blocks: {
        languageVersion: 0,
        blocks: [
          { type: 'de8_wenn', x: 24, y: 24 },
          { type: 'de8_laufen', x: 48, y: 130 },
        ],
      },
    },
    goals() {
      const s = game.state;
      return [
        { label: '進入白日夢（Wenn ich mehr Zeit hätte …）', done: s.traum },
        { label: '沿著河走到博物館（am Fluss entlang zum Museum）', done: s.amMuseum },
        { label: '參觀新的特展（die neue Ausstellung besuchen）', done: s.won },
      ];
    },
    hudItems() {
      const s = game.state;
      return [
        `💭 夢境：<b>${s.traum ? '作夢中 ✨' : '（現實）'}</b>`,
        `🏛️ 博物館：<b>${s.amMuseum ? '到了' : '還沒'}</b>`,
        `👣 動作：<b>${s.steps}</b>`,
      ];
    },
    hinweis: () => berechneHinweis8(game),
    loesungJson() {
      return {
        blocks: {
          languageVersion: 0,
          blocks: [{
            type: 'de8_wenn',
            x: 24,
            y: 24,
            fields: { HAETTE: 'hätte' },
            next: {
              block: {
                type: 'de8_laufen',
                fields: { WUERDE: 'würde', FLUSS: 'am Fluss', ZUM: 'zum' },
                next: {
                  block: { type: 'de8_besuchen', fields: { ANSCHL: 'anschließend', NEUE: 'die neue', VERB: 'besuchen' } },
                },
              },
            },
          }],
        },
      };
    },
  },
  {
    toolbox: TOOLBOX_OW,
    saveKey: 'blockly-rpg-de-openworld',
    woerter: WOERTER_OW,
    missionHint: '提示：任務自由排、每個 +3（寶石 12 枚）。河對岸只能搭電車。兩種框架：📝 möchte／muss＝真的做、💭 würde＝作夢（不算數）——裡面都接原形積木。📎 句尾可插 weil／obwohl／um…zu／damit／nachdem 子句、名詞後可插關係子句。每次執行＝新的一天。',
    vocabNote: '📐 小文法：先查性別再選介係詞——zur（陰性）／zum（陽性、中性）／in den Park／nach Hause；mit der Straßenbahn（陰性 Dativ）；Akkusativ 冠詞：einen（m）／eine（f）／ein（n）／den（獨一無二的那顆！）。',
    starter: {
      blocks: {
        languageVersion: 0,
        blocks: [
          { type: 'ow_gehe', x: 24, y: 24 },
          { type: 'ow_kaufe', x: 48, y: 120 },
        ],
      },
    },
    goals() {
      const s = game.state;
      const list = OW_AUFGABEN.map((a) => ({
        label: `${a.emoji} ${a.de}（${a.zh}｜+${a.belohnung} 🪙）`,
        done: !!s.owBelohnt[a.id],
      }));
      list.push({ label: '💎 Kauf den Zauberstein am Automaten!（12 Münzen 買下魔法寶石！）', done: s.won });
      return list;
    },
    hudItems() {
      const s = game.state;
      const inv = [
        s.owBrot && '🥖', s.owBrezel && '🥨', s.owBlume && '🌸',
        s.owMedikament && '💊', s.owPaket && '📦', s.owBuch && '📖', s.won && '💎',
      ].filter(Boolean).join(' ');
      return [
        `💰 Münzen：<b>${s.purse}/12</b>`,
        `🎒 背包：<b>${inv || '—'}</b>`,
        `🚋 電車：<b>${s.imTram ? '搭乘中' : (s.tramXY ? (s.tramXY.y <= 5 ? '北岸' : '南岸') : '—')}</b>`,
        `👣 動作：<b>${s.steps}</b>`,
      ];
    },
    hinweis: () => berechneHinweisOW(game),
    loesungJson() {
      const seq = [
        ['ow_gehe',  { ADV: 'zuerst', PRAEP: 'zur', ORT: 'baeckerei' }, {
          NEBEN: { block: { type: 'ow_nebensatz', fields: { KONJ: 'weil', FAKT: 'ich Hunger', VERB: 'habe' } } },
        }],
        ['ow_kaufe', { VERB: 'kaufe', ART: 'das', OBJ: 'brot' }, {
          RELSATZ: { block: { type: 'ow_relsatz', fields: { REL: 'das', INHALT: 'ich brauche' } } },
        }],
        ['ow_gehe',  { ADV: 'dann', PRAEP: 'zum', ORT: 'cafe' }, {
          NEBEN: { block: { type: 'ow_nachdem', fields: { INHALT: 'das Brot gekauft', AUX: 'habe' } } },
        }],
        ['ow_kaufe', { VERB: 'trinke', ART: 'einen', OBJ: 'kaffee' }],
        ['ow_modal', { MODAL: 'möchte' }, {
          TATEN: {
            block: {
              type: 'ow_traum_gehen',
              fields: { ADV: 'danach', PRAEP: 'zum', ORT: 'markt' },
              next: {
                block: { type: 'ow_traum_kaufen', fields: { ART: 'eine', OBJ: 'blume', VERB: 'kaufen' } },
              },
            },
          },
        }],
        ['ow_gehe',  { ADV: 'dann', PRAEP: 'zum', ORT: 'brunnen' }, {
          NEBEN: { block: { type: 'ow_zweck', fields: { KONJ: 'um', ZIEL: 'Anna zu treffen' } } },
        }],
        ['ow_traum', { HAETTE: 'hätte', WUERDE: 'würde' }, {
          TRAUM: {
            block: {
              type: 'ow_traum_gehen',
              fields: { ADV: 'NONE', PRAEP: 'zum', ORT: 'museum' },
              next: {
                block: { type: 'ow_traum_kaufen', fields: { ART: 'den', OBJ: 'zauberstein', VERB: 'kaufen' } },
              },
            },
          },
        }],
        ['ow_gehe',  { ADV: 'danach', PRAEP: 'zur', ORT: 'haltestelle' }],
        ['ow_fahre', { ADV: 'dann', MIT: 'mit der', PRAEP: 'zur', ORT: 'bibliothek' }],
        ['ow_kaufe', { VERB: 'hole', ART: 'ein', OBJ: 'buch' }],
        ['ow_gehe',  { ADV: 'dann', PRAEP: 'zum', ORT: 'museum' }],
        ['ow_gehe',  { ADV: 'anschließend', PRAEP: 'zur', ORT: 'uni' }],
        ['ow_gehe',  { ADV: 'dann', PRAEP: 'zur', ORT: 'haltestelle' }],
        ['ow_fahre', { ADV: 'schließlich', MIT: 'mit der', PRAEP: 'zum', ORT: 'automat' }],
        ['ow_kaufe', { VERB: 'kaufe', ART: 'den', OBJ: 'zauberstein' }],
      ];
      let block = null;
      for (let i = seq.length - 1; i >= 0; i--) {
        const b = { type: seq[i][0], fields: seq[i][1] };
        if (seq[i][2]) b.inputs = seq[i][2];
        if (block) b.next = { block };
        block = b;
      }
      block.x = 24;
      block.y = 24;
      return { blocks: { languageVersion: 0, blocks: [block] } };
    },
  },
];

let currentLevel = 0;
const meta = () => LEVEL_META[currentLevel];

/* ================= HUD、任務、單字表 ================= */

function renderHud() {
  const m = meta();
  el.statusBar.innerHTML = m.hudItems().map((h) => `<span>${h}</span>`).join('');
  el.missionList.innerHTML = '';
  for (const g of m.goals()) {
    const li = document.createElement('li');
    li.className = g.done ? 'done' : '';
    li.innerHTML = `<span class="check">${g.done ? '✅' : '⬜'}</span><span class="goal-text"></span>` +
      (g.progress && !g.done ? `<span class="progress">${g.progress}</span>` : '');
    li.querySelector('.goal-text').textContent = g.label;
    el.missionList.appendChild(li);
  }
}

function renderVocab() {
  el.vocabList.innerHTML = '';
  for (const w of meta().woerter) {
    const li = document.createElement('li');
    li.title = '點一下聽發音';
    const voll = w.artikel ? `${w.artikel} ${w.wort}` : w.wort;
    li.innerHTML = `<span>${w.emoji}</span><span class="wort${w.genus ? ` genus-${w.genus}` : ''}"></span><span class="zh"></span>`;
    li.querySelector('.wort').textContent = voll;
    li.querySelector('.zh').textContent = w.zh;
    li.addEventListener('click', () => {
      sprich(voll);
      setSentence(voll, w.zh);
    });
    el.vocabList.appendChild(li);
  }
}

game.onHudChange = renderHud;
game.onHint = (text) => setMessage('hint', text);

/* ================= 存檔 ================= */

function saveWorkspace() {
  try {
    localStorage.setItem(meta().saveKey, JSON.stringify(Blockly.serialization.workspaces.save(workspace)));
  } catch (_) { /* 隱私模式下可能失敗，略過 */ }
}

function loadWorkspace() {
  try {
    const saved = localStorage.getItem(meta().saveKey);
    Blockly.serialization.workspaces.load(saved ? JSON.parse(saved) : meta().starter, workspace);
  } catch (e) {
    console.warn('載入存檔失敗，使用預設積木', e);
    try { Blockly.serialization.workspaces.load(meta().starter, workspace); } catch (_) {}
  }
}

workspace.addChangeListener((e) => {
  if (e.isUiEvent) return;
  saveWorkspace();
});

/* ================= 關卡切換 ================= */

function switchLevel(index) {
  currentLevel = index;
  game.loadLevel(index);
  workspace.updateToolbox(meta().toolbox);
  workspace.clear();
  loadWorkspace();
  workspace.highlightBlock(null);

  el.subtitle.textContent = game.level.offeneWelt
    ? `🌍 開放世界：${game.level.titel} — ${game.level.tagline}`
    : `第 ${index + 1} 關：${game.level.titel} — ${game.level.tagline}`;
  el.missionHint.textContent = meta().missionHint;
  el.vocabNote.textContent = meta().vocabNote;
  for (const btn of el.levelNav.querySelectorAll('.level-btn')) {
    btn.classList.toggle('active', Number(btn.dataset.level) === index);
  }
  hintCount = 0;
  lastHintDe = null;
  solutionUsed = false;
  renderHud();
  renderVocab();
  setSentence('Bereit?', '準備好了嗎');
  const startMsgs = [
    '用左邊的德文積木組成句子，命令勇者行動！',
    '把活動接進「Ich möchte」，組成一句計畫，勇者就會照著過一天！',
    '把句子接進「Ich」——動詞要跟著 ich 變位！搭公車才能過河喔。',
    '你已經在公車上了！用「Nachdem …」子句開始這個句子，在市政廳下車去見 Anna。',
    '早上 7:20，紅線到站——快組出「Ich muss …」的計畫：轉乘藍線、趕上 7:30 的火車去上班！',
    '外面下著大雨☔——但今天有三件事非做不可！用「Obwohl …」開頭，冒雨完成行程吧。',
    '昨天買的腳踏車壞了😱！用關係子句說清楚是「哪一台」，送修後再搭電車去大學。',
    '今天事情好多……要是有更多時間就好了！用 Konjunktiv II 作一場白日夢吧 💭',
    '歡迎來到 Deutschstadt！🌍 這裡沒有固定句子——自由組句完成任務賺 Münzen，存滿 12 枚買下傳說中的 Zauberstein！（河對岸要搭電車 🚋）',
  ];
  setMessage('info', startMsgs[index]);
}

el.levelNav.addEventListener('click', (e) => {
  const btn = e.target.closest('.level-btn');
  if (btn) switchLevel(Number(btn.dataset.level));
});

/* ================= 執行器 ================= */

let running = false;

async function runProgram() {
  if (running) return;
  if (workspace.getAllBlocks(false).filter((b) => !b.isShadow()).length === 0) {
    setMessage('hint', '工作區是空的，先從左邊拖一些積木過來吧！');
    return;
  }

  running = true;
  el.run.disabled = true;
  game.reset();
  setMessage('info', '🏃 Los geht’s!（執行中……）');
  setSentence('…', '');

  let code;
  try {
    code = jsGen.workspaceToCode(workspace);
  } catch (e) {
    setMessage('error', '積木轉成程式時出錯了：' + e.message);
    running = false;
    el.run.disabled = false;
    return;
  }

  const fn = new Function('cmd', 'cmd2', 'cmd3', 'cmd4', 'cmd5', 'cmd6', 'cmd7', 'cmd8', 'cmd9', 'highlightBlock',
    `'use strict';\nreturn (async () => {\n${code}\n})();`);

  try {
    await fn(cmd, cmd2, cmd3, cmd4, cmd5, cmd6, cmd7, cmd8, cmd9, (id) => workspace.highlightBlock(id));
    if (!game.state.won) {
      const doneMsgs = [
        '🤔 Das Programm ist fertig, aber der Diamant fehlt noch.（程式跑完了，但還沒拿到寶石——看看任務目標再調整！）',
        '🤔 Der Plan ist fertig, aber kein Frühstück?（計畫跑完了，但還沒吃到早餐——檢查一下順序和地點！）',
        '🤔 Der Tag ist um, aber du hast nicht gelernt?（一天結束了卻沒唸到書——檢查一下句子的順序！）',
        '🤔 Der Satz ist zu Ende, aber wo ist Anna?（句子說完了卻沒見到 Anna——檢查結構：Nachdem → 主句 → um…zu！）',
        '🤔 Der Satz ist zu Ende, aber du bist noch nicht bei der Arbeit?（句子說完了卻還沒到公司——檢查結構：轉乘 → 趕車 → damit！）',
        '🤔 Der Satz ist zu Ende, aber du bist noch nicht zu Hause?（句子說完了卻還沒回到家——檢查結構：Obwohl → 藥局 → 郵局 → 回家！）',
        '🤔 Der Satz ist zu Ende, aber du bist noch nicht an der Uni?（句子說完了卻還沒到大學——檢查結構：送修 → 搭電車！）',
        '🤔 Der Tagtraum ist vorbei, aber du warst nicht im Museum?（夢醒了卻沒到博物館——檢查結構：Wenn → würde laufen → besuchen！）',
        '🌆 Der Tag ist um, aber der Zauberstein wartet noch!（今天結束了，寶石還在販賣機裡——把更多句子接到程式後面，一次跑完一整天的行程！每次執行都從早上重新開始）',
      ];
      setMessage('hint', doneMsgs[currentLevel]);
    }
  } catch (e) {
    if (e instanceof WinSignal) {
      showWin();
    } else if (e instanceof AbortRun) {
      // 使用者按了重置，安靜結束
    } else if (e instanceof GameError) {
      setMessage('error', e.message);
    } else {
      console.error(e);
      setMessage('error', '程式發生錯誤：' + e.message);
    }
  } finally {
    workspace.highlightBlock(null);
    running = false;
    el.run.disabled = false;
  }
}

function showWin() {
  const blockCount = workspace.getAllBlocks(false).filter((b) => !b.isShadow()).length;
  const winMsgs = [
    '🎉 Du hast den Diamanten!（你拿到寶石了！太棒了！）',
    '🎉 Guten Appetit! Frühstück im Park!（在公園吃早餐，完美的一天！）',
    '🎉 Fleißig! Lernen im Café!（在咖啡店唸書，充實的一天！）',
    '🎉 Hallo Anna! Schön, dich zu sehen!（見到 Anna 了！複合句大魔王被你打敗啦！）',
    '🎉 Pünktlich zur Arbeit!（趕上 halb acht 的火車，準時上班！情態動詞＋damit 都難不倒你！）',
    '🎉 Endlich zu Hause!（冒著大雨完成所有行程，終於回到家！obwohl 和 nach Hause 都學會啦！）',
    '🎉 An der Uni!（腳踏車送修、電車也搭對了！關係子句和陰性 Dativ 都難不倒你！）',
    '🎉 Ein perfekter Tagtraum!（完美的白日夢！hätte／würde——作夢專用的 Konjunktiv II 學會了！）',
    '🎉 Der Zauberstein gehört dir!（一整天的德語句子換來 12 Münzen 和魔法寶石——Deutschstadt 制霸！）',
  ];
  setMessage('success', winMsgs[currentLevel]);
  const extra = solutionUsed
    ? '（這次看了解答——下次試試自己完成！）'
    : (hintCount === 0 ? '而且完全沒用提示，太神啦！' : `（用了 ${hintCount} 次提示）`);
  el.winStats.textContent = `你用了 ${blockCount} 個積木、${game.state.steps} 個動作完成冒險！${extra}`;
  if (cmd.ttsOn) sprich('Geschafft! Super!');
  setTimeout(() => { el.winOverlay.hidden = false; }, 450);
}

/* ---------- 提示鍵 ---------- */

let hintCount = 0;
let lastHintDe = null;
let solutionUsed = false;

el.hint.addEventListener('click', () => {
  const h = meta().hinweis();
  if (!h) {
    setMessage('success', '🎉 這一關已經完成啦，不需要提示了！');
    return;
  }
  hintCount++;
  if (h.mask && lastHintDe !== h.de) {
    // 第一次：遮住關鍵字，讓學習者自己想
    lastHintDe = h.de;
    setMessage('hint', `💡 下一步：${h.maskiert}（${h.zh}）── ${h.note}。再按一次 💡 看完整句子`);
  } else {
    lastHintDe = h.de;
    setMessage('hint', `💡 下一步：${h.de}（${h.zh}）`);
    setSentence(h.de, h.zh);
    if (cmd.ttsOn) sprich(h.de);
  }
});

/* ---------- 解答鍵 ---------- */

el.solution.addEventListener('click', () => {
  const userBlocks = workspace.getAllBlocks(false).filter((b) => !b.isShadow()).length;
  if (userBlocks > 2 && !window.confirm('要把工作區換成完整解答嗎？你目前的積木會被取代。')) {
    return;
  }
  const json = meta().loesungJson();
  if (!json) {
    setMessage('error', '找不到解答……這關好像壞掉了，請回報！');
    return;
  }
  solutionUsed = true;
  workspace.clear();
  Blockly.serialization.workspaces.load(json, workspace);
  game.reset();
  const blockCount = workspace.getAllBlocks(false).filter((b) => !b.isShadow()).length;
  setMessage('hint', `📖 完整解答已放進工作區（${blockCount} 個積木）。按「▶ 執行」看勇者走一遍——順便跟著唸每個句子！`);
});

/* ================= 控制列 ================= */

el.run.addEventListener('click', runProgram);

el.reset.addEventListener('click', () => {
  game.reset();
  workspace.highlightBlock(null);
  setMessage('info', '已重置。Bereit?（調整好句子後再按「▶ 執行」）');
  setSentence('Bereit?', '準備好了嗎');
});

el.again.addEventListener('click', () => {
  el.winOverlay.hidden = true;
  game.reset();
  hintCount = 0;
  lastHintDe = null;
  solutionUsed = false;
  setMessage('info', 'Nochmal!（再挑戰一次！能不能用更少的積木、更少的提示過關呢？）');
});

el.tts.addEventListener('click', () => {
  const on = !cmd.ttsOn;
  cmd.ttsOn = on;
  cmd2.ttsOn = on;
  cmd3.ttsOn = on;
  cmd4.ttsOn = on;
  cmd5.ttsOn = on;
  cmd6.ttsOn = on;
  cmd7.ttsOn = on;
  cmd8.ttsOn = on;
  cmd9.ttsOn = on;
  el.tts.textContent = on ? '🔊' : '🔇';
  el.tts.classList.toggle('off', !on);
  if (!on && window.speechSynthesis) speechSynthesis.cancel();
});

el.speed.addEventListener('input', () => {
  game.speed = Number(el.speed.value);
  el.speedLabel.textContent = `×${game.speed}`;
});

/* ================= 啟動 ================= */

switchLevel(0);

// 測試與除錯用
window.__rpg = { workspace, game, cmd, cmd2, cmd3, cmd4, cmd5, cmd6, cmd7, cmd8, cmd9, runProgram, switchLevel };
