'use strict';

/* ================= 德文句子積木 ================= */

const ARTIKEL_OPTIONS = [
  ['?', 'NONE'],
  ['der', 'der'],
  ['die', 'die'],
  ['das', 'das'],
  ['den', 'den'],
];

// 冠詞性別顏色（德語教學常用的顏色記憶法）
const FARBE_MASKULIN = '#4a90d9'; // der 陽性＝藍
const FARBE_FEMININ = '#d94a6b';  // die 陰性＝紅
const FARBE_RICHTUNG = '#2fa4a9';

Blockly.defineBlocksWithJsonArray([
  /* ---- 動詞：移動 ---- */
  {
    type: 'de_geh',
    message0: 'geh %1',
    args0: [{ type: 'input_value', name: 'RICHTUNG', check: 'Richtung' }],
    inputsInline: true,
    previousStatement: null,
    nextStatement: null,
    colour: 214,
    tooltip: 'geh ＝ 走（後面接一個方向，例如 nach vorne）',
  },
  {
    type: 'de_dreh',
    message0: 'dreh dich %1',
    args0: [{ type: 'input_value', name: 'RICHTUNG', check: 'Richtung' }],
    inputsInline: true,
    previousStatement: null,
    nextStatement: null,
    colour: 214,
    tooltip: 'dreh dich ＝ 轉身（原地轉，不移動）',
  },
  {
    type: 'de_dreh_um',
    message0: 'dreh dich um',
    previousStatement: null,
    nextStatement: null,
    colour: 214,
    tooltip: 'dreh dich um ＝ 向後轉（180 度）',
  },

  /* ---- 動詞：物品互動 ---- */
  {
    type: 'de_nimm',
    message0: 'nimm %1',
    args0: [{ type: 'input_value', name: 'NOMEN', check: 'Nomen' }],
    inputsInline: true,
    previousStatement: null,
    nextStatement: null,
    colour: 42,
    tooltip: 'nimm ＝ 拿、撿起（後面接一個名詞）',
  },
  {
    type: 'de_kaufe',
    message0: 'kaufe %1',
    args0: [{ type: 'input_value', name: 'NOMEN', check: 'Nomen' }],
    inputsInline: true,
    previousStatement: null,
    nextStatement: null,
    colour: 296,
    tooltip: 'kaufe ＝ 買（要站在販賣機前面）',
  },
  {
    type: 'de_oeffne',
    message0: 'öffne %1',
    args0: [{ type: 'input_value', name: 'NOMEN', check: 'Nomen' }],
    inputsInline: true,
    previousStatement: null,
    nextStatement: null,
    colour: 296,
    tooltip: 'öffne ＝ 打開（要面對著門）',
  },

  /* ---- 方向片語 ---- */
  {
    type: 'de_nach_vorne',
    message0: 'nach vorne',
    output: 'Richtung',
    colour: FARBE_RICHTUNG,
    tooltip: 'nach vorne ＝ 向前',
  },
  {
    type: 'de_nach_links',
    message0: 'nach links',
    output: 'Richtung',
    colour: FARBE_RICHTUNG,
    tooltip: 'nach links ＝ 向左',
  },
  {
    type: 'de_nach_rechts',
    message0: 'nach rechts',
    output: 'Richtung',
    colour: FARBE_RICHTUNG,
    tooltip: 'nach rechts ＝ 向右',
  },

  /* ---- 名詞（要自己選冠詞！） ---- */
  {
    type: 'de_muenze',
    message0: '%1 Münze',
    args0: [{ type: 'field_dropdown', name: 'ARTIKEL', options: ARTIKEL_OPTIONS }],
    output: 'Nomen',
    colour: FARBE_FEMININ,
    tooltip: 'Münze ＝ 金幣（想想看：冠詞要用哪一個？）',
  },
  {
    type: 'de_schluessel',
    message0: '%1 Schlüssel',
    args0: [{ type: 'field_dropdown', name: 'ARTIKEL', options: ARTIKEL_OPTIONS }],
    output: 'Nomen',
    colour: FARBE_MASKULIN,
    tooltip: 'Schlüssel ＝ 鑰匙（小心：它是受詞的時候，冠詞會變化！）',
  },
  {
    type: 'de_tuer',
    message0: '%1 Tür',
    args0: [{ type: 'field_dropdown', name: 'ARTIKEL', options: ARTIKEL_OPTIONS }],
    output: 'Nomen',
    colour: FARBE_FEMININ,
    tooltip: 'Tür ＝ 門（想想看：冠詞要用哪一個？）',
  },
]);

/* ================= JavaScript 產生器 ================= */

(function registerGenerators() {
  const gen = (typeof javascript !== 'undefined')
    ? javascript.javascriptGenerator
    : Blockly.JavaScript;
  const ORDER = (typeof javascript !== 'undefined' && javascript.Order)
    ? javascript.Order.ATOMIC
    : 0;

  const richtungCode = (value) => () => [`'${value}'`, ORDER];
  const nomenCode = (nomen) => (block) =>
    [JSON.stringify({ artikel: block.getFieldValue('ARTIKEL'), nomen }), ORDER];
  const verbCode = (method, inputName) => (block, g) => {
    const arg = g.valueToCode(block, inputName, ORDER) || 'null';
    return `await cmd.${method}(${arg});\n`;
  };

  gen.forBlock['de_geh'] = verbCode('geh', 'RICHTUNG');
  gen.forBlock['de_dreh'] = verbCode('drehDich', 'RICHTUNG');
  gen.forBlock['de_dreh_um'] = () => 'await cmd.drehDichUm();\n';
  gen.forBlock['de_nimm'] = verbCode('nimm', 'NOMEN');
  gen.forBlock['de_kaufe'] = verbCode('kaufe', 'NOMEN');
  gen.forBlock['de_oeffne'] = verbCode('oeffne', 'NOMEN');

  gen.forBlock['de_nach_vorne'] = richtungCode('vorne');
  gen.forBlock['de_nach_links'] = richtungCode('links');
  gen.forBlock['de_nach_rechts'] = richtungCode('rechts');

  gen.forBlock['de_muenze'] = nomenCode('Münze');
  gen.forBlock['de_schluessel'] = nomenCode('Schlüssel');
  gen.forBlock['de_tuer'] = nomenCode('Tür');
})();

/* ================= 第 2 關：計畫句積木 ================= */

const ORDINAL_OPTIONS = [
  ['?', 'NONE'],
  ['zuerst', 'zuerst'],
  ['dann', 'dann'],
  ['danach', 'danach'],
];

Blockly.defineBlocksWithJsonArray([
  {
    type: 'de2_moechte',
    message0: 'Ich möchte %1',
    args0: [{ type: 'input_statement', name: 'PLAN', check: 'Plan' }],
    colour: '#7b5cd6',
    tooltip: 'Ich möchte … ＝ 我想要……（把想做的事照順序接進來，勇者會自己照著做）',
  },
  {
    type: 'de2_baeckerei',
    message0: '%1 %2 Bäckerei gehen',
    args0: [
      { type: 'field_dropdown', name: 'ORDINAL', options: ORDINAL_OPTIONS },
      { type: 'field_dropdown', name: 'PRAEP', options: [['?', 'NONE'], ['zur', 'zur'], ['zum', 'zum'], ['nach der', 'nach der'], ['zu das', 'zu das']] },
    ],
    previousStatement: 'Plan',
    nextStatement: 'Plan',
    colour: '#c9802e',
    tooltip: '去麵包店（gehen ＝ 去。想想：zu + die Bäckerei 的 Dativ 縮寫是？）',
  },
  {
    type: 'de2_markt',
    message0: '%1 auf %2 Markt Obst kaufen',
    args0: [
      { type: 'field_dropdown', name: 'ORDINAL', options: ORDINAL_OPTIONS },
      { type: 'field_dropdown', name: 'PRAEP', options: [['?', 'NONE'], ['dem', 'dem'], ['den', 'den'], ['der', 'der']] },
    ],
    previousStatement: 'Plan',
    nextStatement: 'Plan',
    colour: '#b3437a',
    tooltip: '在市場買水果（kaufen ＝ 買。位置 Wo? 用 Dativ，方向 Wohin? 用 Akkusativ——這裡是哪一種？）',
  },
  {
    type: 'de2_park',
    message0: '%1 %2 Park frühstücken',
    args0: [
      { type: 'field_dropdown', name: 'ORDINAL', options: ORDINAL_OPTIONS },
      { type: 'field_dropdown', name: 'PRAEP', options: [['?', 'NONE'], ['im', 'im'], ['in den', 'in den'], ['am', 'am']] },
    ],
    previousStatement: 'Plan',
    nextStatement: 'Plan',
    colour: '#3f9d63',
    tooltip: '在公園吃早餐（frühstücken ＝ 吃早餐。in + dem 的縮寫是？）',
  },
]);

