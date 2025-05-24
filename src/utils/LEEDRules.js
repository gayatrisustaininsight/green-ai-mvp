/**
 * LEED Credit Assessment Rule Engine
 * Comprehensive system for evaluating LEED credits with extensible rule sets
 */

class LEEDRuleEngine {
  constructor() {
    this.credits = {
      EACr6: new EACr6RuleSet(),
      IEQCr5: new IEQCr5RuleSet()
    };
    this.calculationModule = new CalculationModule();
  }

  /**
   * Assess a specific credit with provided data
   * @param {string} creditId - Credit identifier (e.g., 'EACr6', 'IEQCr5')
   * @param {Object} data - Input data for assessment
   * @param {string} units - 'IP' for Imperial or 'SI' for Metric
   * @returns {Object} Assessment result
   */
  assessCredit(creditId, data, units = 'IP') {
    if (!this.credits[creditId]) {
      throw new Error(`Credit ${creditId} not found in rule engine`);
    }

    return this.credits[creditId].assess(data, units, this.calculationModule);
  }

  /**
   * Add a new credit rule set
   * @param {string} creditId - Credit identifier
   * @param {Object} ruleSet - Rule set implementation
   */
  addCredit(creditId, ruleSet) {
    this.credits[creditId] = ruleSet;
  }

  /**
   * Get all available credits
   * @returns {Array} List of credit IDs
   */
  getAvailableCredits() {
    return Object.keys(this.credits);
  }
}

/**
 * Enhanced Refrigerant Management Credit (EACr6) Rule Set
 */
class EACr6RuleSet {
  constructor() {
    this.parameters = [
      'Refrigerant Used', 'ODP', 'GWP', 'Confirmation Statement',
      'Equipment Type', 'Refrigerant charge', 'Leakage Rate', 
      'Equipment Life', 'Equipment Cooling Capacity', 'Equipment Quantity',
      'Leakage Test Results', 'Greenchill Certification Status'
    ];
  }

  assess(data, units, calculationModule) {
    const result = {
      creditId: 'EACr6',
      creditName: 'Enhanced Refrigerant Management',
      awarded: false,
      points: 0,
      maxPoints: 1,
      gaps: [],
      nonCompliant: [],
      option: null,
      details: {}
    };

    // Determine which option to evaluate
    const hasBasicRefrigerantData = data['Refrigerant Used'] && 
                                   data['ODP'] !== undefined && 
                                   data['GWP'] !== undefined;

    if (hasBasicRefrigerantData) {
      // Try Option 1 first
      const option1Result = this.assessOption1(data);
      if (option1Result.compliant) {
        result.awarded = true;
        result.points = 1;
        result.option = 1;
        result.details = option1Result;
        return result;
      }
    }

    // Try Option 2
    const option2Result = this.assessOption2(data, units, calculationModule);
    result.option = 2;
    result.details = option2Result;
    result.gaps = option2Result.gaps;
    result.nonCompliant = option2Result.nonCompliant;

    if (option2Result.compliant && option2Result.gaps.length === 0) {
      result.awarded = true;
      result.points = 1;
    }

    return result;
  }

  assessOption1(data) {
    const result = {
      option: 1,
      compliant: false,
      gaps: [],
      requirements: {
        refrigerantUsed: false,
        odpZero: false,
        gwpLessThan50: false,
        confirmationStatement: false
      }
    };

    // Check Refrigerant Used
    if (!data['Refrigerant Used']) {
      result.gaps.push('Refrigerant Used');
    } else {
      result.requirements.refrigerantUsed = true;
    }

    // Check ODP = 0
    if (data['ODP'] === undefined || data['ODP'] === null) {
      result.gaps.push('ODP Value');
    } else if (data['ODP'] !== 0) {
      return result; // Exit for Option 2 if ODP is not 0
    } else {
      result.requirements.odpZero = true;
    }

    // Check GWP < 50
    if (data['GWP'] === undefined || data['GWP'] === null) {
      result.gaps.push('GWP Value');
    } else if (data['GWP'] >= 50) {
      return result; // Exit for Option 2 if GWP >= 50
    } else {
      result.requirements.gwpLessThan50 = true;
    }

    // Check Confirmation Statement
    if (!data['Confirmation Statement']) {
      result.gaps.push('Confirmation Statement');
    } else {
      result.requirements.confirmationStatement = true;
    }

    // All requirements met and no gaps
    if (result.gaps.length === 0 && 
        Object.values(result.requirements).every(req => req)) {
      result.compliant = true;
    }

    return result;
  }

