import { useRef, useState } from 'react'
import type { ChangeEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { TopBar, MobileNav } from '../components/Nav'
import { Icon } from '../components/Icon'
import { Button } from '../components/Button'
import { api } from '../api/client'

type UploadMethod = 'pdf' | 'text'
const ACCEPTED = '.pdf,application/pdf'
const LIMITE_CARACTERES = 15000

function contaChars(s: string): number {
  return s.replace(/\s/g, '').length
}

function cortarNoLimite(s: string): string {
  let usados = 0
  for (let i = 0; i < s.length; i++) {
    if (!/\s/.test(s[i])) usados++
    if (usados > LIMITE_CARACTERES) return s.slice(0, i)
  }
  return s
}

export function GerarQuestoesPage() {
  const navigate = useNavigate()
  const [method, setMethod] = useState<UploadMethod>('text')
  const [discipline, setDiscipline] = useState('')
  const [content, setContent] = useState('')
  const [fileName, setFileName] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const fileInputRef = useRef<HTMLInputElement | null>(null)

  const openFilePicker = () => {
    fileInputRef.current?.click()
  }

  const handleFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    try {
      const text = await file.text()
      setFileName(file.name)
      setContent(cortarNoLimite(text.trim()))
      setError('')
    } catch {
      setFileName(file.name)
      setContent('')
      setError('Não foi possível ler o arquivo. Tente novamente.')
    }
  }

  const handleGenerate = async () => {
    if (busy) return
    setError('')

    if (!discipline.trim()) {
      setError('Informe o título da disciplina.')
      return
    }
    if (method === 'pdf' && !content.trim()) {
      setError('Selecione um arquivo PDF para continuar.')
      return
    }
    if (method === 'text' && content.trim().length < 10) {
      setError('O material base precisa ter pelo menos 10 caracteres.')
      return
    }

    setBusy(true)
    try {
      const created = await api.createDiscipline(discipline.trim())
      const material = await api.createMaterial({
        disciplineId: created.id,
        title: discipline.trim(),
        content: content.trim(),
      })
      await api.generateQuiz({
        disciplineId: created.id,
        materialId: material.id,
        questionCount: 30,
      })
      navigate(`/disciplina/${created.id}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao gerar o simulado.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="min-h-screen bg-background pb-28 md:pb-16">
      <TopBar />

      <main className="pt-24 md:pt-32 px-container-padding-mobile md:px-container-padding-desktop max-w-3xl mx-auto flex flex-col gap-stack-lg">
        <section className="text-center mt-8">
          <h2 className="font-display text-display-lg-mobile md:text-display-lg text-primary tracking-tight mb-2">
            Novo Simulado
          </h2>
          <p className="font-body-lg text-body-lg text-on-surface-variant">
            Transforme seus materiais de estudo em testes dinâmicos com a inteligência artificial
            do Fragata Quiz.
          </p>
        </section>

        <section className="flex flex-col gap-stack-md bg-surface-container-lowest p-6 md:p-8 rounded-2xl shadow-card border border-black/5">
          <div className="flex flex-col gap-stack-sm">
            <label className="font-label-bold text-label-bold text-on-surface" htmlFor="discipline">
              Título da Disciplina
            </label>
            <input
              className="w-full bg-surface-bright border border-outline-variant rounded-xl px-4 py-3 font-body-md text-body-md text-on-surface focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all duration-200 placeholder:text-outline"
              id="discipline"
              placeholder="ex: Biologia Celular"
              type="text"
              value={discipline}
              onChange={(e) => setDiscipline(e.target.value)}
            />
          </div>

          <div className="flex flex-col gap-stack-sm mt-4">
            <label className="font-label-bold text-label-bold text-on-surface">
              Como deseja enviar seu material?
            </label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <button
                type="button"
                onClick={() => {
                  setMethod('pdf')
                  setError('')
                }}
                className={`flex flex-col items-center justify-center p-6 gap-3 rounded-2xl border-2 bg-surface-bright transition-all duration-300 group hover:shadow-lift ${
                  method === 'pdf' ? 'border-primary bg-primary/10' : 'border-outline-variant hover:border-primary'
                }`}
              >
                <div className="w-12 h-12 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform duration-300 bg-secondary/20">
                  <Icon name="upload_file" filled className="text-secondary" />
                </div>
                <span
                  className={`font-label-bold text-label-bold transition-colors ${
                    method === 'pdf' ? 'text-primary' : 'text-on-surface group-hover:text-primary'
                  }`}
                >
                  Anexar Documento (PDF)
                </span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setMethod('text')
                  setError('')
                }}
                className={`flex flex-col items-center justify-center p-6 gap-3 rounded-2xl border-2 transition-all duration-300 group hover:shadow-lift ${
                  method === 'text'
                    ? 'border-primary bg-primary/10 shadow-lift'
                    : 'border-outline-variant bg-surface-bright hover:border-primary'
                }`}
              >
                <div
                  className={`w-12 h-12 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform duration-300 ${
                    method === 'text' ? 'bg-primary shadow-[0_0_15px_rgba(0,82,255,0.3)]' : 'bg-primary/10'
                  }`}
                >
                  <Icon name="content_paste" filled className={method === 'text' ? 'text-on-primary' : 'text-primary'} />
                </div>
                <span
                  className={`font-label-bold text-label-bold transition-colors ${
                    method === 'text' ? 'text-primary' : 'text-on-surface group-hover:text-primary'
                  }`}
                >
                  Colar Texto
                </span>
              </button>
            </div>
          </div>

          <div className="flex flex-col gap-stack-sm mt-4">
            <label className="font-label-bold text-label-bold text-on-surface" htmlFor="material-text">
              Material Base
            </label>
            <div className="relative w-full h-48 md:h-64 rounded-xl border border-primary bg-surface-bright overflow-hidden group focus-within:ring-2 focus-within:ring-primary focus-within:shadow-[0_4px_20px_rgba(0,82,255,0.15)] transition-all duration-300">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-transparent pointer-events-none opacity-50 group-focus-within:opacity-100 transition-opacity duration-500" />
              {method === 'pdf' ? (
                <button
                  type="button"
                  onClick={openFilePicker}
                  className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-2 bg-surface-container-lowest/80 hover:bg-[#F8FAFC]/90 transition-colors"
                >
                  <Icon name="upload_file" filled className="text-primary text-headline-md" />
                  <span className="font-label-bold text-label-bold text-on-surface">
                    {fileName ? `Arquivo anexado: ${fileName}` : 'Selecione o arquivo PDF'}
                  </span>
                  <span className="font-caption text-caption text-on-surface-variant">
                    {fileName ? 'Toque para trocar o arquivo' : 'Clique para abrir o seletor de arquivos'}
                  </span>
                </button>
              ) : (
                <textarea
                  className="w-full h-full p-4 bg-transparent border-none font-body-md text-body-md text-on-surface resize-none focus:outline-none focus:ring-0 z-10 relative"
                  id="material-text"
                  placeholder="Cole seu resumo ou notas de estudo aqui..."
                  value={content}
                  onChange={(e) => setContent(cortarNoLimite(e.target.value))}
                  disabled={busy}
                />
              )}
            </div>
            <div className="flex items-center justify-between mt-2">
              <span className="font-caption text-caption text-on-surface-variant">
                {method === 'pdf'
                  ? contaChars(content) >= LIMITE_CARACTERES
                    ? 'Arquivo muito longo — apenas os primeiros 15.000 caracteres foram usados.'
                    : 'Os primeiros 15.000 caracteres do arquivo serão usados.'
                  : 'Serão usados até 15.000 caracteres do texto.'}
              </span>
              <span className="font-caption text-caption text-on-surface-variant tabular-nums">
                {contaChars(content).toLocaleString('pt-BR')} / {LIMITE_CARACTERES.toLocaleString('pt-BR')}
              </span>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept={ACCEPTED}
              onChange={(e) => void handleFileChange(e)}
              className="hidden"
              aria-hidden="true"
              tabIndex={-1}
            />
          </div>

          {error ? (
            <p className="font-body-md text-body-md text-error bg-error/10 rounded-xl p-3" role="alert">
              {error}
            </p>
          ) : null}

          <Button
            variant="gradient"
            fullWidth
            leadingIcon="auto_awesome"
            className="mt-8 py-4 rounded-xl"
            onClick={() => void handleGenerate()}
            disabled={busy}
          >
            {busy ? 'Gerando simulado...' : 'Gerar Simulado com IA'}
          </Button>
        </section>
      </main>

      <MobileNav />
    </div>
  )
}