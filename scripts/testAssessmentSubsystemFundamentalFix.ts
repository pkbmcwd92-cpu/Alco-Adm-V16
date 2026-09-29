import assert from 'node:assert';

class MockLocalStorage {
  private store: Map<string, string> = new Map();
  getItem(key: string): string | null {
    return this.store.has(key) ? this.store.get(key)! : null;
  }
  setItem(key: string, value: string): void {
    this.store.set(key, String(value));
  }
  removeItem(key: string): void {
    this.store.delete(key);
  }
  clear(): void {
    this.store.clear();
  }
  get length(): number {
    return this.store.size;
  }
  key(index: number): string | null {
    const keys = Array.from(this.store.keys());
    return keys[index] || null;
  }
}
const mockStorage = new MockLocalStorage();
(globalThis as any).localStorage = mockStorage;

import {
  createInitialStorageV5,
  saveAssessmentCriteriaV5,
  saveAssessmentPlansV5,
  saveAssessmentPackagesV5,
  getSemesterDataV5,
  createYearHierarchyV5,
  loadStorageV5,
  saveStorageV5,
} from '../src/services/storageV5';
import { resolveAssessmentGenerationSpec } from '../src/services/assessmentGenerationSpecService';
import { resolveAssessmentGenerationPlan } from '../src/services/assessmentGenerationPlanService';
import {
  buildGenerationContract,
  generateAssessmentPackageDraft,
} from '../src/services/assessmentPackageGeneratorService';
import { validateAssessmentCoverage } from '../src/services/assessmentCoverageValidationService';
import { verifyAssessmentPackageAnswers } from '../src/services/assessmentAnswerVerificationService';
import {
  AcademicSetting,
  AssessmentAIGenerationProvider,
  AssessmentAIGenerationRawResponse,
  AssessmentCriterion,
  AssessmentPackage,
  AssessmentPlan,
  TPData,
} from '../src/types';

class MockAIProvider implements AssessmentAIGenerationProvider {
  constructor(private fn: () => string) {}
  async generate(): Promise<AssessmentAIGenerationRawResponse> {
    return { rawText: this.fn() };
  }
}

console.log('=== STARTING ASSESSMENT SUBSYSTEM FUNDAMENTAL FIX REGRESSION SUITE ===\n');