  assessOption2(data, units, calculationModule) {
    const result = {
      option: 2,
      compliant: false,
      gaps: [],
      nonCompliant: [],
      calculations: null
    };

    const requiredParams = [
      'GWP', 'Refrigerant charge', 'Leakage Rate', 'Equipment Life',
      'Equipment Cooling Capacity', 'Equipment Quantity'
    ];

    // Check for missing parameters
    requiredParams.forEach(param => {
      if (data[param] === undefined || data[param] === null || data[param] === '') {
        result.gaps.push(param);
      }
    });

    // For commercial refrigeration systems, check additional requirements
    if (data['Equipment Type'] && 
        data['Equipment Type'].toLowerCase().includes('refrigeration')) {
      if (!data['Leakage Test Results']) {
        result.gaps.push('Leakage Test Results');
      }
      if (!data['Greenchill Certification Status']) {
        result.gaps.push('Greenchill Certification Status');
      }
    }

    // If no gaps, perform calculations
    if (result.gaps.length === 0) {
      try {
        const calculations = calculationModule.calculateRefrigerantImpact(data, units);
        result.calculations = calculations;

        const threshold = units === 'IP' ? 100 : 13;
        if (calculations.weightedAverage <= threshold) {
          result.compliant = true;
        } else {
          result.nonCompliant.push(`Weighted average (${calculations.weightedAverage.toFixed(2)}) exceeds threshold (${threshold})`);
        }
      } catch (error) {
        result.nonCompliant.push(`Calculation error: ${error.message}`);
      }
    }

    return result;
  }
}

/**
 * Thermal Comfort Credit (IEQCr5) Rule Set
 */
class IEQCr5RuleSet {
  constructor() {
    this.parameters = [
      'Compliance Path', 'PMV', 'PPD', 'Operative Temperature Range',
      'Relative Humidity Range', 'Air Speed', 'Clothing Insulation',
      'Metabolic Rate', 'Weather Data Source', 'Total Individual Spaces',
      'Controlled Spaces', 'Group Controls', 'Thermostat Locations'
    ];
  }

  assess(data, units, calculationModule) {
    const result = {
      creditId: 'IEQCr5',
      creditName: 'Thermal Comfort',
      awarded: false,
      points: 0,
      maxPoints: 1,
      gaps: [],
      nonCompliant: [],
      parts: {
        part1: null,
        part2: null
      }
    };

    // Assess Part 1
    const part1Result = this.assessPart1(data);
    result.parts.part1 = part1Result;

    // Assess Part 2
    const part2Result = this.assessPart2(data, calculationModule);
    result.parts.part2 = part2Result;

    // Combine gaps and non-compliant issues
    result.gaps = [...part1Result.gaps, ...part2Result.gaps];
    result.nonCompliant = [...part1Result.nonCompliant, ...part2Result.nonCompliant];

    // Award credit if both parts are compliant with no gaps
    if (part1Result.compliant && part2Result.compliant && 
        result.gaps.length === 0 && result.nonCompliant.length === 0) {
      result.awarded = true;
      result.points = 1;
    }

    return result;
  }