(function registerLevel2Generators() {
  const gen = (typeof javascript !== 'undefined')
    ? javascript.javascriptGenerator
    : Blockly.JavaScript;

  const TYP2 = { de2_baeckerei: 'baeckerei', de2_markt: 'markt', de2_park: 'park' };

  gen.forBlock['de2_moechte'] = (block) => {
    const teile = [];
    let b = block.getInputTargetBlock('PLAN');
    while (b) {
      if (TYP2[b.type]) {
        teile.push({
          id: b.id,
          typ: TYP2[b.type],
          ordinal: b.getFieldValue('ORDINAL'),
          praep: b.getFieldValue('PRAEP'),
        });
      }
      b = b.getNextBlock();
    }
    return `await cmd2.fuehrePlanAus(${JSON.stringify(teile)}, highlightBlock);\n`;
  };

  // 子句積木只有「沒接進 Ich möchte」而落單時才會被直接呼叫
  const ohne = () => 'await cmd2.ohneMoechte();\n';
  gen.forBlock['de2_baeckerei'] = ohne;
  gen.forBlock['de2_markt'] = ohne;
  gen.forBlock['de2_park'] = ohne;
})();

const TOOLBOX2 = {
  kind: 'flyoutToolbox',
  contents: [
    { kind: 'label', text: '🗓️ Der Plan 計畫句' },
    { kind: 'block', type: 'de2_moechte' },
    { kind: 'sep', gap: 24 },
    { kind: 'label', text: '📌 Aktivitäten 活動' },
    { kind: 'block', type: 'de2_baeckerei' },
    { kind: 'block', type: 'de2_markt' },
    { kind: 'block', type: 'de2_park' },
  ],
};

/* ================= 第 3 關：現在式句子積木 ================= */

Blockly.defineBlocksWithJsonArray([
  {
    type: 'de3_ich',
    message0: 'Ich %1',
    args0: [{ type: 'input_statement', name: 'SATZ', check: 'Satz' }],
    colour: '#5271c4',
    tooltip: 'Ich ＝ 我。接上句子，動詞要跟著 ich 變位（gehe／fahre／lerne）！',
  },
  {
    type: 'de3_bushaltestelle',
    message0: '%1 %2 %3 Bushaltestelle',
    args0: [
      { type: 'field_dropdown', name: 'VERB', options: [['?', 'NONE'], ['gehen', 'gehen'], ['gehe', 'gehe'], ['gehst', 'gehst'], ['geht', 'geht']] },
      { type: 'field_dropdown', name: 'ORDINAL', options: ORDINAL_OPTIONS },
      { type: 'field_dropdown', name: 'PRAEP', options: [['?', 'NONE'], ['zur', 'zur'], ['zum', 'zum'], ['nach der', 'nach der']] },
    ],
    previousStatement: 'Satz',
    nextStatement: 'Satz',
    colour: '#4a7bd0',
    tooltip: '走到公車站（die Bushaltestelle。想想：ich 的動詞形式、zu + der 的縮寫）',
  },
  {
    type: 'de3_bus',
    message0: '%1 %2 mit %3 Bus zur Bibliothek',
    args0: [
      { type: 'field_dropdown', name: 'VERB', options: [['?', 'NONE'], ['fahren', 'fahren'], ['fahre', 'fahre'], ['fährst', 'fährst'], ['fährt', 'fährt']] },
      { type: 'field_dropdown', name: 'ORDINAL', options: ORDINAL_OPTIONS },
      { type: 'field_dropdown', name: 'PRAEP', options: [['?', 'NONE'], ['dem', 'dem'], ['den', 'den'], ['der', 'der']] },
    ],
    previousStatement: 'Satz',
    nextStatement: 'Satz',
    colour: '#d97b29',
    tooltip: '搭公車去圖書館（fahren mit + ？——mit 永遠接 Dativ！要先站在公車站）',
  },
  {
    type: 'de3_cafe',
    message0: '%1 %2 %3 Café',
    args0: [
      { type: 'field_dropdown', name: 'VERB', options: [['?', 'NONE'], ['lernen', 'lernen'], ['lerne', 'lerne'], ['lernst', 'lernst'], ['lernt', 'lernt']] },
      { type: 'field_dropdown', name: 'ORDINAL', options: ORDINAL_OPTIONS },
      { type: 'field_dropdown', name: 'PRAEP', options: [['?', 'NONE'], ['im', 'im'], ['ins', 'ins'], ['am', 'am']] },
    ],
    previousStatement: 'Satz',
    nextStatement: 'Satz',
    colour: '#8a5a33',
    tooltip: '在咖啡店唸書（das Café 是中性。要先有書！）',
  },
]);

(function registerLevel3Generators() {
  const gen = (typeof javascript !== 'undefined')
    ? javascript.javascriptGenerator
    : Blockly.JavaScript;

  const TYP3 = { de3_bushaltestelle: 'haltestelle', de3_bus: 'bus', de3_cafe: 'cafe' };

  gen.forBlock['de3_ich'] = (block) => {
    const teile = [];
    let b = block.getInputTargetBlock('SATZ');
    while (b) {
      if (TYP3[b.type]) {
        teile.push({
          id: b.id,
          typ: TYP3[b.type],
          verb: b.getFieldValue('VERB'),
          ordinal: b.getFieldValue('ORDINAL'),
          praep: b.getFieldValue('PRAEP'),
        });
      }
      b = b.getNextBlock();
    }
    return `await cmd3.fuehreSatzAus(${JSON.stringify(teile)}, highlightBlock);\n`;
  };

  const ohneIch = () => 'await cmd3.ohneIch();\n';
  gen.forBlock['de3_bushaltestelle'] = ohneIch;
  gen.forBlock['de3_bus'] = ohneIch;
  gen.forBlock['de3_cafe'] = ohneIch;
})();

const TOOLBOX3 = {
  kind: 'flyoutToolbox',
  contents: [
    { kind: 'label', text: '🚌 Der Tag 一天' },
    { kind: 'block', type: 'de3_ich' },
    { kind: 'sep', gap: 24 },
    { kind: 'label', text: '📌 Sätze 句子' },
    { kind: 'block', type: 'de3_bushaltestelle' },
    { kind: 'block', type: 'de3_bus' },
    { kind: 'block', type: 'de3_cafe' },
  ],
};

/* ================= 第 4 關：複合句積木 ================= */

