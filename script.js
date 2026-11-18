"use strict";

const routes = [
  { id: "R01", tujuan: "Banjarmasin", tarif: 150000, jarak: 190 },
  { id: "R02", tujuan: "Sampit", tarif: 160000, jarak: 220 },
  { id: "R03", tujuan: "Kasongan", tarif: 70000, jarak: 85 },
  { id: "R04", tujuan: "Kapuas", tarif: 90000, jarak: 140 },
  { id: "R05", tujuan: "Pangkalan Bun", tarif: 280000, jarak: 450 },
  { id: "R06", tujuan: "Pulang Pisau", tarif: 60000, jarak: 95 },
];

const activities = [
  { id: "C1", mulai: 360, selesai: 600, biaya: 750000 },
  { id: "C2", mulai: 480, selesai: 720, biaya: 850000 },
  { id: "C3", mulai: 630, selesai: 870, biaya: 900000 },
  { id: "C4", mulai: 720, selesai: 1020, biaya: 1100000 },
  { id: "C5", mulai: 900, selesai: 1140, biaya: 800000 },
];

const packages = [
  { id: "P1", muatan: "Dokumen & Sparepart Mesin", berat: 15, ongkir: 120000 },
  { id: "P2", muatan: "Tekstil & Pakaian Konveksi", berat: 25, ongkir: 220000 },
  { id: "P3", muatan: "Paket Elektronik Ringan", berat: 10, ongkir: 90000 },
  { id: "P4", muatan: "Kotak Perlengkapan Usaha", berat: 30, ongkir: 290000 },
  { id: "P5", muatan: "Kerajinan & Makanan Kering", berat: 20, ongkir: 170000 },
];

const capacity = 60;

// Setiap baris menyimpan lima ulangan dan rata-rata dari lampiran asli.
const mergeTimes = [
  [10, 0.003892, 0.003701, 0.004378, 0.004235, 0.004787, 0.004199],
  [100, 0.061279, 0.066523, 0.062016, 0.081942, 0.062153, 0.066782],
  [1000, 0.920219, 0.882942, 0.999877, 1.039061, 0.977529, 0.963925],
];

const activityTimes = [
  [10, 0.0070, 0.0026, 0.0018, 0.0017, 0.0015, 0.0029, 4],
  [100, 0.0148, 0.0128, 0.0118, 0.0118, 0.0117, 0.0126, 8],
  [1000, 0.1911, 0.1599, 0.1858, 0.1476, 0.1455, 0.1660, 14],
  [10000, 3.4633, 2.7201, 3.8499, 2.9252, 2.5837, 3.1084, 14],
];

const knapsackTimes = [
  [5, 60, 0.0299, 0.0308, 0.0320, 0.0315, 0.0337, 0.0316, 60, 550000],
  [10, 60, 0.0683, 0.0610, 0.0619, 0.0645, 0.0629, 0.0637, 60, 790000],
  [20, 60, 0.1269, 0.1303, 0.1194, 0.1245, 0.1290, 0.1260, 60, 970000],
  [50, 60, 0.4016, 0.3531, 0.3353, 0.3160, 0.3115, 0.3435, 59, 1590000],
  [20, 30, 0.0530, 0.0522, 0.0500, 0.0520, 0.0521, 0.0518, 30, 650000],
  [20, 90, 0.1890, 0.1912, 0.1951, 0.1919, 0.1901, 0.1914, 90, 1260000],
  [20, 120, 0.2673, 0.2553, 0.2620, 0.2581, 0.2576, 0.2601, 120, 1540000],
];

function buildMergeDemo(items) {
  const frames = [{ type: "start" }];

  function sort(group, key) {
    const node = { key, group };
    if (group.length < 2) {
      node.sorted = group;
      frames.push({ type: "base", node });
      return node;
    }

    const mid = Math.floor(group.length / 2);
    frames.push({ type: "split", node });
    node.left = sort(group.slice(0, mid), key + "0");
    node.right = sort(group.slice(mid), key + "1");

    const left = node.left.sorted;
    const right = node.right.sorted;
    const sorted = [];
    const picks = [];
    let i = 0;
    let j = 0;
    while (i < left.length && j < right.length) {
      const a = left[i];
      const b = right[j];
      const pick = a.tarif <= b.tarif ? left[i++] : right[j++];
      sorted.push(pick);
      picks.push({ a, b, pick });
    }
    node.sorted = sorted.concat(left.slice(i), right.slice(j));
    frames.push({ type: "merge", node, picks });
    return node;
  }

  const root = sort(items, "r");
  frames.push({ type: "result", sorted: root.sorted });
  return { frames, root };
}

function buildActivityDemo(items) {
  const sorted = [...items].sort((a, b) => a.selesai - b.selesai);
  const frames = [{ type: "start" }, { type: "sorted" }];
  const picked = [];
  let last = null;

  for (const item of sorted) {
    const take = last === null || item.mulai >= last.selesai;
    frames.push({ type: "check", item, last, take });
    if (take) {
      picked.push(item);
      last = item;
    }
  }
  frames.push({ type: "result", picked });
  return { frames, sorted };
}