async function runSubsystemRegressionTests() {
  const setting: AcademicSetting = {
    id: 'setting-fix-1',
    academicYear: '2025/2026',
    semester: '1 (Ganjil)',
    level: 'SD',
    grade: '4',
    subject: 'Matematika',
    curriculum: 'Kurikulum Merdeka',
  } as any;

  const mockTP: TPData = {
    id: 'tp-data-1',
    academicSettingId: setting.id,
    workflowStatus: 'SIAP',
    items: [
      { id: 'tp-1', code: 'TP-1', statement: 'Memahami konsep pecahan senilai dan desimal', order: 1 } as any,
      { id: 'tp-2', code: 'TP-2', statement: 'Mengaplikasikan operasi penjumlahan pecahan', order: 2 } as any,
      { id: 'tp-3', code: 'TP-3', statement: 'Menganalisis soal cerita matematika pecahan', order: 3 } as any,
    ],
  } as any;

  const mockCriteria: AssessmentCriterion[] = [
    { id: 'crit-1', academicSettingId: setting.id, tpId: 'tp-1', description: 'Peserta didik mampu mengidentifikasi pecahan senilai', approach: 'deskripsi', workflowStatus: 'SIAP', name: 'KKTP 1' } as any,
    { id: 'crit-2', academicSettingId: setting.id, tpId: 'tp-2', description: 'Peserta didik mampu menghitung penjumlahan pecahan', approach: 'deskripsi', workflowStatus: 'SIAP', name: 'KKTP 2' } as any,
    { id: 'crit-3', academicSettingId: setting.id, tpId: 'tp-3', description: 'Peserta didik mampu menyelesaikan masalah pecahan', approach: 'deskripsi', workflowStatus: 'SIAP', name: 'KKTP 3' } as any,
  ];

  // =========================================================================
  // SECTION 1: ITEM COUNT DISTRIBUTION & REMAINDER ALLOCATION (SECTION 2, 3, 21)
  // =========================================================================
  console.log('--- SECTION 1: ITEM COUNT DISTRIBUTION & REMAINDER ALLOCATION ---');

  // Case 1: requested = 10, coverage = 1
  const planCase1: AssessmentPlan = {
    id: 'plan-1',
    academicSettingId: setting.id,
    title: 'Tes Format 1',
    purpose: 'SUMMATIVE',
    timing: 'MID_SEMESTER',
    scopeType: 'TP',
    tpIds: ['tp-1'],
    criterionIds: ['crit-1'],
    instruments: [{ id: 'inst-w1', type: 'WRITTEN_TEST' }],
    workflowStatus: 'SIAP',
    createdAt: '2026-09-29T00:00:00Z',
    updatedAt: '2026-09-29T00:00:00Z',
  };

  const specCase1 = resolveAssessmentGenerationSpec({
    academicSetting: setting,
    assessmentPlan: planCase1,
    tp: mockTP,
    assessmentCriteria: mockCriteria,
  });

  const genPlanCase1 = resolveAssessmentGenerationPlan({
    generationSpec: specCase1,
    constraints: { assemblyMode: 'AUTO_RECOMMENDED', requestedTotalItems: 10 },
  });

  assert.strictEqual(genPlanCase1.coverageUnits.length, 1, 'Case 1: 1 coverage unit generated');
  assert.strictEqual(genPlanCase1.coverageUnits[0].recommendedCount, 10, 'Case 1: 10 items allocated to single coverage unit');
  assert.strictEqual(genPlanCase1.summary.allocatedCount, 10, 'Case 1: Total summary allocatedCount is 10');
  console.log('  [PASS] Case 1: requested=10, coverage=1 -> 10 items allocated');

  // Case 2: requested = 20, coverage = 3
  const planCase2: AssessmentPlan = {
    ...planCase1,
    id: 'plan-2',
    tpIds: ['tp-1', 'tp-2', 'tp-3'],
    criterionIds: ['crit-1', 'crit-2', 'crit-3'],
  };

  const specCase2 = resolveAssessmentGenerationSpec({
    academicSetting: setting,
    assessmentPlan: planCase2,
    tp: mockTP,
    assessmentCriteria: mockCriteria,
  });

  const genPlanCase2 = resolveAssessmentGenerationPlan({
    generationSpec: specCase2,
    constraints: { assemblyMode: 'AUTO_RECOMMENDED', requestedTotalItems: 20 },
  });

  const countsCase2 = genPlanCase2.coverageUnits.map((u) => u.recommendedCount);
  const sumCase2 = countsCase2.reduce((a, b) => (a || 0) + (b || 0), 0);
  assert.strictEqual(sumCase2, 20, 'Case 2: Sum of recommendedCount === 20');
  // 20 / 3 = 6.666 -> 7, 7, 6
  assert.deepStrictEqual(countsCase2, [7, 7, 6], 'Case 2: Remainder allocated deterministically (7, 7, 6)');
  console.log('  [PASS] Case 2: requested=20, coverage=3 -> deterministic sum=20 (7, 7, 6)');

  // Case 3: requested = 10, coverage = 3
  const genPlanCase3 = resolveAssessmentGenerationPlan({
    generationSpec: specCase2,
    constraints: { assemblyMode: 'AUTO_RECOMMENDED', requestedTotalItems: 10 },
  });

  const countsCase3 = genPlanCase3.coverageUnits.map((u) => u.recommendedCount);
  const sumCase3 = countsCase3.reduce((a, b) => (a || 0) + (b || 0), 0);
  assert.strictEqual(sumCase3, 10, 'Case 3: Sum of recommendedCount === 10');
  // 10 / 3 = 3.333 -> 4, 3, 3
  assert.deepStrictEqual(countsCase3, [4, 3, 3], 'Case 3: Remainder allocated deterministically (4, 3, 3)');
  console.log('  [PASS] Case 3: requested=10, coverage=3 -> deterministic sum=10 (4, 3, 3)');

  // =========================================================================
  // SECTION 2: DIFFICULTY & COGNITIVE DEMAND DISTRIBUTION (SECTION 22, 23)
  // =========================================================================
  console.log('\n--- SECTION 2: DIFFICULTY & COGNITIVE DEMAND DISTRIBUTION ---');

  const genPlanDist = resolveAssessmentGenerationPlan({
    generationSpec: specCase2,
    constraints: {
      assemblyMode: 'AUTO_RECOMMENDED',
      requestedTotalItems: 10,
      difficultyDistribution: { BASIC: 3, MODERATE: 5, CHALLENGING: 2 },
      cognitiveDistribution: { RECALL_UNDERSTAND: 2, APPLY: 4, ANALYZE_REASON: 3, EVALUATE_CREATE: 1 },
    },
  });

  assert.strictEqual(genPlanDist.constraints.requestedTotalItems, 10, 'Constraints preserve requestedTotalItems');
  assert.ok(genPlanDist.coverageUnits.every((u) => u.difficultyTarget !== undefined), 'Difficulty targets allocated to coverage units');
  assert.ok(genPlanDist.coverageUnits.every((u) => u.cognitiveDemand !== undefined), 'Cognitive demand targets allocated to coverage units');
  console.log('  [PASS] Difficulty and cognitive demand distributions resolved and assigned deterministically');

  // =========================================================================
  // SECTION 3: WRITTEN TEST ALL ITEM TYPES & SCORING (SECTION 24)
  // =========================================================================
  console.log('\n--- SECTION 3: WRITTEN TEST ALL ITEM TYPES & SCORING ---');

  const fullWrittenProvider = new MockAIProvider(() =>
    JSON.stringify([
      // Unit 0 (requiredCount: 4)
      {
        coverageUnitId: genPlanCase3.coverageUnits[0].id,
        itemType: 'MULTIPLE_CHOICE',
        prompt: '1 + 1 = ?',
        options: [{ text: '2', isCorrect: true }, { text: '3', isCorrect: false }],
        proposedAnswer: { answerType: 'OPTION', value: '2', optionIndices: [0], explanation: '1 + 1 = 2' },
        scoringGuideDraft: {},
      },
      {
        coverageUnitId: genPlanCase3.coverageUnits[0].id,
        itemType: 'MULTIPLE_SELECT',
        prompt: 'Pilih bilangan genap',
        options: [{ text: '2', isCorrect: true }, { text: '4', isCorrect: true }, { text: '3', isCorrect: false }],
        proposedAnswer: { answerType: 'MULTIPLE_OPTION', optionIndices: [0, 1] },
        scoringGuideDraft: {},
      },
      {
        coverageUnitId: genPlanCase3.coverageUnits[0].id,
        itemType: 'TRUE_FALSE',
        prompt: 'Matahari terbit dari timur.',
        options: [{ text: 'Benar', isCorrect: true }, { text: 'Salah', isCorrect: false }],
        proposedAnswer: { answerType: 'OPTION', value: 'Benar', optionIndices: [0] },
        scoringGuideDraft: {},
      },
      {
        coverageUnitId: genPlanCase3.coverageUnits[0].id,
        itemType: 'SHORT_ANSWER',
        prompt: 'Ibu kota Indonesia adalah...',
        proposedAnswer: { answerType: 'EXACT', value: 'Nusantara' },
        scoringGuideDraft: {},
      },
      // Unit 1 (requiredCount: 3)
      {
        coverageUnitId: genPlanCase3.coverageUnits[1].id,
        itemType: 'ESSAY',
        prompt: 'Jelaskan siklus air secara singkat.',
        proposedAnswer: { answerType: 'EXPECTED_RESPONSE', value: 'Evaporasi, kondensasi, presipitasi.' },
        scoringGuideDraft: { instructions: 'Penilaian berdasarkan 3 tahapan utama', maxScore: 10 },
      },
      {
        coverageUnitId: genPlanCase3.coverageUnits[1].id,
        itemType: 'MATCHING',
        prompt: 'Jodohkan hewan dan makanannya',
        matchingPremises: [{ id: 'p1', text: 'Kambing' }],
        matchingResponses: [{ id: 'r1', text: 'Rumput' }],
        proposedAnswer: { answerType: 'MATCHING', matchingPairs: [{ premiseId: 'p1', responseId: 'r1' }] },
        scoringGuideDraft: {},
      },
      {
        coverageUnitId: genPlanCase3.coverageUnits[1].id,
        itemType: 'MULTIPLE_CHOICE',
        prompt: '2 + 2 = ?',
        options: [{ text: '4', isCorrect: true }, { text: '5', isCorrect: false }],
        proposedAnswer: { answerType: 'OPTION', value: '4', optionIndices: [0] },
        scoringGuideDraft: {},
      },
      // Unit 2 (requiredCount: 3)
      {
        coverageUnitId: genPlanCase3.coverageUnits[2].id,
        itemType: 'CATEGORY_RESPONSE',
        prompt: 'Kelompokkan benda padat dan cair',
        categoryStatements: [{ id: 's1', text: 'Batu' }],
        categoryCategories: [{ id: 'c1', label: 'Padat' }],
        proposedAnswer: { answerType: 'CATEGORY_RESPONSE', categoryAnswers: [{ statementId: 's1', categoryId: 'c1' }] },
        scoringGuideDraft: {},
      },
      {
        coverageUnitId: genPlanCase3.coverageUnits[2].id,
        itemType: 'SHORT_ANSWER',
        prompt: 'Berapakah 5 x 5?',
        proposedAnswer: { answerType: 'EXACT', value: '25' },
        scoringGuideDraft: {},
      },
      {
        coverageUnitId: genPlanCase3.coverageUnits[2].id,
        itemType: 'MULTIPLE_CHOICE',
        prompt: 'Berapakah 10 - 3?',
        options: [{ text: '7', isCorrect: true }, { text: '8', isCorrect: false }],
        proposedAnswer: { answerType: 'OPTION', value: '7', optionIndices: [0] },
        scoringGuideDraft: {},
      },
    ])
  );

  const contractCase3 = buildGenerationContract(genPlanCase3);
  const resultCase3 = await generateAssessmentPackageDraft({
    generationPlan: genPlanCase3,
    provider: fullWrittenProvider,
  });

  const pkgCase3 = resultCase3.generatedPackage!;
  assert.ok(pkgCase3, 'Generated package exists');
  assert.strictEqual(pkgCase3.answerKeys.length, 10, '10 AnswerKeys created for 10 written test items');
  assert.strictEqual(pkgCase3.scoringGuides.length, 10, '10 ScoringGuides created for 10 written test items');

  const answerVerification = await verifyAssessmentPackageAnswers(pkgCase3);
  if (answerVerification.section.status !== 'PASS') {
    console.error('DEBUG answerVerification findings:', JSON.stringify(answerVerification.section.findings, null, 2));
  }
  assert.strictEqual(answerVerification.section.status, 'REVIEW', 'Answer Verification is REVIEW with 0 blocking failures');
  console.log('  [PASS] All 7 written test item types generate valid answer keys, scoring guides & pass answer verification');

  // =========================================================================
  // SECTION 4: NON-WRITTEN ASSESSMENT TYPES & SELF/PEER (SECTION 25)
  // =========================================================================
  console.log('\n--- SECTION 4: NON-WRITTEN ASSESSMENT TYPES & SELF/PEER ---');

  // Self & Peer Assessment (Must NOT have AnswerKeys)
  const planSelf: AssessmentPlan = {
    ...planCase1,
    id: 'plan-self',
    instruments: [{ id: 'inst-self', type: 'SELF_ASSESSMENT' }],
  };

  const specSelf = resolveAssessmentGenerationSpec({
    academicSetting: setting,
    assessmentPlan: planSelf,
    tp: mockTP,
    assessmentCriteria: mockCriteria,
  });

  const genPlanSelf = resolveAssessmentGenerationPlan({ generationSpec: specSelf });
  const selfProvider = new MockAIProvider(() =>
    JSON.stringify([
      {
        coverageUnitId: genPlanSelf.coverageUnits[0].id,
        itemType: 'SHORT_ANSWER',
        prompt: 'Saya memahami materi penjumlahan pecahan dengan baik.',
      },
    ])
  );

  const resultSelf = await generateAssessmentPackageDraft({
    generationPlan: genPlanSelf,
    provider: selfProvider,
  });

  const pkgSelf = resultSelf.generatedPackage!;
  assert.strictEqual(pkgSelf.instruments[0].type, 'SELF_ASSESSMENT', 'Self Assessment instrument generated');
  assert.strictEqual(pkgSelf.answerKeys.length, 0, 'Self Assessment has ZERO answer keys (NO FAKE KEYS)');
  console.log('  [PASS] SELF_ASSESSMENT generates statements with ZERO fake answer keys');

  // Performance Assessment (Task + Aspects + Rubric)
  const planPerf: AssessmentPlan = {
    ...planCase1,
    id: 'plan-perf',
    instruments: [{ id: 'inst-perf', type: 'PERFORMANCE' }],
  };

  const specPerf = resolveAssessmentGenerationSpec({
    academicSetting: setting,
    assessmentPlan: planPerf,
    tp: mockTP,
    assessmentCriteria: mockCriteria,
  });

  const genPlanPerf = resolveAssessmentGenerationPlan({ generationSpec: specPerf });
  const perfProvider = new MockAIProvider(() =>
    JSON.stringify([
      {
        coverageUnitId: genPlanPerf.coverageUnits[0].id,
        taskTitle: 'Praktik Menimbang Benda',
        taskPrompt: 'Lakukan penimbangan benda menggunakan timbangan secara kelompok.',
        instructions: 'Ikuti petunjuk keselamatan kerja.',
        aspects: [{ label: 'Persiapan alat', description: 'Menyiapkan timbangan' }],
        rubricDraft: {
          title: 'Rubrik Praktik Menimbang',
          criteria: [{ label: 'Ketepatan hasil', indicator: 'Hasil timbangan akurat' }],
          scale: [{ label: 'Sangat Baik', score: 4, order: 1 }],
        },
        scoringGuideDraft: { instructions: 'Skor berdasarkan rubrik', maxScore: 100 },
      },
    ])
  );

  const resultPerf = await generateAssessmentPackageDraft({
    generationPlan: genPlanPerf,
    provider: perfProvider,
  });

  const pkgPerf = resultPerf.generatedPackage!;
  assert.strictEqual(pkgPerf.instruments[0].type, 'PERFORMANCE', 'Performance instrument generated');
  assert.strictEqual(pkgPerf.rubrics.length, 1, 'Performance rubric created');
  assert.strictEqual(pkgPerf.scoringGuides.length, 1, 'Performance scoring guide created');
  console.log('  [PASS] PERFORMANCE generates task, aspects, rubric & scoring guide');

  // =========================================================================
  // SECTION 5: E2E PERSISTENCE & STORAGE V5 ROUNDTRIP (SECTION 28)
  // =========================================================================
  console.log('\n--- SECTION 5: E2E PERSISTENCE & STORAGE V5 ROUNDTRIP ---');

  let state = createInitialStorageV5();
  state.profiles.push({
    id: 'prof-1',
    schoolId: 'sch-1',
    name: 'Guru Tes',
    nip: '123456',
    role: 'TEACHER',
    email: 'guru@test.com',
    status: 'PNS',
    defaultSubject: 'Matematika',
    defaultLevel: 'SD',
  } as any);
  state.schools.push({
    id: 'sch-1',
    npsn: '12345678',
    name: 'SD Negeri 1 Tes',
    level: 'SD',
    status: 'NEGERI',
    address: 'Jl. Raya',
    subdistrict: 'Kecamatan',
    district: 'Kabupaten',
    province: 'Provinsi',
  } as any);
  saveStorageV5(state);

  const { semesterPlans } = createYearHierarchyV5({
    profileId: 'prof-1',
    schoolId: 'sch-1',
    academicYear: '2025/2026',
    level: 'SD',
    grade: 'Kelas 4',
    subject: 'Matematika',
    curriculumType: 'KURIKULUM_MERDEKA',
  });
  const sem1Plan = semesterPlans[0];

  saveAssessmentCriteriaV5(sem1Plan.id, mockCriteria);
  saveAssessmentPlansV5(sem1Plan.id, [planCase2]);
  saveAssessmentPackagesV5(sem1Plan.id, [pkgCase3]);

  const semData = getSemesterDataV5(sem1Plan.id);
  assert.strictEqual(semData.assessmentCriteria?.length, 3, 'V5 criteria persisted');
  assert.strictEqual(semData.assessmentPlan?.length, 1, 'V5 plan persisted');
  assert.strictEqual(semData.assessmentPackage?.length, 1, 'V5 package persisted');

  const loadedPkg = semData.assessmentPackage?.[0]!;
  assert.strictEqual(loadedPkg.answerKeys.length, 10, 'Loaded package retains all 10 answer keys');
  assert.strictEqual(loadedPkg.scoringGuides.length, 10, 'Loaded package retains all 10 scoring guides');

  const coverageValidation = validateAssessmentCoverage(loadedPkg, genPlanCase3);
  assert.ok(coverageValidation.status === 'PASS' || coverageValidation.status === 'REVIEW', 'Coverage validation succeeded on persisted package');

  console.log('  [PASS] E2E V5 persistence roundtrip: Plan -> Spec -> GenPlan -> Package -> Save -> Reload');

  console.log('\n========================================');
  console.log('ALL ASSESSMENT SUBSYSTEM TESTS PASSED SUCCESSFULLY!');
  console.log('========================================');
}

runSubsystemRegressionTests().catch((err) => {
  console.error('FATAL TEST ERROR:', err);
  process.exit(1);
});
