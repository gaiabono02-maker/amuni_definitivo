export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      abbonamenti: {
        Row: {
          created_at: string
          id: string
          inizio: string | null
          note: string
          piano: string
          prezzo: number
          scadenza: string | null
          stato: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          inizio?: string | null
          note?: string
          piano?: string
          prezzo?: number
          scadenza?: string | null
          stato?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          inizio?: string | null
          note?: string
          piano?: string
          prezzo?: number
          scadenza?: string | null
          stato?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      acquirenti: {
        Row: {
          articoli: Json
          created_at: string
          email: string
          id: string
          nome: string
          totale: number
        }
        Insert: {
          articoli?: Json
          created_at?: string
          email: string
          id?: string
          nome: string
          totale?: number
        }
        Update: {
          articoli?: Json
          created_at?: string
          email?: string
          id?: string
          nome?: string
          totale?: number
        }
        Relationships: []
      }
      aziende: {
        Row: {
          certificazioni: string[]
          codice_accesso: string | null
          comune: string
          created_at: string
          descrizione: string
          facebook: string | null
          id: string
          instagram: string | null
          logo_url: string | null
          nome: string
          provincia: string
          pubblica: boolean
          settore: string
          sito_web: string | null
          slug: string
          updated_at: string
        }
        Insert: {
          certificazioni?: string[]
          codice_accesso?: string | null
          comune?: string
          created_at?: string
          descrizione?: string
          facebook?: string | null
          id?: string
          instagram?: string | null
          logo_url?: string | null
          nome: string
          provincia?: string
          pubblica?: boolean
          settore?: string
          sito_web?: string | null
          slug: string
          updated_at?: string
        }
        Update: {
          certificazioni?: string[]
          codice_accesso?: string | null
          comune?: string
          created_at?: string
          descrizione?: string
          facebook?: string | null
          id?: string
          instagram?: string | null
          logo_url?: string | null
          nome?: string
          provincia?: string
          pubblica?: boolean
          settore?: string
          sito_web?: string | null
          slug?: string
          updated_at?: string
        }
        Relationships: []
      }
      bundle: {
        Row: {
          attivo: boolean
          created_at: string
          descrizione: string
          id: string
          immagine_url: string | null
          nome: string
          ordine: number
          prezzo: number
          prezzo_singoli: number
          prodotti_inclusi: string[]
          updated_at: string
        }
        Insert: {
          attivo?: boolean
          created_at?: string
          descrizione?: string
          id?: string
          immagine_url?: string | null
          nome: string
          ordine?: number
          prezzo?: number
          prezzo_singoli?: number
          prodotti_inclusi?: string[]
          updated_at?: string
        }
        Update: {
          attivo?: boolean
          created_at?: string
          descrizione?: string
          id?: string
          immagine_url?: string | null
          nome?: string
          ordine?: number
          prezzo?: number
          prezzo_singoli?: number
          prodotti_inclusi?: string[]
          updated_at?: string
        }
        Relationships: []
      }
      iscrizioni: {
        Row: {
          azienda: string
          created_at: string
          email: string
          id: string
          messaggio: string | null
          nome: string
          provincia: string | null
          settore: string | null
          stato: string
        }
        Insert: {
          azienda: string
          created_at?: string
          email: string
          id?: string
          messaggio?: string | null
          nome: string
          provincia?: string | null
          settore?: string | null
          stato?: string
        }
        Update: {
          azienda?: string
          created_at?: string
          email?: string
          id?: string
          messaggio?: string | null
          nome?: string
          provincia?: string | null
          settore?: string | null
          stato?: string
        }
        Relationships: []
      }
      prodotti: {
        Row: {
          azienda: string
          categoria: string
          created_at: string
          descrizione: string
          disponibile: boolean
          id: string
          immagine_url: string | null
          nome: string
          ordine: number
          prezzo: number
          provincia: string
          updated_at: string
        }
        Insert: {
          azienda?: string
          categoria?: string
          created_at?: string
          descrizione?: string
          disponibile?: boolean
          id?: string
          immagine_url?: string | null
          nome: string
          ordine?: number
          prezzo?: number
          provincia?: string
          updated_at?: string
        }
        Update: {
          azienda?: string
          categoria?: string
          created_at?: string
          descrizione?: string
          disponibile?: boolean
          id?: string
          immagine_url?: string | null
          nome?: string
          ordine?: number
          prezzo?: number
          provincia?: string
          updated_at?: string
        }
        Relationships: []
      }
      prodotto_del_mese: {
        Row: {
          attivo: boolean
          created_at: string
          id: string
          prodotto_id: string | null
          produttore_storia: string
          scadenza: string
          sconto_percentuale: number
          updated_at: string
        }
        Insert: {
          attivo?: boolean
          created_at?: string
          id?: string
          prodotto_id?: string | null
          produttore_storia?: string
          scadenza?: string
          sconto_percentuale?: number
          updated_at?: string
        }
        Update: {
          attivo?: boolean
          created_at?: string
          id?: string
          prodotto_id?: string | null
          produttore_storia?: string
          scadenza?: string
          sconto_percentuale?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "prodotto_del_mese_prodotto_id_fkey"
            columns: ["prodotto_id"]
            isOneToOne: false
            referencedRelation: "prodotti"
            referencedColumns: ["id"]
          },
        ]
      }
      profili: {
        Row: {
          citta: string
          created_at: string
          email: string
          id: string
          indirizzo: string
          nome: string
          provincia: string
          telefono: string
          updated_at: string
          user_id: string
        }
        Insert: {
          citta?: string
          created_at?: string
          email?: string
          id?: string
          indirizzo?: string
          nome?: string
          provincia?: string
          telefono?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          citta?: string
          created_at?: string
          email?: string
          id?: string
          indirizzo?: string
          nome?: string
          provincia?: string
          telefono?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      richieste_interesse: {
        Row: {
          azienda: string
          azienda_slug: string
          contattato_il: string | null
          created_at: string
          email_cliente: string
          id: string
          messaggio: string
          nome_cliente: string
          note_interne: string
          prodotto_id: string | null
          prodotto_nome: string
          stato: string
          telefono_cliente: string | null
          updated_at: string
        }
        Insert: {
          azienda: string
          azienda_slug: string
          contattato_il?: string | null
          created_at?: string
          email_cliente: string
          id?: string
          messaggio?: string
          nome_cliente: string
          note_interne?: string
          prodotto_id?: string | null
          prodotto_nome: string
          stato?: string
          telefono_cliente?: string | null
          updated_at?: string
        }
        Update: {
          azienda?: string
          azienda_slug?: string
          contattato_il?: string | null
          created_at?: string
          email_cliente?: string
          id?: string
          messaggio?: string
          nome_cliente?: string
          note_interne?: string
          prodotto_id?: string | null
          prodotto_nome?: string
          stato?: string
          telefono_cliente?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      richieste_prodotti: {
        Row: {
          categoria: string
          created_at: string
          email: string
          id: string
          nome_prodotto: string
          note: string
          stato: string
        }
        Insert: {
          categoria?: string
          created_at?: string
          email: string
          id?: string
          nome_prodotto: string
          note?: string
          stato?: string
        }
        Update: {
          categoria?: string
          created_at?: string
          email?: string
          id?: string
          nome_prodotto?: string
          note?: string
          stato?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "user"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "user"],
    },
  },
} as const
