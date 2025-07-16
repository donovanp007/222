'use client'

import { useState, useEffect } from 'react'

// South African Medicine Interface
export interface SAMedicine {
  id: string
  name: string
  activeIngredient: string
  strength: string
  dosageForm: string
  manufacturer: string
  registrationNumber: string
  nappiCode?: string
  scheduledSubstance?: '0' | '1' | '2' | '3' | '4' | '5' | '6' | '7' | '8'
  indication: string[]
  contraindications: string[]
  interactions: string[]
  pediatricUse: boolean
  pregnancyCategory?: 'A' | 'B' | 'C' | 'D' | 'X'
  isEssentialMedicine: boolean
  price?: {
    singleExitPrice: number
    dispensingFee: number
    vatInclusive: number
  }
  availability: 'available' | 'discontinued' | 'shortage' | 'restricted'
  lastUpdated: Date
}

// Essential Medicines List Entry
export interface EssentialMedicine {
  id: string
  genericName: string
  strength: string
  dosageForm: string
  therapeuticClass: string
  level: 'primary' | 'secondary' | 'tertiary'
  indication: string
  standardTreatment: boolean
  pediatricFormulation: boolean
  alternatives: string[]
}

// Standard Treatment Guidelines
export interface STGGuideline {
  id: string
  condition: string
  icd10Code: string
  ageGroup: 'adult' | 'pediatric' | 'geriatric' | 'all'
  careLevel: 'primary' | 'secondary' | 'tertiary'
  firstLineTherapy: {
    medication: string
    dosage: string
    duration: string
    route: string
  }[]
  secondLineTherapy?: {
    medication: string
    dosage: string
    duration: string
    route: string
    indication: string
  }[]
  nonPharmacological: string[]
  referralCriteria: string[]
  followUpSchedule: string
  lastRevised: Date
}

// Clinical Guideline from CGSO
export interface CGSOGuideline {
  id: string
  title: string
  category: 'medicine' | 'surgery' | 'pathology' | 'radiology' | 'emergency'
  condition: string
  evidenceLevel: 'A' | 'B' | 'C' | 'D'
  recommendation: string
  implementation: string[]
  contraindications: string[]
  specialistConsultation: boolean
  lastUpdated: Date
}

// WHO Essential Medicine
export interface WHOEssentialMedicine {
  id: string
  name: string
  anatomicalClass: string
  therapeuticClass: string
  pharmacologicalClass: string
  chemicalSubstance: string
  dosageForm: string[]
  routeOfAdministration: string[]
  indication: string[]
  contraindications: string[]
  pregnancyCategory?: string
  breastfeedingSafety: 'safe' | 'caution' | 'avoid' | 'unknown'
  pediatricUse: boolean
  geriatricConsiderations?: string[]
  therapeuticEquivalence: string[]
  costEffectiveness: 'high' | 'medium' | 'low'
  availability: 'global' | 'regional' | 'limited'
  lastUpdated: Date
}

// Medical Database Service
export class SAMedicalDatabaseService {
  private static instance: SAMedicalDatabaseService
  private medicines: SAMedicine[] = []
  private essentialMedicines: EssentialMedicine[] = []
  private stgGuidelines: STGGuideline[] = []
  private cgsoGuidelines: CGSOGuideline[] = []
  private whoEssentialMedicines: WHOEssentialMedicine[] = []
  private isInitialized = false

  public static getInstance(): SAMedicalDatabaseService {
    if (!SAMedicalDatabaseService.instance) {
      SAMedicalDatabaseService.instance = new SAMedicalDatabaseService()
    }
    return SAMedicalDatabaseService.instance
  }

  async initialize() {
    if (this.isInitialized) return

    try {
      await Promise.all([
        this.loadSAHPRADatabase(),
        this.loadEssentialMedicines(),
        this.loadSTGGuidelines(),
        this.loadCGSOGuidelines(),
        this.loadWHOEssentialMedicines()
      ])
      this.isInitialized = true
      console.log('SA Medical Databases initialized successfully')
    } catch (error) {
      console.error('Failed to initialize SA Medical Databases:', error)
    }
  }

