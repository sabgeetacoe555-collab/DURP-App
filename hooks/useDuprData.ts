import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase"
import { useAuth } from "./useAuth"

interface DuprData {
  duprId: string | null
  singlesRating: number | null
  doublesRating: number | null
  isConnected: boolean
}

export const useDuprData = () => {
  const { user } = useAuth()
  const [duprData, setDuprData] = useState<DuprData>({
    duprId: null,
    singlesRating: null,
    doublesRating: null,
    isConnected: false,
  })
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadDuprData = async () => {
    if (!user) {
      setDuprData({
        duprId: null,
        singlesRating: null,
        doublesRating: null,
        isConnected: false,
      })
      setIsLoading(false)
      return
    }

    try {
      setIsLoading(true)
      setError(null)

      const { data, error: fetchError } = await supabase
        .from("users")
        .select("dupr_id, dupr_rating_singles, dupr_rating_doubles")
        .eq("id", user.id)
        .single()

      if (fetchError) {
        console.error("Error fetching DUPR data:", fetchError)
        setError(fetchError.message)
        setDuprData({
          duprId: null,
          singlesRating: null,
          doublesRating: null,
          isConnected: false,
        })
      } else {
        const isConnected = !!data?.dupr_id
        setDuprData({
          duprId: data?.dupr_id || null,
          singlesRating: data?.dupr_rating_singles || null,
          doublesRating: data?.dupr_rating_doubles || null,
          isConnected,
        })
      }
    } catch (err) {
      console.error("Error in loadDuprData:", err)
      setError(err instanceof Error ? err.message : "Unknown error")
      setDuprData({
        duprId: null,
        singlesRating: null,
        doublesRating: null,
        isConnected: false,
      })
    } finally {
      setIsLoading(false)
    }
  }

  const connectToDupr = async () => {
    // This would typically open the DUPR connection flow
    // For now, we'll just reload the data
    await loadDuprData()
  }

  useEffect(() => {
    loadDuprData()
  }, [user])

  return {
    ...duprData,
    isLoading,
    error,
    connectToDupr,
    refreshData: loadDuprData,
  }
}