  assessPart1(data) {
    const result = {
      part: 1,
      compliant: false,
      gaps: [],
      nonCompliant: [],
      requirements: {
        compliancePath: false,
        pmvInRange: false,
        ppdCompliant: false,
        environmentalDataComplete: false
      }
    };

    // Check Compliance Path
    if (!data['Compliance Path']) {
      result.gaps.push('Compliance Path');
    } else {
      result.requirements.compliancePath = true;
    }

    // Check PMV range (-0.5 to 0.5)
    if (data['PMV'] === undefined || data['PMV'] === null) {
      result.gaps.push('PMV');
    } else {
      const pmv = parseFloat(data['PMV']);
      if (pmv >= -0.5 && pmv <= 0.5) {
        result.requirements.pmvInRange = true;
      } else {
        result.nonCompliant.push(`PMV (${pmv}) is outside acceptable range (-0.5 to 0.5)`);
      }
    }

    // Check PPD < 10%
    if (data['PPD'] === undefined || data['PPD'] === null) {
      result.gaps.push('PPD');
    } else {
      const ppd = parseFloat(data['PPD']);
      if (ppd < 10) {
        result.requirements.ppdCompliant = true;
      } else {
        result.nonCompliant.push(`PPD (${ppd}%) is not less than 10%`);
      }
    }

    // Check environmental data
    const environmentalParams = [
      'Operative Temperature Range', 'Relative Humidity Range',
      'Air Speed', 'Clothing Insulation', 'Metabolic Rate', 'Weather Data Source'
    ];

    const missingEnvData = environmentalParams.filter(param => 
      !data[param] || data[param] === '');

    if (missingEnvData.length > 0) {
      result.gaps.push(...missingEnvData);
    } else {
      result.requirements.environmentalDataComplete = true;
    }

    // Check overall compliance
    if (result.gaps.length === 0 && result.nonCompliant.length === 0 &&
        Object.values(result.requirements).every(req => req)) {
      result.compliant = true;
    }

    return result;
  }

  assessPart2(data, calculationModule) {
    const result = {
      part: 2,
      compliant: false,
      gaps: [],
      nonCompliant: [],
      calculations: null,
      requirements: {
        spacePercentageCompliant: false,
        groupControlsPresent: false,
        thermostatLocationsPresent: false
      }
    };

    // Check space data and calculate percentage
    if (!data['Total Individual Spaces'] || !data['Controlled Spaces']) {
      if (!data['Total Individual Spaces']) result.gaps.push('Total Individual Spaces');
      if (!data['Controlled Spaces']) result.gaps.push('Controlled Spaces');
    } else {
      try {
        const percentage = calculationModule.calculateSpacePercentage(
          data['Total Individual Spaces'], 
          data['Controlled Spaces']
        );
        
        result.calculations = { spacePercentage: percentage };

        if (percentage > 50) {
          result.requirements.spacePercentageCompliant = true;
        } else {
          result.nonCompliant.push(`Controlled spaces percentage (${percentage.toFixed(1)}%) is not greater than 50%`);
        }
      } catch (error) {
        result.nonCompliant.push(`Space calculation error: ${error.message}`);
      }
    }

    // Check Group Controls
    if (!data['Group Controls']) {
      result.gaps.push('Group Controls');
    } else {
      result.requirements.groupControlsPresent = true;
    }

    // Check Thermostat Locations
    if (!data['Thermostat Locations']) {
      result.gaps.push('Thermostat Locations');
    } else {
      result.requirements.thermostatLocationsPresent = true;
    }

    // Check overall compliance
    if (result.gaps.length === 0 && result.nonCompliant.length === 0 &&
        Object.values(result.requirements).every(req => req)) {
      result.compliant = true;
    }

    return result;
  }
}

/**
 * Calculation Module for complex calculations
 */