Blockly.defineBlocksWithJsonArray([
  {
    type: 'de4_nachdem',
    message0: 'Nachdem ich %1 Rathaus %2 %3 ,',
    args0: [
      { type: 'field_dropdown', name: 'PRAEP', options: [['?', 'NONE'], ['am', 'am'], ['im', 'im'], ['zum', 'zum']] },
      { type: 'field_dropdown', name: 'PARTIZIP', options: [['?', 'NONE'], ['ausgestiegen', 'ausgestiegen'], ['aussteigen', 'aussteigen'], ['steige aus', 'steige aus']] },
      { type: 'field_dropdown', name: 'AUX', options: [['?', 'NONE'], ['bin', 'bin'], ['habe', 'habe'], ['ist', 'ist']] },
    ],
    nextStatement: 'Satz4',
    colour: '#5e60ce',
    tooltip: 'Nachdem 子句：在市政廳下車之後（注意：子句動詞放最後——Perfekt 用過去分詞＋助動詞；移動動詞用 sein！）',
  },
  {
    type: 'de4_hauptsatz',
    message0: '%1 über %2 Platz %3 Café ,',
    args0: [
      { type: 'field_dropdown', name: 'WO', options: [['?', 'NONE'], ['gehe ich', 'gehe ich'], ['ich gehe', 'ich gehe']] },
      { type: 'field_dropdown', name: 'ART', options: [['?', 'NONE'], ['den', 'den'], ['dem', 'dem'], ['der', 'der']] },
      { type: 'field_dropdown', name: 'PRAEP2', options: [['?', 'NONE'], ['zum', 'zum'], ['zur', 'zur'], ['zu das', 'zu das']] },
    ],
    previousStatement: 'Satz4',
    nextStatement: 'Satz4',
    colour: '#d97b29',
    tooltip: '主句：穿過廣場走到咖啡店（Nachdem-子句佔了第一位，主句要倒裝！über＋穿越的移動用 Akkusativ）',
  },
  {
    type: 'de4_zweck',
    message0: 'um Anna %1 .',
    args0: [
      { type: 'field_dropdown', name: 'TREFFEN', options: [['?', 'NONE'], ['zu treffen', 'zu treffen'], ['treffen', 'treffen'], ['zu treffe', 'zu treffe'], ['getroffen', 'getroffen']] },
    ],
    previousStatement: 'Satz4',
    colour: '#c0517f',
    tooltip: 'um…zu 目的句：為了見 Anna（um ＋ 受詞 ＋ zu ＋ 動詞原形）',
  },
]);

(function registerLevel4Generators() {
  const gen = (typeof javascript !== 'undefined')
    ? javascript.javascriptGenerator
    : Blockly.JavaScript;

  gen.forBlock['de4_nachdem'] = (block) => {
    const teile = [{
      id: block.id,
      typ: 'nachdem',
      praep: block.getFieldValue('PRAEP'),
      partizip: block.getFieldValue('PARTIZIP'),
      aux: block.getFieldValue('AUX'),
    }];
    let b = block.getNextBlock();
    while (b) {
      if (b.type === 'de4_hauptsatz') {
        teile.push({
          id: b.id,
          typ: 'hauptsatz',
          wo: b.getFieldValue('WO'),
          art: b.getFieldValue('ART'),
          praep2: b.getFieldValue('PRAEP2'),
        });
      } else if (b.type === 'de4_zweck') {
        teile.push({ id: b.id, typ: 'zweck', treffen: b.getFieldValue('TREFFEN') });
      }
      b = b.getNextBlock();
    }
    return `await cmd4.fuehreSatz4Aus(${JSON.stringify(teile)}, highlightBlock);\n`;
  };

  // 接在 Nachdem 後面的子積木由上面的產生器一次讀走；
  // 孤立的鏈（沒有 Nachdem 開頭）則提示句子結構錯誤。
  const hinterNachdem = (block) => {
    let b = block.getPreviousBlock();
    while (b) {
      if (b.type === 'de4_nachdem') return true;
      b = b.getPreviousBlock();
    }
    return false;
  };
  const teilOhneNachdem = (block) => hinterNachdem(block) ? '' : 'await cmd4.ohneNachdem();\n';
  gen.forBlock['de4_hauptsatz'] = teilOhneNachdem;
  gen.forBlock['de4_zweck'] = teilOhneNachdem;
})();

const TOOLBOX4 = {
  kind: 'flyoutToolbox',
  contents: [
    { kind: 'label', text: '⏰ Nebensatz 子句' },
    { kind: 'block', type: 'de4_nachdem' },
    { kind: 'sep', gap: 24 },
    { kind: 'label', text: '📌 Hauptsatz & Zweck 主句與目的' },
    { kind: 'block', type: 'de4_hauptsatz' },
    { kind: 'block', type: 'de4_zweck' },
  ],
};

/* ================= 第 5 關：情態動詞句積木 ================= */

Blockly.defineBlocksWithJsonArray([
  {
    type: 'de5_muss',
    message0: 'Ich %1 %2',
    args0: [
      { type: 'field_dropdown', name: 'MODAL', options: [['?', 'NONE'], ['muss', 'muss'], ['musst', 'musst'], ['müssen', 'müssen']] },
      { type: 'input_statement', name: 'SATZ', check: 'Satz5' },
    ],
    colour: '#7048b6',
    tooltip: '情態動詞 müssen（必須）——要跟著 ich 變位！後面的動詞都用原形放句尾。',
  },
  {
    type: 'de5_linie',
    message0: 'zuerst %1 %2 Linie %3',
    args0: [
      { type: 'field_dropdown', name: 'KASUS', options: [['?', 'NONE'], ['in die', 'in die'], ['in der', 'in der'], ['in das', 'in das']] },
      { type: 'field_dropdown', name: 'ADJ', options: [['?', 'NONE'], ['blaue', 'blaue'], ['blauen', 'blauen'], ['blaues', 'blaues']] },
      { type: 'field_dropdown', name: 'VERB', options: [['?', 'NONE'], ['umsteigen', 'umsteigen'], ['umzusteigen', 'umzusteigen'], ['steige um', 'steige um']] },
    ],
    previousStatement: 'Satz5',
    nextStatement: 'Satz5',
    colour: '#3f6fd8',
    tooltip: '轉乘藍線（die Linie 陰性。「轉進去」是方向 Wohin? → in + Akkusativ；形容詞要加字尾！）',
  },
  {
    type: 'de5_zug',
    message0: 'und dann %1 Zug %2 %3',
    args0: [
      { type: 'field_dropdown', name: 'ART', options: [['?', 'NONE'], ['den', 'den'], ['der', 'der'], ['dem', 'dem']] },
      { type: 'field_dropdown', name: 'ZEIT', options: [['?', 'NONE'], ['vor halb acht', 'vor halb acht'], ['vor halb neun', 'vor halb neun'], ['vor acht', 'vor acht'], ['nach halb acht', 'nach halb acht']] },
      { type: 'field_dropdown', name: 'VERB', options: [['?', 'NONE'], ['erwischen', 'erwischen'], ['erwische', 'erwische'], ['erwischt', 'erwischt']] },
    ],
    previousStatement: 'Satz5',
    nextStatement: 'Satz5',
    colour: '#d97b29',
    tooltip: '趕上火車（der Zug 是受詞 → Akkusativ。看好時刻表：Abfahrt 7:30——德文怎麼說？）',
  },
  {
    type: 'de5_damit',
    message0: '%1 ich pünktlich %2 Arbeit %3',
    args0: [
      { type: 'field_dropdown', name: 'KONJ', options: [['?', 'NONE'], ['damit', 'damit'], ['um', 'um'], ['dass', 'dass']] },
      { type: 'field_dropdown', name: 'PRAEP', options: [['?', 'NONE'], ['zur', 'zur'], ['zum', 'zum'], ['in die', 'in die']] },
      { type: 'field_dropdown', name: 'VERB', options: [['?', 'NONE'], ['komme', 'komme'], ['kommen', 'kommen'], ['kommt', 'kommt']] },
    ],
    previousStatement: 'Satz5',
    colour: '#c0517f',
    tooltip: 'damit 目的句：為了讓我準時上班（damit ＋ 主詞 ＋ … ＋ 變位動詞放最後——跟 um…zu 不一樣！）',
  },
]);

