import { NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'

// Pré-carregar dados na inicialização
const DATA_PATH = path.join(process.cwd(), 'src/data/oportunidades.json')
const NAO_CONFIRMADOS_PATH = path.join(process.cwd(), 'src/data/turmas_nao_confirmadas.json')

const RAW_DATA = (() => {
  const content = fs.readFileSync(DATA_PATH, 'utf-8')
  return JSON.parse(content.replace(/:\s*NaN\s*([,}])/g, ': null$1'))
})()

// Carregar lista de turmas não confirmadas
const TURMAS_NAO_CONFIRMADAS = (() => {
  try {
    const content = fs.readFileSync(NAO_CONFIRMADOS_PATH, 'utf-8')
    const lista = JSON.parse(content)
    // Criar Set com chaves normalizadas para busca rápida
    const set = new Set<string>()
    for (const t of lista) {
      const key = `${(t.curso || '').toUpperCase().trim()}|${(t.turno || '').toUpperCase().trim()}|${(t.campus || '').toUpperCase().trim()}`
      set.add(key)
    }
    return set
  } catch {
    return new Set<string>()
  }
})()

// PE = Pontos de Equilíbrio (meta de matrículas por curso)
const PE_POR_CURSO = 15

// Pré-calcular filtros únicos
const FILTROS = (() => {
  const cursos = new Set<string>()
  const turnos = new Set<string>()
  const modelos = new Set<string>()
  const campus = new Set<string>()
  for (const item of RAW_DATA) {
    if (item.Curso) cursos.add(item.Curso)
    if (item.Turno) turnos.add(item.Turno)
    if (item['Modelo de Ensino']) modelos.add(item['Modelo de Ensino'])
    if (item['Campus / Polo']) campus.add(item['Campus / Polo'])
  }
  return {
    cursos: [...cursos].sort(),
    turnos: [...turnos].sort(),
    modelos: [...modelos].sort(),
    campus: [...campus].sort()
  }
})()

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

