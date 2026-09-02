import { ClusterId } from "./pricelist";
import { TermOfPayment, TierMode, KprTierInput } from "./kpr-calculator";
import { BankPreset } from "./bankPresets";
import { Pekerjaan } from "@/types/buyer";
import { DEFAULT_SUKU_BUNGA } from "./simulationLog";

export type TabId = "profil" | "properti" | "term";

export interface FormState {
  nama: string;
  pekerjaan: Pekerjaan;
  usia: number | null;
  cluster: ClusterId | null;
  tipe: string | null;
  unitId: string | null;
  term: TermOfPayment;
  tenorTahun: number;
  sukuBunga: number;
  diskonPreLaunching: number;
  dpPercent: number;
  tierMode: TierMode;
  tiers: KprTierInput[];
  activeTab: TabId;
}

function defaultTiers(rate: number): KprTierInput[] {
  return [
    { durasiTahun: 2, nilai: rate },
    { durasiTahun: 0, nilai: rate }, // durasiTahun tier terakhir diabaikan (otomatis = sisa tenor)
  ];
}

export const initialFormState: FormState = {
  nama: "",
  pekerjaan: "Karyawan",
  usia: null,
  cluster: null,
  tipe: null,
  unitId: null,
  term: "HARD_CASH",
  tenorTahun: 20,
  sukuBunga: DEFAULT_SUKU_BUNGA,
  diskonPreLaunching: 0,
  dpPercent: 0,
  tierMode: "BUNGA",
  tiers: defaultTiers(DEFAULT_SUKU_BUNGA),
  activeTab: "profil",
};

export type FormAction =
  | { type: "SET_FIELD"; field: keyof FormState; value: FormState[keyof FormState] }
  | { type: "SET_CLUSTER"; cluster: ClusterId }
  | { type: "SET_TIPE"; tipe: string }
  | { type: "SET_UNIT"; unitId: string }
  | { type: "SET_TAB"; tab: TabId }
  | { type: "APPLY_DEFAULT_RATE"; rate: number }
  | { type: "SET_TIER_MODE"; mode: TierMode }
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
    case "SET_UNIT":
      return { ...state, unitId: action.unitId };
    case "SET_TAB":
      return { ...state, activeTab: action.tab };
    case "APPLY_DEFAULT_RATE":
      return { ...state, sukuBunga: action.rate };
    case "SET_TIER_MODE":
      return {
        ...state,
        tierMode: action.mode,
        tiers:
          action.mode === "BUNGA"
            ? defaultTiers(state.sukuBunga)
            : [
                { durasiTahun: 2, nilai: 0 },
                { durasiTahun: 0, nilai: 0.05 },
              ],
      };
    case "ADD_TIER": {
      if (state.tiers.length >= 6) return state; // batas wajar biar UI tidak meluber
      const tiers = [...state.tiers];
      const defaultNilai = state.tierMode === "BUNGA" ? state.sukuBunga : 0.05;
      tiers.splice(tiers.length - 1, 0, { durasiTahun: 1, nilai: defaultNilai });
      return { ...state, tiers };
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
      return {
        ...state,
        tierMode: "BUNGA",
        tiers: [
          { durasiTahun, nilai: sukuBunga },
          { durasiTahun: 0, nilai: state.sukuBunga },
        ],
      };
    }
    case "RESET":
      return { ...initialFormState, sukuBunga: state.sukuBunga, tiers: defaultTiers(state.sukuBunga) };
    default:
      return state;
  }
}
