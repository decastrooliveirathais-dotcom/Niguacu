'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'
import { Users, GraduationCap, DollarSign, TrendingUp, TrendingDown, CheckCircle, XCircle, Search, RefreshCw, BookOpen } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'

const COLORS = ['#22c55e', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899']
const GREEN = '#22c55e'
const RED = '#ef4444'

function KPICard({ titulo, valor, subtitulo, icon: Icon, color, bgColor }: { 
  titulo: string; valor: string | number; subtitulo?: string; icon?: React.ElementType; color: string; bgColor: string 
}) {
  return (
    <Card className="shadow-md border-0">
      <CardContent className="pt-5 pb-5 px-5">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm font-medium text-gray-500 mb-1">{titulo}</p>
            <p className="text-3xl font-bold" style={{ color }}>{typeof valor === 'number' ? valor.toLocaleString('pt-BR') : valor}</p>
            {subtitulo && <p className="text-xs text-gray-400 mt-1">{subtitulo}</p>}
          </div>
          {Icon && (
            <div className={`${bgColor} p-3 rounded-xl`}>
              <Icon className="w-5 h-5 text-white" />
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

function ChartCard({ title, data, dataKey, color, descending }: { 
  title: string; data: any[]; dataKey: string; color: string; descending?: boolean 
}) {
  return (
    <Card className="shadow-md border-0">
      <CardHeader className="pb-2 pt-4 px-4">
        <CardTitle className="text-sm font-semibold text-gray-700">{title}</CardTitle>
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
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="max-w-sm w-full shadow-lg"><CardContent className="flex flex-col items-center py-10">
          <RefreshCw className="w-12 h-12 text-red-400 mb-4" />
          <p className="text-gray-600 mb-4">{error}</p>
          <Button onClick={() => location.reload()}>Tentar novamente</Button>
        </CardContent></Card>
      </div>
    )
  }

  const confirmacaoData = [
    { nome: 'Confirmadas', valor: data?.graficos?.percentualConfirmacao?.confirmadas || 0, fill: GREEN },
    { nome: 'Não Confirmadas', valor: data?.graficos?.percentualConfirmacao?.naoConfirmadas || 0, fill: RED }
  ]

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-800">Painel de Resultados Educacionais</h1>
          <p className="text-gray-500 mt-1">Acompanhamento de Matrículas - Período 2026.1</p>
        </div>

        {/* Filtros */}
        <Card className="shadow-md border-0 mb-6">
          <CardContent className="pt-4 pb-4">
            <div className="flex flex-wrap gap-3 items-center">
              <div className="relative flex-1 min-w-[180px] max-w-[280px]">
                <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
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
              color="#3b82f6" 
              bgColor="bg-blue-500" 
            />
            <KPICard 
              titulo="Matrículas Financeiras" 
              valor={data?.kpis?.totalMatFin || 0}
              subtitulo="Pagamentos confirmados"
              icon={DollarSign} 
              color="#22c55e" 
              bgColor="bg-green-500" 
            />
            <KPICard 
              titulo="Matrículas Acadêmicas" 
              valor={data?.kpis?.totalMatAcad || 0}
              subtitulo="Finalizadas"
              icon={GraduationCap} 
              color="#14b8a6" 
              bgColor="bg-teal-500" 
            />
            <KPICard 
              titulo="Total de Turmas" 
              valor={data?.kpis?.totalTurmas || 0}
              icon={BookOpen} 
              color="#8b5cf6" 
              bgColor="bg-violet-500" 
            />
            <KPICard 
              titulo="Turmas Confirmadas" 
              valor={data?.kpis?.turmasConfirmadas || 0}
              subtitulo={`${data?.kpis?.percentualConfirmacao}%`}
              icon={CheckCircle} 
              color="#22c55e" 
              bgColor="bg-green-500" 
            />
            <KPICard 
              titulo="Turmas Não Confirmadas" 
              valor={data?.kpis?.turmasNaoConfirmadas || 0}
              icon={XCircle} 
              color="#ef4444" 
              bgColor="bg-red-500" 
            />
          </div>
        )}

        {/* Seção: Visão Geral */}
        <div className="mb-6">
          <h2 className="text-lg font-semibold text-gray-700 mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-blue-500" />
            Visão Geral
          </h2>
          
          {loading && !data ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[...Array(5)].map((_, i) => <Card key={i} className="shadow-md"><CardContent className="py-4"><Skeleton className="h-56 w-full" /></CardContent></Card>)}
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Percentual de Confirmação */}
              <Card className="shadow-md border-0">
                <CardHeader className="pb-2 pt-4 px-4">
                  <CardTitle className="text-sm font-semibold text-gray-700">Percentual de Confirmação de Turmas</CardTitle>
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
                      <div className="w-3 h-3 rounded-full bg-green-500"></div>
                      <span className="text-xs text-gray-600">Confirmadas ({data?.kpis?.percentualConfirmacao}%)</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-red-500"></div>
                      <span className="text-xs text-gray-600">Não Confirmadas</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Top 5 MAT FIN */}
              <ChartCard 
                title="Top 5 Cursos - Mat. Financeira" 
                data={data?.graficos?.top5MatFin} 
                dataKey="matFin" 
                color="#22c55e" 
              />

              {/* Top 5 MAT ACAD */}
              <ChartCard 
                title="Top 5 Cursos - Mat. Acadêmica" 
                data={data?.graficos?.top5MatAcad} 
                dataKey="matAcad" 
                color="#14b8a6" 
              />

              {/* Bottom 5 MAT FIN */}
              <ChartCard 
                title="Bottom 5 Cursos - Mat. Financeira" 
                data={data?.graficos?.bottom5MatFin} 
                dataKey="matFin" 
                color="#f59e0b" 
              />

              {/* Bottom 5 MAT ACAD */}
              <ChartCard 
                title="Bottom 5 Cursos - Mat. Acadêmica" 
                data={data?.graficos?.bottom5MatAcad} 
                dataKey="matAcad" 
                color="#ef4444" 
              />

              {/* Resumo */}
              <Card className="shadow-md border-0 bg-gradient-to-br from-blue-500 to-violet-600">
                <CardHeader className="pb-2 pt-4 px-4">
                  <CardTitle className="text-sm font-semibold text-white">Resumo Executivo</CardTitle>
                </CardHeader>
                <CardContent className="pb-4 px-4 text-white">
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-blue-100">Taxa de Confirmação:</span>
                      <span className="font-bold text-lg">{data?.kpis?.percentualConfirmacao}%</span>
                    </div>
                    <div className="w-full bg-white/20 rounded-full h-2">
                      <div 
                        className="bg-green-400 h-2 rounded-full" 
                        style={{ width: `${data?.kpis?.percentualConfirmacao || 0}%` }}
                      ></div>
                    </div>
                    <div className="pt-2 text-xs text-blue-100 space-y-1">
                      <div className="flex justify-between"><span>Oportunidades:</span><span>{(data?.kpis?.totalOportunidades || 0).toLocaleString('pt-BR')}</span></div>
                      <div className="flex justify-between"><span>Mat. Financeiras:</span><span>{(data?.kpis?.totalMatFin || 0).toLocaleString('pt-BR')}</span></div>
                      <div className="flex justify-between"><span>Mat. Acadêmicas:</span><span>{(data?.kpis?.totalMatAcad || 0).toLocaleString('pt-BR')}</span></div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>

        {/* Seção: Todas as Turmas */}
        <div>
          <h2 className="text-lg font-semibold text-gray-700 mb-4 flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-violet-500" />
            Todas as Turmas
            <Badge variant="secondary" className="ml-2">{data?.turmas?.paginacao?.registros?.toLocaleString('pt-BR') || 0} turmas</Badge>
          </h2>

          <Card className="shadow-md border-0">
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-gray-100 border-b">
                      <th className="text-left p-3 text-xs font-semibold text-gray-600 uppercase tracking-wider">Curso</th>
                      <th className="text-left p-3 text-xs font-semibold text-gray-600 uppercase tracking-wider">Modelo de Ensino</th>
                      <th className="text-left p-3 text-xs font-semibold text-gray-600 uppercase tracking-wider">Turno</th>
                      <th className="text-center p-3 text-xs font-semibold text-gray-600 uppercase tracking-wider">MAT FIN</th>
                      <th className="text-center p-3 text-xs font-semibold text-gray-600 uppercase tracking-wider">MAT ACAD</th>
                      <th className="text-center p-3 text-xs font-semibold text-gray-600 uppercase tracking-wider">PE</th>
                      <th className="text-center p-3 text-xs font-semibold text-gray-600 uppercase tracking-wider">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loading ? (
                      [...Array(10)].map((_, i) => (
                        <tr key={i} className="border-b"><td colSpan={7} className="p-3"><Skeleton className="h-4 w-full" /></td></tr>
                      ))
                    ) : data?.turmas?.dados?.map((t: any, i: number) => (
                      <tr key={i} className={`border-b hover:bg-gray-50 transition-colors ${t.status === 'Confirmado' ? 'bg-green-50/30' : ''}`}>
                        <td className="p-3">
                          <span className="font-medium text-gray-800 text-sm" title={t.curso}>
                            {t.curso.length > 35 ? `${t.curso.slice(0, 35)}...` : t.curso}
                          </span>
                        </td>
                        <td className="p-3 text-sm text-gray-600">{t.modelo}</td>
                        <td className="p-3 text-sm text-gray-600">{t.turno}</td>
                        <td className="p-3 text-center">
                          <span className="font-semibold text-green-600">{t.matFin}</span>
                        </td>
                        <td className="p-3 text-center">
                          <span className="font-semibold text-teal-600">{t.matAcad}</span>
                        </td>
                        <td className="p-3 text-center">
                          <span className="text-gray-500">{t.pe}</span>
                        </td>
                        <td className="p-3 text-center">
                          <Badge 
                            className={`${t.status === 'Confirmado' ? 'bg-green-500 hover:bg-green-600' : 'bg-red-500 hover:bg-red-600'} text-white font-medium px-3 py-1`}
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
              <div className="flex justify-between items-center p-4 border-t bg-gray-50">
                <span className="text-sm text-gray-500">
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
                  <span className="flex items-center px-3 text-sm text-gray-600">
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
        <div className="mt-6 text-center text-xs text-gray-400">
          Painel de Resultados Educacionais • Atualizado em {new Date().toLocaleDateString('pt-BR')} às {new Date().toLocaleTimeString('pt-BR')}
        </div>
      </div>
    </div>
  )
}
