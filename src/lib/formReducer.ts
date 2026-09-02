import { ClusterId } from "./pricelist";
import { TermOfPayment } from "./kpr-calculator";
import { Pekerjaan } from "@/types/buyer";
import { DEFAULT_SUKU_BUNGA } from "./simulationLog";

export type TabId = "profil" | "properti" | "term";

export interface FormState {
  nama: string;
  pekerjaan: Pekerjaan;
  usia: number | null;
  kprAktif: number;
  cluster: ClusterId | null;
  tipe: string | null;
  unitId: string | null;
  term: TermOfPayment;
  tenorTahun: number;
  sukuBunga: number;
  diskonPreLaunching: number;
  dpPercent: number;
  activeTab: TabId;
}

export const initialFormState: FormState = {
  nama: "",
  pekerjaan: "Karyawan",
  usia: null,
  kprAktif: 0,
  cluster: null,
  tipe: null,
  unitId: null,
  term: "HARD_CASH",
  tenorTahun: 20,
  sukuBunga: DEFAULT_SUKU_BUNGA,
  diskonPreLaunching: 0,
  dpPercent: 0,
  activeTab: "profil",
};

export type FormAction =
  | { type: "SET_FIELD"; field: keyof FormState; value: FormState[keyof FormState] }
  | { type: "SET_CLUSTER"; cluster: ClusterId }
  | { type: "SET_TIPE"; tipe: string }
  | { type: "SET_UNIT"; unitId: string }
  | { type: "SET_TAB"; tab: TabId }
  | { type: "APPLY_DEFAULT_RATE"; rate: number }
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
    case "RESET":
      return { ...initialFormState, sukuBunga: state.sukuBunga };
    default:
      return state;
  }
}
