import React from 'react';
import { RefreshCw, CheckCircle2, AlertCircle, AlertTriangle } from 'lucide-react';
import { NormalizedAssessmentDocument } from '../../types/assessmentExport';
import {
  AssessmentRegenerationTarget,
  AssessmentRegenerationLocator,
} from '../../types';

export interface AssessmentDocumentPreviewProps {
  model: NormalizedAssessmentDocument;
  workflowStatus: 'DRAFT' | 'PERLU_DILENGKAPI' | 'SIAP';
  needsReview?: boolean;
  onRegenerateTarget?: (
    target: AssessmentRegenerationTarget,
    targetId: string,
    explicitOverride?: boolean,
    locator?: AssessmentRegenerationLocator,
    description?: string
  ) => Promise<void> | void;
  activeRegeneration?: {
    target: AssessmentRegenerationTarget;
    targetId: string;
    label: string;
  } | null;
  feedback?: {
    status: 'SUCCESS' | 'ERROR';
    title: string;
    message: string;
    target: AssessmentRegenerationTarget;
    targetId: string;
    locator?: AssessmentRegenerationLocator;
    canRetry?: boolean;
  } | null;
  onDismissFeedback?: () => void;
  onRetryFeedback?: () => void;
}

export const AssessmentDocumentPreview: React.FC<AssessmentDocumentPreviewProps> = ({
  model,
  workflowStatus,
  needsReview,
  onRegenerateTarget,
  activeRegeneration,
  feedback,
  onDismissFeedback,
  onRetryFeedback,
}) => {
  const meta = model.metadata;

  const isTargetLoading = (target: AssessmentRegenerationTarget, targetId?: string) => {
    if (!activeRegeneration || !targetId) return false;
    return activeRegeneration.target === target && activeRegeneration.targetId === targetId;
  };

  const isAnyLoading = Boolean(activeRegeneration);

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-12">
      {/* 1. STATUS BANNER */}
      <div
        className={`p-4 rounded-lg border flex flex-col md:flex-row md:items-center md:justify-between gap-2 ${
          workflowStatus === 'SIAP'
            ? 'bg-emerald-50 border-emerald-300 text-emerald-900'
            : workflowStatus === 'PERLU_DILENGKAPI'
            ? 'bg-amber-50 border-amber-300 text-amber-900'
            : 'bg-blue-50 border-blue-300 text-blue-900'
        }`}
      >
        <div>
          <h3 className="font-bold text-sm uppercase tracking-wide">
            {workflowStatus === 'SIAP' && 'Pratinjau Dokumen SIAP'}
            {workflowStatus === 'PERLU_DILENGKAPI' && 'Pratinjau — Perlu Dilengkapi'}
            {workflowStatus === 'DRAFT' && 'Pratinjau Draf'}
          </h3>
          <p className="text-xs mt-0.5 opacity-90">
            {workflowStatus === 'SIAP' && 'Dokumen siap untuk verifikasi dan ekspor resmi.'}
            {workflowStatus === 'PERLU_DILENGKAPI' && 'Dokumen masih memiliki bagian yang perlu diperbaiki.'}
            {workflowStatus === 'DRAFT' && 'Dokumen ini belum dikonfirmasi SIAP.'}
          </p>
        </div>
        {needsReview && (
          <div className="inline-flex items-center px-2.5 py-1 rounded bg-amber-100 border border-amber-300 text-amber-800 text-xs font-semibold self-start md:self-auto">
            Masih memerlukan review guru.
          </div>
        )}
      </div>

      {/* 2. GRANULAR REGENERATION FEEDBACK / PROGRESS NOTIFICATION */}
      {activeRegeneration && (
        <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg flex items-center justify-between gap-3 text-xs text-blue-900 shadow-sm animate-pulse">
          <div className="flex items-center gap-2.5">
            <RefreshCw className="w-4 h-4 text-blue-600 animate-spin shrink-0" />
            <div>
              <span className="font-bold text-blue-950">Membuat ulang {activeRegeneration.label}...</span>
              <p className="text-[11px] text-blue-700">Mohon tunggu, AI sedang memproses pembaruan komponen ini.</p>
            </div>
          </div>
          <span className="px-2 py-0.5 rounded bg-blue-100 text-blue-800 text-[10px] font-bold uppercase shrink-0">
            Sedang Diproses
          </span>
        </div>
      )}

      {feedback && !activeRegeneration && (
        <div
          className={`p-3.5 rounded-lg border flex items-start justify-between gap-3 text-xs shadow-sm transition-all ${
            feedback.status === 'SUCCESS'
              ? 'bg-emerald-50 border-emerald-300 text-emerald-900'
              : 'bg-red-50 border-red-300 text-red-900'
          }`}
        >
          <div className="flex items-start gap-2.5">
            {feedback.status === 'SUCCESS' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            ) : (
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
            )}
            <div className="space-y-0.5">
              <div className="font-bold text-sm">
                {feedback.title}
              </div>
              <p className={feedback.status === 'SUCCESS' ? 'text-emerald-800' : 'text-red-800'}>
                {feedback.message}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {feedback.status === 'ERROR' && feedback.canRetry && onRetryFeedback && (
              <button
                type="button"
                onClick={onRetryFeedback}
                className="px-2.5 py-1 bg-red-600 hover:bg-red-700 text-white rounded font-semibold text-xs flex items-center gap-1 shadow-sm transition"
              >
                <RefreshCw className="w-3 h-3" /> Coba Lagi
              </button>
            )}
            {onDismissFeedback && (
              <button
                type="button"
                onClick={onDismissFeedback}
                className="text-slate-400 hover:text-slate-700 font-bold px-1 py-0.5 text-xs rounded transition"
                title="Tutup pemberitahuan"
              >
                ✕
              </button>
            )}
          </div>
        </div>
      )}

      {/* DOCUMENT SHEET */}
      <div className="bg-white border border-slate-300 shadow-sm rounded-lg p-6 md:p-10 space-y-8 text-slate-800 text-sm font-sans leading-relaxed">
        {/* HEADER / TITLES */}
        <div className="text-center space-y-1 pb-4 border-b border-slate-200">
          <h2 className="text-lg md:text-xl font-extrabold uppercase tracking-tight text-slate-900">
            {meta.title}
          </h2>
          {meta.subTitle && (
            <p className="text-sm font-semibold text-slate-600">{meta.subTitle}</p>
          )}
          <p className="text-xs text-slate-500 font-medium">{meta.schoolName}</p>
        </div>

        {/* IDENTITAS */}
        <div className="space-y-2">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 border-b border-slate-100 pb-1">
            Informasi Dokumen & Satuan Pendidikan
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-1.5 text-xs">
            <div className="flex justify-between py-0.5 border-b border-slate-50">
              <span className="text-slate-500 font-medium">Satuan Pendidikan:</span>
              <span className="font-semibold text-slate-800">{meta.schoolName || '-'}</span>
            </div>
            {meta.npsn && (
              <div className="flex justify-between py-0.5 border-b border-slate-50">
                <span className="text-slate-500 font-medium">NPSN:</span>
                <span className="font-semibold text-slate-800">{meta.npsn}</span>
              </div>
            )}
            <div className="flex justify-between py-0.5 border-b border-slate-50">
              <span className="text-slate-500 font-medium">Mata Pelajaran:</span>
              <span className="font-semibold text-slate-800">{meta.subject || '-'}</span>
            </div>
            <div className="flex justify-between py-0.5 border-b border-slate-50">
              <span className="text-slate-500 font-medium">Fase / Kelas:</span>
              <span className="font-semibold text-slate-800">
                {meta.phase ? `Fase ${meta.phase}` : ''} {meta.grade ? `Kelas ${meta.grade}` : ''}
              </span>
            </div>
            <div className="flex justify-between py-0.5 border-b border-slate-50">
              <span className="text-slate-500 font-medium">Tahun Ajaran:</span>
              <span className="font-semibold text-slate-800">{meta.academicYear || '-'}</span>
            </div>
            <div className="flex justify-between py-0.5 border-b border-slate-50">
              <span className="text-slate-500 font-medium">Semester:</span>
              <span className="font-semibold text-slate-800">{meta.semester || '-'}</span>
            </div>
            <div className="flex justify-between py-0.5 border-b border-slate-50">
              <span className="text-slate-500 font-medium">Guru Pengampu:</span>
              <span className="font-semibold text-slate-800">{meta.teacherName || '-'}</span>
            </div>
            <div className="flex justify-between py-0.5 border-b border-slate-50">
              <span className="text-slate-500 font-medium">Tanggal Dokumen:</span>
              <span className="font-semibold text-slate-800">{meta.formattedDocumentDate || meta.documentDate || '-'}</span>
            </div>
            {meta.packageRevision !== undefined && (
              <div className="flex justify-between py-0.5 border-b border-slate-50">
                <span className="text-slate-500 font-medium">Nomor Revisi:</span>
                <span className="font-semibold text-slate-800">Rev {meta.packageRevision}</span>
              </div>
            )}
          </div>
        </div>

        {/* SECTION I: KISI-KISI ASESMEN */}
        <div className="space-y-3 pt-2">
          <h3 className="text-sm font-bold uppercase tracking-wide text-slate-900 border-l-4 border-blue-600 pl-2">
            I. Kisi-Kisi Asesmen
          </h3>
          {model.kisiKisi.rows.length === 0 ? (
            <p className="text-xs text-slate-400 italic">Belum ada kisi-kisi asesmen.</p>
          ) : (
            <div className="overflow-x-auto border border-slate-200 rounded">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                    <th className="p-2 w-10 text-center">No</th>
                    <th className="p-2 w-1/4">Tujuan Pembelajaran / KD</th>
                    <th className="p-2">Indikator</th>
                    <th className="p-2">Materi / Konteks</th>
                    <th className="p-2 w-28">Instrumen</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {model.kisiKisi.rows.map((row) => {
                    const isIndicatorLoading = isTargetLoading('INDICATOR', row.id);
                    const isMaterialLoading = isTargetLoading('MATERIAL_CONTEXT', row.id);

                    return (
                      <tr key={`kisikisi-${row.no}`} className="hover:bg-slate-50/50">
                        <td className="p-2 text-center font-semibold text-slate-600">{row.no}</td>
                        <td className="p-2">
                          <div className="text-slate-800">{row.tpCodeAndStatement}</div>
                        </td>
                        <td className="p-2">
                          <div className="flex items-start justify-between gap-1.5">
                            <span className="text-slate-700">{row.indicator}</span>
                            {onRegenerateTarget && (
                              row.id ? (
                                <button
                                  type="button"
                                  onClick={() =>
                                    onRegenerateTarget(
                                      'INDICATOR',
                                      row.id!,
                                      false,
                                      { kind: 'BLUEPRINT_ITEM', id: row.id! },
                                      `Indikator Kisi-Kisi No. ${row.no}`
                                    )
                                  }
                                  disabled={isAnyLoading}
                                  className="shrink-0 p-1 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded transition disabled:opacity-50"
                                  title={`Buat ulang Indikator Kisi-Kisi No. ${row.no}`}
                                >
                                  <RefreshCw className={`w-3 h-3 ${isIndicatorLoading ? 'animate-spin text-blue-600' : ''}`} />
                                </button>
                              ) : (
                                <span className="text-[10px] text-slate-400 italic shrink-0" title="Bagian ini belum dapat dibuat ulang otomatis">
                                  -
                                </span>
                              )
                            )}
                          </div>
                        </td>
                        <td className="p-2">
                          <div className="flex items-start justify-between gap-1.5">
                            <span className="text-slate-700">{row.material || '-'}</span>
                            {onRegenerateTarget && (
                              row.id ? (
                                <button
                                  type="button"
                                  onClick={() =>
                                    onRegenerateTarget(
                                      'MATERIAL_CONTEXT',
                                      row.id!,
                                      false,
                                      { kind: 'BLUEPRINT_ITEM', id: row.id! },
                                      `Materi Kisi-Kisi No. ${row.no}`
                                    )
                                  }
                                  disabled={isAnyLoading}
                                  className="shrink-0 p-1 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded transition disabled:opacity-50"
                                  title={`Buat ulang Materi / Konteks No. ${row.no}`}
                                >
                                  <RefreshCw className={`w-3 h-3 ${isMaterialLoading ? 'animate-spin text-blue-600' : ''}`} />
                                </button>
                              ) : (
                                <span className="text-[10px] text-slate-400 italic shrink-0" title="Bagian ini belum dapat dibuat ulang otomatis">
                                  -
                                </span>
                              )
                            )}
                          </div>
                        </td>
                        <td className="p-2 text-slate-700 font-medium">{row.instrumentType}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* SECTION II: INSTRUMEN ASESMEN */}
        <div className="space-y-6 pt-2">
          <h3 className="text-sm font-bold uppercase tracking-wide text-slate-900 border-l-4 border-blue-600 pl-2">
            II. Instrumen Asesmen
          </h3>
          {model.instruments.list.length === 0 ? (
            <p className="text-xs text-slate-400 italic">Belum ada instrumen asesmen.</p>
          ) : (
            model.instruments.list.map((inst, instIdx) => {
              const isInstLoading = activeRegeneration?.targetId === inst.id;

              return (
                <div key={inst.id} className="p-4 rounded border border-slate-200 bg-slate-50/60 space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                    <h4 className="text-xs font-bold uppercase tracking-wide text-slate-800">
                      Instrumen {instIdx + 1}: {inst.title || inst.typeLabel || inst.type}
                    </h4>
                    <span className="text-[11px] font-semibold px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200">
                      {inst.typeLabel || inst.type}
                    </span>
                  </div>

                  {/* WRITTEN TEST */}
                  {inst.type === 'WRITTEN_TEST' && (
                    <div className="space-y-4">
                      {inst.writtenItems && inst.writtenItems.length > 0 ? (
                        inst.writtenItems.map((item) => {
                          const isStimulusLoading = isTargetLoading('STIMULUS', item.id);
                          const isPromptLoading = isTargetLoading('ITEM_PROMPT', item.id);
                          const isOptionsLoading = isTargetLoading('OPTIONS', item.id);

                          return (
                            <div key={`written-${inst.id}-${item.no}`} className="space-y-2 p-3 bg-white border border-slate-200 rounded">
                              {/* Stimulus */}
                              {item.stimulus && (
                                <div className="p-2.5 bg-slate-50 border-l-2 border-slate-400 text-xs italic text-slate-700 flex items-start justify-between gap-2 rounded-r">
                                  <div className="flex-1">{item.stimulus}</div>
                                  {onRegenerateTarget && (
                                    item.id ? (
                                      <button
                                        type="button"
                                        onClick={() =>
                                          onRegenerateTarget(
                                            'STIMULUS',
                                            item.id!,
                                            false,
                                            { kind: 'INSTRUMENT_ITEM', id: item.id! },
                                            `Stimulus Soal ${item.no}`
                                          )
                                        }
                                        disabled={isAnyLoading}
                                        className="shrink-0 inline-flex items-center gap-1 px-1.5 py-0.5 text-[10px] font-semibold text-slate-600 hover:text-blue-700 hover:bg-blue-50 border border-slate-200 rounded not-italic transition disabled:opacity-50"
                                        title={`Buat ulang Stimulus Soal ${item.no}`}
                                      >
                                        <RefreshCw className={`w-2.5 h-2.5 ${isStimulusLoading ? 'animate-spin text-blue-600' : 'text-slate-500'}`} />
                                        <span>{isStimulusLoading ? 'Memproses...' : 'Buat Ulang Stimulus'}</span>
                                      </button>
                                    ) : (
                                      <span className="text-[10px] text-slate-400 italic shrink-0">ID tidak tersedia</span>
                                    )
                                  )}
                                </div>
                              )}

                              {/* Prompt / Question */}
                              <div className="flex items-start justify-between gap-2">
                                <div className="flex items-start gap-2 flex-1">
                                  <span className="font-bold text-xs text-slate-700">{item.no}.</span>
                                  <div className="text-xs text-slate-800 flex-1">{item.prompt}</div>
                                </div>
                                <div className="flex items-center gap-1.5 shrink-0">
                                  {item.itemType && (
                                    <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-slate-100 border border-slate-200 text-slate-600">
                                      {item.itemType}
                                    </span>
                                  )}
                                  {onRegenerateTarget && (
                                    item.id ? (
                                      <button
                                        type="button"
                                        onClick={() =>
                                          onRegenerateTarget(
                                            'ITEM_PROMPT',
                                            item.id!,
                                            false,
                                            { kind: 'INSTRUMENT_ITEM', id: item.id! },
                                            `Pertanyaan Soal ${item.no}`
                                          )
                                        }
                                        disabled={isAnyLoading}
                                        className="inline-flex items-center gap-1 px-1.5 py-0.5 text-[10px] font-semibold text-slate-600 hover:text-blue-700 hover:bg-blue-50 border border-slate-200 rounded transition disabled:opacity-50"
                                        title={`Buat ulang Pertanyaan Soal ${item.no}`}
                                      >
                                        <RefreshCw className={`w-2.5 h-2.5 ${isPromptLoading ? 'animate-spin text-blue-600' : 'text-slate-500'}`} />
                                        <span>{isPromptLoading ? 'Memproses...' : 'Buat Ulang Pertanyaan'}</span>
                                      </button>
                                    ) : (
                                      <span className="text-[10px] text-slate-400 italic">ID tidak tersedia</span>
                                    )
                                  )}
                                </div>
                              </div>

                              {/* Options */}
                              {item.options && item.options.length > 0 && (
                                <div className="pl-6 space-y-1 pt-1 border-t border-slate-100">
                                  <div className="flex items-center justify-between pb-0.5">
                                    <span className="text-[10px] font-bold uppercase text-slate-400">Pilihan Jawaban</span>
                                    {onRegenerateTarget && (
                                      item.id ? (
                                        <button
                                          type="button"
                                          onClick={() =>
                                            onRegenerateTarget(
                                              'OPTIONS',
                                              item.id!,
                                              false,
                                              { kind: 'INSTRUMENT_ITEM', id: item.id! },
                                              `Pilihan Jawaban Soal ${item.no}`
                                            )
                                          }
                                          disabled={isAnyLoading}
                                          className="inline-flex items-center gap-1 px-1.5 py-0.5 text-[10px] font-semibold text-slate-600 hover:text-blue-700 hover:bg-blue-50 border border-slate-200 rounded transition disabled:opacity-50"
                                          title={`Buat ulang Pilihan Jawaban Soal ${item.no}`}
                                        >
                                          <RefreshCw className={`w-2.5 h-2.5 ${isOptionsLoading ? 'animate-spin text-blue-600' : 'text-slate-500'}`} />
                                          <span>{isOptionsLoading ? 'Memproses...' : 'Buat Ulang Pilihan'}</span>
                                        </button>
                                      ) : null
                                    )}
                                  </div>
                                  {item.options.map((opt, optIdx) => (
                                    <div key={`written-${inst.id}-${item.no}-${opt.label || optIdx}`} className="text-xs text-slate-700 flex items-start gap-2">
                                      <span className="font-semibold text-slate-600">{opt.label}.</span>
                                      <span>{opt.text}</span>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          );
                        })
                      ) : (
                        <p className="text-xs text-slate-400 italic">Belum ada butir soal tes tertulis.</p>
                      )}
                    </div>
                  )}

                  {/* ORAL TEST */}
                  {inst.type === 'ORAL_TEST' && (
                    <div className="space-y-3">
                      {inst.instructions && (
                        <div className="text-xs text-slate-600">
                          <span className="font-semibold">Petunjuk:</span> {inst.instructions}
                        </div>
                      )}
                      {inst.oralItems && inst.oralItems.length > 0 ? (
                        inst.oralItems.map((item) => {
                          const isPromptLoading = isTargetLoading('ITEM_PROMPT', item.id);

                          return (
                            <div key={`oral-${inst.id}-${item.no}`} className="p-3 bg-white border border-slate-200 rounded space-y-1">
                              <div className="flex items-start justify-between gap-2 text-xs">
                                <div className="flex items-start gap-2 flex-1">
                                  <span className="font-bold text-slate-700">#{item.no}</span>
                                  <div className="flex-1">
                                    <span className="font-semibold text-slate-800">Pertanyaan:</span> {item.prompt}
                                  </div>
                                </div>
                                {onRegenerateTarget && (
                                  item.id ? (
                                    <button
                                      type="button"
                                      onClick={() =>
                                        onRegenerateTarget(
                                          'ITEM_PROMPT',
                                          item.id!,
                                          false,
                                          { kind: 'INSTRUMENT_ITEM', id: item.id! },
                                          `Pertanyaan Soal ${item.no}`
                                        )
                                      }
                                      disabled={isAnyLoading}
                                      className="shrink-0 inline-flex items-center gap-1 px-1.5 py-0.5 text-[10px] font-semibold text-slate-600 hover:text-blue-700 hover:bg-blue-50 border border-slate-200 rounded transition disabled:opacity-50"
                                      title={`Buat ulang Pertanyaan Soal ${item.no}`}
                                    >
                                      <RefreshCw className={`w-2.5 h-2.5 ${isPromptLoading ? 'animate-spin text-blue-600' : 'text-slate-500'}`} />
                                      <span>{isPromptLoading ? 'Memproses...' : 'Buat Ulang'}</span>
                                    </button>
                                  ) : (
                                    <span className="text-[10px] text-slate-400 italic">ID tidak tersedia</span>
                                  )
                                )}
                              </div>
                              {item.expectedResponse && (
                                <div className="pl-6 text-xs text-slate-600">
                                  <span className="font-medium text-slate-500">Respons yang Diharapkan:</span> {item.expectedResponse}
                                </div>
                              )}
                            </div>
                          );
                        })
                      ) : (
                        <p className="text-xs text-slate-400 italic">Belum ada butir tes lisan.</p>
                      )}
                    </div>
                  )}

                  {/* PERFORMANCE */}
                  {inst.type === 'PERFORMANCE' && (
                    <div className="space-y-3">
                      {inst.task && (
                        <div className="p-2.5 bg-white border border-slate-200 rounded text-xs space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-slate-700 block">Tugas Kinerja / Praktik:</span>
                            {onRegenerateTarget && (
                              inst.id ? (
                                <button
                                  type="button"
                                  onClick={() =>
                                    onRegenerateTarget(
                                      'TASK',
                                      inst.id,
                                      false,
                                      { kind: 'INSTRUMENT', id: inst.id },
                                      `Tugas Kinerja (${inst.title || 'Praktik'})`
                                    )
                                  }
                                  disabled={isAnyLoading}
                                  className="inline-flex items-center gap-1 px-1.5 py-0.5 text-[10px] font-semibold text-slate-600 hover:text-blue-700 hover:bg-blue-50 border border-slate-200 rounded transition disabled:opacity-50"
                                  title="Buat ulang Tugas Kinerja"
                                >
                                  <RefreshCw className={`w-2.5 h-2.5 ${isTargetLoading('TASK', inst.id) ? 'animate-spin text-blue-600' : 'text-slate-500'}`} />
                                  <span>{isTargetLoading('TASK', inst.id) ? 'Memproses...' : 'Buat Ulang Tugas'}</span>
                                </button>
                              ) : null
                            )}
                          </div>
                          <p className="text-slate-800 whitespace-pre-wrap">{inst.task}</p>
                        </div>
                      )}
                      {inst.instructions && (
                        <div className="text-xs text-slate-600">
                          <span className="font-semibold">Petunjuk Pelaksanaan:</span> {inst.instructions}
                        </div>
                      )}
                      {inst.performanceAspects && inst.performanceAspects.length > 0 && (
                        <div className="space-y-1.5 pt-1">
                          <span className="text-xs font-bold text-slate-700 block">Aspek Penilaian:</span>
                          <div className="grid grid-cols-1 gap-2">
                            {inst.performanceAspects.map((asp, aIdx) => (
                              <div key={`perf-aspect-${inst.id}-${aIdx}`} className="p-2 bg-white border border-slate-200 rounded text-xs">
                                <div className="flex items-center justify-between font-semibold text-slate-800">
                                  <span>{aIdx + 1}. {asp.label}</span>
                                  {asp.weight !== undefined && (
                                    <span className="text-slate-500 font-normal">Bobot: {asp.weight}</span>
                                  )}
                                </div>
                                {asp.description && (
                                  <p className="text-slate-600 mt-0.5">{asp.description}</p>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* OBSERVATION */}
                  {inst.type === 'OBSERVATION' && (
                    <div className="space-y-3">
                      {inst.instructions && (
                        <div className="text-xs text-slate-600">
                          <span className="font-semibold">Petunjuk Observasi:</span> {inst.instructions}
                        </div>
                      )}
                      {inst.recordingScheme && (
                        <div className="text-xs text-slate-600">
                          <span className="font-semibold">Skema Pencatatan:</span> {inst.recordingScheme}
                        </div>
                      )}
                      {inst.observationAspects && inst.observationAspects.length > 0 && (
                        <div className="space-y-1.5 pt-1">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-slate-700 block">Aspek Observasi:</span>
                            {onRegenerateTarget && (
                              inst.id ? (
                                <button
                                  type="button"
                                  onClick={() =>
                                    onRegenerateTarget(
                                      'OBSERVATION_CONTENT',
                                      inst.id,
                                      false,
                                      { kind: 'INSTRUMENT', id: inst.id },
                                      `Aspek Observasi`
                                    )
                                  }
                                  disabled={isAnyLoading}
                                  className="inline-flex items-center gap-1 px-1.5 py-0.5 text-[10px] font-semibold text-slate-600 hover:text-blue-700 hover:bg-blue-50 border border-slate-200 rounded transition disabled:opacity-50"
                                  title="Buat ulang Aspek Observasi"
                                >
                                  <RefreshCw className={`w-2.5 h-2.5 ${isTargetLoading('OBSERVATION_CONTENT', inst.id) ? 'animate-spin text-blue-600' : 'text-slate-500'}`} />
                                  <span>{isTargetLoading('OBSERVATION_CONTENT', inst.id) ? 'Memproses...' : 'Buat Ulang Aspek'}</span>
                                </button>
                              ) : null
                            )}
                          </div>
                          <div className="grid grid-cols-1 gap-2">
                            {inst.observationAspects.map((asp, oIdx) => (
                              <div key={`obs-aspect-${inst.id}-${oIdx}`} className="p-2 bg-white border border-slate-200 rounded text-xs">
                                <span className="font-semibold text-slate-800 block">{oIdx + 1}. {asp.label}</span>
                                {asp.indicator && (
                                  <p className="text-slate-600 mt-0.5"><span className="font-medium text-slate-500">Indikator:</span> {asp.indicator}</p>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* ASSIGNMENT */}
                  {inst.type === 'ASSIGNMENT' && (
                    <div className="space-y-2 p-3 bg-white border border-slate-200 rounded text-xs">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-700 block mb-0.5">Instruksi Penugasan:</span>
                        {onRegenerateTarget && (
                          inst.id ? (
                            <button
                              type="button"
                              onClick={() =>
                                onRegenerateTarget(
                                  'TASK',
                                  inst.id,
                                  false,
                                  { kind: 'INSTRUMENT', id: inst.id },
                                  `Tugas Penugasan`
                                )
                              }
                              disabled={isAnyLoading}
                              className="inline-flex items-center gap-1 px-1.5 py-0.5 text-[10px] font-semibold text-slate-600 hover:text-blue-700 hover:bg-blue-50 border border-slate-200 rounded transition disabled:opacity-50"
                              title="Buat ulang Instruksi Penugasan"
                            >
                              <RefreshCw className={`w-2.5 h-2.5 ${isTargetLoading('TASK', inst.id) ? 'animate-spin text-blue-600' : 'text-slate-500'}`} />
                              <span>{isTargetLoading('TASK', inst.id) ? 'Memproses...' : 'Buat Ulang'}</span>
                            </button>
                          ) : null
                        )}
                      </div>
                      {inst.instructions && (
                        <p className="text-slate-800 whitespace-pre-wrap">{inst.instructions}</p>
                      )}
                      {inst.expectedOutput && (
                        <div className="pt-2 border-t border-slate-100">
                          <span className="font-semibold text-slate-600">Hasil / Luaran yang Diharapkan:</span>{' '}
                          <span className="text-slate-800">{inst.expectedOutput}</span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* PROJECT */}
                  {inst.type === 'PROJECT' && (
                    <div className="space-y-2 p-3 bg-white border border-slate-200 rounded text-xs">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-700 block mb-0.5">Deskripsi / Brief Proyek:</span>
                        {onRegenerateTarget && (
                          inst.id ? (
                            <button
                              type="button"
                              onClick={() =>
                                onRegenerateTarget(
                                  'TASK',
                                  inst.id,
                                  false,
                                  { kind: 'INSTRUMENT', id: inst.id },
                                  `Brief Proyek`
                                )
                              }
                              disabled={isAnyLoading}
                              className="inline-flex items-center gap-1 px-1.5 py-0.5 text-[10px] font-semibold text-slate-600 hover:text-blue-700 hover:bg-blue-50 border border-slate-200 rounded transition disabled:opacity-50"
                              title="Buat ulang Brief Proyek"
                            >
                              <RefreshCw className={`w-2.5 h-2.5 ${isTargetLoading('TASK', inst.id) ? 'animate-spin text-blue-600' : 'text-slate-500'}`} />
                              <span>{isTargetLoading('TASK', inst.id) ? 'Memproses...' : 'Buat Ulang'}</span>
                            </button>
                          ) : null
                        )}
                      </div>
                      {inst.projectBrief && (
                        <p className="text-slate-800 whitespace-pre-wrap">{inst.projectBrief}</p>
                      )}
                      {inst.expectedDeliverable && (
                        <div className="pt-2 border-t border-slate-100">
                          <span className="font-semibold text-slate-600">Luaran Proyek yang Diharapkan:</span>{' '}
                          <span className="text-slate-800">{inst.expectedDeliverable}</span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* PRODUCT */}
                  {inst.type === 'PRODUCT' && (
                    <div className="space-y-2 p-3 bg-white border border-slate-200 rounded text-xs">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-700 block mb-0.5">Deskripsi / Spesifikasi Produk:</span>
                        {onRegenerateTarget && (
                          inst.id ? (
                            <button
                              type="button"
                              onClick={() =>
                                onRegenerateTarget(
                                  'TASK',
                                  inst.id,
                                  false,
                                  { kind: 'INSTRUMENT', id: inst.id },
                                  `Spesifikasi Produk`
                                )
                              }
                              disabled={isAnyLoading}
                              className="inline-flex items-center gap-1 px-1.5 py-0.5 text-[10px] font-semibold text-slate-600 hover:text-blue-700 hover:bg-blue-50 border border-slate-200 rounded transition disabled:opacity-50"
                              title="Buat ulang Spesifikasi Produk"
                            >
                              <RefreshCw className={`w-2.5 h-2.5 ${isTargetLoading('TASK', inst.id) ? 'animate-spin text-blue-600' : 'text-slate-500'}`} />
                              <span>{isTargetLoading('TASK', inst.id) ? 'Memproses...' : 'Buat Ulang'}</span>
                            </button>
                          ) : null
                        )}
                      </div>
                      {inst.productBrief && (
                        <p className="text-slate-800 whitespace-pre-wrap">{inst.productBrief}</p>
                      )}
                      {inst.expectedProduct && (
                        <div className="pt-2 border-t border-slate-100">
                          <span className="font-semibold text-slate-600">Produk yang Diharapkan:</span>{' '}
                          <span className="text-slate-800">{inst.expectedProduct}</span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* PORTFOLIO */}
                  {inst.type === 'PORTFOLIO' && (
                    <div className="space-y-2 p-3 bg-white border border-slate-200 rounded text-xs">
                      {inst.instructions && (
                        <div className="mb-2">
                          <span className="font-bold text-slate-700 block mb-0.5">Petunjuk Portofolio:</span>
                          <p className="text-slate-800 whitespace-pre-wrap">{inst.instructions}</p>
                        </div>
                      )}
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-bold text-slate-700 block">Persyaratan Bukti Portofolio:</span>
                          {onRegenerateTarget && (
                            inst.id ? (
                              <button
                                type="button"
                                onClick={() =>
                                  onRegenerateTarget(
                                    'EVIDENCE_REQUIREMENT',
                                    inst.id,
                                    false,
                                    { kind: 'INSTRUMENT', id: inst.id },
                                    `Persyaratan Bukti Portofolio`
                                  )
                                }
                                disabled={isAnyLoading}
                                className="inline-flex items-center gap-1 px-1.5 py-0.5 text-[10px] font-semibold text-slate-600 hover:text-blue-700 hover:bg-blue-50 border border-slate-200 rounded transition disabled:opacity-50"
                                title="Buat ulang Persyaratan Bukti Portofolio"
                              >
                                <RefreshCw className={`w-2.5 h-2.5 ${isTargetLoading('EVIDENCE_REQUIREMENT', inst.id) ? 'animate-spin text-blue-600' : 'text-slate-500'}`} />
                                <span>{isTargetLoading('EVIDENCE_REQUIREMENT', inst.id) ? 'Memproses...' : 'Buat Ulang Bukti'}</span>
                              </button>
                            ) : null
                          )}
                        </div>
                        {inst.evidenceRequirements && inst.evidenceRequirements.length > 0 ? (
                          <ul className="list-disc pl-5 space-y-1 text-slate-700">
                            {inst.evidenceRequirements.map((req, rIdx) => (
                              <li key={`portfolio-req-${inst.id}-${rIdx}`}>{req}</li>
                            ))}
                          </ul>
                        ) : (
                          <p className="text-slate-400 italic">Belum ada persyaratan bukti.</p>
                        )}
                      </div>
                    </div>
                  )}

                  {/* SELF & PEER ASSESSMENT */}
                  {(inst.type === 'SELF_ASSESSMENT' || inst.type === 'PEER_ASSESSMENT') && (
                    <div className="space-y-3">
                      {inst.instructions && (
                        <div className="text-xs text-slate-600">
                          <span className="font-semibold">Petunjuk:</span> {inst.instructions}
                        </div>
                      )}
                      {inst.responseScheme && (
                        <div className="text-xs text-slate-600">
                          <span className="font-semibold">Skema Respon:</span> {inst.responseScheme}
                        </div>
                      )}
                      {inst.selfPeerItems && inst.selfPeerItems.length > 0 ? (
                        <div className="space-y-1.5">
                          <span className="text-xs font-bold text-slate-700 block">Daftar Pernyataan Refleksi / Penilaian:</span>
                          {inst.selfPeerItems.map((item) => (
                            <div key={`self-peer-${inst.id}-${item.no}`} className="p-2.5 bg-white border border-slate-200 rounded text-xs flex items-start gap-2">
                              <span className="font-bold text-slate-600">{item.no}.</span>
                              <div className="flex-1">
                                <p className="text-slate-800">{item.statement}</p>
                                {item.category && (
                                  <span className="text-[10px] text-slate-500 font-medium mt-0.5 block">
                                    Kategori: {item.category}
                                  </span>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-xs text-slate-400 italic">Belum ada butir pernyataan.</p>
                      )}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* SECTION III: KUNCI JAWABAN */}
        <div className="space-y-3 pt-2">
          <h3 className="text-sm font-bold uppercase tracking-wide text-slate-900 border-l-4 border-blue-600 pl-2">
            III. Kunci Jawaban
          </h3>
          {model.answerKeys.list.length === 0 ? (
            <p className="text-xs text-slate-400 italic">Tidak ada kunci jawaban terpisah.</p>
          ) : (
            <div className="overflow-x-auto border border-slate-200 rounded">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                    <th className="p-2 w-16 text-center">No. Butir</th>
                    <th className="p-2 w-28">Instrumen</th>
                    <th className="p-2 w-28">Tipe Kunci</th>
                    <th className="p-2">Kunci Jawaban</th>
                    <th className="p-2">Keterangan</th>
                    {onRegenerateTarget && (
                      <th className="p-2 w-24 text-center">Aksi</th>
                    )}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {model.answerKeys.list.map((ak, akIdx) => {
                    const isKeyLoading = isTargetLoading('PROPOSED_ANSWER', ak.id);

                    return (
                      <tr key={`answer-key-${akIdx}`} className="hover:bg-slate-50/50">
                        <td className="p-2 text-center font-semibold text-slate-600">
                          {ak.itemNumber ?? '-'}
                        </td>
                        <td className="p-2 text-slate-700 font-medium">{ak.instrumentType}</td>
                        <td className="p-2 text-slate-700">{ak.answerType}</td>
                        <td className="p-2 font-semibold text-blue-700">{ak.value || '-'}</td>
                        <td className="p-2 text-slate-600">{ak.notes || '-'}</td>
                        {onRegenerateTarget && (
                          <td className="p-2 text-center">
                            {ak.id ? (
                              <button
                                type="button"
                                onClick={() =>
                                  onRegenerateTarget(
                                    'PROPOSED_ANSWER',
                                    ak.id!,
                                    false,
                                    { kind: 'ANSWER_KEY', id: ak.id! },
                                    `Kunci Jawaban Soal ${ak.itemNumber ?? (akIdx + 1)}`
                                  )
                                }
                                disabled={isAnyLoading}
                                className="inline-flex items-center gap-1 px-1.5 py-0.5 text-[10px] font-semibold text-slate-600 hover:text-blue-700 hover:bg-blue-50 border border-slate-200 rounded transition disabled:opacity-50"
                                title={`Buat ulang Kunci Jawaban Soal ${ak.itemNumber ?? (akIdx + 1)}`}
                              >
                                <RefreshCw className={`w-2.5 h-2.5 ${isKeyLoading ? 'animate-spin text-blue-600' : 'text-slate-500'}`} />
                                <span>{isKeyLoading ? 'Memproses...' : 'Buat Ulang'}</span>
                              </button>
                            ) : (
                              <span className="text-[10px] text-slate-400 italic">-</span>
                            )}
                          </td>
                        )}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* SECTION IV: PEDOMAN PENSKORAN */}
        <div className="space-y-3 pt-2">
          <h3 className="text-sm font-bold uppercase tracking-wide text-slate-900 border-l-4 border-blue-600 pl-2">
            IV. Pedoman Penskoran
          </h3>
          {model.scoringGuides.list.length === 0 ? (
            <p className="text-xs text-slate-400 italic">Belum ada pedoman penskoran.</p>
          ) : (
            <div className="space-y-3">
              {model.scoringGuides.list.map((guide, guideIdx) => {
                const isGuideLoading = isTargetLoading('SCORING_GUIDE', guide.id);

                return (
                  <div key={`scoring-guide-${guideIdx}-${guide.title}`} className="p-3 bg-slate-50 border border-slate-200 rounded space-y-2 text-xs">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-800">{guide.title}</span>
                        <span className="text-[10px] px-2 py-0.5 rounded bg-slate-200 text-slate-700 font-mono">
                          {guide.guideType}
                        </span>
                      </div>
                      {onRegenerateTarget && (
                        guide.id ? (
                          <button
                            type="button"
                            onClick={() =>
                              onRegenerateTarget(
                                'SCORING_GUIDE',
                                guide.id!,
                                false,
                                { kind: 'SCORING_GUIDE', id: guide.id! },
                                `Pedoman Penskoran "${guide.title}"`
                              )
                            }
                            disabled={isAnyLoading}
                            className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-semibold text-slate-600 hover:text-blue-700 hover:bg-blue-50 border border-slate-200 rounded transition disabled:opacity-50"
                            title={`Buat ulang Pedoman Penskoran "${guide.title}"`}
                          >
                            <RefreshCw className={`w-2.5 h-2.5 ${isGuideLoading ? 'animate-spin text-blue-600' : 'text-slate-500'}`} />
                            <span>{isGuideLoading ? 'Memproses...' : 'Buat Ulang Pedoman'}</span>
                          </button>
                        ) : null
                      )}
                    </div>
                    {guide.instructions && (
                      <p className="text-slate-700"><span className="font-semibold">Instruksi:</span> {guide.instructions}</p>
                    )}
                    {guide.maxScore !== undefined && (
                      <p className="text-slate-700"><span className="font-semibold">Skor Maksimal:</span> {guide.maxScore}</p>
                    )}
                    {guide.notes && (
                      <p className="text-slate-500 italic"><span className="font-semibold not-italic">Catatan:</span> {guide.notes}</p>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* SECTION V: RUBRIK PENILAIAN */}
        <div className="space-y-3 pt-2">
          <h3 className="text-sm font-bold uppercase tracking-wide text-slate-900 border-l-4 border-blue-600 pl-2">
            V. Rubrik Penilaian
          </h3>
          {model.rubrics.list.length === 0 ? (
            <p className="text-xs text-slate-400 italic">Belum ada rubrik penilaian.</p>
          ) : (
            <div className="space-y-4">
              {model.rubrics.list.map((rub, rubIdx) => {
                const isRubricLoading = isTargetLoading('RUBRIC', rub.id);

                return (
                  <div key={`rubric-${rubIdx}-${rub.title}`} className="p-4 bg-slate-50 border border-slate-200 rounded space-y-3 text-xs">
                    <div className="flex items-center justify-between">
                      <div className="font-bold text-slate-800 text-sm">{rub.title}</div>
                      {onRegenerateTarget && (
                        rub.id ? (
                          <button
                            type="button"
                            onClick={() =>
                              onRegenerateTarget(
                                'RUBRIC',
                                rub.id!,
                                false,
                                { kind: 'RUBRIC', id: rub.id! },
                                `Rubrik Penilaian "${rub.title}"`
                              )
                            }
                            disabled={isAnyLoading}
                            className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-semibold text-slate-600 hover:text-blue-700 hover:bg-blue-50 border border-slate-200 rounded transition disabled:opacity-50"
                            title={`Buat ulang Rubrik Penilaian "${rub.title}"`}
                          >
                            <RefreshCw className={`w-2.5 h-2.5 ${isRubricLoading ? 'animate-spin text-blue-600' : 'text-slate-500'}`} />
                            <span>{isRubricLoading ? 'Memproses...' : 'Buat Ulang Rubrik'}</span>
                          </button>
                        ) : null
                      )}
                    </div>
                    {rub.scale && rub.scale.length > 0 && rub.criteria && rub.criteria.length > 0 ? (
                      <div className="overflow-x-auto border border-slate-200 rounded">
                        <table className="w-full text-left text-xs border-collapse">
                          <thead>
                            <tr className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                              <th className="p-2 w-1/3">Kriteria</th>
                              {rub.scale.map((sc, scIdx) => (
                                <th key={`scale-head-${rubIdx}-${scIdx}`} className="p-2 text-center">
                                  <div>{sc.label}</div>
                                  {sc.score !== undefined && (
                                    <div className="text-[10px] font-normal text-slate-500">({sc.score})</div>
                                  )}
                                </th>
                              ))}
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-200">
                            {rub.criteria.map((crit, critIdx) => (
                              <tr key={`criterion-${rubIdx}-${critIdx}`} className="hover:bg-slate-50/50">
                                <td className="p-2 font-semibold text-slate-800 align-top">
                                  <div>{critIdx + 1}. {crit.label}</div>
                                  {crit.weight !== undefined && (
                                    <span className="text-[10px] text-slate-500 font-normal">Bobot: {crit.weight}</span>
                                  )}
                                </td>
                                {rub.scale.map((_, sIdx) => (
                                  <td key={`desc-${rubIdx}-${critIdx}-${sIdx}`} className="p-2 text-slate-600 align-top text-[11px]">
                                    {crit.descriptors && crit.descriptors[sIdx] ? crit.descriptors[sIdx] : '-'}
                                  </td>
                                ))}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <>
                        {rub.criteria && rub.criteria.length > 0 && (
                          <div className="space-y-2">
                            <span className="font-semibold text-slate-700 block">Kriteria Penilaian:</span>
                            <div className="space-y-1.5">
                              {rub.criteria.map((crit, critIdx) => (
                                <div key={`criterion-${rubIdx}-${critIdx}`} className="p-2 bg-white border border-slate-200 rounded">
                                  <div className="flex justify-between font-semibold text-slate-800">
                                    <span>{critIdx + 1}. {crit.label}</span>
                                    {crit.weight !== undefined && (
                                      <span className="text-slate-500 font-normal">Bobot: {crit.weight}</span>
                                    )}
                                  </div>
                                  {crit.descriptors && crit.descriptors.length > 0 && (
                                    <p className="text-slate-600 mt-0.5 text-[11px]">{crit.descriptors.join('; ')}</p>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                        {rub.scale && rub.scale.length > 0 && (
                          <div className="space-y-2 pt-2 border-t border-slate-200">
                            <span className="font-semibold text-slate-700 block">Skala Penilaian:</span>
                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2">
                              {rub.scale.map((sc, scIdx) => (
                                <div key={`scale-${rubIdx}-${scIdx}`} className="p-2 bg-white border border-slate-200 rounded">
                                  <div className="font-semibold text-slate-800 flex justify-between">
                                    <span>{sc.label}</span>
                                    {sc.score !== undefined && <span className="text-blue-600">({sc.score})</span>}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* SIGNOFF */}
        <div className="pt-8 border-t border-slate-200 text-xs">
          <div className="text-right text-slate-700 font-medium mb-6">
            {model.signoff.locationAndDate}
          </div>
          <div className="grid grid-cols-2 gap-8 text-center">
            <div className="space-y-16">
              <div className="font-medium text-slate-700">{model.signoff.principalTitle}</div>
              <div>
                <div className="font-bold underline text-slate-800">{model.signoff.principalName}</div>
                {model.signoff.principalNip && (
                  <div className="text-slate-600">{model.signoff.principalNip}</div>
                )}
              </div>
            </div>
            <div className="space-y-16">
              <div className="font-medium text-slate-700">{model.signoff.teacherTitle}</div>
              <div>
                <div className="font-bold underline text-slate-800">{model.signoff.teacherName}</div>
                {model.signoff.teacherNip && (
                  <div className="text-slate-600">{model.signoff.teacherNip}</div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
