// Type definitions for Function Health biomarker results data structure

export interface SexDetail {
  id: string;
  sex: string;
  oneLineDescription: string;
  optimalRangeLow: string;
  optimalRangeHigh: string;
  questRefRangeLow: string;
  questRefRangeHigh: string;
}

export interface BiomarkerCategory {
  id: string;
  categoryName: string;
}

export interface Biomarker {
  id: string;
  name: string;
  questBiomarkerCode: string;
  resourcesCited: any[];
  whyItMatters: string | null;
  oneLineDescription: string;
  sexDetails: SexDetail[];
  categories: BiomarkerCategory[];
  status: string | null;
}

export interface BiomarkerResult {
  id: string;
  biomarkerId: string;
  biomarkerName: string;
  dateOfService: string;
  testResult: string;
  measurementUnits: string;
  testResultOutOfRange: boolean;
  questBiomarkerId: string;
  questReferenceRange: string;
  requisitionId: string;
  visible: boolean;
}

export interface CurrentResult {
  id: string;
  dateOfService: string;
  calculatedResult: string;
  displayResult: string;
  inRange: boolean;
  requisitionId: string;
}

export interface BiomarkerResultsRecord {
  questBiomarkerId: string;
  rangeString: string;
  rangeMin: string;
  rangeMax: string;
  rangeMinDisplay: string;
  rangeMaxDisplay: string;
  improving: boolean;
  neutral: boolean;
  currentResult: CurrentResult;
  previousResult: CurrentResult | null;
  pastResults: CurrentResult[];
  outOfRangeType: string;
  units: string;
  hasCategory: boolean;
  categories: string[];
  biomarker: Biomarker;
  biomarkerResults: BiomarkerResult[];
  type: number;
  hasNewResults: boolean;
}

export interface CategoryBiomarker {
  id: string;
  name: string;
  questBiomarkerCode: string;
  status: string | null;
}

export interface CategoryData {
  category: {
    id: string;
    biomarkers: CategoryBiomarker[];
    categoryName: string;
    description: string;
  };
  biomarkerNames: string[];
  biomarkerIds: string[];
  legacyBiomarkerIds: string[];
  count: number;
  legacyCount: number;
  questBiomarkerIds: string[];
  description: string;
  improvingBiomarkerIds: string[];
  inRangeBiomarkerIds: string[];
  outOfRangeBiomarkerIds: string[];
  neutralBiomarkerIds: string[];
  otherResultBiomarkerIds: string[];
  biomarkersWithNewResults: number;
}

export interface BiomarkerData {
  biomarkerResultsRecord: BiomarkerResultsRecord[];
  categories: CategoryData[];
}

export interface FunctionHealthData {
  data: BiomarkerData;
} 
