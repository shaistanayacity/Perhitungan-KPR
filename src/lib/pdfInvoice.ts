import jsPDF from "jspdf";
import autoTable, { CellHookData } from "jspdf-autotable";
import { FormState } from "./formReducer";
import { PropertyUnit, TERMS_AND_CONDITIONS, BANK_ACCOUNT, COMPANY_INFO } from "./pricelist";
import { CalculationResult, getTermLabel, getDiskonHargaLabel, KPR_MODE_LABELS, isOctoBooPromoActive } from "./kpr-calculator";
import { formatRupiah, formatPercent, formatDateID, slugifyFileSegment } from "./format";

type RGB = [number, number, number];

// Palet normal (dipakai di luar bulan promo OctoBoo!).
const DEFAULT_NAVY: RGB = [20, 41, 82]; // biru navy, dicerahkan dikit dari [15,30,61]
const DEFAULT_GOLD: RGB = [183, 145, 63];
const DEFAULT_MUTED: RGB = [105, 116, 137]; // dicerahkan dikit dari [91,101,119]
const DEFAULT_INK: RGB = [30, 47, 82]; // dicerahkan dikit dari [22,35,61]
const DEFAULT_BORDER: RGB = [222, 222, 217];
const DEFAULT_ZEBRA: RGB = [247, 245, 240];

// Palet edisi "OctoBoo!" — cuma dipakai selama promo aktif (lihat isOctoBooPromoActive
// di kpr-calculator.ts). Dipasangkan dengan gambar bingkai Halloween full-bleed
// (public/invoice-octoboo-frame.png, sudah ada logo & ilustrasi di bagian atas/bawah
// halaman) — jadi header/footer band navy bawaan TIDAK digambar lagi saat tema ini aktif.
const HALLOWEEN_INK: RGB = [43, 33, 24];
const HALLOWEEN_ACCENT: RGB = [200, 101, 28]; // oranye labu, menggantikan GOLD
const HALLOWEEN_MUTED: RGB = [138, 122, 99];
const HALLOWEEN_BORDER: RGB = [227, 179, 107];
const HALLOWEEN_ZEBRA: RGB = [251, 239, 217];
const HALLOWEEN_TABLE_HEAD_BG: RGB = [250, 240, 217];
const HALLOWEEN_TABLE_HEAD_TEXT: RGB = [43, 33, 24];

/** Gambar manual "harga dicoret → harga setelah subsidi" + keterangan kecil di
 * bawahnya, dipakai untuk sel tabel yang kena subsidi Angsuran OctoBoo! —
 * autoTable/jsPDF tidak punya style strikethrough bawaan, jadi garis coretnya
 * digambar langsung di atas teks harga asli. Dipanggil dari didDrawCell, SETELAH
 * teks default sel itu dikosongkan (lihat didParseCell di wideTableCard). */
function drawSubsidizedPriceCell(
  doc: jsPDF,
  cell: { x: number; y: number; width: number; height: number },
  asliText: string,
  setelahSubsidiText: string,
  caption: string,
  ink: RGB,
  muted: RGB,
  scale = 1
): void {
  const rightEdge = cell.x + cell.width - 1.2;
  const lineY = cell.y + cell.height * 0.42;
  const captionY = cell.y + cell.height * 0.78;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(7.3 * scale);
  doc.setTextColor(...ink);
  doc.text(setelahSubsidiText, rightEdge, lineY, { align: "right" });
  const diskonWidth = doc.getTextWidth(setelahSubsidiText);

  doc.setFont("helvetica", "normal");
  doc.setTextColor(...muted);
  const asliX = rightEdge - diskonWidth - 1.8;
  doc.text(asliText, asliX, lineY, { align: "right" });
  const asliWidth = doc.getTextWidth(asliText);
  doc.setDrawColor(...muted);
  doc.setLineWidth(0.25);
  doc.line(asliX - asliWidth, lineY - 1.0, asliX, lineY - 1.0);

  doc.setFont("helvetica", "italic");
  doc.setFontSize(5.2 * scale);
  doc.setTextColor(...muted);
  doc.text(caption, rightEdge, captionY, { align: "right" });
  doc.setTextColor(...ink);
}