(function registerLevel5Generators() {
  const gen = (typeof javascript !== 'undefined')
    ? javascript.javascriptGenerator
    : Blockly.JavaScript;

  gen.forBlock['de5_muss'] = (block) => {
    const modal = block.getFieldValue('MODAL');
    const teile = [];
    let b = block.getInputTargetBlock('SATZ');
    while (b) {
      if (b.type === 'de5_linie') {
        teile.push({
          id: b.id, typ: 'linie',
          kasus: b.getFieldValue('KASUS'),
          adj: b.getFieldValue('ADJ'),
          verb: b.getFieldValue('VERB'),
        });
      } else if (b.type === 'de5_zug') {
        teile.push({
          id: b.id, typ: 'zug',
          art: b.getFieldValue('ART'),
          zeit: b.getFieldValue('ZEIT'),
          verb: b.getFieldValue('VERB'),
        });
      } else if (b.type === 'de5_damit') {
        teile.push({
          id: b.id, typ: 'damit',
          konj: b.getFieldValue('KONJ'),
          praep: b.getFieldValue('PRAEP'),
          verb: b.getFieldValue('VERB'),
        });
      }
      b = b.getNextBlock();
    }
    return `await cmd5.fuehreSatz5Aus(${JSON.stringify(modal)}, ${JSON.stringify(teile)}, highlightBlock);\n`;
  };

  const ohneMuss = () => 'await cmd5.ohneMuss();\n';
  gen.forBlock['de5_linie'] = ohneMuss;
  gen.forBlock['de5_zug'] = ohneMuss;
  gen.forBlock['de5_damit'] = ohneMuss;
})();

const TOOLBOX5 = {
  kind: 'flyoutToolbox',
  contents: [
    { kind: 'label', text: '❗ Modalverb 情態動詞' },
    { kind: 'block', type: 'de5_muss' },
    { kind: 'sep', gap: 24 },
    { kind: 'label', text: '📌 Der Plan 計畫' },
    { kind: 'block', type: 'de5_linie' },
    { kind: 'block', type: 'de5_zug' },
    { kind: 'block', type: 'de5_damit' },
  ],
};

/* ================= 第 6 關：讓步子句積木 ================= */

Blockly.defineBlocksWithJsonArray([
  {
    type: 'de6_obwohl',
    message0: '%1 es stark %2 ,',
    args0: [
      { type: 'field_dropdown', name: 'KONJ', options: [['?', 'NONE'], ['Obwohl', 'Obwohl'], ['Weil', 'Weil'], ['Wenn', 'Wenn']] },
      { type: 'field_dropdown', name: 'VERB', options: [['?', 'NONE'], ['regnet', 'regnet'], ['regnen', 'regnen'], ['regne', 'regne']] },
    ],
    nextStatement: 'Satz6',
    colour: '#607ec9',
    tooltip: '讓步子句：雖然雨下得很大（連接詞要看語意選！子句動詞放最後，主詞是無人稱的 es）',
  },
  {
    type: 'de6_apotheke',
    message0: '%1 zuerst %2 Apotheke ,',
    args0: [
      { type: 'field_dropdown', name: 'WO', options: [['?', 'NONE'], ['gehe ich', 'gehe ich'], ['ich gehe', 'ich gehe']] },
      { type: 'field_dropdown', name: 'PRAEP', options: [['?', 'NONE'], ['zur', 'zur'], ['zum', 'zum'], ['nach der', 'nach der']] },
    ],
    previousStatement: 'Satz6',
    nextStatement: 'Satz6',
    colour: '#2fa35c',
    tooltip: '第一站：藥局（Obwohl-子句佔了第一位——主句要倒裝！die Apotheke 是陰性）',
  },
  {
    type: 'de6_post',
    message0: 'danach %1 Post ,',
    args0: [
      { type: 'field_dropdown', name: 'PRAEP', options: [['?', 'NONE'], ['zur', 'zur'], ['zum', 'zum'], ['bei der', 'bei der']] },
    ],
    previousStatement: 'Satz6',
    nextStatement: 'Satz6',
    colour: '#dfa722',
    tooltip: '第二站：郵局（die Post 也是陰性。「去」郵局是方向 Wohin?）',
  },
  {
    type: 'de6_bus',
    message0: 'und fahre %1 mit %2 Bus %3 .',
    args0: [
      { type: 'field_dropdown', name: 'ORDINAL', options: [['?', 'NONE'], ['schließlich', 'schließlich'], ['zuerst', 'zuerst'], ['danach', 'danach']] },
      { type: 'field_dropdown', name: 'ART', options: [['?', 'NONE'], ['dem', 'dem'], ['den', 'den'], ['der', 'der']] },
      { type: 'field_dropdown', name: 'HAUSE', options: [['?', 'NONE'], ['nach Hause', 'nach Hause'], ['zu Hause', 'zu Hause'], ['zum Haus', 'zum Haus']] },
    ],
    previousStatement: 'Satz6',
    colour: '#c66a2a',
    tooltip: '最後：搭公車回家（mit 永遠接 Dativ；「回家」跟「在家」是不同的說法！）',
  },
]);

(function registerLevel6Generators() {
  const gen = (typeof javascript !== 'undefined')
    ? javascript.javascriptGenerator
    : Blockly.JavaScript;

  gen.forBlock['de6_obwohl'] = (block) => {
    const teile = [{
      id: block.id,
      typ: 'obwohl',
      konj: block.getFieldValue('KONJ'),
      verb: block.getFieldValue('VERB'),
    }];
    let b = block.getNextBlock();
    while (b) {
      if (b.type === 'de6_apotheke') {
        teile.push({ id: b.id, typ: 'apotheke', wo: b.getFieldValue('WO'), praep: b.getFieldValue('PRAEP') });
      } else if (b.type === 'de6_post') {
        teile.push({ id: b.id, typ: 'post', praep: b.getFieldValue('PRAEP') });
      } else if (b.type === 'de6_bus') {
        teile.push({
          id: b.id, typ: 'bus',
          ordinal: b.getFieldValue('ORDINAL'),
          art: b.getFieldValue('ART'),
          hause: b.getFieldValue('HAUSE'),
        });
      }
      b = b.getNextBlock();
    }
    return `await cmd6.fuehreSatz6Aus(${JSON.stringify(teile)}, highlightBlock);\n`;
  };

  // 接在 Obwohl 後面的子積木由上面的產生器一次讀走；孤立的鏈則提示結構錯誤
  const hinterObwohl = (block) => {
    let b = block.getPreviousBlock();
    while (b) {
      if (b.type === 'de6_obwohl') return true;
      b = b.getPreviousBlock();
    }
    return false;
  };
  const teilOhneObwohl = (block) => hinterObwohl(block) ? '' : 'await cmd6.ohneObwohl();\n';
  gen.forBlock['de6_apotheke'] = teilOhneObwohl;
  gen.forBlock['de6_post'] = teilOhneObwohl;
  gen.forBlock['de6_bus'] = teilOhneObwohl;
})();

const TOOLBOX6 = {
  kind: 'flyoutToolbox',
  contents: [
    { kind: 'label', text: '🌧️ Obwohl … 雖然' },
    { kind: 'block', type: 'de6_obwohl' },
    { kind: 'sep', gap: 24 },
    { kind: 'label', text: '📌 Der Weg 行程' },
    { kind: 'block', type: 'de6_apotheke' },
    { kind: 'block', type: 'de6_post' },
    { kind: 'block', type: 'de6_bus' },
  ],
};

/* ================= 第 7 關：關係子句積木 ================= */