  // SAHPRA Medicine Registration Database
  private async loadSAHPRADatabase() {
    // Mock SAHPRA data - In production, this would fetch from actual SAHPRA API
    this.medicines = [
      {
        id: 'sahpra_001',
        name: 'Amlodipine tablets 5mg',
        activeIngredient: 'Amlodipine besylate',
        strength: '5mg',
        dosageForm: 'Tablet',
        manufacturer: 'Aspen Pharmacare',
        registrationNumber: 'A42/21.4/0123',
        nappiCode: '123456',
        scheduledSubstance: '4',
        indication: ['Hypertension', 'Angina pectoris'],
        contraindications: ['Cardiogenic shock', 'Severe aortic stenosis'],
        interactions: ['Simvastatin (high dose)', 'Grapefruit juice'],
        pediatricUse: false,
        pregnancyCategory: 'C',
        isEssentialMedicine: true,
        price: {
          singleExitPrice: 45.50,
          dispensingFee: 10.50,
          vatInclusive: 62.72
        },
        availability: 'available',
        lastUpdated: new Date('2024-06-01')
      },
      {
        id: 'sahpra_002',
        name: 'Metformin tablets 500mg',
        activeIngredient: 'Metformin hydrochloride',
        strength: '500mg',
        dosageForm: 'Tablet',
        manufacturer: 'Adcock Ingram',
        registrationNumber: 'A42/21.4/0456',
        nappiCode: '234567',
        scheduledSubstance: '4',
        indication: ['Type 2 diabetes mellitus'],
        contraindications: ['Renal impairment', 'Metabolic acidosis'],
        interactions: ['Alcohol', 'Contrast agents'],
        pediatricUse: true,
        pregnancyCategory: 'B',
        isEssentialMedicine: true,
        price: {
          singleExitPrice: 32.00,
          dispensingFee: 10.50,
          vatInclusive: 47.88
        },
        availability: 'available',
        lastUpdated: new Date('2024-06-15')
      }
    ]
  }

  // DoH Essential Medicines List
  private async loadEssentialMedicines() {
    this.essentialMedicines = [
      {
        id: 'eml_001',
        genericName: 'Paracetamol',
        strength: '500mg',
        dosageForm: 'Tablet',
        therapeuticClass: 'Analgesic/Antipyretic',
        level: 'primary',
        indication: 'Pain relief, fever reduction',
        standardTreatment: true,
        pediatricFormulation: true,
        alternatives: ['Ibuprofen', 'Aspirin']
      },
      {
        id: 'eml_002',
        genericName: 'Amoxicillin',
        strength: '500mg',
        dosageForm: 'Capsule',
        therapeuticClass: 'Antibiotic - Penicillin',
        level: 'primary',
        indication: 'Bacterial infections',
        standardTreatment: true,
        pediatricFormulation: true,
        alternatives: ['Co-amoxiclav', 'Cephalexin']
      }
    ]
  }

  // Standard Treatment Guidelines
  private async loadSTGGuidelines() {
    this.stgGuidelines = [
      {
        id: 'stg_001',
        condition: 'Hypertension',
        icd10Code: 'I10',
        ageGroup: 'adult',
        careLevel: 'primary',
        firstLineTherapy: [
          {
            medication: 'Amlodipine',
            dosage: '5mg once daily',
            duration: 'Long-term',
            route: 'Oral'
          }
        ],
        secondLineTherapy: [
          {
            medication: 'Hydrochlorothiazide',
            dosage: '25mg once daily',
            duration: 'Long-term',
            route: 'Oral',
            indication: 'If ACE inhibitor not tolerated'
          }
        ],
        nonPharmacological: [
          'Dietary sodium restriction',
          'Regular exercise',
          'Weight management',
          'Smoking cessation'
        ],
        referralCriteria: [
          'Resistant hypertension',
          'Secondary hypertension suspected',
          'Target organ damage'
        ],
        followUpSchedule: 'Monthly until controlled, then 3-monthly',
        lastRevised: new Date('2024-01-15')
      }
    ]
  }

