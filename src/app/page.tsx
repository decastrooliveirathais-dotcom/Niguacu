'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'
import { Users, GraduationCap, DollarSign, CheckCircle, XCircle, Search, RefreshCw, BookOpen } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'

// Paleta de cores Estácio
const COLORS = {
  green: '#2ecc71',
  red: '#e74c3c',
  purple: '#9b59b6',
  yellow: '#f1c40f',
  orange: '#e67e22',
  blue: '#3498db',
  grayDark: '#333333',
  grayMedium: '#666666',
  grayLight: '#f5f5f5',
  white: '#ffffff'
}

function KPICard({ titulo, valor, subtitulo, icon: Icon, color, bgColor }: { 
  titulo: string; valor: string | number; subtitulo?: string; icon?: React.ElementType; color: string; bgColor: string 
}) {
  return (
    <Card className="shadow-md border-0" style={{ backgroundColor: COLORS.white }}>
      <CardContent className="pt-5 pb-5 px-5">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm font-medium mb-1" style={{ color: COLORS.grayMedium }}>{titulo}</p>
            <p className="text-3xl font-bold" style={{ color }}>{typeof valor === 'number' ? valor.toLocaleString('pt-BR') : valor}</p>
            {subtitulo && <p className="text-xs mt-1" style={{ color: COLORS.grayMedium }}>{subtitulo}</p>}
          </div>
          {Icon && (
            <div className="p-3 rounded-xl" style={{ backgroundColor: bgColor }}>
              <Icon className="w-5 h-5 text-white" />
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

function ChartCard({ title, data, dataKey, color }: { 
  title: string; data: any[]; dataKey: string; color: string
}) {
  return (
    <Card className="shadow-md border-0" style={{ backgroundColor: COLORS.white }}>
      <CardHeader className="pb-2 pt-4 px-4">
        <CardTitle className="text-sm font-semibold" style={{ color: COLORS.grayDark }}>{title}</CardTitle>
      </CardHeader>
      <CardContent className="pb-4 px-4">
        <div className="h-48">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis type="number" fontSize={11} tickLine={false} />
              <YAxis type="category" dataKey="nome" width={120} fontSize={10} tickFormatter={(v) => v.length > 18 ? `${v.slice(0, 18)}...` : v} tickLine={false} />
              <Tooltip 
                formatter={(v: number) => v.toLocaleString('pt-BR')}
                contentStyle={{ borderRadius: 8, border: 'none', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}
              />
              <Bar dataKey={dataKey} fill={color} radius={[0, 6, 6, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}

export default function Dashboard() {
  const [data, setData] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)
  const [filtros, setFiltros] = useState({ campus: 'todos', curso: 'todos', turno: 'todos', modelo: 'todos', busca: '' })
  const [pagina, setPagina] = useState(1)
  const loadingRef = useRef(true)
  const [, update] = useState({})
  const loading = loadingRef.current || !data

  const fetcher = useCallback(async (signal: AbortSignal) => {
    loadingRef.current = true
    update({})
    
    const p = new URLSearchParams()
    if (filtros.campus !== 'todos') p.set('campus', filtros.campus)
    if (filtros.curso !== 'todos') p.set('curso', filtros.curso)
    if (filtros.turno !== 'todos') p.set('turno', filtros.turno)
    if (filtros.modelo !== 'todos') p.set('modelo', filtros.modelo)
    if (filtros.busca) p.set('busca', filtros.busca)
    p.set('pagina', String(pagina))

    try {
      const res = await fetch(`/api/dashboard?${p}`, { signal })
      setData(await res.json())
      setError(null)
    } catch (e: any) {
      if (e.name !== 'AbortError') setError('Erro ao carregar')
    } finally {
      loadingRef.current = false
      update({})
    }
  }, [filtros, pagina])

  useEffect(() => {
    const c = new AbortController()
    fetcher(c.signal)
    return () => c.abort()
  }, [fetcher])

  const setF = (k: string, v: string) => { setFiltros(p => ({ ...p, [k]: v })); setPagina(1) }
  const clear = () => { setFiltros({ campus: 'todos', curso: 'todos', turno: 'todos', modelo: 'todos', busca: '' }); setPagina(1) }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4" style={{ backgroundColor: COLORS.grayLight }}>
        <Card className="max-w-sm w-full shadow-lg" style={{ backgroundColor: COLORS.white }}><CardContent className="flex flex-col items-center py-10">
          <RefreshCw className="w-12 h-12 mb-4" style={{ color: COLORS.red }} />
          <p className="mb-4" style={{ color: COLORS.grayMedium }}>{error}</p>
          <Button onClick={() => location.reload()}>Tentar novamente</Button>
        </CardContent></Card>
      </div>
    )
  }

  const confirmacaoData = [
    { nome: 'Confirmadas', valor: data?.graficos?.percentualConfirmacao?.confirmadas || 0, fill: COLORS.green },
    { nome: 'Não Confirmadas', valor: data?.graficos?.percentualConfirmacao?.naoConfirmadas || 0, fill: COLORS.red }
  ]

  return (
    <div className="min-h-screen p-4 md:p-6" style={{ backgroundColor: COLORS.grayLight }}>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6 flex items-center gap-4">
          <img 
            src="/estacio-logo.png" 
            alt="Estácio" 
            className="h-14 w-auto object-contain"
            style={{ maxHeight: '56px', width: 'auto' }}
          />
          <div>
            <h1 className="text-xl md:text-2xl font-bold" style={{ color: COLORS.grayDark }}>Dashboard - Acompanhamento de cursos</h1>
            <p className="text-sm" style={{ color: COLORS.grayMedium }}>Período 2026.1</p>
          </div>
        </div>

        {/* Filtros */}
        <Card className="shadow-md border-0 mb-6" style={{ backgroundColor: COLORS.white }}>
          <CardContent className="pt-4 pb-4">
            <div className="flex flex-wrap gap-3 items-center">
              <div className="relative flex-1 min-w-[180px] max-w-[280px]">
                <Search className="absolute left-3 top-2.5 w-4 h-4" style={{ color: COLORS.grayMedium }} />
                <Input placeholder="Buscar curso, modelo, turno..." className="pl-9 h-10" onChange={e => setF('busca', e.target.value)} />
              </div>
              <Select value={filtros.campus} onValueChange={v => setF('campus', v)}>
                <SelectTrigger className="w-[150px] h-10"><SelectValue placeholder="Campus" /></SelectTrigger>
                <SelectContent className="max-h-48">{data?.filtros?.campus?.map((c: string) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
              </Select>
              <Select value={filtros.curso} onValueChange={v => setF('curso', v)}>
                <SelectTrigger className="w-[180px] h-10"><SelectValue placeholder="Curso" /></SelectTrigger>
                <SelectContent className="max-h-48">{data?.filtros?.cursos?.map((c: string) => <SelectItem key={c} value={c}>{c.length > 25 ? c.slice(0, 25) + '...' : c}</SelectItem>)}</SelectContent>
              </Select>
              <Select value={filtros.turno} onValueChange={v => setF('turno', v)}>
                <SelectTrigger className="w-[100px] h-10"><SelectValue placeholder="Turno" /></SelectTrigger>
                <SelectContent>{data?.filtros?.turnos?.map((t: string) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
              </Select>
              <Select value={filtros.modelo} onValueChange={v => setF('modelo', v)}>
                <SelectTrigger className="w-[130px] h-10"><SelectValue placeholder="Modelo" /></SelectTrigger>
                <SelectContent>{data?.filtros?.modelos?.map((m: string) => <SelectItem key={m} value={m}>{m}</SelectItem>)}</SelectContent>
              </Select>
              <Button variant="outline" size="sm" className="h-10 px-4" onClick={clear}>Limpar</Button>
            </div>
          </CardContent>
        </Card>

        {/* KPIs */}
        {loading && !data ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
            {[...Array(6)].map((_, i) => <Card key={i} className="shadow-md"><CardContent className="py-6"><Skeleton className="h-16 w-full" /></CardContent></Card>)}
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
            <KPICard 
              titulo="Total Oportunidades" 
              valor={data?.kpis?.totalOportunidades || 0} 
              icon={Users} 
              color={COLORS.blue} 
              bgColor={COLORS.blue} 
            />
            <KPICard 
              titulo="Matrículas Financeiras" 
              valor={data?.kpis?.totalMatFin || 0}
              subtitulo="Pagamentos confirmados"
              icon={DollarSign} 
              color={COLORS.green} 
              bgColor={COLORS.green} 
            />
            <KPICard 
              titulo="Matrículas Acadêmicas" 
              valor={data?.kpis?.totalMatAcad || 0}
              subtitulo="Finalizadas"
              icon={GraduationCap} 
              color={COLORS.purple} 
              bgColor={COLORS.purple} 
            />
            <KPICard 
              titulo="Total de Turmas" 
              valor={data?.kpis?.totalTurmas || 0}
              icon={BookOpen} 
              color={COLORS.orange} 
              bgColor={COLORS.orange} 
            />
            <KPICard 
              titulo="Turmas Confirmadas" 
              valor={data?.kpis?.turmasConfirmadas || 0}
              subtitulo={`${data?.kpis?.percentualConfirmacao}%`}
              icon={CheckCircle} 
              color={COLORS.green} 
              bgColor={COLORS.green} 
            />
            <KPICard 
              titulo="Turmas Não Confirmadas" 
              valor={data?.kpis?.turmasNaoConfirmadas || 0}
              icon={XCircle} 
              color={COLORS.red} 
              bgColor={COLORS.red} 
            />
          </div>
        )}

        {/* Seção: Visão Geral */}
        <div className="mb-6">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2" style={{ color: COLORS.grayDark }}>
            <BookOpen className="w-5 h-5" style={{ color: COLORS.purple }} />
            Visão Geral
          </h2>
          
          {loading && !data ? (
            <div className="grid md:grid-cols-3 gap-4">
              {[...Array(3)].map((_, i) => <Card key={i} className="shadow-md"><CardContent className="py-4"><Skeleton className="h-56 w-full" /></CardContent></Card>)}
            </div>
          ) : (
            <div className="grid md:grid-cols-3 gap-4">
              {/* Percentual de Confirmação */}
              <Card className="shadow-md border-0" style={{ backgroundColor: COLORS.white }}>
                <CardHeader className="pb-2 pt-4 px-4">
                  <CardTitle className="text-sm font-semibold" style={{ color: COLORS.grayDark }}>Percentual de Confirmação de Turmas</CardTitle>
                </CardHeader>
                <CardContent className="pb-4 px-4">
                  <div className="h-48 flex items-center justify-center">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={confirmacaoData}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={80}
                          dataKey="valor"
                          paddingAngle={2}
                        >
                          {confirmacaoData.map((entry, index) => (
                            <Cell key={index} fill={entry.fill} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(v: number) => v.toLocaleString('pt-BR')} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="flex justify-center gap-6 mt-2">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS.green }}></div>
                      <span className="text-xs" style={{ color: COLORS.grayMedium }}>Confirmadas ({data?.kpis?.percentualConfirmacao}%)</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS.red }}></div>
                      <span className="text-xs" style={{ color: COLORS.grayMedium }}>Não Confirmadas</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Top 5 MAT FIN */}
              <ChartCard 
                title="Top 5 Cursos - Mat. Financeira" 
                data={data?.graficos?.top5MatFin} 
                dataKey="matFin" 
                color={COLORS.green} 
              />

              {/* Bottom 5 MAT FIN */}
              <ChartCard 
                title="Bottom 5 Cursos - Mat. Financeira" 
                data={data?.graficos?.bottom5MatFin} 
                dataKey="matFin" 
                color={COLORS.orange} 
              />
            </div>
          )}
        </div>

        {/* Seção: Todas as Turmas */}
        <div>
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2" style={{ color: COLORS.grayDark }}>
            <BookOpen className="w-5 h-5" style={{ color: COLORS.purple }} />
            Todas as Turmas
            <Badge variant="secondary" className="ml-2">{data?.turmas?.paginacao?.registros?.toLocaleString('pt-BR') || 0} turmas</Badge>
          </h2>

          <Card className="shadow-md border-0" style={{ backgroundColor: COLORS.white }}>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b" style={{ backgroundColor: COLORS.grayLight }}>
                      <th className="text-left p-3 text-xs font-semibold uppercase tracking-wider" style={{ color: COLORS.grayMedium }}>Curso</th>
                      <th className="text-left p-3 text-xs font-semibold uppercase tracking-wider" style={{ color: COLORS.grayMedium }}>Modelo de Ensino</th>
                      <th className="text-left p-3 text-xs font-semibold uppercase tracking-wider" style={{ color: COLORS.grayMedium }}>Turno</th>
                      <th className="text-center p-3 text-xs font-semibold uppercase tracking-wider" style={{ color: COLORS.grayMedium }}>MAT FIN</th>
                      <th className="text-center p-3 text-xs font-semibold uppercase tracking-wider" style={{ color: COLORS.grayMedium }}>MAT ACAD</th>
                      <th className="text-center p-3 text-xs font-semibold uppercase tracking-wider" style={{ color: COLORS.grayMedium }}>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loading ? (
                      [...Array(10)].map((_, i) => (
                        <tr key={i} className="border-b"><td colSpan={6} className="p-3"><Skeleton className="h-4 w-full" /></td></tr>
                      ))
                    ) : data?.turmas?.dados?.map((t: any, i: number) => (
                      <tr key={i} className={`border-b hover:bg-gray-50 transition-colors`} style={{ backgroundColor: t.status === 'Não Confirmado' ? '#fef2f2' : COLORS.white }}>
                        <td className="p-3">
                          <span className="font-medium text-sm" style={{ color: COLORS.grayDark }} title={t.curso}>
                            {t.curso.length > 35 ? `${t.curso.slice(0, 35)}...` : t.curso}
                          </span>
                        </td>
                        <td className="p-3 text-sm" style={{ color: COLORS.grayMedium }}>{t.modelo}</td>
                        <td className="p-3 text-sm" style={{ color: COLORS.grayMedium }}>{t.turno}</td>
                        <td className="p-3 text-center">
                          <span className="font-semibold" style={{ color: COLORS.green }}>{t.matFin}</span>
                        </td>
                        <td className="p-3 text-center">
                          <span className="font-semibold" style={{ color: COLORS.purple }}>{t.matAcad}</span>
                        </td>
                        <td className="p-3 text-center">
                          <Badge 
                            className="text-white font-medium px-3 py-1"
                            style={{ backgroundColor: t.status === 'Confirmado' ? COLORS.green : COLORS.red }}
                          >
                            {t.status === 'Confirmado' ? 'SIM' : 'NÃO'}
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              
              {/* Paginação */}
              <div className="flex justify-between items-center p-4 border-t" style={{ backgroundColor: COLORS.grayLight }}>
                <span className="text-sm" style={{ color: COLORS.grayMedium }}>
                  Mostrando {((data?.turmas?.paginacao?.atual || 1) - 1) * 20 + 1} - {Math.min((data?.turmas?.paginacao?.atual || 1) * 20, data?.turmas?.paginacao?.registros || 0)} de {data?.turmas?.paginacao?.registros?.toLocaleString('pt-BR') || 0}
                </span>
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => setPagina(p => Math.max(1, p - 1))} 
                    disabled={pagina === 1 || loading}
                  >
                    Anterior
                  </Button>
                  <span className="flex items-center px-3 text-sm" style={{ color: COLORS.grayMedium }}>
                    Página {data?.turmas?.paginacao?.atual || 1} de {data?.turmas?.paginacao?.total || 1}
                  </span>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => setPagina(p => Math.min(data?.turmas?.paginacao?.total || 1, p + 1))} 
                    disabled={pagina >= (data?.turmas?.paginacao?.total || 1) || loading}
                  >
                    Próximo
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Footer */}
        <div className="mt-6 text-center text-xs" style={{ color: COLORS.grayMedium }}>
          Dashboard - Acompanhamento de cursos • Atualizado em {new Date().toLocaleDateString('pt-BR')} às {new Date().toLocaleTimeString('pt-BR')}
        </div>
      </div>
    </div>
  )
}