Blockly.defineBlocksWithJsonArray([
  {
    type: 'de7_ich',
    message0: 'Ich %1',
    args0: [{ type: 'input_statement', name: 'SATZ', check: 'Satz7' }],
    colour: '#5271c4',
    tooltip: 'Ich ＝ 我。把「送修腳踏車」和「搭電車」接進來，組成一句話！',
  },
  {
    type: 'de7_bringen',
    message0: 'bringe das Fahrrad %1 zuerst %2 Werkstatt',
    args0: [
      { type: 'input_value', name: 'RELSATZ', check: 'Relativsatz' },
      { type: 'field_dropdown', name: 'PRAEP', options: [['?', 'NONE'], ['zur', 'zur'], ['zum', 'zum'], ['zu die', 'zu die']] },
    ],
    inputsInline: true,
    previousStatement: 'Satz7',
    nextStatement: 'Satz7',
    colour: '#2c9678',
    tooltip: '把腳踏車送去修車行（哪一台腳踏車？——把關係子句塞進圓洞裡說清楚！die Werkstatt 是陰性）',
  },
  {
    type: 'de7_relsatz',
    message0: ', %1 ich gestern %2 ,',
    args0: [
      { type: 'field_dropdown', name: 'REL', options: [['?', 'NONE'], ['das', 'das'], ['der', 'der'], ['den', 'den'], ['die', 'die']] },
      { type: 'field_dropdown', name: 'PERF', options: [['?', 'NONE'], ['gekauft habe', 'gekauft habe'], ['gekauft bin', 'gekauft bin'], ['habe gekauft', 'habe gekauft'], ['kaufe', 'kaufe']] },
    ],
    output: 'Relativsatz',
    colour: '#8a5aa8',
    tooltip: '關係子句：「我昨天買的（那台）」——關係代名詞跟先行詞同性別；子句的變位動詞放最後！',
  },
  {
    type: 'de7_tram',
    message0: 'und fahre danach mit %1 Straßenbahn %2 Universität .',
    args0: [
      { type: 'field_dropdown', name: 'ART', options: [['?', 'NONE'], ['der', 'der'], ['dem', 'dem'], ['die', 'die']] },
      { type: 'field_dropdown', name: 'PRAEP2', options: [['?', 'NONE'], ['zur', 'zur'], ['zum', 'zum'], ['an die', 'an die']] },
    ],
    previousStatement: 'Satz7',
    colour: '#c9483f',
    tooltip: '搭路面電車去大學（mit + Dativ——但 die Straßenbahn 是陰性，別背成 mit dem！）',
  },
]);

(function registerLevel7Generators() {
  const gen = (typeof javascript !== 'undefined')
    ? javascript.javascriptGenerator
    : Blockly.JavaScript;

  gen.forBlock['de7_ich'] = (block) => {
    const teile = [];
    let b = block.getInputTargetBlock('SATZ');
    while (b) {
      if (b.type === 'de7_bringen') {
        const rel = b.getInputTargetBlock('RELSATZ');
        teile.push({
          id: b.id,
          typ: 'bringen',
          hatRelsatz: !!rel,
          rel: rel ? rel.getFieldValue('REL') : 'NONE',
          perf: rel ? rel.getFieldValue('PERF') : 'NONE',
          praep: b.getFieldValue('PRAEP'),
        });
      } else if (b.type === 'de7_tram') {
        teile.push({
          id: b.id,
          typ: 'tram',
          art: b.getFieldValue('ART'),
          praep2: b.getFieldValue('PRAEP2'),
        });
      }
      b = b.getNextBlock();
    }
    return `await cmd7.fuehreSatz7Aus(${JSON.stringify(teile)}, highlightBlock);\n`;
  };

  const ohneIch7 = () => 'await cmd7.ohneIch();\n';
  gen.forBlock['de7_bringen'] = ohneIch7;
  gen.forBlock['de7_tram'] = ohneIch7;
  // 孤立的關係子句（沒塞進 Fahrrad 後面的洞）
  gen.forBlock['de7_relsatz'] = () => ['(await cmd7.relsatzAllein())', 0];
})();

const TOOLBOX7 = {
  kind: 'flyoutToolbox',
  contents: [
    { kind: 'label', text: '🚲 Der Satz 句子' },
    { kind: 'block', type: 'de7_ich' },
    { kind: 'sep', gap: 24 },
    { kind: 'label', text: '📌 Teile 句子部件' },
    { kind: 'block', type: 'de7_bringen' },
    { kind: 'block', type: 'de7_relsatz' },
    { kind: 'block', type: 'de7_tram' },
  ],
};

/* ================= 第 8 關：假設語氣積木 ================= */

Blockly.defineBlocksWithJsonArray([
  {
    type: 'de8_wenn',
    message0: 'Wenn ich mehr Zeit %1 ,',
    args0: [
      { type: 'field_dropdown', name: 'HAETTE', options: [['?', 'NONE'], ['hätte', 'hätte'], ['habe', 'habe'], ['hatte', 'hatte'], ['hätten', 'hätten']] },
    ],
    nextStatement: 'Satz8',
    colour: '#9b5fc9',
    tooltip: 'Wenn-子句：要是我有更多時間……（與現實相反的假設 → Konjunktiv II！注意變音，動詞放子句最後）',
  },
  {
    type: 'de8_laufen',
    message0: '%1 ich %2 entlang %3 Museum laufen',
    args0: [
      { type: 'field_dropdown', name: 'WUERDE', options: [['?', 'NONE'], ['würde', 'würde'], ['werde', 'werde'], ['will', 'will']] },
      { type: 'field_dropdown', name: 'FLUSS', options: [['?', 'NONE'], ['am Fluss', 'am Fluss'], ['an den Fluss', 'an den Fluss'], ['im Fluss', 'im Fluss']] },
      { type: 'field_dropdown', name: 'ZUM', options: [['?', 'NONE'], ['zum', 'zum'], ['zur', 'zur'], ['ins', 'ins']] },
    ],
    previousStatement: 'Satz8',
    nextStatement: 'Satz8',
    colour: '#3f8fc4',
    tooltip: '主句：就會沿著河散步到博物館（würde ＋ 原形放句尾；entlang 搭 an + Dativ；das Museum 是中性！）',
  },
  {
    type: 'de8_besuchen',
    message0: 'und %1 %2 Ausstellung %3 .',
    args0: [
      { type: 'field_dropdown', name: 'ANSCHL', options: [['?', 'NONE'], ['anschließend', 'anschließend'], ['anschließen', 'anschließen'], ['anschließt', 'anschließt']] },
      { type: 'field_dropdown', name: 'NEUE', options: [['?', 'NONE'], ['die neue', 'die neue'], ['die neuen', 'die neuen'], ['das neue', 'das neue']] },
      { type: 'field_dropdown', name: 'VERB', options: [['?', 'NONE'], ['besuchen', 'besuchen'], ['besuche', 'besuche'], ['besucht', 'besucht']] },
    ],
    previousStatement: 'Satz8',
    colour: '#c2578f',
    tooltip: '接著參觀新的特展（anschließend＝接著；die Ausstellung 陰性——形容詞字尾！würde 還管著這個動詞喔）',
  },
]);

(function registerLevel8Generators() {
  const gen = (typeof javascript !== 'undefined')
    ? javascript.javascriptGenerator
    : Blockly.JavaScript;

  gen.forBlock['de8_wenn'] = (block) => {
    const teile = [{
      id: block.id,
      typ: 'wenn',
      haette: block.getFieldValue('HAETTE'),
    }];
    let b = block.getNextBlock();
    while (b) {
      if (b.type === 'de8_laufen') {
        teile.push({
          id: b.id, typ: 'laufen',
          wuerde: b.getFieldValue('WUERDE'),
          fluss: b.getFieldValue('FLUSS'),
          zum: b.getFieldValue('ZUM'),
        });
      } else if (b.type === 'de8_besuchen') {
        teile.push({
          id: b.id, typ: 'besuchen',
          anschl: b.getFieldValue('ANSCHL'),
          neue: b.getFieldValue('NEUE'),
          verb: b.getFieldValue('VERB'),
        });
      }
      b = b.getNextBlock();
    }
    return `await cmd8.fuehreSatz8Aus(${JSON.stringify(teile)}, highlightBlock);\n`;
  };

  const hinterWenn = (block) => {
    let b = block.getPreviousBlock();
    while (b) {
      if (b.type === 'de8_wenn') return true;
      b = b.getPreviousBlock();
    }
    return false;
  };
  const teilOhneWenn = (block) => hinterWenn(block) ? '' : 'await cmd8.ohneWenn();\n';
  gen.forBlock['de8_laufen'] = teilOhneWenn;
  gen.forBlock['de8_besuchen'] = teilOhneWenn;
})();