async function loadImageDataUrl(path: string): Promise<string | null> {
  try {
    const res = await fetch(path);
    const blob = await res.blob();
    return await new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(blob);
    });
  } catch {
    return null;
  }
}

export function invoiceFileName(nama: string, tipe: string): string {
  const tanggal = new Date().toISOString().slice(0, 10);
  return `Invoice_KPR_${slugifyFileSegment(nama)}_${slugifyFileSegment(tipe)}_${tanggal}.pdf`;
}

export async function generateInvoicePdf(
  state: FormState,
  unit: PropertyUnit,
  result: CalculationResult
): Promise<jsPDF> {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  // Tema "OctoBoo!" cuma aktif kalau promonya sendiri aktif (Oktober 2026) — di luar
  // itu invoice balik ke desain navy/emas biasa secara otomatis, tanpa perlu saklar manual.
  const themed = isOctoBooPromoActive();
  const NAVY = themed ? HALLOWEEN_INK : DEFAULT_NAVY;
  const GOLD = themed ? HALLOWEEN_ACCENT : DEFAULT_GOLD;
  const MUTED = themed ? HALLOWEEN_MUTED : DEFAULT_MUTED;
  const INK = themed ? HALLOWEEN_INK : DEFAULT_INK;
  const BORDER = themed ? HALLOWEEN_BORDER : DEFAULT_BORDER;
  const ZEBRA = themed ? HALLOWEEN_ZEBRA : DEFAULT_ZEBRA;
  const TABLE_HEAD_BG = themed ? HALLOWEEN_TABLE_HEAD_BG : DEFAULT_NAVY;
  const TABLE_HEAD_TEXT = themed ? HALLOWEEN_TABLE_HEAD_TEXT : ([255, 255, 255] as RGB);

  // Margin & titik mulai konten disesuaikan kalau tema aktif, supaya konten tidak
  // menabrak ilustrasi bingkai (banner atas & rumah hantu bawah) — bingkainya sendiri
  // adalah gambar full-bleed (public/invoice-octoboo-frame.png), bukan digambar manual.
  const margin = themed ? 16 : 12;
  const contentStartY = themed ? 80 : 31;

  // Invoice bertema WAJIB 1 halaman (tidak boleh ada halaman ke-2) — jadi semua ukuran
  // font/spacing vertikal di-rapatkan sedikit (SCALE) dan logic pindah halaman di bawah
  // dimatikan total untuk tema ini, apa pun panjang kontennya.
  const SCALE = themed ? 0.82 : 1;
  const s = (n: number) => n * SCALE;

  const gap = s(3.5);
  const colWidth = (pageWidth - margin * 2 - gap) / 2;
  const leftX = margin;
  const rightX = margin + colWidth + gap;
  let y = 0;

  async function drawOctoBooFrame(): Promise<void> {
    const frame = await loadImageDataUrl("/invoice-octoboo-frame.png");
    if (frame) {
      doc.addImage(frame, "PNG", 0, 0, pageWidth, pageHeight);
    }
  }

  if (themed) {
    await drawOctoBooFrame();
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.5);
    doc.setTextColor(...MUTED);
    doc.text(
      `Invoice Simulasi · ${formatDateID()} · Cluster ${unit.cluster}`,
      pageWidth / 2,
      contentStartY - 6,
      { align: "center" }
    );
  } else {
    // ---- Header band (desain normal, non-promo) ----
    doc.setFillColor(...NAVY);
    doc.rect(0, 0, pageWidth, 26, "F");

    const logo = await loadImageDataUrl("/logo-flame.png");
    if (logo) {
      doc.addImage(logo, "PNG", margin, 4, 9.5, 15.4);
    }
    doc.setTextColor(255, 255, 255);
    doc.setFont("times", "bold");
    doc.setFontSize(13);
    doc.text("SHAISTANAYA CITY", margin + (logo ? 13 : 0), 12);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(...GOLD);
    doc.text("INVOICE SIMULASI", margin + (logo ? 13 : 0), 17.2);

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(8);
    doc.text(`Tanggal Invoice: ${formatDateID()}`, pageWidth - margin, 12, { align: "right" });
    doc.text(`Cluster ${unit.cluster}`, pageWidth - margin, 17.2, { align: "right" });
  }

  y = contentStartY;

  /** Kartu berbingkai (kotak) berisi tabel key-value ringkas + catatan kaki opsional.
   * Mengembalikan koordinat Y bawah kartu, supaya kartu di sebelahnya (kolom lain)
   * bisa dibandingkan tingginya lalu baris berikutnya dimulai dari titik terbawah. */
  function card(title: string, x: number, width: number, startY: number, rows: [string, string][], note?: string): number {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(s(8));
    doc.setTextColor(...GOLD);
    doc.text(title.toUpperCase(), x + 3, startY + s(4.3));

    autoTable(doc, {
      startY: startY + s(6),
      margin: { left: x + 3, right: pageWidth - (x + width - 3) },
      tableWidth: width - 6,
      theme: "plain",
      styles: { fontSize: s(7.6), textColor: INK, cellPadding: { top: s(0.45), bottom: s(0.45), left: 0, right: 0 } },
      columnStyles: {
        0: { textColor: MUTED, cellWidth: (width - 6) * 0.52 },
        1: { fontStyle: "bold", halign: "right" },
      },
      body: rows,
    });
    let endY = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + s(1.5);

    if (note) {
      doc.setFont("helvetica", "italic");
      doc.setFontSize(s(6.2));
      doc.setTextColor(...MUTED);
      const lines = doc.splitTextToSize(note, width - 6);
      doc.text(lines, x + 3, endY + s(2.2));
      endY += lines.length * s(2.7) + s(0.8);
    }

    endY += s(2.2);
    doc.setDrawColor(...BORDER);
    doc.setLineWidth(0.25);
    doc.roundedRect(x, startY, width, endY - startY, 1.5, 1.5, "S");
    return endY + gap;
  }

  /** Kartu lebar penuh berisi autoTable dengan header (dipakai utk tier/cash flow).
   * `subsidyByRow`, kalau diisi, menandai baris mana (berdasarkan index di `body`)
   * yang kena subsidi Angsuran OctoBoo! — nilai asli & setelah subsidi digambar
   * manual (coret + angka baru + keterangan kecil) di kolom terakhir, menggantikan
   * teks biasa untuk baris itu. */
  function wideTableCard(
    title: string,
    startY: number,
    head: string[],
    body: string[][],
    rightAlignCols: number[],
    subsidyByRow?: Record<number, { asli: number; setelahSubsidi: number; caption: string }>
  ): number {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(s(8));
    doc.setTextColor(...GOLD);
    doc.text(title.toUpperCase(), margin + 3, startY + s(4.3));

    const columnStyles: Record<number, { halign: "right" }> = {};
    rightAlignCols.forEach((c) => (columnStyles[c] = { halign: "right" }));
    const subsidyCol = head.length - 1;

    autoTable(doc, {
      startY: startY + s(6),
      margin: { left: margin + 3, right: margin + 3 },
      head: [head],
      body,
      styles: { fontSize: s(7.3), textColor: INK, cellPadding: s(0.9) },
      headStyles: { fillColor: TABLE_HEAD_BG, textColor: TABLE_HEAD_TEXT, fontStyle: "bold", fontSize: s(7) },
      columnStyles,
      didParseCell: (data: CellHookData) => {
        // Selang-seling warna baris ditentukan manual dari row.index (genap/ganjil),
        // bukan diserahkan ke alternateRowStyles bawaan autoTable — supaya tetap
        // konsisten selang-seling walau ada baris yang tingginya beda-beda (baris
        // subsidi OctoBoo! dibikin lebih tinggi via minCellHeight di bawah).
        if (data.section === "body") {
          data.cell.styles.fillColor = data.row.index % 2 === 1 ? ZEBRA : false;
        }
        if (!subsidyByRow) return;
        if (data.section === "body" && data.column.index === subsidyCol && subsidyByRow[data.row.index]) {
          data.cell.text = [];
          data.cell.styles.minCellHeight = s(7.4);
        }
      },
      didDrawCell: (data: CellHookData) => {
        if (!subsidyByRow) return;
        const sub = data.section === "body" ? subsidyByRow[data.row.index] : undefined;
        if (sub && data.column.index === subsidyCol) {
          drawSubsidizedPriceCell(doc, data.cell, formatRupiah(sub.asli), formatRupiah(sub.setelahSubsidi), sub.caption, INK, MUTED, SCALE);
        }
      },
    });
    const endY = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + s(2);
    doc.setDrawColor(...BORDER);
    doc.setLineWidth(0.25);
    doc.roundedRect(margin, startY, pageWidth - margin * 2, endY - startY, 1.5, 1.5, "S");
    return endY + gap;
  }

  // ---- Baris 1: Data Pembeli | Data Properti ----
  const dataPembeliRows: [string, string][] = [
    ["Nama", state.nama],
    ["Pekerjaan", state.pekerjaan || "—"],
    ["Usia", `${state.usia} tahun`],
  ];
  if (state.gaji !== null) dataPembeliRows.push(["Gaji / Penghasilan", `${state.gaji}/bln`]);

  const rowA1 = card("1. Data Pembeli", leftX, colWidth, y, dataPembeliRows);
  const rowA2 = card(
    "2. Data Properti",
    rightX,
    colWidth,
    y,
    [
      ["Cluster / Tipe", `${unit.cluster} — ${unit.tipe}`],
      ["Blok", unit.blok],
      ["LB / LT", `${unit.lb} / ${unit.lt} m²`],
      ["Harga Jual", formatRupiah(unit.hargaAsli)],
    ]
  );
  y = Math.max(rowA1, rowA2);

  // ---- Baris 2: Breakdown Harga | Term of Payment ----
  const breakdownRows: [string, string][] = [["Harga Jual", formatRupiah(result.hargaJual)]];
  if (result.diskonTunaiKeras > 0)
    breakdownRows.push(["Diskon Tunai Keras (5%)", `- ${formatRupiah(result.diskonTunaiKeras)}`]);
  if (result.diskonCustom > 0)
    breakdownRows.push(["Diskon Khusus", `- ${formatRupiah(result.diskonCustom)}`]);
  if (result.diskonPpnDtp > 0)
    breakdownRows.push([getDiskonHargaLabel(), `- ${formatRupiah(result.diskonPpnDtp)}`]);
  breakdownRows.push(["Harga Transaksi", formatRupiah(result.hargaSetelahDiskon)]);

  const termRows: [string, string][] = [
    ["Term Pembayaran", getTermLabel(state.term)],
    ["Uang Tanda Jadi (UTJ)", formatRupiah(result.utj)],
  ];
  if (result.uangMuka > 0) termRows.push(["Uang Muka", formatRupiah(result.uangMuka)]);
  if (result.cicilanBulanan !== null)
    termRows.push([
      `Cicilan (${result.tenorBertahapBulan} bln)`,
      formatRupiah(result.cicilanBulananSetelahSubsidi ?? result.cicilanBulanan),
    ]);
  if (state.term === "KPR" && result.angsuranAwalKprSetelahSubsidi !== null)
    termRows.push(["Angsuran Awal", formatRupiah(result.angsuranAwalKprSetelahSubsidi)]);
  if (state.term !== "TUNAI_BERTAHAP")
    termRows.push([
      state.term === "KPR" ? "Harga KPR" : "Sisa Pelunasan",
      formatRupiah(result.sisaPelunasan),
    ]);
  if (result.promoSubsidiAngsuranAktif)
    termRows.push([
      "Promo OctoBOO!",
      `Subsidi Angsuran ${formatRupiah(result.subsidiAngsuranNominal)} Selama ${result.subsidiAngsuranBulan} Bulan`,
    ]);

  const rowB1 = card("3. Breakdown Harga", leftX, colWidth, y, breakdownRows);
  const rowB2 = card("4. Term of Payment", rightX, colWidth, y, termRows);
  y = Math.max(rowB1, rowB2);

  // ---- Section 5: KPR Breakdown ----
  if (result.pokokKpr !== null && result.tierDisplayRows) {
    // Invoice bertema WAJIB 1 halaman — jangan pernah ganti halaman di sini.
    if (!themed && y > 210) {
      doc.addPage();
      y = 12;
    }
    const head = ["Tahun", "Suku Bunga", "Angsuran/bln"];
    const subsidyCaption = `Subsidi ${formatRupiah(result.subsidiAngsuranNominal)}/${result.subsidiAngsuranBulan} bln`;
    const tier5Subsidy: Record<number, { asli: number; setelahSubsidi: number; caption: string }> = {};
    const body = result.tierDisplayRows.map((row, i) => {
      if (row.disubsidi && result.subsidiAngsuranNominal > 0) {
        tier5Subsidy[i] = {
          asli: row.angsuranBulanan,
          setelahSubsidi: Math.max(0, row.angsuranBulanan - result.subsidiAngsuranNominal),
          caption: subsidyCaption,
        };
      }
      return [
        row.labelBulan
          ? `Bulan ${row.bulanMulai}${row.bulanSelesai > row.bulanMulai ? `–${row.bulanSelesai}` : ""}`
          : `${row.tahunMulai}${row.tahunSelesai > row.tahunMulai ? `–${row.tahunSelesai}` : ""}`,
        formatPercent(row.sukuBunga),
        formatRupiah(row.angsuranBulanan),
      ];
    });
    if (result.floatingTail) {
      const ft = result.floatingTail;
      body.push([
        `${ft.tahunMulai}${ft.tahunSelesai > ft.tahunMulai ? `–${ft.tahunSelesai}` : ""}`,
        "Floating — mengikuti suku bunga bank",
        "—",
      ]);
    }
    y = wideTableCard(
      `5. KPR Breakdown (${result.kprMode ? KPR_MODE_LABELS[result.kprMode] : "KPR"}) · Pokok ${formatRupiah(result.pokokKpr)} · Tenor ${result.tenorKprTahun} thn`,
      y,
      head,
      body,
      [2],
      tier5Subsidy
    );
  }

  // ---- Section 6: Cash Flow ----
  if (!themed && y > 235) {
    doc.addPage();
    y = 12;
  }
  const cashFlowSubsidyCaption = `Subsidi ${formatRupiah(result.subsidiAngsuranNominal)}/${result.subsidiAngsuranBulan} bln`;
  const cashFlowSubsidy: Record<number, { asli: number; setelahSubsidi: number; caption: string }> = {};
  result.cashFlow.forEach((m, i) => {
    if (m.disubsidi && m.nominalSetelahSubsidi !== undefined) {
      cashFlowSubsidy[i] = { asli: m.nominal, setelahSubsidi: m.nominalSetelahSubsidi, caption: cashFlowSubsidyCaption };
    }
  });
  y = wideTableCard(
    "6. Ringkasan Cash Flow",
    y,
    ["Waktu", "Keterangan", "Nominal"],
    result.cashFlow.map((m) => [m.hari, m.keterangan, m.nominal > 0 ? formatRupiah(m.nominal) : "—"]),
    [2],
    cashFlowSubsidy
  );

  // ---- Syarat & Ketentuan (2 kolom) + info pembayaran ----
  const terms = TERMS_AND_CONDITIONS[unit.cluster];
  const half = Math.ceil(terms.length / 2);
  const colA = terms.slice(0, half);
  const colB = terms.slice(half);
  const tcColWidth = (pageWidth - margin * 2 - 6 - gap) / 2;
  const catatanText =
    "Catatan: Simulasi ini bersifat estimasi dan bukan merupakan persetujuan kredit. Persetujuan KPR dan suku bunga sepenuhnya ditentukan oleh Bank pemberi KPR. Harga & diskon mengacu pada pricelist periode " +
    COMPANY_INFO.periode +
    ".";

  function bulletHeight(list: string[]): number {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(s(6.8));
    let h = 0;
    for (const t of list) {
      h += doc.splitTextToSize(`•  ${t}`, tcColWidth - 3).length * s(2.9);
    }
    return h;
  }
  const catatanLines = doc.splitTextToSize(catatanText, pageWidth - margin * 2 - 6);
  // Ukur dulu tinggi total kartu S&K (bullets 2 kolom + info pembayaran + catatan)
  // sebelum menggambar, supaya keputusan pindah halaman akurat — bukan tebakan.
  const estTcHeight =
    s(8.5) + Math.max(bulletHeight(colA), bulletHeight(colB)) + s(2.2) + s(3.4) + s(2.9) + s(3.4) + catatanLines.length * s(2.7) + s(4);
  // Invoice bertema WAJIB 1 halaman — jangan pernah ganti halaman di sini.
  if (!themed && y + estTcHeight > pageHeight - 12) {
    doc.addPage();
    y = 12;
  }

  doc.setFont("helvetica", "bold");
  doc.setFontSize(s(8));
  doc.setTextColor(...GOLD);
  doc.text("SYARAT & KETENTUAN", margin + 3, y + s(4.3));

  function bulletList(list: string[], x: number, startYList: number): number {
    let yy = startYList;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(s(6.8));
    doc.setTextColor(...MUTED);
    for (const t of list) {
      const lines = doc.splitTextToSize(`•  ${t}`, tcColWidth - 3);
      doc.text(lines, x, yy);
      yy += lines.length * s(2.9);
    }
    return yy;
  }
  const tcEndA = bulletList(colA, leftX + 3, y + s(8.5));
  const tcEndB = bulletList(colB, rightX + 3, y + s(8.5));
  let footY = Math.max(tcEndA, tcEndB) + s(2.2);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(s(7.2));
  doc.setTextColor(...INK);
  doc.text(
    `Pembayaran: Bank ${BANK_ACCOUNT.bank} No. ${BANK_ACCOUNT.nomor} a.n ${BANK_ACCOUNT.atasNama}`,
    leftX + 3,
    footY
  );
  footY += s(3.4);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...MUTED);
  doc.text(`Head Office: ${COMPANY_INFO.headOffice}`, leftX + 3, footY);
  footY += s(2.9);
  doc.text(`Marketing Gallery: ${COMPANY_INFO.marketingGallery}`, leftX + 3, footY);
  footY += s(3.4);
  doc.setFontSize(s(6.3));
  doc.text(catatanLines, leftX + 3, footY);
  footY += catatanLines.length * s(2.7);

  doc.setDrawColor(...BORDER);
  doc.setLineWidth(0.25);
  doc.roundedRect(margin, y, pageWidth - margin * 2, footY - y + 2, 1.5, 1.5, "S");

  // ---- Footer page numbers ----
  const pageCount = doc.getNumberOfPages();
  const pageNumY = themed ? pageHeight - 46 : pageHeight - 7;
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(7);
    doc.setTextColor(...MUTED);
    doc.text(`Halaman ${i} dari ${pageCount}`, pageWidth - margin, pageNumY, {
      align: "right",
    });
  }

  return doc;
}
