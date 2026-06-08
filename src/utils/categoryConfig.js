// src/utils/categoryConfig.js
// Central configuration for all trial categories.
// Single source of truth for category-specific behavior across the app.

export const CATEGORIES = {
  herbicide: {
    id: 'herbicide',
    name: 'Herbicide',
    description: 'Weed control efficacy trials — evaluate herbicide formulations against target weeds',
    icon: 'Leaf',
    color: {
      primary: 'emerald-600',
      secondary: 'emerald-700',
      light: 'emerald-50',
      badge: 'bg-emerald-100 text-emerald-700',
      gradient: 'from-emerald-600 to-emerald-700',
      ring: 'ring-emerald-400',
      accent: 'emerald',
      hex: '#059669',
      hexLight: '#d1fae5',
    },
    collections: {
      trials: 'herbicide_trials',
      projects: 'herbicide_projects',
      formulations: 'herbicide_formulations',
      ingredients: 'herbicide_ingredients',
      blocks: 'herbicide_blocks',
    },
    primaryMetric: { key: 'WCE', label: 'Weed Control Efficiency', unit: '%' },
    targetLabel: 'Weed Species',
    targetField: 'WeedSpecies',
    resultRatings: ['Excellent', 'Good', 'Fair', 'Poor'],
    applicationTimings: [
      { value: 'PRE', label: 'Pre-emergence' },
      { value: 'EPOST', label: 'Early Post-emergence' },
      { value: 'POST', label: 'Post-emergence' },
      { value: 'LPOST', label: 'Late Post-emergence' },
      { value: 'SEQ', label: 'Sequential' },
    ],
    growthStages: [
      'Seedling', 'Vegetative', 'Tillering', 'Jointing', 'Booting', 'Heading', 'Flowering', 'Grain Fill', 'Maturity'
    ],
    // Category-specific form fields (beyond shared fields)
    specificFields: [
      { key: 'WeedSpecies', label: 'Target Weed Species', type: 'text', placeholder: 'e.g. Echinochloa crus-galli' },
      { key: 'WeedGrowthStage', label: 'Weed Growth Stage', type: 'select', options: ['Seedling', 'Vegetative', 'Tillering', 'Reproductive', 'Mature'] },
      { key: 'YieldValue', label: 'Crop Yield (kg/ha)', type: 'number', placeholder: '0' },
    ],
    // Observation schema for efficacy data
    observationFields: [
      { key: 'weedCover', label: 'Weed Cover (%)', type: 'number', min: 0, max: 100 },
      { key: 'weedDetails', label: 'Weed Species Details', type: 'weedArray' },
    ],
    // Formulation-specific fields
    formulationFields: [
      { key: 'ModeOfAction', label: 'Mode of Action (HRAC Group)', type: 'text', placeholder: 'e.g. Group 1 - ACCase' },
      { key: 'TargetWeeds', label: 'Target Weeds', type: 'text', placeholder: 'Comma-separated weed species' },
    ],
    // AI analysis prompts
    aiPhotoPrompt: 'Analyze this photo of a herbicide trial plot. Identify weed species present, estimate total weed cover percentage, identify crop damage or phytotoxicity, and assess overall weed control efficacy. Be scientific and precise.',
    aiFeatures: ['Weed species identification', 'Weed cover estimation', 'Phytotoxicity assessment', 'Crop health analysis'],
    // Dashboard specific widgets
    dashboardWidgets: ['sprayAdvisor', 'weedFinder', 'resistanceTracker'],
    // Which shared features to show
    showSprayAdvisor: true,
    showResistanceTracker: true,
    efficacyCalc: 'wce', // (1 - treated/control) * 100
  },

  fungicide: {
    id: 'fungicide',
    name: 'Fungicide',
    description: 'Disease control efficacy trials — evaluate fungicide products against crop diseases',
    icon: 'Shield',
    color: {
      primary: 'indigo-600',
      secondary: 'indigo-700',
      light: 'indigo-50',
      badge: 'bg-indigo-100 text-indigo-700',
      gradient: 'from-indigo-600 to-purple-700',
      ring: 'ring-indigo-400',
      accent: 'indigo',
      hex: '#4f46e5',
      hexLight: '#e0e7ff',
    },
    collections: {
      trials: 'fungicide_trials',
      projects: 'fungicide_projects',
      formulations: 'fungicide_formulations',
      ingredients: 'fungicide_ingredients',
      blocks: 'fungicide_blocks',
    },
    primaryMetric: { key: 'DCE', label: 'Disease Control Efficiency', unit: '%' },
    targetLabel: 'Target Disease',
    targetField: 'DiseaseTarget',
    resultRatings: ['Excellent', 'Good', 'Fair', 'Poor'],
    applicationTimings: [
      { value: 'PREVENTIVE', label: 'Preventive (Before infection)' },
      { value: 'CURATIVE', label: 'Curative (After infection)' },
      { value: 'ERADICANT', label: 'Eradicant (Established disease)' },
      { value: 'SEED', label: 'Seed Treatment' },
      { value: 'SEQ', label: 'Sequential Application' },
    ],
    growthStages: [
      'Germination', 'Seedling', 'Vegetative', 'Tillering', 'Booting', 'Heading', 'Flowering', 'Grain Fill', 'Maturity'
    ],
    specificFields: [
      { key: 'DiseaseTarget', label: 'Target Disease', type: 'text', placeholder: 'e.g. Rice Blast, Powdery Mildew' },
      { key: 'PathogenName', label: 'Pathogen Species', type: 'text', placeholder: 'e.g. Magnaporthe oryzae' },
      { key: 'DiseaseSeverityScale', label: 'Severity Scale', type: 'select', options: ['0-9 Scale', '0-100%', 'Modified Cobb Scale', 'Horsfall-Barratt', 'EPPO standard', 'AUDPC'] },
      { key: 'InoculationMethod', label: 'Inoculation Method', type: 'select', options: ['Natural Infection', 'Artificial Inoculation', 'Spore Suspension Spray', 'Spore Injection'] },
      { key: 'InoculationDate', label: 'Inoculation Date', type: 'date' },
      { key: 'FungicideResistanceRisk', label: 'Fungicide Resistance Risk', type: 'select', options: ['Low Risk', 'Medium Risk', 'High Risk', 'Known Resistant Strain'] },
      { key: 'FRACGroup', label: 'FRAC Group', type: 'text', placeholder: 'e.g. Group 11 - QoI (Strobilurin)' },
      { key: 'CropStageAtApplication', label: 'Crop Stage (BBCH)', type: 'text', placeholder: 'e.g. BBCH 30-39' },
      { key: 'YieldValue', label: 'Crop Yield (kg/ha)', type: 'number', placeholder: '0' },
    ],
    observationFields: [
      { key: 'diseaseSeverity', label: 'Disease Severity (%)', type: 'number', min: 0, max: 100 },
      { key: 'diseaseIncidence', label: 'Disease Incidence (%)', type: 'number', min: 0, max: 100 },
      { key: 'greenLeafArea', label: 'Green Leaf Area (%)', type: 'number', min: 0, max: 100 },
      { key: 'plantHealthScore', label: 'Plant Health Score (1-10)', type: 'number', min: 1, max: 10 },
      { key: 'audpc', label: 'AUDPC (Disease Area Index)', type: 'number', min: 0 },
      { key: 'phytotoxicity', label: 'Crop Phytotoxicity (%)', type: 'number', min: 0, max: 100 },
      { key: 'leafLesionCount', label: 'Average Lesions per Leaf', type: 'number', min: 0 },
      { key: 'fruitInfectionPct', label: 'Fruit Infection (%)', type: 'number', min: 0, max: 100 },
      { key: 'defoliationPct', label: 'Defoliation Rate (%)', type: 'number', min: 0, max: 100 },
      
      { key: 'sporeDensity', label: 'Spore Density/Count', type: 'number', min: 0 },
      { key: 'sporulationIndex', label: 'Sporulation Index (0-5)', type: 'number', min: 0, max: 5 },
      { key: 'lesionSize', label: 'Average Lesion Size (mm)', type: 'number', min: 0 },
      { key: 'canopyDensity', label: 'Canopy Density (%)', type: 'number', min: 0, max: 100 },
      { key: 'yieldKgPlot', label: 'Total Yield (kg/plot)', type: 'number', min: 0 },
      { key: 'marketableYieldPct', label: 'Marketable Yield (%)', type: 'number', min: 0, max: 100 },
      { key: 'qualityRating', label: 'Quality Rating (0-10)', type: 'number', min: 0, max: 10 },
      { key: 'postHarvestDecay', label: 'Post-Harvest Decay/Rot (%)', type: 'number', min: 0, max: 100 },
      { key: 'senescenceDays', label: 'Post-Harvest Days to Senescence', type: 'number', min: 0 },
      { key: 'qualityNotes', label: 'Visual Quality Notes', type: 'text' },
    ],
    formulationFields: [
      { key: 'ModeOfAction', label: 'Mode of Action (FRAC Group)', type: 'text', placeholder: 'e.g. Group 3 - DMI (Triazole)' },
      { key: 'TargetDiseases', label: 'Target Diseases', type: 'text', placeholder: 'Comma-separated disease names' },
    ],
    aiPhotoPrompt: 'Analyze this photo of a fungicide trial plot. Identify any disease symptoms (lesions, spots, blight, mildew, rust), estimate disease incidence and severity, assess leaf health and green leaf area, and evaluate overall disease control efficacy. Be scientific and precise.',
    aiFeatures: ['Disease symptom identification', 'Severity estimation', 'Leaf health assessment', 'Pathogen identification hints'],
    dashboardWidgets: ['sprayAdvisor', 'diseaseFinder'],
    showSprayAdvisor: true,
    showResistanceTracker: false,
    efficacyCalc: 'dce', // (1 - treated_severity/control_severity) * 100
  },

  pesticide: {
    id: 'pesticide',
    name: 'Pesticide',
    description: 'Pest control efficacy trials — evaluate insecticide/pesticide products against crop pests',
    icon: 'Bug',
    color: {
      primary: 'red-600',
      secondary: 'red-700',
      light: 'red-50',
      badge: 'bg-red-100 text-red-700',
      gradient: 'from-red-600 to-orange-700',
      ring: 'ring-red-400',
      accent: 'red',
      hex: '#dc2626',
      hexLight: '#fee2e2',
    },
    collections: {
      trials: 'pesticide_trials',
      projects: 'pesticide_projects',
      formulations: 'pesticide_formulations',
      ingredients: 'pesticide_ingredients',
      blocks: 'pesticide_blocks',
    },
    primaryMetric: { key: 'PRE', label: 'Pest Reduction Efficiency', unit: '%' },
    targetLabel: 'Target Pest',
    targetField: 'PestTarget',
    resultRatings: ['Excellent', 'Good', 'Fair', 'Poor'],
    applicationTimings: [
      { value: 'FOLIAR', label: 'Foliar Spray' },
      { value: 'SOIL', label: 'Soil Drench' },
      { value: 'SEED', label: 'Seed Treatment' },
      { value: 'GRANULAR', label: 'Granular Application' },
      { value: 'TRUNK', label: 'Trunk Injection' },
      { value: 'BAIT', label: 'Bait Station' },
    ],
    growthStages: [
      'Germination', 'Seedling', 'Vegetative', 'Tillering', 'Reproductive', 'Flowering', 'Fruiting', 'Maturity'
    ],
    specificFields: [
      { key: 'PestTarget', label: 'Target Pest', type: 'text', placeholder: 'e.g. Brown Planthopper, Fall Armyworm' },
      { key: 'PestSpecies', label: 'Pest Species (Scientific)', type: 'text', placeholder: 'e.g. Nilaparvata lugens' },
      { key: 'PestDensityBefore', label: 'Pest Density Before (per m²)', type: 'number', placeholder: '0' },
      { key: 'PestLifeStage', label: 'Target Life Stage', type: 'select', options: ['Egg', 'Larva / Nymph', 'Pupa', 'Adult', 'Mixed Population'] },
      { key: 'IRACGroup', label: 'IRAC Group', type: 'text', placeholder: 'e.g. Group 4A - Neonicotinoid' },
      { key: 'PHI', label: 'Pre-Harvest Interval (days)', type: 'number', placeholder: '14' },
      { key: 'ApplicationMethod', label: 'Application Method', type: 'select', options: ['Foliar Spray', 'Soil Drench', 'Seed Treatment', 'Granular', 'Trunk Injection', 'Bait'] },
      { key: 'YieldValue', label: 'Crop Yield (kg/ha)', type: 'number', placeholder: '0' },
    ],
    observationFields: [
      { key: 'pestCount', label: 'Pest Count (per unit/plant)', type: 'number', min: 0 },
      { key: 'damageRating', label: 'Crop Damage Rating (0-9)', type: 'number', min: 0, max: 9 },
      { key: 'beneficialCount', label: 'Beneficial Insect Count', type: 'number', min: 0 },
      { key: 'percentMortality', label: 'Pest Mortality (%)', type: 'number', min: 0, max: 100 },
      { key: 'deadPestCount', label: 'Dead Pest Count (per unit)', type: 'number', min: 0 },
      { key: 'feedingDamagePct', label: 'Feeding Damage (%)', type: 'number', min: 0, max: 100 },
      { key: 'knockdownSpeed', label: 'Knockdown Rate (%)', type: 'number', min: 0, max: 100 },
      { key: 'parasitismRate', label: 'Parasitism Rate (%)', type: 'number', min: 0, max: 100 },
      { key: 'phytotoxicity', label: 'Crop Phytotoxicity (%)', type: 'number', min: 0, max: 100 },

      { key: 'pestDensityLeaf', label: 'Pest Density per Leaf', type: 'number', min: 0 },
      { key: 'eggCount', label: 'Egg Count (per unit)', type: 'number', min: 0 },
      { key: 'larvalCount', label: 'Larval Count (per unit)', type: 'number', min: 0 },
      { key: 'pupalCount', label: 'Pupal Count (per unit)', type: 'number', min: 0 },
      { key: 'fruitDamagePct', label: 'Fruit Damage (%)', type: 'number', min: 0, max: 100 },
      { key: 'yieldKgPlot', label: 'Total Yield (kg/plot)', type: 'number', min: 0 },
      { key: 'marketableYieldPct', label: 'Marketable Yield (%)', type: 'number', min: 0, max: 100 },
      { key: 'qualityRating', label: 'Quality Rating (0-10)', type: 'number', min: 0, max: 10 },
      { key: 'senescenceDays', label: 'Post-Harvest Days to Senescence', type: 'number', min: 0 },
      { key: 'qualityNotes', label: 'Visual Quality Notes', type: 'text' },
    ],
    formulationFields: [
      { key: 'ModeOfAction', label: 'Mode of Action (IRAC Group)', type: 'text', placeholder: 'e.g. Group 1A - Carbamate' },
      { key: 'TargetPests', label: 'Target Pests', type: 'text', placeholder: 'Comma-separated pest names' },
    ],
    aiPhotoPrompt: 'Analyze this photo of a pesticide trial plot. Identify any insects or pests visible, estimate pest density and damage level, count visible insects if possible, identify beneficial insects, and assess overall pest control efficacy. Note any crop damage from pests. Be scientific and precise.',
    aiFeatures: ['Insect identification', 'Pest count estimation', 'Damage assessment', 'Beneficial insect detection', 'Leaf damage analysis'],
    dashboardWidgets: ['sprayAdvisor', 'pestFinder'],
    showSprayAdvisor: true,
    showResistanceTracker: false,
    efficacyCalc: 'pre', // (1 - after_count/before_count) * 100
  },

  nutrition: {
    id: 'nutrition',
    name: 'Nutrition',
    description: 'Plant nutrition trials — evaluate fertilizers, micronutrients, and nutrient management strategies',
    icon: 'Beaker',
    color: {
      primary: 'amber-600',
      secondary: 'amber-700',
      light: 'amber-50',
      badge: 'bg-amber-100 text-amber-700',
      gradient: 'from-amber-600 to-yellow-700',
      ring: 'ring-amber-400',
      accent: 'amber',
      hex: '#d97706',
      hexLight: '#fef3c7',
    },
    collections: {
      trials: 'nutrition_trials',
      projects: 'nutrition_projects',
      formulations: 'nutrition_formulations',
      ingredients: 'nutrition_ingredients',
      blocks: 'nutrition_blocks',
    },
    primaryMetric: { key: 'YieldImprovement', label: 'Yield Improvement', unit: '%' },
    targetLabel: 'Nutrient Target',
    targetField: 'NutrientType',
    resultRatings: ['Excellent', 'Good', 'Fair', 'Poor'],
    applicationTimings: [
      { value: 'BASAL', label: 'Basal Application' },
      { value: 'TOPDRESS', label: 'Top Dressing' },
      { value: 'FOLIAR', label: 'Foliar Spray' },
      { value: 'FERTIGATION', label: 'Fertigation' },
      { value: 'SEED', label: 'Seed Coating' },
      { value: 'SPLIT', label: 'Split Application' },
    ],
    growthStages: [
      'Pre-planting', 'Germination', 'Seedling', 'Vegetative', 'Tillering', 'Jointing', 'Booting', 'Heading', 'Flowering', 'Grain Fill', 'Maturity'
    ],
    specificFields: [
      { key: 'NutrientType', label: 'Nutrient Type', type: 'select', options: ['Nitrogen (N)', 'Phosphorus (P)', 'Potassium (K)', 'Zinc (Zn)', 'Iron (Fe)', 'Boron (B)', 'Manganese (Mn)', 'Calcium (Ca)', 'Magnesium (Mg)', 'NPK Blend', 'Micronutrient Mix', 'Organic', 'Custom'] },
      { key: 'NutrientSource', label: 'Nutrient Source', type: 'text', placeholder: 'e.g. Urea, DAP, MOP, ZnSO4' },
      { key: 'FertilizerForm', label: 'Fertilizer Form', type: 'select', options: ['Granular', 'Liquid', 'Prilled / Pelleted', 'Chelated Powders', 'Controlled-release (CRF)', 'Organic Compost'] },
      { key: 'SoilApplicationRate', label: 'Soil Application Rate (kg/ha)', type: 'number', placeholder: '0' },
      { key: 'ApplicationMethod', label: 'Application Method', type: 'select', options: ['Basal', 'Top Dressing', 'Foliar Spray', 'Fertigation', 'Seed Coating', 'Band Placement'] },
      { key: 'ChlorophyllIndex', label: 'SPAD/Chlorophyll Reading', type: 'number', placeholder: '0' },
      { key: 'PlantHeight', label: 'Plant Height (cm)', type: 'number', placeholder: '0' },
      { key: 'TillerCount', label: 'Tiller Count (per hill)', type: 'number', placeholder: '0' },
      { key: 'YieldValue', label: 'Crop Yield (kg/ha)', type: 'number', placeholder: '0' },
    ],
    observationFields: [
      { key: 'plantHeight', label: 'Plant Height (cm)', type: 'number', min: 0 },
      { key: 'plantHeightAvg', label: 'Plant Height Average (cm)', type: 'number', min: 0 },
      { key: 'stemDiameter', label: 'Stem Diameter (mm)', type: 'number', min: 0 },
      { key: 'ndvi', label: 'NDVI Canopy Index', type: 'number', min: 0, max: 1 },
      { key: 'ndre', label: 'NDRE Canopy Index', type: 'number', min: 0, max: 1 },
      { key: 'chlorophyllIndex', label: 'SPAD Chlorophyll Reading', type: 'number', min: 0, max: 100 },
      { key: 'visualVigor', label: 'Visual Vigor Rating (0-10)', type: 'number', min: 0, max: 10 },
      
      { key: 'leafColor', label: 'Leaf Color Rating (1-9)', type: 'number', min: 1, max: 9 },
      { key: 'deficiencySign', label: 'Visual Deficiency Sign', type: 'select', options: ['None', 'N', 'P', 'K', 'Mg', 'Ca', 'S', 'Zn', 'Mn', 'Fe', 'B', 'Cu'] },
      { key: 'deficiencySeverity', label: 'Deficiency Severity (0-10)', type: 'number', min: 0, max: 10 },
      { key: 'tissueN', label: 'Tissue Nitrogen N (%)', type: 'number', min: 0, max: 20 },
      { key: 'tissueP', label: 'Tissue Phosphorus P (%)', type: 'number', min: 0, max: 10 },
      { key: 'tissueK', label: 'Tissue Potassium K (%)', type: 'number', min: 0, max: 10 },
      { key: 'tissueMg', label: 'Tissue Magnesium Mg (%)', type: 'number', min: 0, max: 10 },
      { key: 'tissueCa', label: 'Tissue Calcium Ca (%)', type: 'number', min: 0, max: 10 },
      { key: 'tissueS', label: 'Tissue Sulfur S (%)', type: 'number', min: 0, max: 10 },
      { key: 'tissueMicros', label: 'Tissue Micronutrients (ppm)', type: 'number', min: 0 },

      { key: 'fruitCount', label: 'Panicle/Fruit Count (per unit)', type: 'number', min: 0 },
      { key: 'fruitSize', label: 'Fruit Size Category', type: 'select', options: ['S', 'M', 'L'] },
      { key: 'fruitWeight', label: 'Average Fruit Weight (g)', type: 'number', min: 0 },
      { key: 'yieldKgPlot', label: 'Total Yield (kg/plot)', type: 'number', min: 0 },
      { key: 'marketableYieldPct', label: 'Marketable Yield (%)', type: 'number', min: 0, max: 100 },
      { key: 'qualityRating', label: 'Quality Rating (0-10)', type: 'number', min: 0, max: 10 },
      { key: 'senescenceDays', label: 'Post-Harvest Days to Senescence', type: 'number', min: 0 },
      { key: 'qualityNotes', label: 'Visual Quality Notes', type: 'text' },

      { key: 'pestDamage', label: 'Pest Damage Rating (0-10)', type: 'number', min: 0, max: 10 },
      { key: 'diseaseIncidence', label: 'Disease Incidence (%)', type: 'number', min: 0, max: 100 },
      { key: 'phytotoxicity', label: 'Crop Phytotoxicity (%)', type: 'number', min: 0, max: 100 },
      { key: 'lodging', label: 'Lodging/Wilting (Yes/No)', type: 'select', options: ['No', 'Yes'] },
      { key: 'blossomEndRot', label: 'Blossom End Rot (%)', type: 'number', min: 0, max: 100 },
      { key: 'cracking', label: 'Cracking (%)', type: 'number', min: 0, max: 100 },
      { key: 'colorDevelopment', label: 'Color Development (0-10)', type: 'number', min: 0, max: 10 },
      
      { key: 'tillerCount', label: 'Tiller/Branch Count', type: 'number', min: 0 },
      { key: 'biomassWeight', label: 'Dry Biomass (g/m²)', type: 'number', min: 0 },
      { key: 'leafCount', label: 'Leaf Count per Plant', type: 'number', min: 0 },
      { key: 'thousandKernelWeight', label: '1000-Grain Weight (g)', type: 'number', min: 0 },
      { key: 'rootLength', label: 'Average Root Length (cm)', type: 'number', min: 0 },
      { key: 'nue', label: 'Nutrient Use Efficiency (NUE)', type: 'number' },
    ],
    formulationFields: [
      { key: 'NutrientComposition', label: 'Nutrient Composition (N-P-K)', type: 'text', placeholder: 'e.g. 46-0-0 (Urea)' },
      { key: 'SourceType', label: 'Source Type', type: 'select', options: ['Synthetic', 'Organic', 'Bio-fertilizer', 'Slow Release', 'Liquid'] },
    ],
    aiPhotoPrompt: 'Analyze this photo of a nutrition trial plot. Assess plant vigor, leaf color (check for chlorosis, necrosis, deficiency symptoms), estimate plant height, count tillers or leaves if visible, count fruits or panicles, and evaluate overall crop health and nutrient status. Be scientific and precise.',
    aiFeatures: ['Nutrient deficiency detection', 'Leaf count', 'Fruit/panicle count', 'Chlorosis assessment', 'Plant vigor scoring', 'Growth stage identification'],
    dashboardWidgets: ['yieldTracker', 'nutrientFinder'],
    showSprayAdvisor: false,
    showResistanceTracker: false,
    efficacyCalc: 'yieldImprovement', // (treated_yield/control_yield - 1) * 100
  },

  biostimulant: {
    id: 'biostimulant',
    name: 'Biostimulant',
    description: 'Biostimulant efficacy trials — evaluate growth enhancers, seaweed extracts, and biological products',
    icon: 'Sprout',
    color: {
      primary: 'teal-600',
      secondary: 'teal-700',
      light: 'teal-50',
      badge: 'bg-teal-100 text-teal-700',
      gradient: 'from-teal-600 to-cyan-700',
      ring: 'ring-teal-400',
      accent: 'teal',
      hex: '#0d9488',
      hexLight: '#ccfbf1',
    },
    collections: {
      trials: 'biostimulant_trials',
      projects: 'biostimulant_projects',
      formulations: 'biostimulant_formulations',
      ingredients: 'biostimulant_ingredients',
      blocks: 'biostimulant_blocks',
    },
    primaryMetric: { key: 'GrowthIndex', label: 'Growth Enhancement Index', unit: '' },
    targetLabel: 'Biostimulant Type',
    targetField: 'BiostimulantType',
    resultRatings: ['Excellent', 'Good', 'Fair', 'Poor'],
    applicationTimings: [
      { value: 'FOLIAR', label: 'Foliar Spray' },
      { value: 'SEED', label: 'Seed Coating / Priming' },
      { value: 'SOIL', label: 'Soil Drench' },
      { value: 'ROOT', label: 'Root Dip' },
      { value: 'FERTIGATION', label: 'Fertigation' },
    ],
    growthStages: [
      'Pre-planting', 'Germination', 'Seedling', 'Vegetative', 'Flowering', 'Fruiting', 'Maturity'
    ],
    specificFields: [
      { key: 'BiostimulantType', label: 'Biostimulant Type', type: 'select', options: ['Seaweed Extract', 'Humic Acid', 'Fulvic Acid', 'Amino Acid', 'Microbial Inoculant', 'Mycorrhizal', 'Plant Extract', 'Protein Hydrolysate', 'Chitosan', 'Custom'] },
      { key: 'ActiveBiologicals', label: 'Active Biological Agents', type: 'text', placeholder: 'e.g. Trichoderma, Bacillus subtilis' },
      { key: 'StressType', label: 'Abiotic Stress Condition', type: 'select', options: ['None / Normal Growth', 'Drought Stress', 'Salinity Stress', 'Cold Stress', 'Heat Stress', 'Nutrient Deficiency Stress'] },
      { key: 'ApplicationMethod', label: 'Application Method', type: 'select', options: ['Foliar Spray', 'Seed Coating', 'Soil Drench', 'Root Dip', 'Fertigation'] },
      { key: 'RootBiomass', label: 'Root Biomass (g)', type: 'number', placeholder: '0' },
      { key: 'ShootBiomass', label: 'Shoot Biomass (g)', type: 'number', placeholder: '0' },
      { key: 'PlantHeight', label: 'Plant Height (cm)', type: 'number', placeholder: '0' },
      { key: 'ChlorophyllIndex', label: 'SPAD/Chlorophyll Reading', type: 'number', placeholder: '0' },
      { key: 'YieldValue', label: 'Crop Yield (kg/ha)', type: 'number', placeholder: '0' },
    ],
    observationFields: [
      { key: 'plantHeight', label: 'Plant Height (cm)', type: 'number', min: 0 },
      { key: 'plantHeightAvg', label: 'Plant Height Average (cm)', type: 'number', min: 0 },
      { key: 'stemDiameter', label: 'Stem Diameter (mm)', type: 'number', min: 0 },
      { key: 'ndvi', label: 'NDVI Canopy Index', type: 'number', min: 0, max: 1 },
      { key: 'ndre', label: 'NDRE Canopy Index', type: 'number', min: 0, max: 1 },
      { key: 'chlorophyllIndex', label: 'SPAD Chlorophyll Reading', type: 'number', min: 0, max: 100 },
      { key: 'visualVigor', label: 'Visual Vigor Rating (0-10)', type: 'number', min: 0, max: 10 },

      { key: 'rootDevelopment', label: 'Root Development Index (0-10)', type: 'number', min: 0, max: 10 },
      { key: 'lateralRoots', label: 'Lateral Root Count', type: 'number', min: 0 },
      { key: 'rootDepth', label: 'Root Depth (cm)', type: 'number', min: 0 },
      { key: 'shootVigor', label: 'Shoot Vigor Rating (0-10)', type: 'number', min: 0, max: 10 },
      { key: 'branchingIndex', label: 'Branching Index', type: 'number', min: 0 },
      { key: 'lai', label: 'Leaf Area Index (LAI)', type: 'number', min: 0 },
      { key: 'stressTolerance', label: 'Abiotic Stress Tolerance (1-10)', type: 'number', min: 1, max: 10 },
      { key: 'overallVigor', label: 'Overall Vigor Score (0-10)', type: 'number', min: 0, max: 10 },
      { key: 'germinationPct', label: 'Seed Germination Rate (%)', type: 'number', min: 0, max: 100 },
      { key: 'rootColonizationPct', label: 'Mycorrhizal Colonization (%)', type: 'number', min: 0, max: 100 },
      { key: 'photosyntheticRate', label: 'Photosynthetic Rate (μmol/m²/s)', type: 'number', min: 0 },
      { key: 'abioticStressRecovery', label: 'Abiotic Stress Recovery (1-10)', type: 'number', min: 1, max: 10 },

      { key: 'fruitCount', label: 'Fruit Count per Plant', type: 'number', min: 0 },
      { key: 'fruitSize', label: 'Fruit Size Category', type: 'select', options: ['S', 'M', 'L'] },
      { key: 'fruitWeight', label: 'Average Fruit Weight (g)', type: 'number', min: 0 },
      { key: 'yieldKgPlot', label: 'Total Yield (kg/plot)', type: 'number', min: 0 },
      { key: 'marketableYieldPct', label: 'Marketable Yield (%)', type: 'number', min: 0, max: 100 },
      { key: 'qualityRating', label: 'Quality Rating (0-10)', type: 'number', min: 0, max: 10 },
      { key: 'senescenceDays', label: 'Post-Harvest Days to Senescence', type: 'number', min: 0 },
      { key: 'qualityNotes', label: 'Visual Quality Notes', type: 'text' },

      { key: 'pestDamage', label: 'Pest Damage Rating (0-10)', type: 'number', min: 0, max: 10 },
      { key: 'diseaseIncidence', label: 'Disease Incidence (%)', type: 'number', min: 0, max: 100 },
      { key: 'phytotoxicity', label: 'Crop Phytotoxicity (%)', type: 'number', min: 0, max: 100 },
      { key: 'lodging', label: 'Lodging/Wilting (Yes/No)', type: 'select', options: ['No', 'Yes'] },
      { key: 'blossomEndRot', label: 'Blossom End Rot (%)', type: 'number', min: 0, max: 100 },
      { key: 'cracking', label: 'Cracking (%)', type: 'number', min: 0, max: 100 },
      { key: 'colorDevelopment', label: 'Color Development (0-10)', type: 'number', min: 0, max: 10 },

      { key: 'rootBiomass', label: 'Root Dry Biomass (g)', type: 'number', min: 0 },
      { key: 'shootBiomass', label: 'Shoot Dry Biomass (g)', type: 'number', min: 0 },
      { key: 'rootToShootRatio', label: 'Root to Shoot Ratio', type: 'number', min: 0 },
      { key: 'leafCount', label: 'Leaf Count per Plant', type: 'number', min: 0 },
    ],
    formulationFields: [
      { key: 'ActiveIngredients', label: 'Active Biological Agents', type: 'text', placeholder: 'e.g. Ascophyllum nodosum extract' },
      { key: 'MechanismOfAction', label: 'Mechanism of Action', type: 'text', placeholder: 'e.g. Auxin-like activity, Root growth promotion' },
    ],
    aiPhotoPrompt: 'Analyze this photo of a biostimulant trial plot. Assess plant vigor, root and shoot development, leaf color and health, count leaves and fruits if visible, evaluate growth enhancement compared to untreated, and identify any stress tolerance improvements. Be scientific and precise.',
    aiFeatures: ['Growth assessment', 'Root development analysis', 'Leaf count', 'Fruit count', 'Stress tolerance scoring', 'Plant vigor comparison'],
    dashboardWidgets: ['yieldTracker', 'growthTracker'],
    showSprayAdvisor: false,
    showResistanceTracker: false,
    efficacyCalc: 'growthIndex', // composite of height + biomass + chlorophyll
  },
};