// Função para verificar se turma está na lista de não confirmados
function isNaoConfirmada(curso: string, turno: string, campus: string): boolean {
  const key = `${(curso || '').toUpperCase().trim()}|${(turno || '').toUpperCase().trim()}|${(campus || '').toUpperCase().trim()}`
  return TURMAS_NAO_CONFIRMADAS.has(key)
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  
  // Filtros
  const cursoFiltro = searchParams.get('curso')
  const turnoFiltro = searchParams.get('turno')
  const modeloFiltro = searchParams.get('modelo')
  const campusFiltro = searchParams.get('campus')
  const busca = searchParams.get('busca')?.toLowerCase()
  const pagina = parseInt(searchParams.get('pagina') || '1')
  
  // Filtrar dados
  const dados = RAW_DATA.filter((item: Item) => {
    if (cursoFiltro && cursoFiltro !== 'todos' && item.Curso !== cursoFiltro) return false
    if (turnoFiltro && turnoFiltro !== 'todos' && item.Turno !== turnoFiltro) return false
    if (modeloFiltro && modeloFiltro !== 'todos' && item['Modelo de Ensino'] !== modeloFiltro) return false
    if (campusFiltro && campusFiltro !== 'todos' && item['Campus / Polo'] !== campusFiltro) return false
    if (busca && !`${item.Curso} ${item.Turno} ${item['Modelo de Ensino']} ${item['Campus / Polo']}`.toLowerCase().includes(busca)) return false
    return true
  })

  // Turmas: Curso + Modelo + Turno + Campus
  const turmas: Record<string, {
    curso: string; modelo: string; turno: string; campus: string
    total: number; matFin: number; matAcad: number
    pe: number; status: 'Confirmado' | 'Não Confirmado'
  }> = {}

  for (const item of dados) {
    const curso = item.Curso || 'N/I'
    const modelo = item['Modelo de Ensino'] || 'N/I'
    const turno = item.Turno || 'N/I'
    const campus = item['Campus / Polo'] || 'N/I'
    
    const key = `${curso}|${modelo}|${turno}|${campus}`
    
    if (!turmas[key]) {
      turmas[key] = {
        curso, modelo, turno, campus,
        total: 0, matFin: 0, matAcad: 0,
        pe: PE_POR_CURSO,
        status: 'Confirmado'
      }
    }
    
    turmas[key].total++
    if (item['Flag Matrícula Financeira'] === 1) turmas[key].matFin++
    if (item['Flag Matrícula Acadêmica'] === 1) turmas[key].matAcad++
  }

  // Calcular status baseado na lista de não confirmados
  const turmasArray = Object.values(turmas).map(t => ({
    ...t,
    status: isNaoConfirmada(t.curso, t.turno, t.campus) ? 'Não Confirmado' as const : 'Confirmado' as const
  }))

  // KPIs gerais
  const totalOportunidades = dados.length
  const totalMatFin = dados.filter(i => i['Flag Matrícula Financeira'] === 1).length
  const totalMatAcad = dados.filter(i => i['Flag Matrícula Acadêmica'] === 1).length
  const totalTurmas = turmasArray.length
  const turmasConfirmadas = turmasArray.filter(t => t.status === 'Confirmado').length
  const turmasNaoConfirmadas = turmasArray.filter(t => t.status === 'Não Confirmado').length
  const percentualConfirmacao = totalTurmas > 0 ? ((turmasConfirmadas / totalTurmas) * 100).toFixed(1) : '0'

  // Dados por curso para rankings
  const cursosData: Record<string, { matFin: number; matAcad: number; total: number }> = {}
  for (const item of dados) {
    const curso = item.Curso || 'N/I'
    if (!cursosData[curso]) cursosData[curso] = { matFin: 0, matAcad: 0, total: 0 }
    cursosData[curso].total++
    if (item['Flag Matrícula Financeira'] === 1) cursosData[curso].matFin++
    if (item['Flag Matrícula Acadêmica'] === 1) cursosData[curso].matAcad++
  }

  // Rankings
  const cursosArray = Object.entries(cursosData).map(([nome, data]) => ({
    nome, ...data
  }))

  // Top 5 por MAT FIN
  const top5MatFin = [...cursosArray].sort((a, b) => b.matFin - a.matFin).slice(0, 5)
  // Bottom 5 por MAT FIN
  const bottom5MatFin = [...cursosArray].filter(c => c.matFin > 0).sort((a, b) => a.matFin - b.matFin).slice(0, 5)
  // Top 5 por MAT ACAD
  const top5MatAcad = [...cursosArray].sort((a, b) => b.matAcad - a.matAcad).slice(0, 5)
  // Bottom 5 por MAT ACAD
  const bottom5MatAcad = [...cursosArray].filter(c => c.matAcad > 0).sort((a, b) => a.matAcad - b.matAcad).slice(0, 5)

  // Ordenar turmas por status (Não Confirmados primeiro) e depois por matAcad
  const turmasOrdenadas = [...turmasArray].sort((a, b) => {
    if (a.status === 'Não Confirmado' && b.status !== 'Não Confirmado') return -1
    if (a.status !== 'Não Confirmado' && b.status === 'Não Confirmado') return 1
    return b.matAcad - a.matAcad
  })

  // Paginação
  const porPagina = 20
  const totalPaginas = Math.ceil(turmasOrdenadas.length / porPagina)
  const inicio = (pagina - 1) * porPagina
  const turmasPaginadas = turmasOrdenadas.slice(inicio, inicio + porPagina)

  return NextResponse.json({
    kpis: {
      totalOportunidades,
      totalMatFin,
      totalMatAcad,
      totalTurmas,
      turmasConfirmadas,
      turmasNaoConfirmadas,
      percentualConfirmacao
    },
    graficos: {
      top5MatFin,
      bottom5MatFin,
      top5MatAcad,
      bottom5MatAcad,
      percentualConfirmacao: {
        confirmadas: turmasConfirmadas,
        naoConfirmadas: turmasNaoConfirmadas
      }
    },
    filtros: FILTROS,
    turmas: {
      dados: turmasPaginadas,
      paginacao: {
        atual: pagina,
        total: totalPaginas,
        registros: turmasOrdenadas.length
      }
    }
  })
}