function buildKnapsackDemo(items, maxWeight) {
  const dp = Array.from({ length: items.length + 1 }, () => Array(maxWeight + 1).fill(0));
  const frames = [{ type: "start" }, { type: "base", i: 0 }];

  for (let i = 1; i <= items.length; i++) {
    const item = items[i - 1];
    for (let w = 0; w <= maxWeight; w++) {
      const skip = dp[i - 1][w];
      dp[i][w] = item.berat <= w
        ? Math.max(skip, item.ongkir + dp[i - 1][w - item.berat])
        : skip;
    }
    frames.push({ type: "fill", i, item });
  }

  const picked = [];
  let w = maxWeight;
  for (let i = items.length; i > 0; i--) {
    const item = items[i - 1];
    const before = w;
    const take = dp[i][w] > dp[i - 1][w];
    if (take) {
      picked.push(item);
      w -= item.berat;
    }
    frames.push({ type: "trace", i, item, before, after: w, take });
  }

  frames.push({ type: "result", picked: picked.reverse(), total: dp[items.length][maxWeight] });
  return { frames, dp, items, capacity: maxWeight };
}

const demos = {
  merge: {
    title: "Merge Sort",
    description: "Urutkan tarif enam rute dari yang termurah.",
    method: "Lima percobaan per ukuran input. Setiap percobaan merata-ratakan 200 pengurutan.",
    ...buildMergeDemo(routes),
  },
  activity: {
    title: "Activity Selection",
    description: "Pilih sebanyak mungkin pesanan carter tanpa bentrok.",
    method: "Lima percobaan per ukuran input. Waktu mencakup proses algoritma di Python.",
    ...buildActivityDemo(activities),
  },
  knapsack: {
    title: "0/1 Knapsack",
    description: "Maksimalkan ongkir paket titipan dengan batas 60 kg.",
    method: "Lima percobaan per skenario, masing-masing 1.000 eksekusi. Kapasitas dan jumlah paket diuji secara terpisah.",
    ...buildKnapsackDemo(packages, capacity),
  },
};

const analyses = {
  merge: {
    time: "O(n log n)",
    space: "O(n)",
    trend: "Rata-rata naik dari 0,004199 ms untuk 10 rute menjadi 0,963925 ms untuk 1.000 rute. Penggabungan memproses total n data per tingkat, dan jumlah tingkat tumbuh secara logaritmik.",
    strength: "Pengurutan stabil, sehingga rute dengan tarif yang sama mempertahankan urutan awal.",
    limit: "Penggabungan membutuhkan daftar sementara dan pemanggilan rekursif.",
  },
  activity: {
    time: "O(n log n) · kasus terburuk",
    space: "O(n)",
    trend: "Rata-rata naik dari 0,0029 ms untuk 10 jadwal menjadi 3,1084 ms untuk 10.000 jadwal. Pengurutan mendominasi waktu, sedangkan seleksi memeriksa setiap jadwal sekali.",
    strength: "Memilih jumlah pesanan terbanyak tanpa bentrok untuk satu kendaraan.",
    limit: "Untuk memaksimalkan pendapatan, model perlu memperhitungkan bobot atau nilai sewa tiap pesanan.",
  },
  knapsack: {
    time: "O(n × W)",
    space: "O(n × W)",
    trend: "Pada kapasitas 60 kg, rata-rata naik dari 0,0316 ms untuk 5 paket menjadi 0,3435 ms untuk 50 paket. Pada 20 paket, kenaikan kapasitas dari 30 ke 120 kg meningkatkan rata-rata dari 0,0518 menjadi 0,2601 ms. Paket menambah baris tabel DP dan kapasitas menambah kolom.",
    strength: "Menemukan ongkir maksimum dalam batas kapasitas serta menunjukkan paket pembentuk hasilnya.",
    limit: "Kapasitas bernilai besar menambah waktu dan memori untuk tabel DP.",
  },
};

const flowcharts = {
  merge: {
    file: "flowchart_merge_sort.png",
    alt: "Alur Merge Sort. Periksa kasus dasar, bagi dan urutkan kedua bagian secara rekursif, lalu gabungkan dengan membandingkan tarif.",
  },
  activity: {
    file: "flowchart_activity_selection.png",
    alt: "Alur Activity Selection. Urutkan jadwal menurut jam selesai, lalu terima jadwal berikutnya jika waktu mulainya sama dengan atau melebihi jam selesai terakhir.",
  },
  knapsack: {
    file: "flowchart_knapsack.png",
    alt: "Alur 0/1 Knapsack. Isi tabel DP dengan pilihan ambil atau lewati, lalu telusuri tabel dari baris terakhir untuk menemukan paket terpilih.",
  },
};