class CalculationModule {
  /**
   * Calculate refrigerant impact (LCODP and LCGWP)
   * @param {Object} data - Refrigerant data
   * @param {string} units - 'IP' or 'SI'
   * @returns {Object} Calculation results
   */
  calculateRefrigerantImpact(data, units) {
    const gwp = parseFloat(data['GWP']);
    const odp = parseFloat(data['ODP']) || 0;
    const leakageRate = parseFloat(data['Leakage Rate']) / 100; // Convert to decimal
    const life = parseFloat(data['Equipment Life']);
    const refrigerantCharge = parseFloat(data['Refrigerant charge']);
    const coolingCapacity = parseFloat(data['Equipment Cooling Capacity']);
    const quantity = parseFloat(data['Equipment Quantity']) || 1;

    // Maintenance factor (Mr) - typically 1 for end of life disposal
    const maintenanceFactor = 1;

    // Calculate LCODP and LCGWP
    const lcodp = (odp * (leakageRate * life + maintenanceFactor) * refrigerantCharge) / life;
    const lcgwp = (gwp * (leakageRate * life + maintenanceFactor) * refrigerantCharge) / life;

    // Calculate weighted impact per unit
    const unitImpact = lcgwp + (lcodp * Math.pow(10, 5));

    // Calculate total weighted impact
    const totalImpact = unitImpact * coolingCapacity * quantity;
    const totalCapacity = coolingCapacity * quantity;

    // Calculate weighted average
    const weightedAverage = totalImpact / totalCapacity;

    return {
      lcodp: lcodp,
      lcgwp: lcgwp,
      unitImpact: unitImpact,
      totalImpact: totalImpact,
      totalCapacity: totalCapacity,
      weightedAverage: weightedAverage,
      threshold: units === 'IP' ? 100 : 13,
      units: units,
      compliant: weightedAverage <= (units === 'IP' ? 100 : 13)
    };
  }

  /**
   * Calculate percentage of controlled spaces
   * @param {number} totalSpaces - Total individual spaces
   * @param {number} controlledSpaces - Thermally controlled spaces
   * @returns {number} Percentage
   */
  calculateSpacePercentage(totalSpaces, controlledSpaces) {
    const total = parseFloat(totalSpaces);
    const controlled = parseFloat(controlledSpaces);

    if (total <= 0) {
      throw new Error('Total spaces must be greater than 0');
    }

    return (controlled / total) * 100;
  }
}

/**
 * Utility functions for data validation and formatting
 */
class LEEDUtils {
  /**
   * Validate input data structure
   * @param {Object} data - Input data
   * @param {Array} requiredParams - Required parameters
   * @returns {Object} Validation result
   */
  static validateData(data, requiredParams) {
    const missing = requiredParams.filter(param => 
      data[param] === undefined || data[param] === null || data[param] === '');
    
    return {
      valid: missing.length === 0,
      missing: missing
    };
  }

  /**
   * Format assessment result for reporting
   * @param {Object} result - Assessment result
   * @returns {string} Formatted report
   */
  static formatAssessmentReport(result) {
    let report = `=== ${result.creditName} (${result.creditId}) Assessment ===\n`;
    report += `Points Awarded: ${result.points}/${result.maxPoints}\n`;
    report += `Status: ${result.awarded ? 'PASSED' : 'FAILED'}\n\n`;

    if (result.gaps.length > 0) {
      report += `Gaps (Missing Information):\n`;
      result.gaps.forEach(gap => report += `  - ${gap}\n`);
      report += '\n';
    }

    if (result.nonCompliant.length > 0) {
      report += `Non-Compliant Issues:\n`;
      result.nonCompliant.forEach(issue => report += `  - ${issue}\n`);
      report += '\n';
    }

    if (result.option) {
      report += `Assessment Option: ${result.option}\n`;
    }

    return report;
  }
}

/**
 * Multi-Document Data Consolidator for LEED Credits
 * Handles structured multi-document format with pre-extracted parameter values
 */
class LEEDDataConsolidator {
  constructor() {
    this.priorityRules = {
      // Default priority for parameter sources (higher number = higher priority)
      'manufacturer_datasheet': 10,
      'equipment_schedule': 8,
      'specification': 7,
      'calculation': 6,
      'drawing': 5,
      'narrative': 4,
      'default': 1
    };
  }