const TOOLBOX8 = {
  kind: 'flyoutToolbox',
  contents: [
    { kind: 'label', text: '💭 Wenn … 要是' },
    { kind: 'block', type: 'de8_wenn' },
    { kind: 'sep', gap: 24 },
    { kind: 'label', text: '📌 Der Tagtraum 白日夢' },
    { kind: 'block', type: 'de8_laufen' },
    { kind: 'block', type: 'de8_besuchen' },
  ],
};

/* ================= 開放世界：自由組句積木 ================= */

const OW_ORT_OPTIONEN = [
  ['?', 'NONE'],
  ['🥖 Bäckerei', 'baeckerei'],
  ['🍎 Markt', 'markt'],
  ['☕ Café', 'cafe'],
  ['⛲ Brunnen', 'brunnen'],
  ['🌳 Park', 'park'],
  ['💊 Apotheke', 'apotheke'],
  ['📯 Post', 'post'],
  ['🏢 Rathaus', 'rathaus'],
  ['🎰 Automaten', 'automat'],
  ['🚏 Haltestelle', 'haltestelle'],
  ['🏠 Hause', 'hause'],
  ['📚 Bibliothek', 'bibliothek'],
  ['🏛️ Museum', 'museum'],
  ['🎓 Universität', 'uni'],
];

const OW_ADV_OPTIONEN = [
  ['—', 'NONE'],
  ['zuerst', 'zuerst'],
  ['dann', 'dann'],
  ['danach', 'danach'],
  ['anschließend', 'anschließend'],
  ['schließlich', 'schließlich'],
];

const OW_PRAEP_OPTIONEN = [
  ['?', 'NONE'],
  ['zur', 'zur'],
  ['zum', 'zum'],
  ['in den', 'in den'],
  ['ins', 'ins'],
  ['nach', 'nach'],
];