const pythonExamples = {
  merge: {
    source: `def merge_sort(data):
    if len(data) <= 1:
        return data[:]

    tengah = len(data) // 2
    kiri = merge_sort(data[:tengah])
    kanan = merge_sort(data[tengah:])
    return merge(kiri, kanan)


def merge(kiri, kanan):
    hasil = []
    i = 0
    j = 0

    while i < len(kiri) and j < len(kanan):
        if kiri[i]["tarif"] <= kanan[j]["tarif"]:
            hasil.append(kiri[i])
            i += 1
        else:
            hasil.append(kanan[j])
            j += 1

    hasil.extend(kiri[i:])
    hasil.extend(kanan[j:])
    return hasil`,
    highlights: {
      start: [1],
      split: [2, 5, 6, 7],
      base: [2, 3],
      result: [8, 26],
    },
  },
  activity: {
    source: `def activity_selection(jadwal):
    urut = sorted(jadwal, key=lambda j: j["selesai"])
    if not urut:
        return []
    terpilih = [urut[0]]
    selesai_terakhir = urut[0]["selesai"]

    for j in urut[1:]:
        if j["mulai"] >= selesai_terakhir:
            terpilih.append(j)
            selesai_terakhir = j["selesai"]

    return terpilih`,
    highlights: {
      start: [1],
      sorted: [2],
      result: [13],
    },
  },
  knapsack: {
    source: `def knapsack_01(data_bagasi, kapasitas):
    n = len(data_bagasi)
    dp = [[0] * (kapasitas + 1) for _ in range(n + 1)]

    for i, paket in enumerate(data_bagasi, start=1):
        for w in range(kapasitas + 1):
            lewati = dp[i - 1][w]
            dp[i][w] = lewati
            if paket.berat <= w:
                ambil = paket.ongkir + dp[i - 1][w - paket.berat]
                dp[i][w] = max(lewati, ambil)

    terpilih = []
    w = kapasitas
    for i in range(n, 0, -1):
        paket = data_bagasi[i - 1]
        if dp[i][w] > dp[i - 1][w]:
            terpilih.append(paket)
            w -= paket.berat

    terpilih.reverse()
    return terpilih, dp[n][kapasitas]`,
    highlights: {
      start: [1],
      base: [2, 3],
      result: [21, 22],
    },
  },
};

const $ = id => document.getElementById(id);
const formatInteger = new Intl.NumberFormat("id-ID");
const decimalFormats = new Map([4, 6].map(precision => [precision, new Intl.NumberFormat("id-ID", {
  minimumFractionDigits: precision,
  maximumFractionDigits: precision,
})]));
const number = value => formatInteger.format(value);
const currency = value => "Rp" + number(value);
const decimal = (value, precision) => decimalFormats.get(precision).format(value);
const sum = (items, key) => items.reduce((total, item) => total + item[key], 0);
const escapeHtml = value => String(value).replace(/[&<>"']/g, character => ({
  "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
}[character]));
const time = minutes => [Math.floor(minutes / 60), minutes % 60]
  .map(part => String(part).padStart(2, "0")).join(".");
const intervalLabel = item => time(item.mulai) + "–" + time(item.selesai);

function pythonMarkup(source) {
  const keywords = new Set([
    "and", "def", "else", "for", "if", "in", "lambda", "not", "return", "while",
  ]);
  const tokens = /("[^"\n]*"|'[^'\n]*'|#[^\n]*|\b\d+\b|\b[a-zA-Z_]\w*\b)/g;
  let result = "";
  let previous = 0;
  for (const match of source.matchAll(tokens)) {
    const token = match[0];
    result += escapeHtml(source.slice(previous, match.index));
    let css = "";
    if (keywords.has(token)) css = "python-keyword";
    else if (token.startsWith('"') || token.startsWith("'")) css = "python-string";
    else if (token.startsWith("#")) css = "python-comment";
    else if (/^\d+$/.test(token)) css = "python-number";
    result += css ? `<span class="${css}">${escapeHtml(token)}</span>` : escapeHtml(token);
    previous = match.index + token.length;
  }
  return result + escapeHtml(source.slice(previous));
}

function codeSelection(key, frame, selectedWeight) {
  if (key === "merge" && frame.type === "merge") {
    const lines = [12, 13, 14, 16, 17];
    if (frame.picks.some(step => step.pick === step.a)) lines.push(18, 19);
    if (frame.picks.some(step => step.pick === step.b)) lines.push(20, 21, 22);
    lines.push(24, 25, 26);
    return { lines, focus: 16 };
  }
  if (key === "activity" && frame.type === "check") {
    if (frame.last === null) return { lines: [5, 6] };
    return { lines: frame.take ? [8, 9, 10, 11] : [8, 9] };
  }
  if (key === "knapsack" && frame.type === "fill") {
    const lines = [5, 6, 7, 8, 9];
    if (frame.item.berat <= selectedWeight) lines.push(10, 11);
    return { lines };
  }
  if (key === "knapsack" && frame.type === "trace") {
    const lines = frame.i === packages.length ? [13, 14] : [];
    lines.push(15, 16, 17);
    if (frame.take) lines.push(18, 19);
    return { lines };
  }
  const lines = pythonExamples[key].highlights[frame.type];
  return { lines, focus: frame.type === "result" ? lines.at(-1) : lines[0] };
}

function renderCode(key, frame, selectedWeight) {
  const code = $("python-code");
  const viewport = $("code-view");
  if (code.dataset.algorithm !== key) {
    code.innerHTML = pythonExamples[key].source.split("\n").map((line, index) =>
      `<span class="code-line" data-line="${index + 1}"><span class="code-number" aria-hidden="true">${index + 1}</span><span class="code-source">${pythonMarkup(line) || " "}</span></span>`
    ).join("");
    code.dataset.algorithm = key;
    viewport.scrollLeft = 0;
    viewport.scrollTop = 0;
  }

  const { lines, focus = lines[0] } = codeSelection(key, frame, selectedWeight);
  for (const line of code.querySelectorAll(".code-line")) {
    const lineNumber = Number(line.dataset.line);
    line.classList.toggle("is-active", lines.includes(lineNumber));
    if (lineNumber === focus) line.setAttribute("aria-current", "step");
    else line.removeAttribute("aria-current");
  }
  $("code-lines").textContent = "Baris " + lines.join(", ");
  $("code-lines").title = "Baris tersorot " + lines.join(", ");

  const active = code.querySelector(`[data-line="${focus}"]`);
  const bounds = viewport.getBoundingClientRect();
  const position = active.getBoundingClientRect();
  if (position.top < bounds.top + 20 || position.bottom > bounds.bottom - 20) {
    viewport.scrollTop += position.top - bounds.top - 24;
  }
}