  /**
   * Consolidate multi-document LEED data for assessment
   * @param {Object} multiDocData - Multi-document data in format: {doc1: {EACr6: {Parameters: [], Values: {}}}}
   * @param {string} creditId - Target credit ID
   * @param {Object} options - Consolidation options
   * @returns {Object} Consolidated data with conflict resolution
   */
  consolidateData(multiDocData, creditId, options = {}) {
    const {
      conflictResolution = 'priority', // 'priority', 'latest', 'manual'
      customPriorities = {},
      manualResolutions = {}
    } = options;

    const consolidatedData = {};
    const dataSources = {};
    const conflicts = {};
    const processingLog = [];

    // Extract parameter values from each document
    Object.entries(multiDocData).forEach(([docName, docData]) => {
      if (!docData[creditId]) {
        processingLog.push(`Document ${docName} does not contain ${creditId} data`);
        return;
      }

      const creditData = docData[creditId];
      const parameters = creditData.Parameters || [];
      const values = creditData.Values || {};

      parameters.forEach(parameter => {
        const paramValue = values[parameter];
        
        if (paramValue !== undefined && paramValue !== null && paramValue !== '') {
          if (consolidatedData[parameter] !== undefined) {
            // Conflict detected
            if (!conflicts[parameter]) {
              conflicts[parameter] = [{
                document: dataSources[parameter],
                value: consolidatedData[parameter]
              }];
            }
            conflicts[parameter].push({
              document: docName,
              value: paramValue
            });
          } else {
            // First occurrence of this parameter
            consolidatedData[parameter] = paramValue;
            dataSources[parameter] = docName;
          }
        }
      });
    });

    // Resolve conflicts
    const resolvedData = this.resolveConflicts(
      consolidatedData, 
      conflicts, 
      conflictResolution, 
      { customPriorities, manualResolutions, dataSources }
    );

    return {
      data: resolvedData.data,
      sources: resolvedData.sources,
      conflicts: conflicts,
      resolutionLog: resolvedData.resolutionLog,
      processingInfo: {
        documentsProcessed: Object.keys(multiDocData).length,
        parametersFound: Object.keys(resolvedData.data).length,
        conflictsDetected: Object.keys(conflicts).length,
        conflictsResolved: resolvedData.resolutionLog.length
      },
      processingLog
    };
  }

  /**
   * Resolve parameter conflicts using specified strategy
   * @param {Object} data - Current consolidated data
   * @param {Object} conflicts - Detected conflicts
   * @param {string} strategy - Resolution strategy
   * @param {Object} options - Resolution options
   * @returns {Object} Resolved data
   */
  resolveConflicts(data, conflicts, strategy, options) {
    const resolvedData = { ...data };
    const resolvedSources = { ...options.dataSources };
    const resolutionLog = [];

    Object.entries(conflicts).forEach(([parameter, conflictList]) => {
      let resolvedValue;
      let resolvedSource;
      let resolutionMethod;

      switch (strategy) {
        case 'priority':
          const priorityResolution = this.resolveBypriority(conflictList, options.customPriorities);
          resolvedValue = priorityResolution.value;
          resolvedSource = priorityResolution.source;
          resolutionMethod = 'priority-based';
          break;

        case 'latest':
          const latestConflict = conflictList[conflictList.length - 1];
          resolvedValue = latestConflict.value;
          resolvedSource = latestConflict.document;
          resolutionMethod = 'latest-document';
          break;

        case 'manual':
          if (options.manualResolutions[parameter]) {
            const manualChoice = options.manualResolutions[parameter];
            const chosenConflict = conflictList.find(c => c.document === manualChoice.document);
            if (chosenConflict) {
              resolvedValue = chosenConflict.value;
              resolvedSource = chosenConflict.document;
              resolutionMethod = 'manual-selection';
            }
          }
          break;

        default:
          // Default to first occurrence
          resolvedValue = data[parameter];
          resolvedSource = options.dataSources[parameter];
          resolutionMethod = 'first-occurrence';
      }

      if (resolvedValue !== undefined) {
        resolvedData[parameter] = resolvedValue;
        resolvedSources[parameter] = resolvedSource;
        
        resolutionLog.push({
          parameter,
          conflicts: conflictList,
          resolvedValue,
          resolvedSource,
          method: resolutionMethod
        });
      }
    });

    return {
      data: resolvedData,
      sources: resolvedSources,
      resolutionLog
    };
  }