  // CGSO Clinical Guidelines
  private async loadCGSOGuidelines() {
    this.cgsoGuidelines = [
      {
        id: 'cgso_001',
        title: 'Management of Acute Coronary Syndrome',
        category: 'medicine',
        condition: 'Acute myocardial infarction',
        evidenceLevel: 'A',
        recommendation: 'Immediate dual antiplatelet therapy with aspirin and clopidogrel',
        implementation: [
          'Aspirin 300mg stat, then 75mg daily',
          'Clopidogrel 600mg loading dose, then 75mg daily',
          'Monitor for bleeding complications'
        ],
        contraindications: [
          'Active bleeding',
          'Recent stroke',
          'Severe liver disease'
        ],
        specialistConsultation: true,
        lastUpdated: new Date('2024-03-20')
      }
    ]
  }

  // WHO Essential Medicines Database
  private async loadWHOEssentialMedicines() {
    this.whoEssentialMedicines = [
      {
        id: 'who_001',
        name: 'Paracetamol',
        anatomicalClass: 'N02B - Other analgesics and antipyretics',
        therapeuticClass: 'Analgesic, antipyretic',
        pharmacologicalClass: 'Non-opioid analgesic',
        chemicalSubstance: 'N-acetyl-p-aminophenol',
        dosageForm: ['tablet', 'oral solution', 'suppository'],
        routeOfAdministration: ['oral', 'rectal'],
        indication: [
          'Pain relief (mild to moderate)',
          'Fever reduction',
          'Headache',
          'Musculoskeletal pain'
        ],
        contraindications: [
          'Severe hepatic impairment',
          'Hypersensitivity to paracetamol'
        ],
        pregnancyCategory: 'A',
        breastfeedingSafety: 'safe',
        pediatricUse: true,
        geriatricConsiderations: [
          'Adjust dose in hepatic impairment',
          'Monitor liver function'
        ],
        therapeuticEquivalence: ['Acetaminophen'],
        costEffectiveness: 'high',
        availability: 'global',
        lastUpdated: new Date('2024-01-01')
      },
      {
        id: 'who_002',
        name: 'Amoxicillin',
        anatomicalClass: 'J01C - Beta-lactam antibacterials, penicillins',
        therapeuticClass: 'Antibiotic',
        pharmacologicalClass: 'Beta-lactam antibiotic',
        chemicalSubstance: 'Amoxicillin trihydrate',
        dosageForm: ['capsule', 'tablet', 'oral suspension', 'injection'],
        routeOfAdministration: ['oral', 'intravenous', 'intramuscular'],
        indication: [
          'Bacterial infections (respiratory tract)',
          'Urinary tract infections',
          'Skin and soft tissue infections',
          'Otitis media'
        ],
        contraindications: [
          'Penicillin allergy',
          'Infectious mononucleosis'
        ],
        pregnancyCategory: 'B',
        breastfeedingSafety: 'safe',
        pediatricUse: true,
        geriatricConsiderations: [
          'Adjust dose in renal impairment'
        ],
        therapeuticEquivalence: ['Ampicillin (similar spectrum)'],
        costEffectiveness: 'high',
        availability: 'global',
        lastUpdated: new Date('2024-01-01')
      }
    ]
  }

  // Search Methods
  searchMedicines(query: string): SAMedicine[] {
    const searchTerm = query.toLowerCase()
    return this.medicines.filter(med => 
      med.name.toLowerCase().includes(searchTerm) ||
      med.activeIngredient.toLowerCase().includes(searchTerm) ||
      med.nappiCode?.includes(searchTerm)
    )
  }

  searchEssentialMedicines(query: string): EssentialMedicine[] {
    const searchTerm = query.toLowerCase()
    return this.essentialMedicines.filter(med =>
      med.genericName.toLowerCase().includes(searchTerm) ||
      med.therapeuticClass.toLowerCase().includes(searchTerm)
    )
  }

  searchSTGGuidelines(condition: string): STGGuideline[] {
    const searchTerm = condition.toLowerCase()
    return this.stgGuidelines.filter(guideline =>
      guideline.condition.toLowerCase().includes(searchTerm) ||
      guideline.icd10Code.toLowerCase().includes(searchTerm)
    )
  }