function stats(pairs = []) {
  if (pairs.length === 0) return "";
  return '<dl class="step-data">' + pairs.map(([label, value]) =>
    `<div><dt>${escapeHtml(label)}</dt><dd>${escapeHtml(value)}</dd></div>`
  ).join("") + "</dl>";
}

function table(headers, rows, { css = "data-table", numeric = [] } = {}) {
  const alignment = index => numeric.includes(index) ? ' class="num"' : "";
  const head = headers.map((header, index) =>
    `<th scope="col"${alignment(index)}>${escapeHtml(header)}</th>`
  ).join("");
  const body = rows.map(row => {
    const cells = row.map((value, column) => column === 0
      ? `<th scope="row"${alignment(column)}>${escapeHtml(value)}</th>`
      : `<td${alignment(column)}>${escapeHtml(value)}</td>`
    ).join("");
    return `<tr>${cells}</tr>`;
  }).join("");
  return `<div class="scroll-x" tabindex="0"><table class="${css}"><thead><tr>${head}</tr></thead><tbody>${body}</tbody></table></div>`;
}

function routeTable(items) {
  return table(["ID", "Tujuan dari Palangka Raya", "Tarif", "Jarak (km)"], items.map(item => [
    item.id, item.tujuan, currency(item.tarif), number(item.jarak),
  ]), { numeric: [2, 3] });
}

function packageTable(items) {
  return table(["Paket", "Jenis muatan", "Bobot (kg)", "Ongkir"], items.map(item => [
    item.id, item.muatan, number(item.berat), currency(item.ongkir),
  ]), { numeric: [2, 3] });
}

const ids = items => items.map(item => item.id).join(", ");

function treeMarkup(node, states, activeKey) {
  const state = states.get(node.key);
  const group = state === "merge" ? node.sorted : node.group;
  const style = node.key === activeKey ? "is-active" : state === "base" || state === "merge" ? "is-sorted" : "";
  const cards = group.map(item => `
    <span class="route-chip" title="${escapeHtml(item.tujuan)}">
      <strong>${item.id}</strong><span>${currency(item.tarif)}</span>
    </span>`).join("");
  const children = state === "split" || state === "merge"
    ? `<div class="tree-children">${treeMarkup(node.left, states, activeKey)}${treeMarkup(node.right, states, activeKey)}</div>`
    : "";
  return `<div class="tree-node"><div class="node-cards ${style}">${cards}</div>${children}</div>`;
}

function renderMerge(demo, frame, index) {
  if (frame.type === "start") {
    return {
      label: "Tabel 3.1 · Tarif rute",
      visual: routeTable(routes),
      title: "Data awal",
      description: "Enam tarif masih mengikuti urutan rute pada panduan. Mulai dengan membagi daftar menjadi dua.",
      details: [["Jumlah rute", routes.length], ["Kunci pengurutan", "Tarif tiket"]],
    };
  }
  if (frame.type === "result") {
    return {
      label: "Rute dari termurah ke termahal",
      visual: routeTable(frame.sorted),
      title: "Pengurutan selesai",
      description: "Kedua bagian yang sudah terurut digabung menjadi satu daftar. Setiap rute tetap membawa tarif dan jaraknya.",
      details: [["Termurah", currency(frame.sorted[0].tarif)], ["Termahal", currency(frame.sorted.at(-1).tarif)]],
    };
  }

  const states = new Map();
  for (const step of demo.frames.slice(1, index + 1)) {
    states.set(step.node.key, step.type);
  }
  const visual = `<div class="scroll-x" tabindex="0"><div class="tree">${treeMarkup(demo.root, states, frame.node.key)}</div></div>`;
  const common = { label: "Pohon pembagian rute", visual };
  if (frame.type === "split") {
    return {
      ...common,
      title: "Bagi kelompok",
      description: `Pisahkan ${frame.node.group.length} rute menjadi dua kelompok. Telusuri kelompok kiri terlebih dahulu.`,
      details: [["Kiri", ids(frame.node.left.group)], ["Kanan", ids(frame.node.right.group)]],
    };
  }
  if (frame.type === "base") {
    const [item] = frame.node.group;
    return {
      ...common,
      title: "Kasus dasar",
      description: `${item.id} sudah terurut sebagai kelompok satu rute.`,
      details: [["Tujuan", item.tujuan], ["Tarif", currency(item.tarif)]],
    };
  }

  const first = frame.picks[0];
  return {
    ...common,
    title: "Gabung dua kelompok",
    description: `Bandingkan ${first.a.id} (${currency(first.a.tarif)}) dan ${first.b.id} (${currency(first.b.tarif)}). Masukkan ${first.pick.id} lebih dulu, lalu lanjutkan sampai kelompok habis.`,
    details: [
      ["Kiri", ids(frame.node.left.sorted)],
      ["Kanan", ids(frame.node.right.sorted)],
      ["Hasil gabung", ids(frame.node.sorted)],
    ],
  };
}

