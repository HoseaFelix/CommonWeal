import {create} from "zustand"
import { PolicyFeedback } from "../types"


type errorState = {
    error: string;
    setError: (msg: string) => void;
    clearError: () => void;
}

export interface RiskyClause {
    clause: string
    risk: string
    reason?: string
  }
  
  export interface PolicyData {
    riskScore: number
    riskLevel: string
    summary: string
    riskyClauses: RiskyClause[]
    plainEnglish: string[]
    complianceFlags: string[]
    recommendations: string[]
  }
  
  export interface FeedbackErrorState {
    error: string | null
  }
    



export const useFeedbackStore =create<PolicyFeedback>(()=>({
    riskScore: 0,
    riskLevel: "",
    summary: "",
    riskyClauses: [],
    plainEnglish: [],
    complianceFlags: [],
    recommendations: [],
}))

export const useErrorStore = create<errorState>((set)=>({
    error: '',
    setError: (msg) => set({error: msg}),
    clearError: () => set({error: ''})

}))
