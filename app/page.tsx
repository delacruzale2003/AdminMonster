'use client'

import React, { useState, useEffect } from 'react'
import { createClient } from '@supabase/supabase-js'
import { 
  Download, 
  Trophy, 
  Users, 
  Search, 
  Loader2, 
  Gift,
  RefreshCw,
  X,
  Maximize2,
  ZoomIn,
  ZoomOut
} from 'lucide-react'
import * as XLSX from 'xlsx'

// --- CONFIGURACIÓN DE SUPABASE ---
// Inicialización local para evitar errores de resolución de módulos externos en el entorno de previsualización
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
const supabase = createClient(supabaseUrl, supabaseAnonKey)

export default function AdminPage() {
  // --- CONFIGURACIÓN ---
  const CAMPAIGN_NAME = process.env.NEXT_PUBLIC_CAMPAIGN || ''

  // --- ESTADOS ---
  const [campaign, setCampaign] = useState<any>(null)
  const [registrations, setRegistrations] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  
  // Estados del Sorteo
  const [isRaffling, setIsRaffling] = useState(false)
  const [winner, setWinner] = useState<any>(null)

  // Estado del Modal de Imagen
  const [selectedImage, setSelectedImage] = useState(null)
  const [isZoomed, setIsZoomed] = useState(false)

  // --- CARGA INICIAL ---
  useEffect(() => {
    const initAdmin = async () => {
      if (!supabaseUrl || !supabaseAnonKey) {
        console.error("Supabase credentials missing")
        setLoading(false)
        return
      }

      setLoading(true)
      try {
        // 1. Obtener ID de la campaña desde el ENV
        const { data: campData, error: campError } = await supabase
          .from('campaigns')
          .select('*')
          .eq('name', CAMPAIGN_NAME)
          .single()

        if (campData) {
          setCampaign(campData)
          // 2. Cargar registros de esa campaña
          const { data: regData, error: regError } = await supabase
            .from('registrations')
            .select('*')
            .eq('campaign_id', campData.id)
            .order('created_at', { ascending: false })
          
          if (regData) setRegistrations(regData)
        }
      } catch (err) {
        console.error("Error initializing admin:", err)
      } finally {
        setLoading(false)
      }
    }

    initAdmin()
  }, [CAMPAIGN_NAME])

  // --- ACCIONES ---
  const handleExportExcel = () => {
    if (registrations.length === 0) return
    
    try {
      const dataToExport = registrations.map(reg => ({
        'Nombre Completo': reg.full_name,
        'DNI/ID': reg.dni || 'N/A',
        'Teléfono': reg.phone,
       
        'Fecha': new Date(reg.created_at).toLocaleString('es-PE'),
        'Link Voucher': reg.voucher_url
      }))
      
      const ws = XLSX.utils.json_to_sheet(dataToExport)
      const wb = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(wb, ws, "Participantes")
      XLSX.writeFile(wb, `Registros_${CAMPAIGN_NAME}_${Date.now()}.xlsx`)
    } catch (err) {
      console.error("Error exporting Excel:", err)
    }
  }

  const handleRandomWinner = () => {
    if (registrations.length === 0) return
    setIsRaffling(true)
    setWinner(null)

    let iterations = 0
    const maxIterations = 35 
    
    const interval = setInterval(() => {
      const randomIndex = Math.floor(Math.random() * registrations.length)
      setWinner(registrations[randomIndex])
      iterations++

      if (iterations >= maxIterations) {
        clearInterval(interval)
        setIsRaffling(false)
      }
    }, 80)
  }

  // Filtrado por búsqueda
  const filteredRegistrations = registrations.filter(r => 
    r.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.dni?.includes(searchTerm) ||
    r.phone?.includes(searchTerm)
  )

  const closeImageModal = () => {
    setSelectedImage(null)
    setIsZoomed(false)
  }

  if (loading && !campaign) {
    return (
      <div className="h-screen w-full flex flex-col items-center justify-center bg-[#88c641] gap-4">
        <Loader2 className="animate-spin text-[#e53829]" size={48} />
        <p className="font-black uppercase tracking-widest text-xs text-zinc-400">Autenticando Campaña...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#88c641] dark:bg-black font-sans text-zinc-900 dark:text-zinc-100 p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* HEADER LOCKADO A CAMPAIGN */}
        <header className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 border-b border-zinc-200 dark:border-zinc-800 pb-8">
          <div className="space-y-1">
            <h1 className="text-4xl font-black uppercase tracking-tighter leading-none flex items-center gap-3">
              <Gift className="text-[#88c641]" size={32} />
              Admin <span className="text-[#88c641]">Promo Monster Oxxo</span>
            </h1>
            <div className="flex items-center gap-2 mt-2">
              <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse"></div>
              <p className="text-zinc-500 text-xs font-black uppercase tracking-[0.2em]">Campaña Activa: {CAMPAIGN_NAME}</p>
            </div>
          </div>

          <div className="flex items-center gap-3 w-full lg:w-auto">
            <button 
              onClick={handleExportExcel}
              disabled={registrations.length === 0}
              className="flex-1 sm:flex-none bg-zinc-900 dark:bg-white text-white dark:text-black px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-2 shadow-xl disabled:opacity-50"
            >
              <Download size={16} strokeWidth={3} /> Excel
            </button>
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
          
          {/* COLUMNA IZQUIERDA: SORTEO Y STATS */}
          <div className="lg:col-span-4 space-y-6">
            
            {/* CARD DE GANADOR */}
            <div className="bg-zinc-900 dark:bg-zinc-800 p-10 rounded-[4rem] shadow-2xl relative overflow-hidden group border border-white/5 flex flex-col items-center text-center">
              <div className="relative z-10 w-full flex flex-col items-center">
                <div className="w-24 h-24 bg-[#88c641] rounded-[2.5rem] flex items-center justify-center mb-6 shadow-2xl rotate-3 transform transition-transform group-hover:rotate-0">
                  <Trophy className="text-white" size={48} strokeWidth={2.5} />
                </div>
                <h3 className="text-white font-black text-3xl uppercase tracking-tighter mb-4 italic leading-none">Sorteo</h3>
                
                <div className="w-full bg-black/40 backdrop-blur-md rounded-[2.5rem] p-8 mb-8 min-h-[160px] flex flex-col justify-center items-center border border-white/10 shadow-inner">
                  {winner ? (
                    <div className="animate-in zoom-in duration-300">
                      <p className="text-[#88c641] font-black text-2xl uppercase tracking-tighter leading-tight mb-2">
                        {winner.full_name}
                      </p>
                      <p className="text-zinc-400 font-bold text-sm tracking-[0.2em] uppercase">{winner.phone}</p>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-3 opacity-20">
                      <RefreshCw className={isRaffling ? "animate-spin" : ""} size={32} />
                      <p className="text-zinc-400 font-black uppercase text-xs tracking-widest italic">
                        {isRaffling ? 'Eligiendo...' : 'Esperando'}
                      </p>
                    </div>
                  )}
                </div>

                <button 
                  onClick={handleRandomWinner}
                  disabled={isRaffling || registrations.length === 0}
                  className="w-full py-5 bg-white text-black rounded-full font-black text-lg uppercase tracking-tighter hover:bg-[#88c641] hover:text-white transition-all active:scale-95 shadow-xl disabled:opacity-20"
                >
                  {isRaffling ? 'Girando...' : 'Elegir Ganador'}
                </button>
              </div>
              <div className="absolute -bottom-20 -right-20 w-64 h-64 bg-orange-500/10 rounded-full blur-[100px]"></div>
            </div>

            {/* CARD STATS */}
            <div className="bg-white dark:bg-zinc-900 p-10 rounded-[3rem] border border-zinc-200 dark:border-zinc-800 shadow-sm flex items-center justify-between">
              <div>
                <p className="text-[11px] font-black uppercase text-zinc-400 tracking-[0.3em] mb-1 leading-none">Total Registrados</p>
                <p className="text-6xl font-black tracking-tighter leading-none">{registrations.length}</p>
              </div>
              <div className="p-5 bg-zinc-100 dark:bg-black rounded-3xl">
                <Users size={40} className="text-zinc-300" />
              </div>
            </div>
          </div>

          {/* COLUMNA DERECHA: TABLA DE DATOS */}
          <div className="lg:col-span-8 bg-white dark:bg-zinc-900 rounded-[4rem] border border-zinc-200 dark:border-zinc-800 shadow-sm overflow-hidden flex flex-col h-[800px]">
            
            <div className="p-10 border-b border-zinc-50 dark:border-zinc-800 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 bg-white dark:bg-zinc-900">
              <h3 className="font-black uppercase tracking-tighter text-2xl">Participantes</h3>
              <div className="relative flex-1 max-w-sm w-full">
                <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-zinc-400" size={18} />
                <input 
                  type="text" 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Buscar por nombre o DNI..."
                  className="w-full bg-zinc-50 dark:bg-black border border-zinc-100 dark:border-zinc-800 rounded-[1.5rem] pl-14 pr-6 py-4 text-sm font-bold outline-none focus:ring-4 focus:ring-orange-500/10 transition-all shadow-inner"
                />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
              {loading ? (
                <div className="h-full flex flex-col items-center justify-center opacity-30 gap-4">
                  <Loader2 className="animate-spin" size={64} strokeWidth={1} />
                  <p className="font-black uppercase text-[10px] tracking-[0.4em]">Sincronizando</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredRegistrations.map((reg) => (
                    <div 
                      key={reg.id} 
                      className="group flex flex-col sm:flex-row sm:items-center justify-between p-6 bg-zinc-50 dark:bg-black/40 rounded-[2.5rem] border border-transparent hover:border-zinc-200 dark:hover:border-white/10 transition-all hover:shadow-md"
                    >
                      <div className="flex items-center gap-5">
                        {/* Mini Preview de Imagen */}
                        <div 
                          onClick={() => setSelectedImage(reg.voucher_url)}
                          className="w-16 h-16 bg-white dark:bg-zinc-800 rounded-2xl flex items-center justify-center overflow-hidden shadow-sm border border-zinc-100 dark:border-white/5 cursor-zoom-in relative group/thumb shrink-0"
                        >
                          <img src={reg.voucher_url} className="w-full h-full object-cover transition-transform group-hover/thumb:scale-110" alt="Thumbnail" />
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/thumb:opacity-100 transition-opacity flex flex-col items-center justify-center">
                            <Maximize2 size={18} className="text-white mb-1" />
                            <span className="text-[8px] text-white font-black uppercase tracking-widest">Ver</span>
                          </div>
                        </div>
                        <div className="min-w-0">
                          <p className="font-black text-lg uppercase tracking-tighter text-zinc-800 dark:text-zinc-100 leading-none mb-1 truncate">
                            {reg.full_name}
                          </p>
                          <p className="text-[11px] font-bold text-zinc-400 uppercase tracking-widest truncate">
                            • {reg.phone}
                          </p>
                          
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-4 mt-6 sm:mt-0 ml-auto sm:ml-0 border-t sm:border-none pt-4 sm:pt-0 w-full sm:w-auto shrink-0">
                        <div className="text-right">
                          <p className="text-[9px] font-black text-zinc-300 uppercase tracking-widest mb-0.5">Fecha Registro</p>
                          <p className="text-xs font-bold text-zinc-400">
                            {new Date(reg.created_at).toLocaleDateString('es-PE')} • {new Date(reg.created_at).toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}

                  {filteredRegistrations.length === 0 && (
                    <div className="py-40 text-center flex flex-col items-center gap-4 text-zinc-300">
                      <Search size={64} strokeWidth={1} className="opacity-10" />
                      <p className="font-black uppercase tracking-widest text-xs">Sin registros</p>
                    </div>
                  )}
                </div>
              )}
            </div>
            
            <div className="p-8 bg-zinc-50 dark:bg-zinc-800/20 border-t border-zinc-100 dark:border-zinc-800 text-center">
              <p className="text-[10px] font-black text-zinc-300 uppercase tracking-[0.5em]"> </p>
            </div>
          </div>

        </div>
      </div>

      {/* MODAL DE PREVISUALIZACIÓN DE VOUCHER MEJORADO */}
      {selectedImage && (
        <div 
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-8 animate-in fade-in duration-300"
        >
          {/* Backdrop con Blur más fuerte */}
          <div 
            className="absolute inset-0 bg-black/95 backdrop-blur-xl"
            onClick={closeImageModal}
          ></div>
          
          {/* Contenido del Modal Mejorado */}
          <div className="relative w-full max-w-4xl h-[85vh] flex flex-col items-center justify-center animate-in zoom-in duration-300">
            
            {/* Botón de Cerrar */}
            <button 
              onClick={closeImageModal}
              className="absolute -top-4 -right-4 z-[110] bg-white text-black p-3 rounded-full shadow-2xl hover:scale-110 active:scale-95 transition-all hover:bg-[#e53829] hover:text-white"
            >
              <X size={24} strokeWidth={3} />
            </button>
            
            {/* Contenedor de Imagen con Zoom */}
            <div 
              className={`relative w-full h-full bg-zinc-900 rounded-[2.5rem] overflow-hidden flex items-center justify-center border border-white/10 shadow-2xl cursor-pointer`}
              onClick={() => setIsZoomed(!isZoomed)}
            >
               <img 
                 src={selectedImage} 
                 className={`max-w-full max-h-full object-contain transition-all duration-500 ease-in-out ${isZoomed ? 'scale-150' : 'scale-100'}`} 
                 alt="Voucher Preview" 
               />
               
               {/* Badge de Zoom */}
               <div className="absolute bottom-6 bg-black/60 backdrop-blur-md px-4 py-2 rounded-full border border-white/20 text-white text-[10px] font-black uppercase tracking-widest flex items-center gap-2 pointer-events-none">
                  {isZoomed ? <><ZoomOut size={14}/> Click para alejar</> : <><ZoomIn size={14}/> Click para zoom</>}
               </div>
            </div>
            
            {/* Footer del Modal */}
            <div className="mt-6 flex gap-4 w-full justify-center">
              <a 
                href={selectedImage} 
                target="_blank" 
                className="bg-white text-black px-10 py-4 rounded-full font-black uppercase text-xs tracking-widest hover:bg-[#e53829] hover:text-white transition-all shadow-xl flex items-center gap-2"
              >
                <Maximize2 size={16} /> Abrir original
              </a>
              <button 
                onClick={closeImageModal}
                className="bg-zinc-800 text-white border border-white/10 px-10 py-4 rounded-full font-black uppercase text-xs tracking-widest hover:bg-zinc-700 transition-all shadow-xl"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 5px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #e2e8f0;
          border-radius: 10px;
        }
        .dark .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #27272a;
        }
      `}</style>
    </div>
  )
}