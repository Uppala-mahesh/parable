'use client'

import { useState } from 'react'

export default function Home() {
  const [file, setFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const [insights, setInsights] = useState<any[]>([])

  const handleFileUpload = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!file) return

    setLoading(true)
    const formData = new FormData()
    formData.append('file', file)

    try {
      const res = await fetch('/api/v1/ingest/csv?user_id=demo', {
        method: 'POST',
        body: formData,
      })
      const data = await res.json()
      console.log('Ingested:', data)

      // Then discover
      const discoverRes = await fetch('/api/v1/discover', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: 'demo', algorithm: 'pc' }),
      })
      const graph = await discoverRes.json()
      console.log('Graph:', graph)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen">
      {/* Hero */}
      <section className="relative overflow-hidden py-24 px-6">
        <div className="max-w-5xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-parable-900/50 border border-parable-700/50 mb-8">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-sm text-parable-300">Now in open beta</span>
          </div>
          <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-6">
            Not dashboards.
            <br />
            <span className="text-parable-400">Not predictions.</span>
            <br />
            <span className="bg-gradient-to-r from-parable-400 to-violet-400 bg-clip-text text-transparent">
              Truth.
            </span>
          </h1>
          <p className="text-xl text-slate-400 max-w-2xl mx-auto mb-12">
            Parable discovers, validates, and communicates cause-and-effect
            relationships across any dataset — with statistical rigor and
            zero hallucination.
          </p>

          {/* Upload */}
          <form onSubmit={handleFileUpload} className="max-w-md mx-auto">
            <div className="relative group">
              <div className="absolute -inset-1 bg-gradient-to-r from-parable-500 to-violet-500 rounded-2xl blur opacity-25 group-hover:opacity-50 transition duration-1000 group-hover:duration-200" />
              <div className="relative flex items-center gap-4 p-6 bg-slate-900 rounded-xl border border-slate-800">
                <input
                  type="file"
                  accept=".csv"
                  onChange={(e) => setFile(e.target.files?.[0] || null)}
                  className="flex-1 text-sm text-slate-400 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-parable-900 file:text-parable-300 hover:file:bg-parable-800"
                />
                <button
                  type="submit"
                  disabled={!file || loading}
                  className="px-6 py-2.5 bg-parable-600 hover:bg-parable-500 disabled:bg-slate-700 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-colors"
                >
                  {loading ? 'Analyzing...' : 'Analyze'}
                </button>
              </div>
            </div>
          </form>
        </div>
      </section>

      {/* Features */}
      <section className="py-24 px-6 border-t border-slate-800">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                title: 'Discover',
                desc: 'Automatically discover causal graphs from observational data using state-of-the-art algorithms.',
                icon: '🔍',
              },
              {
                title: 'Validate',
                desc: 'Rigorously test causal claims with appropriate statistical methods and confidence scoring.',
                icon: '✓',
              },
              {
                title: 'Communicate',
                desc: 'Translate findings into trustworthy natural language with zero hallucination.',
                icon: '💬',
              },
            ].map((feature) => (
              <div
                key={feature.title}
                className="p-8 rounded-2xl bg-slate-900/50 border border-slate-800 hover:border-parable-700/50 transition-colors"
              >
                <div className="text-3xl mb-4">{feature.icon}</div>
                <h3 className="text-xl font-semibold mb-3">{feature.title}</h3>
                <p className="text-slate-400">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-6 border-t border-slate-800">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-slate-500">
            © 2026 Parable Inc. All rights reserved.
          </p>
          <div className="flex gap-6 text-slate-500">
            <a href="#" className="hover:text-parable-400 transition-colors">GitHub</a>
            <a href="#" className="hover:text-parable-400 transition-colors">Docs</a>
            <a href="#" className="hover:text-parable-400 transition-colors">API</a>
          </div>
        </div>
      </footer>
    </main>
  )
}