  searchCGSOGuidelines(query: string): CGSOGuideline[] {
    const searchTerm = query.toLowerCase()
    return this.cgsoGuidelines.filter(guideline =>
      guideline.title.toLowerCase().includes(searchTerm) ||
      guideline.condition.toLowerCase().includes(searchTerm)
    )
  }

  searchWHOEssentialMedicines(query: string): WHOEssentialMedicine[] {
    const searchTerm = query.toLowerCase()
    return this.whoEssentialMedicines.filter(med =>
      med.name.toLowerCase().includes(searchTerm) ||
      med.therapeuticClass.toLowerCase().includes(searchTerm) ||
      med.indication.some(ind => ind.toLowerCase().includes(searchTerm))
    )
  }

  // Get medicine by NAPPI code
  getMedicineByNappi(nappiCode: string): SAMedicine | undefined {
    return this.medicines.find(med => med.nappiCode === nappiCode)
  }

  // Get treatment guidelines for condition
  getTreatmentGuidelines(condition: string): {
    stg: STGGuideline[]
    cgso: CGSOGuideline[]
    essentialMeds: EssentialMedicine[]
    whoMeds: WHOEssentialMedicine[]
  } {
    return {
      stg: this.searchSTGGuidelines(condition),
      cgso: this.searchCGSOGuidelines(condition),
      essentialMeds: this.searchEssentialMedicines(condition),
      whoMeds: this.searchWHOEssentialMedicines(condition)
    }
  }

  // Check drug interactions using SA database
  checkDrugInteractions(medicineIds: string[]): {
    interactions: Array<{
      medicine1: string
      medicine2: string
      severity: 'mild' | 'moderate' | 'severe'
      description: string
      recommendation: string
    }>
    warnings: string[]
  } {
    // Mock implementation - in production would use comprehensive interaction database
    const interactions: any[] = []
    const warnings: string[] = []

    // Example interaction check
    const meds = medicineIds.map(id => this.medicines.find(m => m.id === id)).filter(Boolean)
    
    // Check for known dangerous combinations
    const hasAmlodipine = meds.some(m => m?.activeIngredient.includes('Amlodipine'))
    const hasSimvastatin = meds.some(m => m?.activeIngredient.includes('Simvastatin'))
    
    if (hasAmlodipine && hasSimvastatin) {
      interactions.push({
        medicine1: 'Amlodipine',
        medicine2: 'Simvastatin',
        severity: 'moderate',
        description: 'Amlodipine may increase simvastatin levels',
        recommendation: 'Monitor for muscle pain, consider dose reduction'
      })
    }

    return { interactions, warnings }
  }

  // Get pricing information
  getMedicinePricing(medicineId: string): SAMedicine['price'] | null {
    const medicine = this.medicines.find(m => m.id === medicineId)
    return medicine?.price || null
  }

  // Check if medicine is on Essential Medicines List
  isEssentialMedicine(medicineId: string): boolean {
    const medicine = this.medicines.find(m => m.id === medicineId)
    return medicine?.isEssentialMedicine || false
  }
}

// React Hook for SA Medical Databases
export function useSAMedicalDatabases() {
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [dbService] = useState(() => SAMedicalDatabaseService.getInstance())

  useEffect(() => {
    const initializeDatabase = async () => {
      try {
        setIsLoading(true)
        await dbService.initialize()
        setError(null)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load databases')
      } finally {
        setIsLoading(false)
      }
    }

    initializeDatabase()
  }, [dbService])

  return {
    dbService,
    isLoading,
    error,
    searchMedicines: (query: string) => dbService.searchMedicines(query),
    searchEssentialMedicines: (query: string) => dbService.searchEssentialMedicines(query),
    searchWHOEssentialMedicines: (query: string) => dbService.searchWHOEssentialMedicines(query),
    getTreatmentGuidelines: (condition: string) => dbService.getTreatmentGuidelines(condition),
    checkDrugInteractions: (medicineIds: string[]) => dbService.checkDrugInteractions(medicineIds),
    getMedicinePricing: (medicineId: string) => dbService.getMedicinePricing(medicineId),
    isEssentialMedicine: (medicineId: string) => dbService.isEssentialMedicine(medicineId)
  }
}

export default SAMedicalDatabaseService