Blockly.defineBlocksWithJsonArray([
  {
    type: 'ow_gehe',
    message0: 'Ich gehe %1 %2 %3 %4 .',
    args0: [
      { type: 'field_dropdown', name: 'ADV', options: OW_ADV_OPTIONEN },
      { type: 'field_dropdown', name: 'PRAEP', options: OW_PRAEP_OPTIONEN },
      { type: 'field_dropdown', name: 'ORT', options: OW_ORT_OPTIONEN },
      { type: 'input_value', name: 'NEBEN', check: 'Nebensatz' },
    ],
    inputsInline: true,
    previousStatement: 'OW',
    nextStatement: 'OW',
    colour: '#4a9e57',
    tooltip: '走路去一個地方（介係詞要配地點的性別：zur＝陰性、zum＝陽性/中性、in den Park、nach Hause）。句尾的洞可以插 weil／obwohl 子句！',
  },
  {
    type: 'ow_fahre',
    message0: 'Ich fahre %1 %2 Straßenbahn %3 %4 %5 .',
    args0: [
      { type: 'field_dropdown', name: 'ADV', options: OW_ADV_OPTIONEN },
      { type: 'field_dropdown', name: 'MIT', options: [['?', 'NONE'], ['mit der', 'mit der'], ['mit dem', 'mit dem'], ['mit die', 'mit die']] },
      { type: 'field_dropdown', name: 'PRAEP', options: OW_PRAEP_OPTIONEN },
      { type: 'field_dropdown', name: 'ORT', options: OW_ORT_OPTIONEN },
      { type: 'input_value', name: 'NEBEN', check: 'Nebensatz' },
    ],
    inputsInline: true,
    previousStatement: 'OW',
    nextStatement: 'OW',
    colour: '#4a6fd0',
    tooltip: '搭路面電車過河（要先站在電車站旁！mit + Dativ——die Straßenbahn 是陰性）。句尾的洞可以插 weil／obwohl 子句！',
  },
  {
    type: 'ow_kaufe',
    message0: 'Ich %1 %2 %3 %4 %5 .',
    args0: [
      { type: 'field_dropdown', name: 'VERB', options: [['?', 'NONE'], ['kaufe', 'kaufe'], ['trinke', 'trinke'], ['hole', 'hole']] },
      { type: 'field_dropdown', name: 'ART', options: [['?', 'NONE'], ['einen', 'einen'], ['eine', 'eine'], ['ein', 'ein'], ['den', 'den'], ['die', 'die'], ['das', 'das']] },
      { type: 'field_dropdown', name: 'OBJ', options: [
        ['?', 'NONE'],
        ['🥖 Brot', 'brot'],
        ['🥨 Brezel', 'brezel'],
        ['🌸 Blume', 'blume'],
        ['☕ Kaffee', 'kaffee'],
        ['💊 Medikament', 'medikament'],
        ['📦 Paket', 'paket'],
        ['📖 Kunstbuch', 'buch'],
        ['💎 Zauberstein', 'zauberstein'],
      ] },
      { type: 'input_value', name: 'RELSATZ', check: 'Relsatz' },
      { type: 'input_value', name: 'NEBEN', check: 'Nebensatz' },
    ],
    inputsInline: true,
    previousStatement: 'OW',
    nextStatement: 'OW',
    colour: '#d07a2f',
    tooltip: '在對的地點買／喝／拿東西（Akkusativ：einen＝陽性、eine＝陰性、ein＝中性；獨一無二的 Zauberstein 用 den！）。名詞後面的洞可以插關係子句（記得換定冠詞！）、句尾的洞可以插 weil／obwohl 子句。',
  },
  {
    type: 'ow_relsatz',
    message0: ', %1 %2 ,',
    args0: [
      { type: 'field_dropdown', name: 'REL', options: [['?', 'NONE'], ['der', 'der'], ['die', 'die'], ['das', 'das'], ['den', 'den'], ['dem', 'dem']] },
      { type: 'field_dropdown', name: 'INHALT', options: [['?', 'NONE'], ['ich brauche', 'ich brauche'], ['mir gefällt', 'mir gefällt'], ['Oma braucht', 'Oma braucht']] },
    ],
    inputsInline: true,
    output: 'Relsatz',
    colour: '#00897b',
    tooltip: '關係子句（第 7 關的複習）：插進 kaufe 積木名詞後面的圓洞。代名詞要看「先行詞的性別」＋「它在子句裡的格」——ich brauche／Oma braucht 是受詞（Akkusativ）、mir gefällt 是主詞（Nominativ）！',
  },
  {
    type: 'ow_nebensatz',
    message0: ', %1 %2 %3',
    args0: [
      { type: 'field_dropdown', name: 'KONJ', options: [['?', 'NONE'], ['weil', 'weil'], ['obwohl', 'obwohl'], ['und', 'und'], ['aber', 'aber']] },
      { type: 'field_dropdown', name: 'FAKT', options: [['?', 'NONE'], ['Oma krank', 'Oma krank'], ['ich Hunger', 'ich Hunger'], ['Anna auf mich', 'Anna auf mich'], ['ich müde', 'ich müde'], ['es heute', 'es heute']] },
      { type: 'field_dropdown', name: 'VERB', options: [['?', 'NONE'], ['ist', 'ist'], ['habe', 'habe'], ['wartet', 'wartet'], ['bin', 'bin'], ['regnet', 'regnet']] },
    ],
    inputsInline: true,
    output: 'Nebensatz',
    colour: '#b3599a',
    tooltip: 'weil（因為）／obwohl（雖然）子句（第 6 關的複習）：插進句尾的洞。動詞被踢到子句「最後」！理由還要符合現在的遊戲狀態——藥送到了就不能再說奧瑪生病囉。',
  },
  {
    type: 'ow_zweck',
    message0: ', %1 %2',
    args0: [
      { type: 'field_dropdown', name: 'KONJ', options: [['?', 'NONE'], ['um', 'um'], ['damit', 'damit']] },
      { type: 'field_dropdown', name: 'ZIEL', options: [
        ['?', 'NONE'],
        ['Anna zu treffen', 'Anna zu treffen'],
        ['ein Kunstbuch zu holen', 'ein Kunstbuch zu holen'],
        ['Oma gesund wird', 'Oma gesund wird'],
        ['Anna sich freut', 'Anna sich freut'],
      ] },
    ],
    inputsInline: true,
    output: 'Nebensatz',
    colour: '#9575cd',
    tooltip: '目的子句（第 4、5 關的複習）：主詞相同（都是我）→ um … zu ＋ 原形；主詞是別人（Oma／Anna）→ damit ＋ 變位動詞。插進句尾的洞！',
  },
  {
    type: 'ow_nachdem',
    message0: ', nachdem ich %1 %2',
    args0: [
      { type: 'field_dropdown', name: 'INHALT', options: [
        ['?', 'NONE'],
        ['das Brot gekauft', 'das Brot gekauft'],
        ['Anna getroffen', 'Anna getroffen'],
        ['aus der Bahn ausgestiegen', 'aus der Bahn ausgestiegen'],
      ] },
      { type: 'field_dropdown', name: 'AUX', options: [['?', 'NONE'], ['habe', 'habe'], ['bin', 'bin'], ['hat', 'hat'], ['ist', 'ist']] },
    ],
    inputsInline: true,
    output: 'Nebensatz',
    colour: '#6d8fb5',
    tooltip: '時間子句（第 4 關的複習）：nachdem ＋ Perfekt，助動詞放子句最後——kaufen／treffen 用 habe、移動動詞 aussteigen 用 bin！而且事情要「真的發生過」才能說。',
  },
  {
    type: 'ow_modal',
    message0: '📝 Ich %1 …',
    args0: [
      { type: 'field_dropdown', name: 'MODAL', options: [['?', 'NONE'], ['möchte', 'möchte'], ['muss', 'muss'], ['möchten', 'möchten'], ['musst', 'musst']] },
    ],
    message1: '%1',
    args1: [
      { type: 'input_statement', name: 'TATEN', check: 'OW' },
    ],
    message2: '✅ … und los!',
    previousStatement: 'OW',
    nextStatement: 'OW',
    colour: '#a3583f',
    tooltip: '情態動詞框架（第 2、5 關的複習）：想要（möchte）／必須（muss）——裡面接「原形」動作積木（跟白日夢同一套），但這次是真的去做：照現實規則走路、搭車、花錢，任務照算！',
  },
  {
    type: 'ow_traum',
    message0: '💭 Wenn ich mehr Zeit %1 ,',
    args0: [
      { type: 'field_dropdown', name: 'HAETTE', options: [['?', 'NONE'], ['hätte', 'hätte'], ['habe', 'habe'], ['hatte', 'hatte'], ['hätten', 'hätten']] },
    ],
    message1: '%1 ich …',
    args1: [
      { type: 'field_dropdown', name: 'WUERDE', options: [['?', 'NONE'], ['würde', 'würde'], ['werde', 'werde'], ['will', 'will']] },
    ],
    message2: '%1',
    args2: [
      { type: 'input_statement', name: 'TRAUM', check: 'OW' },
    ],
    message3: '⏰ dann klingelt der Wecker !',
    previousStatement: 'OW',
    nextStatement: 'OW',
    colour: '#9b5fc9',
    tooltip: '白日夢框架（Konjunktiv II）：與現實相反的假設！裡面接「原形」動作積木（gehen／fahren／kaufen）。夢裡連水面都能走——但醒來人還在原地，夢裡做的事不算數。作夢本身是任務（+3）！',
  },
  {
    type: 'ow_traum_gehen',
    message0: '%1 %2 %3 gehen %4',
    args0: [
      { type: 'field_dropdown', name: 'ADV', options: OW_ADV_OPTIONEN },
      { type: 'field_dropdown', name: 'PRAEP', options: OW_PRAEP_OPTIONEN },
      { type: 'field_dropdown', name: 'ORT', options: OW_ORT_OPTIONEN },
      { type: 'input_value', name: 'NEBEN', check: 'Nebensatz' },
    ],
    inputsInline: true,
    previousStatement: 'OW',
    nextStatement: 'OW',
    colour: '#82b98d',
    tooltip: '原形 gehen 放句尾！接進 möchte／muss 框架＝真的走；接進 würde 夢境＝夢裡走（水面也行）。介係詞照樣配性別；原形後面的洞可插子句。',
  },
  {
    type: 'ow_traum_fahren',
    message0: '%1 %2 Straßenbahn %3 %4 fahren %5',
    args0: [
      { type: 'field_dropdown', name: 'ADV', options: OW_ADV_OPTIONEN },
      { type: 'field_dropdown', name: 'MIT', options: [['?', 'NONE'], ['mit der', 'mit der'], ['mit dem', 'mit dem'], ['mit die', 'mit die']] },
      { type: 'field_dropdown', name: 'PRAEP', options: OW_PRAEP_OPTIONEN },
      { type: 'field_dropdown', name: 'ORT', options: OW_ORT_OPTIONEN },
      { type: 'input_value', name: 'NEBEN', check: 'Nebensatz' },
    ],
    inputsInline: true,
    previousStatement: 'OW',
    nextStatement: 'OW',
    colour: '#8298dd',
    tooltip: '原形 fahren 放句尾！在 möchte／muss 框架裡照現實規則（要到車站、電車只過河）；在 würde 夢裡電車隨叫隨到。原形後面的洞可插子句。',
  },
  {
    type: 'ow_traum_kaufen',
    message0: '%1 %2 %3 %4 %5',
    args0: [
      { type: 'field_dropdown', name: 'ART', options: [['?', 'NONE'], ['einen', 'einen'], ['eine', 'eine'], ['ein', 'ein'], ['den', 'den'], ['die', 'die'], ['das', 'das']] },
      { type: 'field_dropdown', name: 'OBJ', options: [
        ['?', 'NONE'],
        ['🥖 Brot', 'brot'],
        ['🥨 Brezel', 'brezel'],
        ['🌸 Blume', 'blume'],
        ['☕ Kaffee', 'kaffee'],
        ['💊 Medikament', 'medikament'],
        ['📦 Paket', 'paket'],
        ['📖 Kunstbuch', 'buch'],
        ['💎 Zauberstein', 'zauberstein'],
      ] },
      { type: 'input_value', name: 'RELSATZ', check: 'Relsatz' },
      { type: 'field_dropdown', name: 'VERB', options: [
        ['?', 'NONE'],
        ['kaufen', 'kaufen'],
        ['trinken', 'trinken'],
        ['holen', 'holen'],
        ['kaufe', 'kaufe'],
        ['trinke', 'trinke'],
        ['hole', 'hole'],
      ] },
      { type: 'input_value', name: 'NEBEN', check: 'Nebensatz' },
    ],
    inputsInline: true,
    previousStatement: 'OW',
    nextStatement: 'OW',
    colour: '#dda579',
    tooltip: '原形 kaufen／trinken／holen 放句尾！在 möchte／muss 框架裡要真的走到店門口（寶石也要錢）；在 würde 夢裡免錢免排隊、醒來就消失。名詞後可插關係子句（換定冠詞！）、原形後可插子句。',
  },
]);