function activityTable(items) {
  return table(["Carter", "Mulai", "Selesai", "Biaya sewa"], items.map(item => [
    item.id, time(item.mulai), time(item.selesai), currency(item.biaya),
  ]), { numeric: [3] });
}

function timeline(items, frames, frame) {
  const first = Math.min(...items.map(item => item.mulai));
  const end = Math.max(...items.map(item => item.selesai));
  const size = end - first;
  const position = minutes => ((minutes - first) / size) * 100;
  const ticks = [360, 480, 600, 720, 840, 960, 1080, 1140];
  const decisions = new Map(frames.filter(step => step.type === "check").map(step => [step.item.id, step.take]));
  const marker = frame.last
    ? `<span class="time-marker" style="left:${position(frame.last.selesai)}%"></span>`
    : "";
  const axis = ticks.map(tick => `<span class="tick-label" style="left:${position(tick)}%">${time(tick)}</span>`).join("");
  const rows = items.map(item => {
    const active = item.id === frame.item?.id;
    const accepted = decisions.get(item.id);
    const status = accepted === true ? "Diterima" : accepted === false ? "Ditolak" : "Menunggu";
    const css = accepted === true ? "is-taken" : accepted === false ? "is-rejected" : "is-undecided";
    return `
      <div class="timeline-row ${active ? "is-active" : ""}">
        <div class="timeline-label"><strong>${item.id}</strong><span>${intervalLabel(item)}</span></div>
        <div class="lane" aria-hidden="true">
          <span class="interval ${decisions.has(item.id) ? css : ""}"
            style="left:${position(item.mulai)}%;width:${position(item.selesai) - position(item.mulai)}%"></span>
          ${active ? marker : ""}
        </div>
        <span class="timeline-status ${css}">${status}</span>
      </div>`;
  }).join("");
  return `<div class="scroll-x" tabindex="0"><div class="timeline">
    <div class="timeline-row" aria-hidden="true"><span></span><div class="timeline-axis">${axis}</div><span></span></div>
    ${rows}
    </div></div>${marker ? '<p class="subtle-note"><span class="marker-key"></span> Jam selesai carter terakhir yang diterima</p>' : ""}`;
}

function renderActivity(demo, frame, index) {
  if (frame.type === "start") {
    return {
      label: "Tabel 3.2 · Pesanan carter",
      visual: activityTable(activities),
      title: "Data awal",
      description: "Setiap pesanan memiliki jam mulai dan jam selesai. Tujuannya memilih sebanyak mungkin pesanan yang bisa dilayani satu kendaraan.",
      details: [["Jumlah pesanan", activities.length]],
    };
  }
  if (frame.type === "result") {
    return {
      label: "Jadwal yang diterima",
      visual: activityTable(frame.picked),
      title: "Seleksi selesai",
      description: "C1, C3, dan C5 diterima. Masing-masing dimulai sesudah pesanan sebelumnya selesai.",
      details: [["Jumlah pesanan", frame.picked.length], ["Total biaya sewa", currency(sum(frame.picked, "biaya"))]],
    };
  }
  const visual = timeline(demo.sorted, demo.frames.slice(0, index + 1), frame);
  if (frame.type === "sorted") {
    return {
      label: "Jadwal menurut jam selesai",
      visual,
      title: "Urutkan jam selesai",
      description: "Jadwal dengan jam selesai paling awal diperiksa lebih dulu. Pada data ini urutan awal C1 sampai C5 sudah mengikuti jam selesai.",
      details: [["Urutan pemeriksaan", ids(demo.sorted)]],
    };
  }

  const { item, last, take } = frame;
  const description = last === null
    ? `${item.id} adalah pesanan yang selesai paling awal.`
    : take
      ? `${item.id} mulai pukul ${time(item.mulai)}, setelah ${last.id} selesai pukul ${time(last.selesai)}.`
      : `${item.id} mulai pukul ${time(item.mulai)}, ketika ${last.id} masih berlangsung sampai ${time(last.selesai)}.`;
  return {
    label: "Garis waktu pesanan carter",
    visual,
    title: `${item.id} ${take ? "diterima" : "ditolak"}`,
    description,
    details: [[`Jadwal ${item.id}`, intervalLabel(item)], ["Selesai terakhir", last ? time(last.selesai) : "—"]],
  };
}

function dpTable(demo, frame, selected, expanded) {
  const { dp, items, capacity: maxWeight } = demo;
  const columns = Array.from({ length: maxWeight + 1 }, (_, weight) => weight)
    .filter(weight => expanded || weight % 10 === 0 || weight === maxWeight);
  const lastRow = frame.type === "trace" ? items.length : frame.i;
  const activeWeight = frame.type === "trace" ? frame.before : selected;
  const head = columns.map(weight => `<th scope="col">${weight}</th>`).join("");
  const rows = dp.map((row, i) => {
    const label = i === 0 ? "Awal" : items[i - 1].id;
    const cells = columns.map(weight => {
      if (i > lastRow) return '<td class="cell-empty">—</td>';
      const active = frame.type !== "base" && i === frame.i && weight === activeWeight;
      const takeWeight = activeWeight - (frame.item?.berat ?? 0);
      const reference = frame.type !== "base" && i === frame.i - 1 &&
        (weight === activeWeight || (frame.type === "fill" && weight === takeWeight));
      const css = active ? "cell-result" : reference ? "cell-reference" : "";
      const value = number(row[weight]);
      const content = frame.type === "fill" && i === frame.i
        ? `<button type="button" data-weight="${weight}" aria-pressed="${active}" aria-label="${label}, ${weight} kg, ${currency(row[weight])}">${value}</button>`
        : value;
      return `<td class="${css}">${content}</td>`;
    }).join("");
    return `<tr><th class="row-label" scope="row">${label}</th>${cells}</tr>`;
  }).join("");
  return `<div class="scroll-x" tabindex="0"><table class="dp-table"><thead><tr>
    <th class="row-label" scope="col">Paket</th>${head}
    </tr></thead><tbody>${rows}</tbody></table></div>`;
}