  /**
   * Resolve conflict using document priority
   * @param {Array} conflictList - List of conflicting values
   * @param {Object} customPriorities - Custom priority mappings
   * @returns {Object} Resolution result
   */
  resolveBypriority(conflictList, customPriorities = {}) {
    const priorities = { ...this.priorityRules, ...customPriorities };
    
    let bestConflict = conflictList[0];
    let bestPriority = this.getDocumentPriority(bestConflict.document, priorities);

    conflictList.forEach(conflict => {
      const priority = this.getDocumentPriority(conflict.document, priorities);
      if (priority > bestPriority) {
        bestConflict = conflict;
        bestPriority = priority;
      }
    });

    return {
      value: bestConflict.value,
      source: bestConflict.document,
      priority: bestPriority
    };
  }

  /**
   * Get document priority based on name patterns
   * @param {string} docName - Document name
   * @param {Object} priorities - Priority mappings
   * @returns {number} Priority score
   */
  getDocumentPriority(docName, priorities) {
    const lowerDocName = docName.toLowerCase();
    
    for (const [pattern, priority] of Object.entries(priorities)) {
      if (lowerDocName.includes(pattern.toLowerCase())) {
        return priority;
      }
    }
    
    return priorities.default || 1;
  }

  /**
   * Process and assess multi-document data in one step
   * @param {Object} multiDocData - Multi-document structured data
   * @param {string} creditId - Credit to assess
   * @param {LEEDRuleEngine} ruleEngine - Rule engine instance
   * @param {Object} options - Processing options
   * @returns {Object} Complete consolidation and assessment result
   */
  processAndAssess(multiDocData, creditId, ruleEngine, options = {}) {
    const {
      units = 'IP',
      conflictResolution = 'priority',
      customPriorities = {},
      manualResolutions = {},
      includeDetailedLog = false
    } = options;

    // Step 1: Consolidate data from multiple documents
    const consolidationResult = this.consolidateData(multiDocData, creditId, {
      conflictResolution,
      customPriorities,
      manualResolutions
    });

    // Step 2: Assess with rule engine
    const assessmentResult = ruleEngine.assessCredit(creditId, consolidationResult.data, units);

    // Step 3: Generate recommendations
    const recommendations = this.generateRecommendations(assessmentResult, consolidationResult);

    // Step 4: Compile final result
    const result = {
      assessment: assessmentResult,
      consolidation: {
        parametersFound: consolidationResult.processingInfo.parametersFound,
        documentsProcessed: consolidationResult.processingInfo.documentsProcessed,
        conflictsDetected: consolidationResult.processingInfo.conflictsDetected,
        conflictsResolved: consolidationResult.processingInfo.conflictsResolved,
        dataSources: consolidationResult.sources
      },
      recommendations
    };

    if (includeDetailedLog) {
      result.detailedLog = {
        conflicts: consolidationResult.conflicts,
        resolutionLog: consolidationResult.resolutionLog,
        processingLog: consolidationResult.processingLog
      };
    }

    return result;
  }