(function registerOffeneWeltGenerators() {
  const gen = (typeof javascript !== 'undefined')
    ? javascript.javascriptGenerator
    : Blockly.JavaScript;

  // 讀取句尾插槽裡的子句（weil/obwohl、um…zu/damit、nachdem）
  const nebenVon = (block) => {
    const nb = block.getInputTargetBlock('NEBEN');
    if (!nb) return null;
    if (nb.type === 'ow_zweck') {
      return { art: 'zweck', konj: nb.getFieldValue('KONJ'), ziel: nb.getFieldValue('ZIEL') };
    }
    if (nb.type === 'ow_nachdem') {
      return { art: 'nachdem', inhalt: nb.getFieldValue('INHALT'), aux: nb.getFieldValue('AUX') };
    }
    return { art: 'neben', konj: nb.getFieldValue('KONJ'), fakt: nb.getFieldValue('FAKT'), verb: nb.getFieldValue('VERB') };
  };

  gen.forBlock['ow_gehe'] = (block) => {
    const t = {
      adv: block.getFieldValue('ADV'),
      praep: block.getFieldValue('PRAEP'),
      ort: block.getFieldValue('ORT'),
      neben: nebenVon(block),
    };
    return `await cmd9.gehe(${JSON.stringify(t)});\n`;
  };

  gen.forBlock['ow_fahre'] = (block) => {
    const t = {
      adv: block.getFieldValue('ADV'),
      mit: block.getFieldValue('MIT'),
      praep: block.getFieldValue('PRAEP'),
      ort: block.getFieldValue('ORT'),
      neben: nebenVon(block),
    };
    return `await cmd9.fahre(${JSON.stringify(t)});\n`;
  };

  gen.forBlock['ow_kaufe'] = (block) => {
    const rb = block.getInputTargetBlock('RELSATZ');
    const t = {
      verb: block.getFieldValue('VERB'),
      art: block.getFieldValue('ART'),
      obj: block.getFieldValue('OBJ'),
      rel: rb ? { rel: rb.getFieldValue('REL'), inhalt: rb.getFieldValue('INHALT') } : null,
      neben: nebenVon(block),
    };
    return `await cmd9.kaufe(${JSON.stringify(t)});\n`;
  };

  // 子句積木單獨飄在外面 → 教學錯誤（同第 7 關的 relsatzAllein 模式）
  gen.forBlock['ow_relsatz'] = () => ['(await cmd9.relsatzAllein())', 0];
  gen.forBlock['ow_nebensatz'] = () => ['(await cmd9.nebensatzAllein())', 0];

  // 收集框架容器裡的原形動作積木（夢境框架與情態動詞框架共用）：
  // 直接讀取每一塊的欄位（不執行它們的產生器），
  // 這樣「現實積木誤入框架」也能被指令層攔下來教學。
  const sammleTeile = (frame, inputName) => {
    const teile = [];
    let b = frame.getInputTargetBlock(inputName);
    while (b) {
      if (b.type === 'ow_traum_gehen') {
        teile.push({
          id: b.id, typ: 'gehen',
          adv: b.getFieldValue('ADV'),
          praep: b.getFieldValue('PRAEP'),
          ort: b.getFieldValue('ORT'),
          neben: nebenVon(b),
        });
      } else if (b.type === 'ow_traum_fahren') {
        teile.push({
          id: b.id, typ: 'fahren',
          adv: b.getFieldValue('ADV'),
          mit: b.getFieldValue('MIT'),
          praep: b.getFieldValue('PRAEP'),
          ort: b.getFieldValue('ORT'),
          neben: nebenVon(b),
        });
      } else if (b.type === 'ow_traum_kaufen') {
        const rb = b.getInputTargetBlock('RELSATZ');
        teile.push({
          id: b.id, typ: 'kaufen',
          art: b.getFieldValue('ART'),
          obj: b.getFieldValue('OBJ'),
          verb: b.getFieldValue('VERB'),
          rel: rb ? { rel: rb.getFieldValue('REL'), inhalt: rb.getFieldValue('INHALT') } : null,
          neben: nebenVon(b),
        });
      } else if (b.type === 'ow_gehe' || b.type === 'ow_fahre' || b.type === 'ow_kaufe') {
        teile.push({ id: b.id, typ: 'indikativ' });
      } else {
        teile.push({ id: b.id, typ: 'fremd' });
      }
      b = b.getNextBlock();
    }
    return teile;
  };

  gen.forBlock['ow_traum'] = (block) => {
    const t = {
      haette: block.getFieldValue('HAETTE'),
      wuerde: block.getFieldValue('WUERDE'),
      teile: sammleTeile(block, 'TRAUM'),
    };
    return `await cmd9.traeume(${JSON.stringify(t)}, highlightBlock);\n`;
  };

  gen.forBlock['ow_modal'] = (block) => {
    const t = {
      modal: block.getFieldValue('MODAL'),
      teile: sammleTeile(block, 'TATEN'),
    };
    return `await cmd9.plane(${JSON.stringify(t)}, highlightBlock);\n`;
  };

  // 原形動作積木單獨飄在主程式裡（沒接進框架）→ 教學錯誤
  const ohneWuerde = () => 'await cmd9.ohneWuerde();\n';
  gen.forBlock['ow_traum_gehen'] = ohneWuerde;
  gen.forBlock['ow_traum_fahren'] = ohneWuerde;
  gen.forBlock['ow_traum_kaufen'] = ohneWuerde;

  // 目的／時間子句單獨飄在外面 → 教學錯誤
  gen.forBlock['ow_zweck'] = () => ['(await cmd9.nebensatzAllein())', 0];
  gen.forBlock['ow_nachdem'] = () => ['(await cmd9.nebensatzAllein())', 0];
})();

const TOOLBOX_OW = {
  kind: 'flyoutToolbox',
  contents: [
    { kind: 'label', text: '🚶 Gehen 走路' },
    { kind: 'block', type: 'ow_gehe' },
    { kind: 'sep', gap: 24 },
    { kind: 'label', text: '🚋 Fahren 搭電車（過河用）' },
    { kind: 'block', type: 'ow_fahre' },
    { kind: 'sep', gap: 24 },
    { kind: 'label', text: '🛍️ Kaufen · Trinken · Holen 買·喝·拿' },
    { kind: 'block', type: 'ow_kaufe' },
    { kind: 'sep', gap: 24 },
    { kind: 'label', text: '📎 Nebensätze 子句（插進句尾／名詞後的洞）' },
    { kind: 'block', type: 'ow_nebensatz' },
    { kind: 'block', type: 'ow_zweck' },
    { kind: 'block', type: 'ow_nachdem' },
    { kind: 'block', type: 'ow_relsatz' },
    { kind: 'sep', gap: 24 },
    { kind: 'label', text: '📝 Rahmen 框架（möchte／muss＝真的做，würde＝作夢）' },
    { kind: 'block', type: 'ow_modal' },
    { kind: 'block', type: 'ow_traum' },
    { kind: 'sep', gap: 24 },
    { kind: 'label', text: '🧩 Infinitive 原形動作（接進上面的框架）' },
    { kind: 'block', type: 'ow_traum_gehen' },
    { kind: 'block', type: 'ow_traum_fahren' },
    { kind: 'block', type: 'ow_traum_kaufen' },
  ],
};

/* ================= 工具箱 ================= */

const TOOLBOX = {
  kind: 'flyoutToolbox',
  contents: [
    { kind: 'label', text: '🚶 Bewegung 移動' },
    { kind: 'block', type: 'de_geh', inputs: { RICHTUNG: { shadow: { type: 'de_nach_vorne' } } } },
    { kind: 'block', type: 'de_dreh', inputs: { RICHTUNG: { shadow: { type: 'de_nach_links' } } } },
    { kind: 'block', type: 'de_dreh_um' },
    { kind: 'block', type: 'de_nach_vorne' },
    { kind: 'block', type: 'de_nach_links' },
    { kind: 'block', type: 'de_nach_rechts' },
    { kind: 'sep', gap: 24 },
    { kind: 'label', text: '✋ Sachen 物品' },
    { kind: 'block', type: 'de_nimm', inputs: { NOMEN: { shadow: { type: 'de_muenze' } } } },
    { kind: 'block', type: 'de_kaufe', inputs: { NOMEN: { shadow: { type: 'de_schluessel' } } } },
    { kind: 'block', type: 'de_oeffne', inputs: { NOMEN: { shadow: { type: 'de_tuer' } } } },
    { kind: 'block', type: 'de_muenze' },
    { kind: 'block', type: 'de_schluessel' },
    { kind: 'block', type: 'de_tuer' },
    { kind: 'sep', gap: 24 },
    { kind: 'label', text: '🔁 Wiederholen 重複' },
    {
      kind: 'block',
      type: 'controls_repeat_ext',
      inputs: {
        TIMES: { shadow: { type: 'math_number', fields: { NUM: 3 } } },
      },
    },
  ],
};