function renderKnapsack(demo, frame, selected, expanded) {
  if (frame.type === "start") {
    return {
      label: "Tabel 3.3 · Paket titipan kargo",
      visual: packageTable(packages),
      title: "Data awal",
      description: "Setiap paket bisa diambil satu kali. Pilih kombinasi dengan total ongkir tertinggi dalam batas kapasitas.",
      details: [["Jumlah paket", packages.length], ["Kapasitas", capacity + " kg"]],
    };
  }
  if (frame.type === "result") {
    return {
      label: "Kombinasi paket optimal",
      visual: packageTable(frame.picked),
      title: "Ongkir maksimum",
      description: "P3, P4, dan P5 mengisi kapasitas 60 kg. Ongkir totalnya sama dengan nilai di sudut kanan bawah tabel DP.",
      details: [["Total bobot", sum(frame.picked, "berat") + " kg"], ["Total ongkir", currency(frame.total)]],
    };
  }

  const note = frame.type === "fill" ? " Pilih angka di baris aktif untuk melihat perhitungannya." : "";
  const visual = dpTable(demo, frame, selected, expanded) +
    `<p class="subtle-note">Kolom menunjukkan kapasitas (kg). Nilai sel dalam rupiah.${note}</p>`;
  const common = { label: "Tabel Dynamic Programming", visual, showToggle: true };
  if (frame.type === "base") {
    return {
      ...common,
      title: "Inisialisasi tabel",
      description: "Baris awal bernilai nol. Ongkir terbaik dengan nol paket selalu Rp0 untuk kapasitas berapa pun.",
      details: [["Ukuran tabel", `${demo.dp.length} baris × ${demo.capacity + 1} kolom`]],
    };
  }
  if (frame.type === "fill") {
    const { i, item } = frame;
    const skip = demo.dp[i - 1][selected];
    const remaining = selected - item.berat;
    const fits = remaining >= 0;
    const take = fits ? currency(item.ongkir) + " + " + currency(demo.dp[i - 1][remaining]) : "Melebihi kapasitas";
    return {
      ...common,
      title: `Isi baris ${item.id}`,
      description: `Untuk kapasitas ${selected} kg, hitung ongkir terbaik jika ${item.id} dilewati atau diambil. Bobot ${item.id} adalah ${item.berat} kg.`,
      details: [["Lewati", currency(skip)], ["Ambil", take], ["Nilai sel", currency(demo.dp[i][selected])]],
    };
  }

  const { item, i, before, after, take } = frame;
  const current = demo.dp[i][before];
  const previous = demo.dp[i - 1][before];
  return {
    ...common,
    title: `${item.id} ${take ? "diambil" : "dilewati"}`,
    description: take
      ? `Nilai tabel bertambah dari ${currency(previous)} menjadi ${currency(current)} saat ${item.id} tersedia. Ambil paket, lalu kurangi kapasitas tersisa sebesar ${item.berat} kg.`
      : `Nilainya tetap ${currency(current)} ketika ${item.id} tersedia. Lewati paket dan lanjutkan ke baris sebelumnya.`,
    details: [["Sisa sebelum", before + " kg"], ["Sisa sesudah", after + " kg"]],
  };
}

const trialColumns = ["U1", "U2", "U3", "U4", "U5", "Rata-rata"];
const formatTrials = (row, start, precision) => row.slice(start, start + 6).map(value => decimal(value, precision));

function benchmarkGroups(key) {
  if (key === "merge") {
    return [{
      title: "Pengaruh jumlah rute",
      xLabel: "Jumlah rute n (skala log₁₀)",
      logX: true,
      rows: mergeTimes.map(row => [number(row[0]), ...formatTrials(row, 1, 6)]),
      points: mergeTimes.map(row => [row[0], row[6]]),
      headers: ["n", ...trialColumns],
    }];
  }
  if (key === "activity") {
    return [{
      title: "Pengaruh jumlah jadwal",
      xLabel: "Jumlah jadwal n (skala log₁₀)",
      logX: true,
      rows: activityTimes.map(row => [number(row[0]), ...formatTrials(row, 1, 4), row[7], "Ya"]),
      points: activityTimes.map(row => [row[0], row[6]]),
      headers: ["n", ...trialColumns, "Terpilih", "Tanpa bentrok"],
    }];
  }
  return [
    {
      title: "Kapasitas tetap 60 kg",
      xLabel: "Jumlah paket n",
      dimension: 0,
      data: knapsackTimes.filter(row => row[1] === 60),
    },
    {
      title: "Jumlah tetap 20 paket",
      xLabel: "Kapasitas W (kg)",
      dimension: 1,
      data: knapsackTimes.filter(row => row[0] === 20).sort((a, b) => a[1] - b[1]),
    },
  ].map(group => ({
    title: group.title,
    xLabel: group.xLabel,
    rows: group.data.map(row => [row[0], row[1], ...formatTrials(row, 2, 4), row[8], currency(row[9])]),
    points: group.data.map(row => [row[group.dimension], row[7]]),
    headers: ["n", "W (kg)", ...trialColumns, "Bobot (kg)", "Ongkir optimal"],
  }));
}

