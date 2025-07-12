import { Patient, Session, SearchCriteria, SearchResult } from "@/types";

export class AdvancedSearchEngine {
  private patients: Patient[];
  private sessions: Session[];

  constructor(patients: Patient[], sessions: Session[]) {
    this.patients = patients;
    this.sessions = sessions;
  }

  search(criteria: SearchCriteria): SearchResult[] {
    const results: SearchResult[] = [];
    const queryLower = criteria.query.toLowerCase().trim();

    if (!queryLower) return results;

    // Search patients
    if (criteria.searchIn.includes('name')) {
      this.searchPatientsByName(queryLower, results);
    }

    if (criteria.searchIn.includes('medicalAid')) {
      this.searchPatientsByMedicalAid(queryLower, results);
    }

    // Search sessions
    if (criteria.searchIn.includes('content') || criteria.searchIn.includes('diagnosis')) {
      this.searchSessions(criteria, results);
    }

    // Filter by date range
    if (criteria.dateRange) {
      this.filterByDateRange(results, criteria.dateRange);
    }

    // Filter by session type
    if (criteria.sessionType) {
      this.filterBySessionType(results, criteria.sessionType);
    }

    // Filter by doctor
    if (criteria.doctorId) {
      this.filterByDoctor(results, criteria.doctorId);
    }

    // Calculate relevance scores and sort
    return this.calculateRelevanceAndSort(results, queryLower);
  }

  private searchPatientsByName(query: string, results: SearchResult[]): void {
    this.patients.forEach(patient => {
      const fullName = `${patient.name} ${patient.surname}`.toLowerCase();
      const matchScore = this.calculateStringMatch(fullName, query);
      
      if (matchScore > 0) {
        results.push({
          patient,
          matchType: 'patient',
          relevanceScore: matchScore * 1.5, // Boost patient name matches
        });
      }
    });
  }

  private searchPatientsByMedicalAid(query: string, results: SearchResult[]): void {
    this.patients.forEach(patient => {
      if (patient.medicalAid) {
        const medicalAidText = `${patient.medicalAid.provider} ${patient.medicalAid.memberNumber}`.toLowerCase();
        const matchScore = this.calculateStringMatch(medicalAidText, query);
        
        if (matchScore > 0) {
          results.push({
            patient,
            matchType: 'patient',
            relevanceScore: matchScore,
          });
        }
      }

      // Also search ID number
      if (patient.idNumber && patient.idNumber.includes(query)) {
        results.push({
          patient,
          matchType: 'patient',
          relevanceScore: 1.0, // Exact match bonus
        });
      }
    });
  }

  private searchSessions(criteria: SearchCriteria, results: SearchResult[]): void {
    this.sessions.forEach(session => {
      let matchScore = 0;
      const patient = this.patients.find(p => p.id === session.patientId);
      
      if (!patient) return;

      // Search content
      if (criteria.searchIn.includes('content')) {
        const contentMatch = this.calculateStringMatch(session.content.toLowerCase(), criteria.query.toLowerCase());
        matchScore += contentMatch * 0.8; // Content matches are slightly less important
      }

      // Search diagnosis
      if (criteria.searchIn.includes('diagnosis') && session.diagnosis) {
        const diagnosisText = session.diagnosis.join(' ').toLowerCase();
        const diagnosisMatch = this.calculateStringMatch(diagnosisText, criteria.query.toLowerCase());
        matchScore += diagnosisMatch * 1.2; // Diagnosis matches are more important
      }

      // Search title
      const titleMatch = this.calculateStringMatch(session.title.toLowerCase(), criteria.query.toLowerCase());
      matchScore += titleMatch;

      if (matchScore > 0) {
        results.push({
          patient,
          session,
          matchType: 'session',
          relevanceScore: matchScore,
        });
      }
    });
  }

  private filterByDateRange(results: SearchResult[], dateRange: { start: Date; end: Date }): void {
    for (let i = results.length - 1; i >= 0; i--) {
      const result = results[i];
      let dateToCheck: Date;

      if (result.session) {
        dateToCheck = result.session.visitDate;
      } else {
        dateToCheck = result.patient.lastVisit || result.patient.createdAt;
      }

      if (dateToCheck < dateRange.start || dateToCheck > dateRange.end) {
        results.splice(i, 1);
      }
    }
  }

  private filterBySessionType(results: SearchResult[], sessionType: Session['sessionType']): void {
    for (let i = results.length - 1; i >= 0; i--) {
      const result = results[i];
      if (result.session && result.session.sessionType !== sessionType) {
        results.splice(i, 1);
      } else if (!result.session) {
        // For patient-only results, keep them if they have sessions of the specified type
        const patientSessions = this.sessions.filter(s => s.patientId === result.patient.id);
        const hasMatchingSessionType = patientSessions.some(s => s.sessionType === sessionType);
        if (!hasMatchingSessionType) {
          results.splice(i, 1);
        }
      }
    }
  }

