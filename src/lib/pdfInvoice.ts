import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { FormState } from "./formReducer";
import { PropertyUnit, TERMS_AND_CONDITIONS, BANK_ACCOUNT, COMPANY_INFO } from "./pricelist";
import { CalculationResult, getTermLabel } from "./kpr-calculator";
import { formatRupiah, formatPercent, formatDateID, slugifyFileSegment } from "./format";

const NAVY: [number, number, number] = [15, 30, 61];
const GOLD: [number, number, number] = [183, 145, 63];
const MUTED: [number, number, number] = [91, 101, 119];
const INK: [number, number, number] = [22, 35, 61];

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
  const margin = 14;
  let y = 0;

  // ---- Header band ----
  doc.setFillColor(...NAVY);
  doc.rect(0, 0, pageWidth, 34, "F");

  const logo = await loadLogoDataUrl();
  if (logo) {
    doc.addImage(logo, "PNG", margin, 6, 12, 19.5);
  }
  doc.setTextColor(255, 255, 255);
  doc.setFont("times", "bold");
  doc.setFontSize(15);
  doc.text("SHAISTANAYA CITY", margin + (logo ? 16 : 0), 15);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(...GOLD);
  doc.text("INVOICE SIMULASI KPR", margin + (logo ? 16 : 0), 21);

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(9);
  doc.text(`Tanggal Invoice: ${formatDateID()}`, pageWidth - margin, 15, { align: "right" });
  doc.text(`Cluster ${unit.cluster}`, pageWidth - margin, 21, { align: "right" });

  y = 42;

  // ---- Section helper ----
  function sectionTitle(title: string) {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10.5);
    doc.setTextColor(...GOLD);
    doc.text(title.toUpperCase(), margin, y);
    doc.setDrawColor(...GOLD);
    doc.setLineWidth(0.3);
    doc.line(margin, y + 1.5, pageWidth - margin, y + 1.5);
    y += 6;
  }

  function kv(rows: [string, string][]) {
    autoTable(doc, {
      startY: y,
      margin: { left: margin, right: margin },
      theme: "plain",
      styles: { fontSize: 9.5, textColor: INK, cellPadding: 1.1 },
      columnStyles: {
        0: { textColor: MUTED, cellWidth: 70 },
        1: { fontStyle: "bold", halign: "right" },
      },
      body: rows,
    });
    y = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 5;
  }

  // ---- Section 1: Data Pembeli ----
  sectionTitle("1. Data Pembeli");
  kv([
    ["Nama", state.nama],
    ["Pekerjaan", state.pekerjaan],
    ["Usia", `${state.usia} tahun`],
  ]);

  // ---- Section 2: Data Properti ----
  sectionTitle("2. Data Properti");
  kv([
    ["Cluster / Tipe", `${unit.cluster} — ${unit.tipe}`],
    ["Lokasi (Blok / No Unit)", `${unit.blok} / ${unit.noUnit}`],
    ["Luas Bangunan / Tanah", `${unit.lb} m² / ${unit.lt} m²`],
    ["Harga Asli", formatRupiah(unit.hargaAsli)],
    ["Harga Properti (KPR)", formatRupiah(unit.hargaKpr)],
  ]);

  // ---- Section 3: Breakdown Harga ----
  sectionTitle("3. Breakdown Harga");
  const breakdownRows: [string, string][] = [["Harga Properti (KPR)", formatRupiah(result.harga)]];
  if (result.diskonTunaiKeras > 0)
    breakdownRows.push(["Diskon Tunai Keras (5%)", `- ${formatRupiah(result.diskonTunaiKeras)}`]);
  if (result.diskonPreLaunching > 0)
    breakdownRows.push(["Diskon Pre-Launching", `- ${formatRupiah(result.diskonPreLaunching)}`]);
  breakdownRows.push(["Harga Setelah Diskon", formatRupiah(result.hargaSetelahDiskon)]);
  kv(breakdownRows);
  doc.setFont("helvetica", "italic");
  doc.setFontSize(7.5);
  doc.setTextColor(...MUTED);
  doc.text("*Harga Properti (KPR) sudah termasuk potongan PPN DTP dari Harga Asli sesuai pricelist.", margin, y);
  y += 5;

  // ---- Section 4: Term of Payment ----
  sectionTitle("4. Term of Payment");
  const termRows: [string, string][] = [
    ["Term Pembayaran", getTermLabel(state.term, state.dpPercent)],
    ["Uang Tanda Jadi (UTJ)", formatRupiah(result.utj)],
  ];
  if (result.uangMuka > 0) termRows.push(["Uang Muka", formatRupiah(result.uangMuka)]);
  if (result.cicilanBulanan !== null)
    termRows.push([
      `Cicilan Bulanan (${result.tenorBertahapBulan} bulan)`,
      formatRupiah(result.cicilanBulanan),
    ]);
  termRows.push(["Sisa Pelunasan", formatRupiah(result.sisaPelunasan)]);
  kv(termRows);

  // ---- Section 5: KPR Breakdown ----
  if (result.pokokKpr !== null) {
    sectionTitle("5. KPR Breakdown (Estimasi)");
    kv([
      ["Pokok KPR", formatRupiah(result.pokokKpr)],
      ["Tenor", `${result.tenorKprTahun} tahun`],
      ["Suku Bunga", `${formatPercent(result.sukuBungaKpr ?? 0)} p.a.`],
      ["Angsuran Bulanan (Estimasi)", formatRupiah(result.angsuranBulananKpr ?? 0)],
      ["Total Bunga (Estimasi)", formatRupiah(result.totalBungaKpr ?? 0)],
      ["Total Cicilan (Estimasi)", formatRupiah(result.totalCicilanKpr ?? 0)],
    ]);
  }

  // ---- Section 6: Cash Flow ----
  if (y > 240) {
    doc.addPage();
    y = 16;
  }
  sectionTitle("6. Ringkasan Cash Flow");
  autoTable(doc, {
    startY: y,
    margin: { left: margin, right: margin },
    head: [["Waktu", "Keterangan", "Nominal"]],
    body: result.cashFlow.map((m) => [m.hari, m.keterangan, m.nominal > 0 ? formatRupiah(m.nominal) : "—"]),
    styles: { fontSize: 9, textColor: INK, cellPadding: 2.2 },
    headStyles: { fillColor: NAVY, textColor: 255, fontStyle: "bold" },
    columnStyles: { 2: { halign: "right" } },
    alternateRowStyles: { fillColor: [246, 244, 238] },
  });
  y = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 8;

  // ---- Terms & bank info ----
  if (y > 265) {
    doc.addPage();
    y = 16;
  }
  sectionTitle("Syarat & Ketentuan");
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(...MUTED);
  const terms = TERMS_AND_CONDITIONS[unit.cluster];
  for (const t of terms) {
    const lines = doc.splitTextToSize(`•  ${t}`, pageWidth - margin * 2);
    doc.text(lines, margin, y);
    y += lines.length * 4;
  }
  y += 3;
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...INK);
  doc.text(`Pembayaran: Bank ${BANK_ACCOUNT.bank} No. ${BANK_ACCOUNT.nomor} a.n ${BANK_ACCOUNT.atasNama}`, margin, y);
  y += 5;
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...MUTED);
  doc.text(`Head Office: ${COMPANY_INFO.headOffice}`, margin, y);
  y += 4;
  doc.text(`Marketing Gallery: ${COMPANY_INFO.marketingGallery}`, margin, y);
  y += 6;
  doc.setFontSize(7.5);
  doc.text(
    doc.splitTextToSize(
      "Catatan: Simulasi ini bersifat estimasi dan bukan merupakan persetujuan kredit. Persetujuan KPR dan suku bunga sepenuhnya ditentukan oleh Bank pemberi KPR. Harga & diskon mengacu pada pricelist periode " +
        COMPANY_INFO.periode +
        ".",
      pageWidth - margin * 2
    ),
    margin,
    y
  );

  // ---- Footer page numbers ----
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(7.5);
    doc.setTextColor(...MUTED);
    doc.text(`Halaman ${i} dari ${pageCount}`, pageWidth - margin, doc.internal.pageSize.getHeight() - 8, {
      align: "right",
    });
  }

  return doc;
}
