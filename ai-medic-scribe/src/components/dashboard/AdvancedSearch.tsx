"use client";

import { useState, useEffect, useCallback } from "react";
import { Search, Filter, Calendar, User, FileText, CreditCard } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AdvancedSearchEngine, createSearchCriteria } from "@/utils/advancedSearch";
import { SearchResult, Patient, Session } from "@/types";
import { usePatients } from "@/hooks/usePatients";
import { useSessions } from "@/hooks/useSessions";

interface AdvancedSearchProps {
  onSelectResult: (patient: Patient, session?: Session) => void;
}

export function AdvancedSearch({ onSelectResult }: AdvancedSearchProps) {
  const { allPatients } = usePatients();
  const { sessions } = useSessions();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  
  // Filter states
  const [searchInName, setSearchInName] = useState(true);
  const [searchInContent, setSearchInContent] = useState(true);
  const [searchInDiagnosis, setSearchInDiagnosis] = useState(true);
  const [searchInMedicalAid, setSearchInMedicalAid] = useState(false);
  const [dateRange, setDateRange] = useState<{ start: string; end: string }>({ start: "", end: "" });
  const [selectedSessionType, setSelectedSessionType] = useState<Session['sessionType'] | "">("");

  const searchEngine = new AdvancedSearchEngine(allPatients, sessions);

  const performSearch = useCallback(() => {
    try {
      const criteria = createSearchCriteria(query, {
        searchInName,
        searchInContent,
        searchInDiagnosis,
        searchInMedicalAid,
        dateRange: dateRange.start && dateRange.end ? {
          start: new Date(dateRange.start),
          end: new Date(dateRange.end)
        } : undefined,
        sessionType: selectedSessionType || undefined,
      });

      const searchResults = searchEngine.search(criteria);
      setResults(searchResults.slice(0, 20)); // Limit to top 20 results
    } catch (error) {
      console.error("Search error:", error);
      setResults([]);
    } finally {
      setIsSearching(false);
    }
  }, [query, searchInName, searchInContent, searchInDiagnosis, searchInMedicalAid, dateRange, selectedSessionType, searchEngine]);

  useEffect(() => {
    if (query.trim().length < 2) {
      setResults([]);
      return;
    }

    setIsSearching(true);
    
    // Debounce search
    const timeout = setTimeout(() => {
      performSearch();
    }, 300);

    return () => clearTimeout(timeout);
  }, [query, searchInName, searchInContent, searchInDiagnosis, searchInMedicalAid, dateRange, selectedSessionType, performSearch]);

  const clearFilters = () => {
    setSearchInName(true);
    setSearchInContent(true);
    setSearchInDiagnosis(true);
    setSearchInMedicalAid(false);
    setDateRange({ start: "", end: "" });
    setSelectedSessionType("");
  };

  const getActiveFilterCount = () => {
    let count = 0;
    if (!searchInName) count++;
    if (!searchInContent) count++;
    if (!searchInDiagnosis) count++;
    if (searchInMedicalAid) count++;
    if (dateRange.start || dateRange.end) count++;
    if (selectedSessionType) count++;
    return count;
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat("en-ZA", {
      year: "numeric",
      month: "short",
      day: "numeric",
    }).format(date);
  };

  const highlightQuery = (text: string, query: string) => {
    if (!query.trim()) return text;
    
    const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    const parts = text.split(regex);
    
    return parts.map((part, index) =>
      regex.test(part) ? (
        <span key={index} className="bg-yellow-200 font-semibold">
          {part}
        </span>
      ) : (
        part
      )
    );
  };

  return (
    <div className="space-y-4">
      {/* Search Input */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
        <Input
          placeholder="Search patients, diagnoses, session content..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="pl-10 pr-12 bg-white border-gray-200 focus:border-blue-500 focus:ring-blue-500"
        />
        
        {/* Filter Button */}
        <Dialog open={showFilters} onOpenChange={setShowFilters}>
          <DialogTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="absolute right-2 top-1/2 transform -translate-y-1/2 h-8 w-8 p-0"
            >
              <Filter className="w-4 h-4" />
              {getActiveFilterCount() > 0 && (
                <Badge variant="destructive" className="absolute -top-1 -right-1 h-4 w-4 p-0 text-xs">
                  {getActiveFilterCount()}
                </Badge>
              )}
            </Button>
          </DialogTrigger>

          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Search Filters</DialogTitle>
            </DialogHeader>

            <div className="space-y-4">
              {/* Search In */}
              <div>
                <Label className="text-sm font-medium text-gray-700 mb-2 block">Search In</Label>
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="search-name"
                      checked={searchInName}
                      onChange={(e) => setSearchInName(e.target.checked)}
                      className="rounded border-gray-300"
                    />
                    <Label htmlFor="search-name" className="text-sm">Patient Names</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="search-content"
                      checked={searchInContent}
                      onChange={(e) => setSearchInContent(e.target.checked)}
                      className="rounded border-gray-300"
                    />
                    <Label htmlFor="search-content" className="text-sm">Session Content</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="search-diagnosis"
                      checked={searchInDiagnosis}
                      onChange={(e) => setSearchInDiagnosis(e.target.checked)}
                      className="rounded border-gray-300"
                    />
                    <Label htmlFor="search-diagnosis" className="text-sm">Diagnoses</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="search-medical-aid"
                      checked={searchInMedicalAid}
                      onChange={(e) => setSearchInMedicalAid(e.target.checked)}
                      className="rounded border-gray-300"
                    />
                    <Label htmlFor="search-medical-aid" className="text-sm">Medical Aid</Label>
                  </div>
                </div>
              </div>

              {/* Date Range */}
              <div>
                <Label className="text-sm font-medium text-gray-700 mb-2 block">Date Range</Label>
                <div className="grid grid-cols-2 gap-2">
                  <Input
                    type="date"
                    value={dateRange.start}
                    onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
                    className="text-sm"
                  />
                  <Input
                    type="date"
                    value={dateRange.end}
                    onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
                    className="text-sm"
                  />
                </div>
              </div>

              {/* Session Type */}
              <div>
                <Label className="text-sm font-medium text-gray-700 mb-2 block">Session Type</Label>
                <select
                  value={selectedSessionType}
                  onChange={(e) => setSelectedSessionType(e.target.value as Session['sessionType'] | "")}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">All Types</option>
                  <option value="consultation">Consultation</option>
                  <option value="follow-up">Follow-up</option>
                  <option value="specialist-report">Specialist Report</option>
                  <option value="ultrasound">Ultrasound</option>
                  <option value="other">Other</option>
                </select>
              </div>

              {/* Actions */}
              <div className="flex justify-between pt-4">
                <Button variant="outline" size="sm" onClick={clearFilters}>
                  Clear Filters
                </Button>
                <Button size="sm" onClick={() => setShowFilters(false)}>
                  Apply Filters
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Results */}
      {query.trim().length >= 2 && (
        <div className="space-y-2">
          {isSearching ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
              <p className="text-sm text-gray-500 mt-2">Searching...</p>
            </div>
          ) : results.length > 0 ? (
            <>
              <p className="text-sm text-gray-600 mb-4">
                Found {results.length} result{results.length !== 1 ? 's' : ''}
              </p>
              {results.map((result, index) => (
                <Card
                  key={`${result.patient.id}-${result.session?.id || 'patient'}-${index}`}
                  className="cursor-pointer hover:shadow-md transition-shadow duration-200 border-gray-200 hover:border-blue-200"
                  onClick={() => onSelectResult(result.patient, result.session)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <h3 className="font-semibold text-gray-900">
                            {highlightQuery(`${result.patient.name} ${result.patient.surname}`, query)}
                          </h3>
                          <Badge variant="secondary" className="text-xs">
                            {result.matchType === 'patient' ? 'Patient' : 'Session'}
                          </Badge>
                          <Badge variant="outline" className="text-xs">
                            {Math.round(result.relevanceScore * 100)}% match
                          </Badge>
                        </div>

                        {result.session && (
                          <div className="space-y-1">
                            <p className="text-sm font-medium text-gray-700">
                              {highlightQuery(result.session.title, query)}
                            </p>
                            <p className="text-sm text-gray-600 line-clamp-2">
                              {highlightQuery(result.session.content.substring(0, 150) + "...", query)}
                            </p>
                            <div className="flex items-center space-x-4 text-xs text-gray-500 mt-2">
                              <div className="flex items-center space-x-1">
                                <Calendar className="w-3 h-3" />
                                <span>{formatDate(result.session.visitDate)}</span>
                              </div>
                              <Badge variant="outline" className="text-xs">
                                {result.session.sessionType}
                              </Badge>
                            </div>
                          </div>
                        )}

                        {!result.session && (
                          <div className="text-sm text-gray-600">
                            <p>Age {result.patient.age}</p>
                            {result.patient.medicalAid && (
                              <p className="flex items-center space-x-1 mt-1">
                                <CreditCard className="w-3 h-3" />
                                <span>{highlightQuery(result.patient.medicalAid.provider, query)}</span>
                              </p>
                            )}
                          </div>
                        )}
                      </div>

                      <div className="flex items-center space-x-2">
                        {result.matchType === 'patient' && <User className="w-4 h-4 text-blue-500" />}
                        {result.matchType === 'session' && <FileText className="w-4 h-4 text-green-500" />}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </>
          ) : (
            <div className="text-center py-8">
              <Search className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No results found</h3>
              <p className="text-gray-500">
                Try adjusting your search terms or filters
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}