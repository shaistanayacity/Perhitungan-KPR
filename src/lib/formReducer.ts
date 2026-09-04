import { ClusterId, getUnitById, getBertahapTenorBulan } from "./pricelist";
import { TermOfPayment, KprMode, KprTierInput } from "./kpr-calculator";
import { BankPreset } from "./bankPresets";
import { DEFAULT_SUKU_BUNGA } from "./simulationLog";

export type TabId = "profil" | "properti" | "term";

export interface FormState {
  nama: string;
  pekerjaan: string;
  usia: number | null;
  gaji: number | null;
  cluster: ClusterId | null;
  tipe: string | null;
  unitId: string | null;
  term: TermOfPayment;
  diskonCustom: number;
  tenorBertahapBulan: number;
  tenorTahun: number;
  dpPercent: number;
  kprMode: KprMode;
  tiers: KprTierInput[];
  activeTab: TabId;
}

function defaultTiers(rate: number, tenorTahun: number): KprTierInput[] {
  return [{ durasiTahun: Math.min(2, tenorTahun), sukuBunga: rate }];
}

export const initialFormState: FormState = {
  nama: "",
  pekerjaan: "",
  usia: null,
  gaji: null,
  cluster: null,
  tipe: null,
  unitId: null,
  term: "HARD_CASH",
  diskonCustom: 0,
  tenorBertahapBulan: 6,
  tenorTahun: 20,
  dpPercent: 0,
  kprMode: "FIX",
  tiers: defaultTiers(DEFAULT_SUKU_BUNGA, 20),
  activeTab: "profil",
};

export type FormAction =
  | { type: "SET_FIELD"; field: keyof FormState; value: FormState[keyof FormState] }
  | { type: "SET_CLUSTER"; cluster: ClusterId }
  | { type: "SET_TIPE"; tipe: string }
  | { type: "SET_UNIT"; unitId: string }
  | { type: "SET_TAB"; tab: TabId }
  | { type: "APPLY_DEFAULT_RATE"; rate: number }
  | { type: "SET_KPR_MODE"; mode: KprMode }
  | { type: "ADD_TIER" }
  | { type: "REMOVE_TIER"; index: number }
  | { type: "UPDATE_TIER"; index: number; field: keyof KprTierInput; value: number }
  | { type: "APPLY_BANK_PRESET"; preset: BankPreset }
  | { type: "RESET" };

export function formReducer(state: FormState, action: FormAction): FormState {
  switch (action.type) {
    case "SET_FIELD":
      return { ...state, [action.field]: action.value };
    case "SET_CLUSTER":
      return { ...state, cluster: action.cluster, tipe: null, unitId: null };
    case "SET_TIPE":
      return { ...state, tipe: action.tipe, unitId: null };
    case "SET_UNIT": {
      const unit = getUnitById(action.unitId);
      return {
        ...state,
        unitId: action.unitId,
        // Default tenor Tunai Bertahap ikut konvensi cluster/tipe — tetap bisa diedit manual.
        tenorBertahapBulan: unit ? getBertahapTenorBulan(unit.cluster, unit.tipe) : state.tenorBertahapBulan,
      };
    }
    case "SET_TAB":
      return { ...state, activeTab: action.tab };
    case "APPLY_DEFAULT_RATE":
      return { ...state, tiers: defaultTiers(action.rate, state.tenorTahun) };
    case "SET_KPR_MODE":
      return {
        ...state,
        kprMode: action.mode,
        // KPR Fix cuma 1 periode fixed lalu floating — pangkas ke tier pertama saja.
        tiers: action.mode === "FIX" ? state.tiers.slice(0, 1) : state.tiers,
      };
    case "ADD_TIER": {
      if (state.kprMode === "FIX" || state.tiers.length >= 6) return state; // batas wajar biar UI tidak meluber
      const last = state.tiers[state.tiers.length - 1];
      return { ...state, tiers: [...state.tiers, { durasiTahun: 1, sukuBunga: last?.sukuBunga ?? 0.03 }] };
    }
    case "REMOVE_TIER": {
      if (state.tiers.length <= 1) return state;
      const tiers = state.tiers.filter((_, i) => i !== action.index);
      return { ...state, tiers };
    }
    case "UPDATE_TIER": {
      const tiers = state.tiers.map((t, i) => (i === action.index ? { ...t, [action.field]: action.value } : t));
      return { ...state, tiers };
    }
    case "APPLY_BANK_PRESET": {
      const { durasiTahun, sukuBunga } = action.preset.tierPertama;
      const tiers = [...state.tiers];
      tiers[0] = { durasiTahun, sukuBunga };
      return { ...state, tiers };
    }
    case "RESET":
      return { ...initialFormState, tiers: defaultTiers(DEFAULT_SUKU_BUNGA, initialFormState.tenorTahun) };
    default:
      return state;
  }
}