  private filterByDoctor(results: SearchResult[], doctorId: string): void {
    for (let i = results.length - 1; i >= 0; i--) {
      const result = results[i];
      
      if (result.session && result.session.doctorId !== doctorId) {
        results.splice(i, 1);
      } else if (!result.session) {
        // For patient-only results, check if patient is assigned to this doctor
        const isAssigned = result.patient.assignedDoctors?.includes(doctorId);
        if (!isAssigned) {
          results.splice(i, 1);
        }
      }
    }
  }

  private calculateStringMatch(text: string, query: string): number {
    if (!text || !query) return 0;

    // Exact match
    if (text === query) return 1.0;

    // Contains match
    if (text.includes(query)) {
      return 0.8 + (query.length / text.length) * 0.2;
    }

    // Word boundary matches
    const textWords = text.split(/\s+/);
    const queryWords = query.split(/\s+/);
    let matchingWords = 0;

    queryWords.forEach(queryWord => {
      if (textWords.some(textWord => textWord.includes(queryWord))) {
        matchingWords++;
      }
    });

    if (matchingWords > 0) {
      return (matchingWords / queryWords.length) * 0.6;
    }

    // Fuzzy match (simple implementation)
    return this.calculateFuzzyMatch(text, query);
  }

  private calculateFuzzyMatch(text: string, query: string): number {
    if (query.length < 3) return 0; // Too short for fuzzy matching

    let matches = 0;
    for (let i = 0; i <= text.length - query.length; i++) {
      const substring = text.substring(i, i + query.length);
      const similarity = this.calculateLevenshteinSimilarity(substring, query);
      if (similarity > 0.7) {
        matches++;
      }
    }

    return matches > 0 ? 0.3 * (matches / (text.length - query.length + 1)) : 0;
  }

  private calculateLevenshteinSimilarity(s1: string, s2: string): number {
    const longer = s1.length > s2.length ? s1 : s2;
    const shorter = s1.length > s2.length ? s2 : s1;

    if (longer.length === 0) return 1.0;

    const distance = this.levenshteinDistance(longer, shorter);
    return (longer.length - distance) / longer.length;
  }

  private levenshteinDistance(s1: string, s2: string): number {
    const matrix = Array(s2.length + 1).fill(null).map(() => Array(s1.length + 1).fill(null));

    for (let i = 0; i <= s1.length; i++) matrix[0][i] = i;
    for (let j = 0; j <= s2.length; j++) matrix[j][0] = j;

    for (let j = 1; j <= s2.length; j++) {
      for (let i = 1; i <= s1.length; i++) {
        const indicator = s1[i - 1] === s2[j - 1] ? 0 : 1;
        matrix[j][i] = Math.min(
          matrix[j][i - 1] + 1,     // deletion
          matrix[j - 1][i] + 1,     // insertion
          matrix[j - 1][i - 1] + indicator // substitution
        );
      }
    }

    return matrix[s2.length][s1.length];
  }

  private calculateRelevanceAndSort(results: SearchResult[], query: string): SearchResult[] {
    // Remove duplicates (same patient/session combination)
    const uniqueResults = new Map<string, SearchResult>();
    
    results.forEach(result => {
      const key = result.session 
        ? `${result.patient.id}-${result.session.id}`
        : `${result.patient.id}-patient`;
      
      const existing = uniqueResults.get(key);
      if (!existing || result.relevanceScore > existing.relevanceScore) {
        uniqueResults.set(key, result);
      }
    });

    // Sort by relevance score (highest first)
    return Array.from(uniqueResults.values()).sort((a, b) => b.relevanceScore - a.relevanceScore);
  }
}

// Helper function to create search criteria
export function createSearchCriteria(
  query: string,
  options: {
    searchInName?: boolean;
    searchInContent?: boolean;
    searchInDiagnosis?: boolean;
    searchInMedicalAid?: boolean;
    dateRange?: { start: Date; end: Date };
    sessionType?: Session['sessionType'];
    doctorId?: string;
  } = {}
): SearchCriteria {
  const searchIn: SearchCriteria['searchIn'] = [];

  if (options.searchInName !== false) searchIn.push('name');
  if (options.searchInContent) searchIn.push('content');
  if (options.searchInDiagnosis) searchIn.push('diagnosis');
  if (options.searchInMedicalAid) searchIn.push('medicalAid');

  return {
    query,
    searchIn,
    dateRange: options.dateRange,
    sessionType: options.sessionType,
    doctorId: options.doctorId,
  };
}