function drawChart(canvas, group) {
  const { width, height } = canvas.getBoundingClientRect();
  if (!width || !height) return;
  const scale = window.devicePixelRatio || 1;
  canvas.width = Math.round(width * scale);
  canvas.height = Math.round(height * scale);
  const ctx = canvas.getContext("2d");
  ctx.scale(scale, scale);
  const theme = getComputedStyle(canvas);
  const color = name => theme.getPropertyValue(name).trim();

  const [left, right, top, bottom] = [50, width - 18, 29, height - 31];
  const xTransform = group.logX ? Math.log10 : value => value;
  const valuesX = group.points.map(point => xTransform(point[0]));
  const firstX = valuesX[0];
  const lastX = valuesX.at(-1);
  const spanX = lastX - firstX;
  const peak = Math.max(...group.points.map(point => point[1]));
  const order = 10 ** Math.floor(Math.log10(peak / 4));
  const tick = [1, 2, 2.5, 5, 10].map(base => base * order).find(value => value >= peak / 4);
  const count = Math.ceil(peak / tick);
  const maxY = count * tick;
  const xp = value => left + 7 + (xTransform(value) - firstX) / spanX * (right - left - 14);
  const yp = value => bottom - value / maxY * (bottom - top);

  ctx.fillStyle = color("--muted");
  ctx.font = `12px ${theme.fontFamily}`;
  ctx.textAlign = "left";
  ctx.fillText("Waktu rata-rata (ms)", 2, 14);

  ctx.textAlign = "right";
  const tickFormat = new Intl.NumberFormat("id-ID", { maximumFractionDigits: 4 });
  for (let i = 0; i <= count; i++) {
    const value = i * tick;
    const y = yp(value);
    ctx.fillText(tickFormat.format(value), left - 9, y + 4);
    ctx.strokeStyle = color(i === 0 ? "--line-strong" : "--line");
    ctx.beginPath();
    ctx.moveTo(left, y);
    ctx.lineTo(right, y);
    ctx.stroke();
  }

  ctx.textAlign = "center";
  for (const [x] of group.points) ctx.fillText(number(x), xp(x), bottom + 19);

  ctx.strokeStyle = color("--accent");
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  group.points.forEach(([x, y], index) => {
    if (index === 0) ctx.moveTo(xp(x), yp(y));
    else ctx.lineTo(xp(x), yp(y));
  });
  ctx.stroke();
  for (const [x, y] of group.points) {
    ctx.fillStyle = color("--card");
    ctx.beginPath();
    ctx.arc(xp(x), yp(y), 4.5, 0, 2 * Math.PI);
    ctx.fill();
    ctx.stroke();
  }
}

const chartData = new Map();
const chartObserver = new ResizeObserver(entries => {
  for (const { target } of entries) {
    const group = chartData.get(target);
    if (group) drawChart(target, group);
  }
});
// Grafik kanvas perlu digambar ulang setelah Poppins lokal selesai dimuat.
document.fonts.ready.then(() => {
  for (const [canvas, group] of chartData) drawChart(canvas, group);
});

function renderBenchmarks(key) {
  chartObserver.disconnect();
  chartData.clear();
  $("benchmark-method").textContent = demos[key].method;
  const groups = benchmarkGroups(key);
  $("benchmarks").innerHTML = groups.map(group => {
    const lastTrial = group.headers.indexOf("Rata-rata");
    const printTable = table(group.headers, group.rows, {
      css: "bench-table",
      numeric: group.headers.map((_, index) => index),
    });
    const canvasLabel = "Grafik " + group.title.toLowerCase() + ". Angka lengkap tersedia di tabel.";
    return `<article class="bench-card" data-average="${lastTrial}">
      <h3>${escapeHtml(group.title)}</h3>
      <div class="bench-layout">
        <figure>
          <canvas class="plot" role="img" aria-label="${escapeHtml(canvasLabel)}"></canvas>
          <figcaption>${escapeHtml(group.xLabel)}</figcaption>
        </figure>
        <div>${printTable}<p class="subtle-note">U1–U5 dan rata-rata dalam ms per eksekusi.</p></div>
      </div>
    </article>`;
  }).join("");

  document.querySelectorAll(".bench-card").forEach((card, index) => {
    const column = Number(card.dataset.average) + 1;
    card.querySelectorAll(`tr > :nth-child(${column})`).forEach(cell => cell.classList.add("average"));
    const canvas = card.querySelector("canvas");
    chartData.set(canvas, groups[index]);
    chartObserver.observe(canvas);
  });

}