  /**
   * Generate actionable recommendations
   * @param {Object} assessmentResult - Assessment result
   * @param {Object} consolidationResult - Consolidation result
   * @returns {Array} Recommendations
   */
  generateRecommendations(assessmentResult, consolidationResult) {
    const recommendations = [];

    // Missing data recommendations
    if (assessmentResult.gaps.length > 0) {
      recommendations.push({
        type: 'missing_data',
        priority: 'high',
        message: `Required parameters missing: ${assessmentResult.gaps.join(', ')}`,
        parameters: assessmentResult.gaps,
        action: 'Provide values for missing parameters to complete assessment'
      });
    }

    // Non-compliance recommendations
    if (assessmentResult.nonCompliant.length > 0) {
      recommendations.push({
        type: 'non_compliance',
        priority: 'critical',
        message: 'Credit requirements not met',
        issues: assessmentResult.nonCompliant,
        action: 'Address compliance issues to earn credit points'
      });
    }

    // Data conflict recommendations
    if (Object.keys(consolidationResult.conflicts).length > 0) {
      recommendations.push({
        type: 'data_conflicts',
        priority: 'medium',
        message: 'Conflicting values found across documents',
        conflicts: Object.keys(consolidationResult.conflicts),
        action: 'Review and verify parameter values across all source documents'
      });
    }

    // Success recommendation
    if (assessmentResult.awarded) {
      recommendations.push({
        type: 'success',
        priority: 'info',
        message: `Credit ${assessmentResult.creditId} successfully earned`,
        points: assessmentResult.points,
        action: 'Document and maintain compliance for final LEED submission'
      });
    }

    return recommendations;
  }

  /**
   * Validate multi-document data structure
   * @param {Object} multiDocData - Multi-document data
   * @param {Array} expectedCredits - Expected credit IDs
   * @returns {Object} Validation result
   */
  validateDataStructure(multiDocData, expectedCredits = []) {
    const validation = {
      valid: true,
      errors: [],
      warnings: [],
      documentCount: 0,
      creditCoverage: {}
    };

    if (!multiDocData || typeof multiDocData !== 'object') {
      validation.valid = false;
      validation.errors.push('Invalid data structure: expected object with document keys');
      return validation;
    }

    validation.documentCount = Object.keys(multiDocData).length;

    // Validate each document
    Object.entries(multiDocData).forEach(([docName, docData]) => {
      if (!docData || typeof docData !== 'object') {
        validation.errors.push(`Document ${docName}: Invalid structure`);
        validation.valid = false;
        return;
      }

      // Check for expected credits
      expectedCredits.forEach(creditId => {
        if (docData[creditId]) {
          if (!validation.creditCoverage[creditId]) {
            validation.creditCoverage[creditId] = [];
          }
          validation.creditCoverage[creditId].push(docName);

          // Validate credit structure
          const creditData = docData[creditId];
          if (!creditData.Parameters || !Array.isArray(creditData.Parameters)) {
            validation.warnings.push(`Document ${docName}, Credit ${creditId}: Missing or invalid Parameters array`);
          }
          if (!creditData.Values || typeof creditData.Values !== 'object') {
            validation.warnings.push(`Document ${docName}, Credit ${creditId}: Missing or invalid Values object`);
          }
        }
      });
    });

    return validation;
  }
}

// Export the main classes for use
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    LEEDRuleEngine,
    EACr6RuleSet,
    IEQCr5RuleSet,
    CalculationModule,
    LEEDUtils,
    LEEDDataConsolidator
  };
}