// Helper: get category config by id
export function getCategoryConfig(categoryId) {
  return CATEGORIES[categoryId] || CATEGORIES.herbicide;
}

// Helper: get all category ids
export function getCategoryIds() {
  return Object.keys(CATEGORIES);
}

// Helper: get all category options for dropdowns
export function getCategoryOptions() {
  return Object.values(CATEGORIES).map(c => ({
    value: c.id,
    label: c.name,
    description: c.description,
    icon: c.icon,
    color: c.color,
  }));
}

// Helper: get Firebase collection name for a category
export function getCollectionName(categoryId, collectionType) {
  const cat = CATEGORIES[categoryId];
  if (!cat) return collectionType; // fallback
  return cat.collections[collectionType] || collectionType;
}

// Helper: calculate efficacy based on category
export function calculateEfficacy(categoryId, treatedValue, controlValue) {
  const cat = CATEGORIES[categoryId];
  if (!cat || !controlValue || controlValue === 0) return 0;

  switch (cat.efficacyCalc) {
    case 'wce':     // Herbicide: (1 - treated_cover/control_cover) * 100
    case 'dce':     // Fungicide: (1 - treated_severity/control_severity) * 100
    case 'pre':     // Pesticide: (1 - after_count/before_count) * 100
      return Math.max(0, (1 - treatedValue / controlValue) * 100);

    case 'yieldImprovement': // Nutrition: (treated/control - 1) * 100
      return Math.max(0, (treatedValue / controlValue - 1) * 100);

    case 'growthIndex': // Biostimulant: composite score
      return Math.max(0, (treatedValue / controlValue - 1) * 100);

    default:
      return Math.max(0, (1 - treatedValue / controlValue) * 100);
  }
}

// Helper: get the primary observation field key for a category
export function getPrimaryObservationField(categoryId) {
  const fieldMap = {
    herbicide: 'weedCover',
    fungicide: 'diseaseSeverity',
    pesticide: 'pestCount',
    nutrition: 'plantHeight',
    biostimulant: 'plantHeight',
  };
  return fieldMap[categoryId] || 'weedCover';
}

// Default access control structure for a user
export const DEFAULT_CATEGORY_ACCESS = {
  herbicide: { read: true, write: true },
  fungicide: { read: true, write: true },
  pesticide: { read: true, write: true },
  nutrition: { read: true, write: true },
  biostimulant: { read: true, write: true },
};

// Admin has full access to everything
export const ADMIN_CATEGORY_ACCESS = {
  herbicide: { read: true, write: true },
  fungicide: { read: true, write: true },
  pesticide: { read: true, write: true },
  nutrition: { read: true, write: true },
  biostimulant: { read: true, write: true },
};

// Helper: check if user has access to a category
export function hasAccess(user, categoryId, action = 'read') {
  if (!user) return false;
  return true; // Bypassing category restriction locks as requested
}
