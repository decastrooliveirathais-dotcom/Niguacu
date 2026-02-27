import { NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'

// Pré-carregar dados na inicialização
const DATA_PATH = path.join(process.cwd(), 'src/data/oportunidades.json')
const RAW_DATA = (() => {
  const content = fs.readFileSync(DATA_PATH, 'utf-8')
  return JSON.parse(content.replace(/:\s*NaN\s*([,}])/g, ': null$1'))
})()

// Pré-calcular filtros únicos
const FILTROS = (() => {
  const cursos = new Set<string>()
  const turnos = new Set<string>()
  const fases = new Set<string>()
  const modelos = new Set<string>()
  const campus = new Set<string>()
  for (const item of RAW_DATA) {
    if (item.Curso) cursos.add(item.Curso)
    if (item.Turno) turnos.add(item.Turno)
    if (item.Fase) fases.add(item.Fase)
    if (item['Modelo de Ensino']) modelos.add(item['Modelo de Ensino'])
    if (item['Campus / Polo']) campus.add(item['Campus / Polo'])
  }
  return {
    cursos: [...cursos].sort(),
    turnos: [...turnos].sort(),
    fases: [...fases].sort(),
    modelos: [...modelos].sort(),
    campus: [...campus].sort()
  }
})()

// Tipo
type Item = {
  Curso: string; Turno: string; Fase: string
  'Status do Atendimento': string
  'Modelo de Ensino': string
  'Campus / Polo': string
  'Data/Hora Inscrição': string
  'Flag Matrícula Financeira': number
  'Flag Matrícula Acadêmica': number
  'Documentação Obrigatória Entregue': number
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  
  // Filtros
  const curso = searchParams.get('curso')
  const turno = searchParams.get('turno')
  const fase = searchParams.get('fase')
  const modelo = searchParams.get('modelo')
  const campusFiltro = searchParams.get('campus')
  const flagFin = searchParams.get('flagFinanceira')
  const flagDoc = searchParams.get('flagDocumentacao')
  const flagAcad = searchParams.get('flagAcademica')
  const busca = searchParams.get('busca')?.toLowerCase()
  const pagina = parseInt(searchParams.get('pagina') || '1')
  const paginaVisao = parseInt(searchParams.get('paginaVisao') || '1')
  
  // Filtrar
  const dados = RAW_DATA.filter((item: Item) => {
    if (curso && curso !== 'todos' && item.Curso !== curso) return false
    if (turno && turno !== 'todos' && item.Turno !== turno) return false
    if (fase && fase !== 'todos' && item.Fase !== fase) return false
    if (modelo && modelo !== 'todos' && item['Modelo de Ensino'] !== modelo) return false
    if (campusFiltro && campusFiltro !== 'todos' && item['Campus / Polo'] !== campusFiltro) return false
    if (flagFin === 'sim' && item['Flag Matrícula Financeira'] !== 1) return false
    if (flagFin === 'nao' && item['Flag Matrícula Financeira'] !== 0) return false
    if (flagDoc === 'sim' && item['Documentação Obrigatória Entregue'] !== 1) return false
    if (flagDoc === 'nao' && item['Documentação Obrigatória Entregue'] !== 0) return false
    if (flagAcad === 'sim' && item['Flag Matrícula Acadêmica'] !== 1) return false
    if (flagAcad === 'nao' && item['Flag Matrícula Acadêmica'] !== 0) return false
    if (busca && !`${item.Curso} ${item.Turno} ${item.Fase} ${item['Status do Atendimento']} ${item['Modelo de Ensino']} ${item['Campus / Polo']}`.toLowerCase().includes(busca)) return false
    return true
  })
  
  // KPIs
  let total = dados.length
  let fin = 0, acad = 0, doc = 0, confirmados = 0
  const faseCount: Record<string, number> = {}
  const turnoCount: Record<string, number> = {}
  const cursoCount: Record<string, number> = {}
  const modeloCount: Record<string, number> = {}
  const statusCount: Record<string, number> = {}
  
  // Visão consolidada: Campus + Curso + Turno + Status Confirmado (SIM/NÃO)
  const visaoConsolidada: Record<string, { 
    campus: string; curso: string; turno: string
    total: number; confirmadosSim: number; confirmadosNao: number
    matFin: number; matAcad: number; taxaConversao: string
  }> = {}
  
  for (const item of dados) {
    if (item['Flag Matrícula Financeira'] === 1) fin++
    if (item['Flag Matrícula Acadêmica'] === 1) acad++
    if (item['Documentação Obrigatória Entregue'] === 1) doc++
    if (item['Status do Atendimento'] === 'Confirmado') confirmados++
    
    const f = item.Fase || 'N/I'
    const t = item.Turno || 'N/I'
    const c = item.Curso || 'N/I'
    const m = item['Modelo de Ensino'] || 'N/I'
    const s = item['Status do Atendimento'] || 'N/I'
    const camp = item['Campus / Polo'] || 'N/I'
    
    faseCount[f] = (faseCount[f] || 0) + 1
    turnoCount[t] = (turnoCount[t] || 0) + 1
    cursoCount[c] = (cursoCount[c] || 0) + 1
    modeloCount[m] = (modeloCount[m] || 0) + 1
    statusCount[s] = (statusCount[s] || 0) + 1
    
    // Visão consolidada: Campus + Curso + Turno
    const key = `${camp}|${c}|${t}`
    if (!visaoConsolidada[key]) {
      visaoConsolidada[key] = { 
        campus: camp, curso: c, turno: t,
        total: 0, confirmadosSim: 0, confirmadosNao: 0,
        matFin: 0, matAcad: 0, taxaConversao: '0'
      }
    }
    visaoConsolidada[key].total++
    if (s === 'Confirmado') {
      visaoConsolidada[key].confirmadosSim++
    } else {
      visaoConsolidada[key].confirmadosNao++
    }
    if (item['Flag Matrícula Financeira'] === 1) visaoConsolidada[key].matFin++
    if (item['Flag Matrícula Acadêmica'] === 1) visaoConsolidada[key].matAcad++
  }
  
  // Calcular taxa de conversão para cada item
  Object.values(visaoConsolidada).forEach(v => {
    v.taxaConversao = v.total > 0 ? ((v.matAcad / v.total) * 100).toFixed(1) : '0'
  })
  
  // Ordenar visão consolidada por total
  const visaoOrdenada = Object.values(visaoConsolidada)
    .sort((a, b) => b.total - a.total)
    .slice(0, 200) // Top 200 combinações
  
  // Top 10 cursos
  const top10 = Object.entries(cursoCount).sort((a, b) => b[1] - a[1]).slice(0, 10)
    .map(([nome, quantidade]) => ({ nome, quantidade }))
  
  // Paginação tabela detalhada
  const porPagina = 10
  const totalPaginas = Math.ceil(dados.length / porPagina)
  const inicio = (pagina - 1) * porPagina
  
  // Tabela detalhada
  const tabela = dados.slice(inicio, inicio + porPagina).map((item: Item) => ({
    campus: item['Campus / Polo'] || 'N/I',
    curso: item.Curso || 'N/I',
    turno: item.Turno || 'N/I',
    modelo: item['Modelo de Ensino'] || 'N/I',
    fase: item.Fase || 'N/I',
    status: item['Status do Atendimento'] || 'N/I',
    confirmado: item['Status do Atendimento'] === 'Confirmado' ? 'SIM' : 'NÃO',
    fin: item['Flag Matrícula Financeira'] === 1 ? 'Sim' : 'Não',
    acad: item['Flag Matrícula Acadêmica'] === 1 ? 'Sim' : 'Não',
    doc: item['Documentação Obrigatória Entregue'] === 1 ? 'Entregue' : 'Pendente',
    data: item['Data/Hora Inscrição'] || 'N/I'
  }))
  
  // Paginação para visão consolidada
  const porPaginaVisao = 15
  const totalPaginasVisao = Math.ceil(visaoOrdenada.length / porPaginaVisao)
  const inicioVisao = (paginaVisao - 1) * porPaginaVisao
  const visaoPaginada = visaoOrdenada.slice(inicioVisao, inicioVisao + porPaginaVisao)
  
  return NextResponse.json({
    kpis: {
      total,
      matFin: fin,
      matAcad: acad,
      docEntregue: doc,
      confirmados,
      naoConfirmados: total - confirmados,
      conversao: total > 0 ? ((acad / total) * 100).toFixed(1) : '0',
      taxaConfirmacao: total > 0 ? ((confirmados / total) * 100).toFixed(1) : '0'
    },
    graficos: {
      fases: Object.entries(faseCount).map(([nome, valor]) => ({ nome, valor })),
      turnos: Object.entries(turnoCount).map(([nome, valor]) => ({ nome, valor })),
      top10,
      modelos: Object.entries(modeloCount).map(([nome, valor]) => ({ nome, valor })),
      status: Object.entries(statusCount).map(([nome, valor]) => ({ nome, valor }))
    },
    filtros: FILTROS,
    visaoConsolidada: {
      dados: visaoPaginada,
      pag: { 
        atual: paginaVisao, 
        total: totalPaginasVisao, 
        registros: visaoOrdenada.length 
      }
    },
    tabela: {
      dados: tabela,
      pag: { atual: pagina, total: totalPaginas, registros: dados.length }
    }
  })
}