// Example usage:
/*
const ruleEngine = new LEEDRuleEngine();
const dataConsolidator = new LEEDDataConsolidator();

// Example 1: Your structured multi-document data format
const multiDocumentData = {
  "hvac_schedule_doc": {
    "EACr6": {
      "Parameters": ["Refrigerant Used", "ODP", "GWP", "Equipment Type", "Equipment Quantity", "Equipment Cooling Capacity"],
      "Values": {
        "Refrigerant Used": "R-32",
        "Equipment Type": "VRF",
        "Equipment Quantity": 3,
        "Equipment Cooling Capacity": 150
      }
    },
    "IEQCr5": {
      "Parameters": ["Total Individual Spaces", "Controlled Spaces"],
      "Values": {
        "Total Individual Spaces": 120,
        "Controlled Spaces": 95
      }
    }
  },
  "manufacturer_datasheet": {
    "EACr6": {
      "Parameters": ["ODP", "GWP", "Refrigerant charge", "Equipment Life"],
      "Values": {
        "ODP": 0,
        "GWP": 675,
        "Refrigerant charge": 75,
        "Equipment Life": 20
      }
    }
  },
  "commissioning_report": {
    "EACr6": {
      "Parameters": ["Leakage Rate", "Confirmation Statement"],
      "Values": {
        "Leakage Rate": 8,
        "Confirmation Statement": "Yes"
      }
    },
    "IEQCr5": {
      "Parameters": ["PMV", "PPD", "Compliance Path", "Group Controls"],
      "Values": {
        "PMV": 0.3,
        "PPD": 7,
        "Compliance Path": "ASHRAE 55-2017",
        "Group Controls": "Yes"
      }
    }
  }
};

// One-step processing and assessment for EACr6
const eaCr6Result = dataConsolidator.processAndAssess(multiDocumentData, 'EACr6', ruleEngine, {
  units: 'IP',
  conflictResolution: 'priority',
  customPriorities: {
    'manufacturer_datasheet': 10,
    'commissioning_report': 8,
    'hvac_schedule': 6
  }
});

console.log('EACr6 Assessment:', eaCr6Result.assessment.awarded ? 'PASSED' : 'FAILED');
console.log('Points:', eaCr6Result.assessment.points);
console.log('Data Sources:', eaCr6Result.consolidation.dataSources);

// Assess IEQCr5
const ieqCr5Result = dataConsolidator.processAndAssess(multiDocumentData, 'IEQCr5', ruleEngine);
console.log('IEQCr5 Assessment:', ieqCr5Result.assessment.awarded ? 'PASSED' : 'FAILED');

// Example 2: Manual consolidation with custom conflict resolution
const consolidatedData = dataConsolidator.consolidateData(multiDocumentData, 'EACr6', {
  conflictResolution: 'manual',
  manualResolutions: {
    'GWP': { document: 'manufacturer_datasheet' }, // Always prefer manufacturer data for GWP
    'Equipment Quantity': { document: 'hvac_schedule_doc' } // Prefer schedule for quantities
  }
});

const manualAssessment = ruleEngine.assessCredit('EACr6', consolidatedData.data, 'IP');

// Example 3: Validate data structure before processing
const validation = dataConsolidator.validateDataStructure(multiDocumentData, ['EACr6', 'IEQCr5']);
if (validation.valid) {
  console.log(`Valid structure with ${validation.documentCount} documents`);
  console.log('Credit coverage:', validation.creditCoverage);
} else {
  console.log('Validation errors:', validation.errors);
}

// Example 4: Handle conflicts with different strategies
const strategies = ['priority', 'latest', 'manual'];
strategies.forEach(strategy => {
  const result = dataConsolidator.consolidateData(multiDocumentData, 'EACr6', {
    conflictResolution: strategy
  });
  console.log(`${strategy} strategy resolved ${result.processingInfo.conflictsResolved} conflicts`);
});

// Example 5: Generate detailed processing report
const detailedResult = dataConsolidator.processAndAssess(multiDocumentData, 'EACr6', ruleEngine, {
  includeDetailedLog: true,
  conflictResolution: 'priority'
});

console.log('Detailed Processing Log:');
console.log('Conflicts:', detailedResult.detailedLog.conflicts);
console.log('Resolution Log:', detailedResult.detailedLog.resolutionLog);
console.log('Recommendations:', detailedResult.recommendations);

// Example 6: Using the utility formatter
const formattedReport = LEEDUtils.formatAssessmentReport(eaCr6Result.assessment);
console.log(formattedReport);
*/