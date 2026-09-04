import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { FormState } from "./formReducer";
import { PropertyUnit, TERMS_AND_CONDITIONS, BANK_ACCOUNT, COMPANY_INFO } from "./pricelist";
import { CalculationResult, getTermLabel, KPR_MODE_LABELS } from "./kpr-calculator";
import { formatRupiah, formatPercent, formatDateID, slugifyFileSegment } from "./format";

const NAVY: [number, number, number] = [15, 30, 61];
const GOLD: [number, number, number] = [183, 145, 63];
const MUTED: [number, number, number] = [91, 101, 119];
const INK: [number, number, number] = [22, 35, 61];
const BORDER: [number, number, number] = [222, 222, 217];
const ZEBRA: [number, number, number] = [247, 245, 240];

async function loadLogoDataUrl(): Promise<string | null> {
  try {
    const res = await fetch("/logo-flame.png");
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
  const margin = 12;
  const gap = 3.5;
  const colWidth = (pageWidth - margin * 2 - gap) / 2;
  const leftX = margin;
  const rightX = margin + colWidth + gap;
  let y = 0;

  // ---- Header band ----
  doc.setFillColor(...NAVY);
  doc.rect(0, 0, pageWidth, 26, "F");

  const logo = await loadLogoDataUrl();
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
  doc.text("INVOICE SIMULASI KPR", margin + (logo ? 13 : 0), 17.2);

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(8);
  doc.text(`Tanggal Invoice: ${formatDateID()}`, pageWidth - margin, 12, { align: "right" });
  doc.text(`Cluster ${unit.cluster}`, pageWidth - margin, 17.2, { align: "right" });

  y = 31;

  /** Kartu berbingkai (kotak) berisi tabel key-value ringkas + catatan kaki opsional.
   * Mengembalikan koordinat Y bawah kartu, supaya kartu di sebelahnya (kolom lain)
   * bisa dibandingkan tingginya lalu baris berikutnya dimulai dari titik terbawah. */
  function card(title: string, x: number, width: number, startY: number, rows: [string, string][], note?: string): number {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.setTextColor(...GOLD);
    doc.text(title.toUpperCase(), x + 3, startY + 4.3);

    autoTable(doc, {
      startY: startY + 6,
      margin: { left: x + 3, right: pageWidth - (x + width - 3) },
      tableWidth: width - 6,
      theme: "plain",
      styles: { fontSize: 7.6, textColor: INK, cellPadding: { top: 0.45, bottom: 0.45, left: 0, right: 0 } },
      columnStyles: {
        0: { textColor: MUTED, cellWidth: (width - 6) * 0.52 },
        1: { fontStyle: "bold", halign: "right" },
      },
      body: rows,
    });
    let endY = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 1.5;

    if (note) {
      doc.setFont("helvetica", "italic");
      doc.setFontSize(6.2);
      doc.setTextColor(...MUTED);
      const lines = doc.splitTextToSize(note, width - 6);
      doc.text(lines, x + 3, endY + 2.2);
      endY += lines.length * 2.7 + 0.8;
    }

    endY += 2.2;
    doc.setDrawColor(...BORDER);
    doc.setLineWidth(0.25);
    doc.roundedRect(x, startY, width, endY - startY, 1.5, 1.5, "S");
    return endY + gap;
  }

  /** Kartu lebar penuh berisi autoTable dengan header (dipakai utk tier/cash flow). */
  function wideTableCard(title: string, startY: number, head: string[], body: string[][], rightAlignCols: number[]): number {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.setTextColor(...GOLD);
    doc.text(title.toUpperCase(), margin + 3, startY + 4.3);

    const columnStyles: Record<number, { halign: "right" }> = {};
    rightAlignCols.forEach((c) => (columnStyles[c] = { halign: "right" }));

    autoTable(doc, {
      startY: startY + 6,
      margin: { left: margin + 3, right: margin + 3 },
      head: [head],
      body,
      styles: { fontSize: 7.3, textColor: INK, cellPadding: 0.9 },
      headStyles: { fillColor: NAVY, textColor: 255, fontStyle: "bold", fontSize: 7 },
      columnStyles,
      alternateRowStyles: { fillColor: ZEBRA },
    });
    const endY = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 2;
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
    breakdownRows.push(["Diskon PPN DTP", `- ${formatRupiah(result.diskonPpnDtp)}`]);
  breakdownRows.push(["Harga Transaksi", formatRupiah(result.hargaSetelahDiskon)]);

  const termRows: [string, string][] = [
    ["Term Pembayaran", getTermLabel(state.term)],
    ["Uang Tanda Jadi (UTJ)", formatRupiah(result.utj)],
  ];
  if (result.uangMuka > 0) termRows.push(["Uang Muka", formatRupiah(result.uangMuka)]);
  if (result.cicilanBulanan !== null)
    termRows.push([`Cicilan (${result.tenorBertahapBulan} bln)`, formatRupiah(result.cicilanBulanan)]);
  termRows.push(["Sisa Pelunasan", formatRupiah(result.sisaPelunasan)]);

  const rowB1 = card("3. Breakdown Harga", leftX, colWidth, y, breakdownRows);
  const rowB2 = card("4. Term of Payment", rightX, colWidth, y, termRows);
  y = Math.max(rowB1, rowB2);

  // ---- Section 5: KPR Breakdown ----
  if (result.pokokKpr !== null && result.tierBreakdown) {
    if (y > 210) {
      doc.addPage();
      y = 12;
    }
    const head = ["Tahun", "Suku Bunga", "Angsuran/bln"];
    const body = result.tierBreakdown.map((t) => [
      `${t.tahunMulai}${t.tahunSelesai > t.tahunMulai ? `–${t.tahunSelesai}` : ""}`,
      formatPercent(t.sukuBunga),
      formatRupiah(t.angsuranBulanan),
    ]);
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
      [2]
    );
  }

  // ---- Section 6: Cash Flow ----
  if (y > 235) {
    doc.addPage();
    y = 12;
  }
  y = wideTableCard(
    "6. Ringkasan Cash Flow",
    y,
    ["Waktu", "Keterangan", "Nominal"],
    result.cashFlow.map((m) => [m.hari, m.keterangan, m.nominal > 0 ? formatRupiah(m.nominal) : "—"]),
    [2]
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
    doc.setFontSize(6.8);
    let h = 0;
    for (const t of list) {
      h += doc.splitTextToSize(`•  ${t}`, tcColWidth - 3).length * 2.9;
    }
    return h;
  }
  const catatanLines = doc.splitTextToSize(catatanText, pageWidth - margin * 2 - 6);
  // Ukur dulu tinggi total kartu S&K (bullets 2 kolom + info pembayaran + catatan)
  // sebelum menggambar, supaya keputusan pindah halaman akurat — bukan tebakan.
  const estTcHeight =
    8.5 + Math.max(bulletHeight(colA), bulletHeight(colB)) + 2.2 + 3.4 + 2.9 + 3.4 + catatanLines.length * 2.7 + 4;
  const pageBottom = doc.internal.pageSize.getHeight() - 12;
  if (y + estTcHeight > pageBottom) {
    doc.addPage();
    y = 12;
  }

  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(...GOLD);
  doc.text("SYARAT & KETENTUAN", margin + 3, y + 4.3);

  function bulletList(list: string[], x: number, startYList: number): number {
    let yy = startYList;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(6.8);
    doc.setTextColor(...MUTED);
    for (const t of list) {
      const lines = doc.splitTextToSize(`•  ${t}`, tcColWidth - 3);
      doc.text(lines, x, yy);
      yy += lines.length * 2.9;
    }
    return yy;
  }
  const tcEndA = bulletList(colA, leftX + 3, y + 8.5);
  const tcEndB = bulletList(colB, rightX + 3, y + 8.5);
  let footY = Math.max(tcEndA, tcEndB) + 2.2;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(7.2);
  doc.setTextColor(...INK);
  doc.text(
    `Pembayaran: Bank ${BANK_ACCOUNT.bank} No. ${BANK_ACCOUNT.nomor} a.n ${BANK_ACCOUNT.atasNama}`,
    leftX + 3,
    footY
  );
  footY += 3.4;
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...MUTED);
  doc.text(`Head Office: ${COMPANY_INFO.headOffice}`, leftX + 3, footY);
  footY += 2.9;
  doc.text(`Marketing Gallery: ${COMPANY_INFO.marketingGallery}`, leftX + 3, footY);
  footY += 3.4;
  doc.setFontSize(6.3);
  doc.text(catatanLines, leftX + 3, footY);
  footY += catatanLines.length * 2.7;

  doc.setDrawColor(...BORDER);
  doc.setLineWidth(0.25);
  doc.roundedRect(margin, y, pageWidth - margin * 2, footY - y + 2, 1.5, 1.5, "S");

  // ---- Footer page numbers ----
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(7);
    doc.setTextColor(...MUTED);
    doc.text(`Halaman ${i} dari ${pageCount}`, pageWidth - margin, doc.internal.pageSize.getHeight() - 7, {
      align: "right",
    });
  }

  return doc;
}
