'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts'
import { Users, GraduationCap, FileCheck, FileText, TrendingUp, Search, RefreshCw, CheckCircle, XCircle, LayoutGrid, Table } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'

const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899']

function KPI({ titulo, valor, desc, icon: Icon, color }: { titulo: string; valor: string | number; desc: string; icon: React.ElementType; color: string }) {
  return (
    <Card className="shadow-sm">
      <CardHeader className="flex flex-row items-center justify-between pb-1 pt-3 px-4">
        <CardTitle className="text-xs font-medium text-gray-500">{titulo}</CardTitle>
        <div className={`p-1.5 rounded ${color}`}><Icon className="w-3.5 h-3.5 text-white" /></div>
      </CardHeader>
      <CardContent className="pt-1 pb-3 px-4">
        <div className="text-xl font-bold">{typeof valor === 'number' ? valor.toLocaleString('pt-BR') : valor}</div>
        <p className="text-[10px] text-gray-400">{desc}</p>
      </CardContent>
    </Card>
  )
}

export default function Dashboard() {
  const [data, setData] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)
  const [filtros, setFiltros] = useState({ curso: 'todos', turno: 'todos', fase: 'todos', modelo: 'todos', flagFin: 'todos', flagDoc: 'todos', flagAcad: 'todos', busca: '' })
  const [pagina, setPagina] = useState(1)
  const [paginaVisao, setPaginaVisao] = useState(1)
  const [abaAtiva, setAbaAtiva] = useState<'graficos' | 'visao'>('graficos')
  const loadingRef = useRef(true)
  const [, update] = useState({})
  const loading = loadingRef.current || !data

  const fetcher = useCallback(async (signal: AbortSignal) => {
    loadingRef.current = true
    update({})
    
    const p = new URLSearchParams()
    if (filtros.curso !== 'todos') p.set('curso', filtros.curso)
    if (filtros.turno !== 'todos') p.set('turno', filtros.turno)
    if (filtros.fase !== 'todos') p.set('fase', filtros.fase)
    if (filtros.modelo !== 'todos') p.set('modelo', filtros.modelo)
    if (filtros.flagFin !== 'todos') p.set('flagFinanceira', filtros.flagFin)
    if (filtros.flagDoc !== 'todos') p.set('flagDocumentacao', filtros.flagDoc)
    if (filtros.flagAcad !== 'todos') p.set('flagAcademica', filtros.flagAcad)
    if (filtros.busca) p.set('busca', filtros.busca)
    p.set('pagina', String(pagina))
    p.set('paginaVisao', String(paginaVisao))

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
  }, [filtros, pagina, paginaVisao])

  useEffect(() => {
    const c = new AbortController()
    fetcher(c.signal)
    return () => c.abort()
  }, [fetcher])

  const setF = (k: string, v: string) => { 
    setFiltros(p => ({ ...p, [k]: v })); 
    setPagina(1); 
    setPaginaVisao(1) 
  }
  const clear = () => { 
    setFiltros({ curso: 'todos', turno: 'todos', fase: 'todos', modelo: 'todos', flagFin: 'todos', flagDoc: 'todos', flagAcad: 'todos', busca: '' }); 
    setPagina(1); 
    setPaginaVisao(1) 
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
        <Card className="max-w-sm w-full"><CardContent className="flex flex-col items-center py-8">
          <FileText className="w-10 h-10 text-red-400 mb-3" />
          <p className="text-gray-500 mb-4">{error}</p>
          <Button size="sm" onClick={() => location.reload()}><RefreshCw className="w-4 h-4 mr-2" />Tentar novamente</Button>
        </CardContent></Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-100 p-3 md:p-4">
      <div className="max-w-7xl mx-auto">
        <div className="mb-4">
          <h1 className="text-xl md:text-2xl font-bold text-gray-800">Dashboard de Resultados Educacionais</h1>
          <p className="text-sm text-gray-500">Período 2026.1 • {data?.kpis?.total?.toLocaleString('pt-BR') || 0} oportunidades</p>
        </div>

        {/* Filtros */}
        <Card className="shadow-sm mb-4">
          <CardContent className="pt-3 pb-3">
            <div className="flex flex-wrap gap-2">
              <div className="relative flex-1 min-w-[150px] max-w-[250px]">
                <Search className="absolute left-2.5 top-2.5 w-4 h-4 text-gray-400" />
                <Input placeholder="Buscar..." className="pl-8 h-9 text-sm" onChange={e => setF('busca', e.target.value)} />
              </div>
              <Select value={filtros.curso} onValueChange={v => setF('curso', v)}>
                <SelectTrigger className="w-[160px] h-9 text-sm"><SelectValue placeholder="Curso" /></SelectTrigger>
                <SelectContent className="max-h-40">{data?.filtros?.cursos?.map((c: string) => <SelectItem key={c} value={c}>{c.length > 20 ? c.slice(0, 20) + '...' : c}</SelectItem>)}</SelectContent>
              </Select>
              <Select value={filtros.turno} onValueChange={v => setF('turno', v)}>
                <SelectTrigger className="w-[100px] h-9 text-sm"><SelectValue placeholder="Turno" /></SelectTrigger>
                <SelectContent>{data?.filtros?.turnos?.map((t: string) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
              </Select>
              <Select value={filtros.modelo} onValueChange={v => setF('modelo', v)}>
                <SelectTrigger className="w-[120px] h-9 text-sm"><SelectValue placeholder="Modelo" /></SelectTrigger>
                <SelectContent>{data?.filtros?.modelos?.map((m: string) => <SelectItem key={m} value={m}>{m}</SelectItem>)}</SelectContent>
              </Select>
              <Select value={filtros.fase} onValueChange={v => setF('fase', v)}>
                <SelectTrigger className="w-[140px] h-9 text-sm"><SelectValue placeholder="Fase" /></SelectTrigger>
                <SelectContent>{data?.filtros?.fases?.map((f: string) => <SelectItem key={f} value={f}>{f}</SelectItem>)}</SelectContent>
              </Select>
              <Select value={filtros.flagFin} onValueChange={v => setF('flagFin', v)}>
                <SelectTrigger className="w-[100px] h-9 text-sm"><SelectValue placeholder="Fin." /></SelectTrigger>
                <SelectContent><SelectItem value="todos">Fin.</SelectItem><SelectItem value="sim">Sim</SelectItem><SelectItem value="nao">Não</SelectItem></SelectContent>
              </Select>
              <Select value={filtros.flagDoc} onValueChange={v => setF('flagDoc', v)}>
                <SelectTrigger className="w-[100px] h-9 text-sm"><SelectValue placeholder="Doc." /></SelectTrigger>
                <SelectContent><SelectItem value="todos">Doc.</SelectItem><SelectItem value="sim">Entregue</SelectItem><SelectItem value="nao">Pendente</SelectItem></SelectContent>
              </Select>
              <Select value={filtros.flagAcad} onValueChange={v => setF('flagAcad', v)}>
                <SelectTrigger className="w-[100px] h-9 text-sm"><SelectValue placeholder="Acad." /></SelectTrigger>
                <SelectContent><SelectItem value="todos">Acad.</SelectItem><SelectItem value="sim">Sim</SelectItem><SelectItem value="nao">Não</SelectItem></SelectContent>
              </Select>
              <Button variant="ghost" size="sm" className="h-9 text-xs" onClick={clear}>Limpar</Button>
            </div>
          </CardContent>
        </Card>

        {/* KPIs */}
        {loading && !data ? (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-2 mb-4">{[...Array(7)].map((_, i) => <Card key={i} className="shadow-sm"><CardContent className="py-4"><Skeleton className="h-12 w-full" /></CardContent></Card>)}</div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-2 mb-4">
            <KPI titulo="Total" valor={data?.kpis?.total || 0} desc="Oportunidades" icon={Users} color="bg-blue-500" />
            <KPI titulo="Confirmados" valor={data?.kpis?.confirmados || 0} desc={`${data?.kpis?.taxaConfirmacao}% do total`} icon={CheckCircle} color="bg-green-500" />
            <KPI titulo="Não Confirm." valor={data?.kpis?.naoConfirmados || 0} desc="Aguardando" icon={XCircle} color="bg-red-500" />
            <KPI titulo="Mat. Financ." valor={data?.kpis?.matFin || 0} desc="Pagamentos" icon={FileCheck} color="bg-emerald-500" />
            <KPI titulo="Mat. Acadêm." valor={data?.kpis?.matAcad || 0} desc="Finalizadas" icon={GraduationCap} color="bg-teal-500" />
            <KPI titulo="Documentação" valor={data?.kpis?.docEntregue || 0} desc="Entregues" icon={FileText} color="bg-amber-500" />
            <KPI titulo="Conversão" valor={`${data?.kpis?.conversao}%`} desc="Taxa" icon={TrendingUp} color="bg-purple-500" />
          </div>
        )}

        {/* Abas */}
        <div className="flex gap-2 mb-3">
          <Button 
            variant={abaAtiva === 'graficos' ? 'default' : 'outline'} 
            size="sm" 
            className="h-8 text-xs"
            onClick={() => setAbaAtiva('graficos')}
          >
            <LayoutGrid className="w-3.5 h-3.5 mr-1" /> Gráficos
          </Button>
          <Button 
            variant={abaAtiva === 'visao' ? 'default' : 'outline'} 
            size="sm" 
            className="h-8 text-xs"
            onClick={() => setAbaAtiva('visao')}
          >
            <Table className="w-3.5 h-3.5 mr-1" /> Visão Consolidada
          </Button>
        </div>

        {/* Conteúdo das Abas */}
        {abaAtiva === 'graficos' ? (
          /* Gráficos */
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3 mb-4">
            {[
              { title: 'Por Fase', data: data?.graficos?.fases, type: 'pie' },
              { title: 'Por Turno', data: data?.graficos?.turnos, type: 'bar' },
              { title: 'Top 10 Cursos', data: data?.graficos?.top10?.map((d: any) => ({ nome: d.nome, valor: d.quantidade })), type: 'barH' },
              { title: 'Modelo de Ensino', data: data?.graficos?.modelos, type: 'bar' },
              { title: 'Status Atendimento', data: data?.graficos?.status, type: 'pie' },
            ].map((g, i) => (
              <Card key={i} className="shadow-sm">
                <CardHeader className="py-2 px-3"><CardTitle className="text-sm">{g.title}</CardTitle></CardHeader>
                <CardContent className="pb-2 px-3">
                  <div className="h-40">
                    {loading ? <Skeleton className="h-full w-full" /> : (
                      <ResponsiveContainer width="100%" height="100%">
                        {g.type === 'pie' ? (
                          <PieChart><Pie data={g.data} cx="50%" cy="50%" innerRadius={30} outerRadius={50} dataKey="valor" nameKey="nome">
                            {g.data?.map((_: any, j: number) => <Cell key={j} fill={COLORS[j % COLORS.length]} />)}
                          </Pie><Tooltip formatter={(v: number) => v.toLocaleString('pt-BR')} /></PieChart>
                        ) : g.type === 'barH' ? (
                          <BarChart data={g.data} layout="vertical"><CartesianGrid strokeDasharray="3 3" /><XAxis type="number" /><YAxis type="category" dataKey="nome" width={80} fontSize={9} /><Tooltip /><Bar dataKey="valor" fill="#3b82f6" radius={[0, 3, 3, 0]} /></BarChart>
                        ) : (
                          <BarChart data={g.data}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="nome" fontSize={9} /><YAxis /><Tooltip /><Bar dataKey="valor" fill="#10b981" radius={[3, 3, 0, 0]} /></BarChart>
                        )}
                      </ResponsiveContainer>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
            
            {/* Resumo */}
            <Card className="shadow-sm bg-gradient-to-br from-blue-50 to-green-50">
              <CardHeader className="py-2 px-3"><CardTitle className="text-sm">Resumo</CardTitle></CardHeader>
              <CardContent className="pb-3 px-3 text-sm space-y-1.5">
                <div className="flex justify-between"><span className="text-gray-500">Total filtrado:</span><b>{(data?.kpis?.total || 0).toLocaleString('pt-BR')}</b></div>
                <div className="flex justify-between"><span className="text-gray-500">Taxa confirmação:</span><Badge className="bg-green-500 text-[10px]">{data?.kpis?.taxaConfirmacao}%</Badge></div>
                <div className="flex justify-between"><span className="text-gray-500">Taxa conversão:</span><Badge className="bg-purple-500 text-[10px]">{data?.kpis?.conversao}%</Badge></div>
                <div className="flex justify-between"><span className="text-gray-500">Pendente doc:</span><span className="text-amber-600">{((data?.kpis?.total || 0) - (data?.kpis?.docEntregue || 0)).toLocaleString('pt-BR')}</span></div>
                <div className="flex justify-between"><span className="text-gray-500">Aguarda fin.:</span><span className="text-blue-600">{((data?.kpis?.total || 0) - (data?.kpis?.matFin || 0)).toLocaleString('pt-BR')}</span></div>
              </CardContent>
            </Card>
          </div>
        ) : (
          /* Visão Consolidada */
          <Card className="shadow-sm mb-4">
            <CardHeader className="py-2 px-3 flex-row flex justify-between items-center space-y-0">
              <div>
                <CardTitle className="text-sm">Visão Consolidada: Curso × Turno × Modelo de Ensino</CardTitle>
                <p className="text-xs text-gray-400">{data?.visaoConsolidada?.pag?.registros?.toLocaleString('pt-BR') || 0} combinações encontradas</p>
              </div>
              <span className="text-xs text-gray-400">Pág. {data?.visaoConsolidada?.pag?.atual || 1} de {data?.visaoConsolidada?.pag?.total || 1}</span>
            </CardHeader>
            <CardContent className="px-3 pb-3">
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead><tr className="border-b bg-gray-50">
                    <th className="text-left p-2 font-medium">Curso</th>
                    <th className="text-left p-2 font-medium">Turno</th>
                    <th className="text-left p-2 font-medium">Modelo</th>
                    <th className="text-center p-2 font-medium">Total</th>
                    <th className="text-center p-2 font-medium bg-green-50">Confirmados</th>
                    <th className="text-center p-2 font-medium bg-red-50">Não Confirm.</th>
                    <th className="text-center p-2 font-medium">Mat. Fin.</th>
                    <th className="text-center p-2 font-medium">Mat. Acad.</th>
                    <th className="text-center p-2 font-medium">Conversão</th>
                  </tr></thead>
                  <tbody>
                    {loading ? [...Array(10)].map((_, i) => <tr key={i} className="border-b">{[...Array(9)].map((_, j) => <td key={j} className="p-2"><Skeleton className="h-3 w-full" /></td>)}</tr>) 
                    : data?.visaoConsolidada?.dados?.map((r: any, i: number) => (
                      <tr key={i} className="border-b hover:bg-gray-50">
                        <td className="p-2 font-medium truncate max-w-[200px]" title={r.curso}>{r.curso}</td>
                        <td className="p-2">{r.turno}</td>
                        <td className="p-2">{r.modelo}</td>
                        <td className="p-2 text-center font-bold">{r.total.toLocaleString('pt-BR')}</td>
                        <td className="p-2 text-center bg-green-50">
                          <Badge className="bg-green-500 text-white text-[10px]">{r.confirmados.toLocaleString('pt-BR')}</Badge>
                        </td>
                        <td className="p-2 text-center bg-red-50">
                          <Badge className="bg-red-400 text-white text-[10px]">{r.naoConfirmados.toLocaleString('pt-BR')}</Badge>
                        </td>
                        <td className="p-2 text-center">{r.matFin.toLocaleString('pt-BR')}</td>
                        <td className="p-2 text-center">{r.matAcad.toLocaleString('pt-BR')}</td>
                        <td className="p-2 text-center">
                          <Badge variant="outline" className={`text-[10px] ${parseFloat(r.taxaConversao) > 20 ? 'text-green-600 border-green-300' : parseFloat(r.taxaConversao) > 10 ? 'text-amber-600 border-amber-300' : 'text-gray-500'}`}>
                            {r.taxaConversao}%
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="flex justify-between items-center mt-3">
                <span className="text-[10px] text-gray-400">
                  Mostrando {((data?.visaoConsolidada?.pag?.atual || 1) - 1) * 15 + 1}-{Math.min((data?.visaoConsolidada?.pag?.atual || 1) * 15, data?.visaoConsolidada?.pag?.registros || 0)} de {data?.visaoConsolidada?.pag?.registros?.toLocaleString('pt-BR') || 0}
                </span>
                <div className="flex gap-1">
                  <Button variant="outline" size="sm" className="h-7 text-xs px-2" onClick={() => setPaginaVisao(p => Math.max(1, p - 1))} disabled={paginaVisao === 1 || loading}>←</Button>
                  <Button variant="outline" size="sm" className="h-7 text-xs px-2" onClick={() => setPaginaVisao(p => Math.min(data?.visaoConsolidada?.pag?.total || 1, p + 1))} disabled={paginaVisao >= (data?.visaoConsolidada?.pag?.total || 1) || loading}>→</Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Tabela Detalhada */}
        <Card className="shadow-sm">
          <CardHeader className="py-2 px-3 flex-row flex justify-between items-center space-y-0">
            <div>
              <CardTitle className="text-sm">Dados Detalhados</CardTitle>
              <p className="text-xs text-gray-400">{data?.tabela?.pag?.registros?.toLocaleString('pt-BR') || 0} registros</p>
            </div>
            <span className="text-xs text-gray-400">Pág. {data?.tabela?.pag?.atual || 1} de {data?.tabela?.pag?.total || 1}</span>
          </CardHeader>
          <CardContent className="px-3 pb-3">
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead><tr className="border-b bg-gray-50">
                  <th className="text-left p-1.5 font-medium">Curso</th>
                  <th className="text-left p-1.5 font-medium">Turno</th>
                  <th className="text-left p-1.5 font-medium">Modelo</th>
                  <th className="text-left p-1.5 font-medium">Fase</th>
                  <th className="text-left p-1.5 font-medium">Status</th>
                  <th className="text-center p-1.5 font-medium">Fin</th>
                  <th className="text-center p-1.5 font-medium">Acad</th>
                  <th className="text-center p-1.5 font-medium">Doc</th>
                  <th className="text-left p-1.5 font-medium">Data</th>
                </tr></thead>
                <tbody>
                  {loading ? [...Array(5)].map((_, i) => <tr key={i} className="border-b">{[...Array(9)].map((_, j) => <td key={j} className="p-1.5"><Skeleton className="h-3 w-full" /></td>)}</tr>) 
                  : data?.tabela?.dados?.map((r: any, i: number) => (
                    <tr key={i} className="border-b hover:bg-gray-50">
                      <td className="p-1.5 truncate max-w-[150px]" title={r.curso}>{r.curso}</td>
                      <td className="p-1.5">{r.turno}</td>
                      <td className="p-1.5">{r.modelo}</td>
                      <td className="p-1.5"><Badge variant="outline" className="text-[10px]">{r.fase?.slice(0, 12)}</Badge></td>
                      <td className="p-1.5">
                        <Badge className={r.status === 'Confirmado' ? 'bg-green-500 text-white text-[10px]' : 'text-[10px]'} variant={r.status === 'Confirmado' ? 'default' : 'secondary'}>
                          {r.status}
                        </Badge>
                      </td>
                      <td className="p-1.5 text-center"><Badge className={r.fin === 'Sim' ? 'bg-green-500 text-white text-[10px]' : 'text-[10px]'} variant={r.fin === 'Sim' ? 'default' : 'secondary'}>{r.fin}</Badge></td>
                      <td className="p-1.5 text-center"><Badge className={r.acad === 'Sim' ? 'bg-emerald-500 text-white text-[10px]' : 'text-[10px]'} variant={r.acad === 'Sim' ? 'default' : 'secondary'}>{r.acad}</Badge></td>
                      <td className="p-1.5 text-center"><Badge className={r.doc === 'Entregue' ? 'bg-amber-500 text-white text-[10px]' : 'text-[10px]'} variant={r.doc === 'Entregue' ? 'default' : 'secondary'}>{r.doc}</Badge></td>
                      <td className="p-1.5 text-gray-400">{r.data}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="flex justify-between items-center mt-3">
              <span className="text-[10px] text-gray-400">Mostrando {((data?.tabela?.pag?.atual || 1) - 1) * 10 + 1}-{Math.min((data?.tabela?.pag?.atual || 1) * 10, data?.tabela?.pag?.registros || 0)} de {data?.tabela?.pag?.registros?.toLocaleString('pt-BR') || 0}</span>
              <div className="flex gap-1">
                <Button variant="outline" size="sm" className="h-7 text-xs px-2" onClick={() => setPagina(p => Math.max(1, p - 1))} disabled={pagina === 1 || loading}>←</Button>
                <Button variant="outline" size="sm" className="h-7 text-xs px-2" onClick={() => setPagina(p => Math.min(data?.tabela?.pag?.total || 1, p + 1))} disabled={pagina >= (data?.tabela?.pag?.total || 1) || loading}>→</Button>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <p className="text-center text-[10px] text-gray-300 mt-3">Atualizado em {new Date().toLocaleDateString('pt-BR')}</p>
      </div>
    </div>
  )
}