function renderAnalysis(key) {
  const analysis = analyses[key];
  $("analysis-body").innerHTML = `
    <dl class="complexity">
      <div><dt>Waktu</dt><dd>${escapeHtml(analysis.time)}</dd></div>
      <div><dt>Ruang tambahan</dt><dd>${escapeHtml(analysis.space)}</dd></div>
    </dl>
    <p>${escapeHtml(analysis.trend)}</p>
    <ul class="analysis-notes">
      <li><strong>Kelebihan.</strong> ${escapeHtml(analysis.strength)}</li>
      <li><strong>Keterbatasan.</strong> ${escapeHtml(analysis.limit)}</li>
    </ul>`;
}

const tabs = [...document.querySelectorAll("[data-algorithm]")];
const stepByTab = { merge: 0, activity: 0, knapsack: 0 };
let current = "merge";
let inspectedWeight = capacity;
let fullTable = false;

function renderStep() {
  const demo = demos[current];
  const index = stepByTab[current];
  const frame = demo.frames[index];
  const last = demo.frames.length - 1;
  let view;
  if (current === "merge") view = renderMerge(demo, frame, index);
  if (current === "activity") view = renderActivity(demo, frame, index);
  if (current === "knapsack") view = renderKnapsack(demo, frame, inspectedWeight, fullTable);

  $("visual-title").textContent = view.label;
  $("visual").innerHTML = view.visual;
  $("step-title").textContent = view.title;
  $("step-description").textContent = view.description;
  $("step-detail").innerHTML = stats(view.details);
  renderCode(current, frame, inspectedWeight);
  $("step-body").scrollTop = 0;
  $("visual").scrollTop = 0;
  $("step-counter").textContent = index === 0 ? `Data awal · ${last} langkah` : `Langkah ${index} dari ${last}`;
  $("progress").max = last;
  $("progress").value = index;
  $("back").disabled = index === 0;
  $("next").disabled = index === last;
  $("reset").disabled = index === 0;

  const toggle = $("dp-toggle");
  toggle.hidden = !view.showToggle;
  toggle.textContent = fullTable ? "Tabel ringkas" : "Tabel lengkap";
  toggle.setAttribute("aria-pressed", String(fullTable));

  const activeCell = $("visual").querySelector(".cell-result");
  if (activeCell) {
    const scroll = activeCell.closest(".scroll-x");
    scroll.scrollLeft = Math.max(0, activeCell.offsetLeft - scroll.clientWidth / 2);
  }
}

function selectTab(key) {
  current = key;
  for (const tab of tabs) {
    const selected = tab.dataset.algorithm === key;
    tab.setAttribute("aria-selected", String(selected));
    tab.tabIndex = selected ? 0 : -1;
  }
  $("panel").setAttribute("aria-labelledby", "tab-" + key);
  $("algorithm-title").textContent = demos[key].title;
  $("algorithm-description").textContent = demos[key].description;
  renderStep();
  renderBenchmarks(key);
  renderAnalysis(key);
}

function moveStep(change) {
  const target = stepByTab[current] + change;
  if (target < 0 || target >= demos[current].frames.length) return;
  stepByTab[current] = target;
  renderStep();
}

for (const [index, tab] of tabs.entries()) {
  tab.addEventListener("click", () => selectTab(tab.dataset.algorithm));
  tab.addEventListener("keydown", event => {
    const destination = {
      ArrowLeft: (index + tabs.length - 1) % tabs.length,
      ArrowRight: (index + 1) % tabs.length,
      Home: 0,
      End: tabs.length - 1,
    }[event.key];
    if (destination === undefined) return;
    event.preventDefault();
    const nextTab = tabs[destination];
    selectTab(nextTab.dataset.algorithm);
    nextTab.focus();
  });
}

$("back").addEventListener("click", () => moveStep(-1));
$("next").addEventListener("click", () => moveStep(1));
$("reset").addEventListener("click", () => {
  stepByTab[current] = 0;
  if (current === "knapsack") inspectedWeight = capacity;
  renderStep();
  $("next").focus({ preventScroll: true });
});
$("dp-toggle").addEventListener("click", () => {
  fullTable = !fullTable;
  if (!fullTable && inspectedWeight % 10 !== 0) inspectedWeight = capacity;
  renderStep();
});
$("visual").addEventListener("click", event => {
  const button = event.target.closest("[data-weight]");
  if (!button) return;
  inspectedWeight = Number(button.dataset.weight);
  renderStep();
  $("visual").querySelector(`[data-weight="${inspectedWeight}"]`).focus({ preventScroll: true });
});

const flowchartDialog = $("flowchart-dialog");
const flowchartViewport = $("flowchart-viewport");
const flowchartZoom = $("flowchart-zoom");

function setFlowchartZoom(zoomed) {
  flowchartViewport.classList.toggle("is-zoomed", zoomed);
  flowchartViewport.scrollTop = 0;
  flowchartViewport.scrollLeft = 0;
  flowchartZoom.textContent = zoomed ? "Sesuaikan ukuran" : "Perbesar";
}

$("flowchart-open").addEventListener("click", () => {
  const chart = flowcharts[current];
  const image = $("flowchart-image");
  $("flowchart-title").textContent = "Flowchart " + demos[current].title;
  image.alt = chart.alt;
  image.src = "flowcharts/" + chart.file;
  setFlowchartZoom(false);
  flowchartDialog.showModal();
});
flowchartZoom.addEventListener("click", () => {
  setFlowchartZoom(!flowchartViewport.classList.contains("is-zoomed"));
});
flowchartDialog.addEventListener("close", () => $("flowchart-open").focus({ preventScroll: true }));

selectTab(current);
