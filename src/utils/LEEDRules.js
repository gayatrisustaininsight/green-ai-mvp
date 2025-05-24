/**
 * LEED Credit Assessment Rule Engine
 * File: utils/leedrules.js
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
 * Static test data for LEED credit assessment
 */
const getStaticTestData = () => {
  return {
    // EACr6 Test Case 1: Low-impact refrigerant (should pass Option 1)
    eaCr6_option1_pass: {
      'Refrigerant Used': 'R-1234ze(E)',
      'ODP': 0,
      'GWP': 4,
      'Confirmation Statement': 'Yes - All equipment uses low-GWP refrigerants',
      'Equipment Type': 'Heat Pump',
      'Equipment Quantity': 2,
      'Equipment Cooling Capacity': 50
    },

    // EACr6 Test Case 2: Standard refrigerant (should use Option 2)
    eaCr6_option2_pass: {
      'Refrigerant Used': 'R-32',
      'ODP': 0,
      'GWP': 675,
      'Equipment Type': 'VRF System',
      'Refrigerant charge': 45,
      'Leakage Rate': 7,
      'Equipment Life': 20,
      'Equipment Cooling Capacity': 120,
      'Equipment Quantity': 3
    },

    // EACr6 Test Case 3: High-impact refrigerant (should fail)
    eaCr6_fail: {
      'Refrigerant Used': 'R-410A',
      'ODP': 0,
      'GWP': 2088,
      'Equipment Type': 'Split System',
      'Refrigerant charge': 8,
      'Leakage Rate': 15,
      'Equipment Life': 15,
      'Equipment Cooling Capacity': 25,
      'Equipment Quantity': 10
    },

    // IEQCr5 Test Case 1: Compliant thermal comfort (should pass)
    ieqCr5_pass: {
      'Compliance Path': 'ASHRAE 55-2017',
      'PMV': 0.3,
      'PPD': 7,
      'Operative Temperature Range': '68-76°F',
      'Relative Humidity Range': '30-60%',
      'Air Speed': '0.15 m/s',
      'Clothing Insulation': '0.5 clo',
      'Metabolic Rate': '1.0 met',
      'Weather Data Source': 'TMY3',
      'Total Individual Spaces': 150,
      'Controlled Spaces': 142,
      'Group Controls': 'Yes - Multi-zone VAV system',
      'Thermostat Locations': 'Per architectural drawings'
    },

    // IEQCr5 Test Case 2: Non-compliant PMV (should fail)
    ieqCr5_fail_pmv: {
      'Compliance Path': 'ASHRAE 55-2017',
      'PMV': 0.8,
      'PPD': 18,
      'Operative Temperature Range': '65-80°F',
      'Relative Humidity Range': '20-70%',
      'Air Speed': '0.1 m/s',
      'Clothing Insulation': '0.6 clo',
      'Metabolic Rate': '1.1 met',
      'Weather Data Source': 'TMY3',
      'Total Individual Spaces': 100,
      'Controlled Spaces': 45,
      'Group Controls': 'Yes',
      'Thermostat Locations': 'Per drawings'
    },

    // IEQCr5 Test Case 3: Insufficient space control (should fail)
    ieqCr5_fail_spaces: {
      'Compliance Path': 'ASHRAE 55-2017',
      'PMV': 0.2,
      'PPD': 6,
      'Operative Temperature Range': '68-76°F',
      'Relative Humidity Range': '30-60%',
      'Air Speed': '0.15 m/s',
      'Clothing Insulation': '0.5 clo',
      'Metabolic Rate': '1.0 met',
      'Weather Data Source': 'TMY3',
      'Total Individual Spaces': 200,
      'Controlled Spaces': 85, // Only 42.5% controlled
      'Group Controls': 'Yes',
      'Thermostat Locations': 'Per drawings'
    }
  };
};

/**
 * LEED Score Controller Function
 * Main controller for processing LEED credit assessments
 */
exports.LeedScoreController = async (req, res) => {
  try {
    console.log('=== LEED Credit Assessment Controller Started ===');
    
    // Initialize LEED Rule Engine
    const ruleEngine = new LEEDRuleEngine();
    
    // Get static test data (replace with req.body in real implementation)
    const testData = getStaticTestData();
    
    const results = {
      timestamp: new Date().toISOString(),
      assessments: {},
      summary: {
        totalCreditsAssessed: 0,
        totalPointsEarned: 0,
        totalPossiblePoints: 0,
        successRate: 0,
        overallStatus: 'UNKNOWN'
      },
      testCases: []
    };

    // Test EACr6 - Enhanced Refrigerant Management
    console.log('\n--- Testing EACr6: Enhanced Refrigerant Management ---');
    
    // Test Case 1: Option 1 Pass (Low-impact refrigerant)
    console.log('\nTest Case 1: Low-impact refrigerant (R-1234ze)');
    try {
      const eaCr6_test1 = ruleEngine.assessCredit('EACr6', testData.eaCr6_option1_pass, 'IP');
      results.assessments.EACr6_Option1_Pass = eaCr6_test1;
      results.summary.totalCreditsAssessed++;
      results.summary.totalPointsEarned += eaCr6_test1.points;
      results.summary.totalPossiblePoints += eaCr6_test1.maxPoints;
      
      console.log(`Result: ${eaCr6_test1.awarded ? 'PASSED' : 'FAILED'}`);
      console.log(`Points: ${eaCr6_test1.points}/${eaCr6_test1.maxPoints}`);
      console.log(`Option: ${eaCr6_test1.option}`);
      
      results.testCases.push({
        credit: 'EACr6',
        testCase: 'Low-impact refrigerant',
        expected: 'PASS',
        actual: eaCr6_test1.awarded ? 'PASS' : 'FAIL',
        points: eaCr6_test1.points,
        option: eaCr6_test1.option
      });
      
    } catch (error) {
      console.error('EACr6 Test 1 Error:', error.message);
      results.assessments.EACr6_Option1_Pass = { error: error.message };
    }

    // Test Case 2: Option 2 Pass (Standard refrigerant with good performance)
    console.log('\nTest Case 2: Standard refrigerant (R-32) with calculations');
    try {
      const eaCr6_test2 = ruleEngine.assessCredit('EACr6', testData.eaCr6_option2_pass, 'IP');
      results.assessments.EACr6_Option2_Pass = eaCr6_test2;
      results.summary.totalCreditsAssessed++;
      results.summary.totalPointsEarned += eaCr6_test2.points;
      results.summary.totalPossiblePoints += eaCr6_test2.maxPoints;
      
      console.log(`Result: ${eaCr6_test2.awarded ? 'PASSED' : 'FAILED'}`);
      console.log(`Points: ${eaCr6_test2.points}/${eaCr6_test2.maxPoints}`);
      console.log(`Option: ${eaCr6_test2.option}`);
      
      if (eaCr6_test2.details.calculations) {
        console.log(`Weighted Average: ${eaCr6_test2.details.calculations.weightedAverage.toFixed(2)} (threshold: ${eaCr6_test2.details.calculations.threshold})`);
      }
      
      results.testCases.push({
        credit: 'EACr6',
        testCase: 'Standard refrigerant with calculations',
        expected: 'PASS',
        actual: eaCr6_test2.awarded ? 'PASS' : 'FAIL',
        points: eaCr6_test2.points,
        option: eaCr6_test2.option,
        calculation: eaCr6_test2.details.calculations?.weightedAverage
      });
      
    } catch (error) {
      console.error('EACr6 Test 2 Error:', error.message);
      results.assessments.EACr6_Option2_Pass = { error: error.message };
    }

    // Test Case 3: Fail Case (High-impact refrigerant)
    console.log('\nTest Case 3: High-impact refrigerant (R-410A)');
    try {
      const eaCr6_test3 = ruleEngine.assessCredit('EACr6', testData.eaCr6_fail, 'IP');
      results.assessments.EACr6_Fail = eaCr6_test3;
      results.summary.totalCreditsAssessed++;
      results.summary.totalPointsEarned += eaCr6_test3.points;
      results.summary.totalPossiblePoints += eaCr6_test3.maxPoints;
      
      console.log(`Result: ${eaCr6_test3.awarded ? 'PASSED' : 'FAILED'}`);
      console.log(`Points: ${eaCr6_test3.points}/${eaCr6_test3.maxPoints}`);
      console.log(`Option: ${eaCr6_test3.option}`);
      
      if (eaCr6_test3.nonCompliant.length > 0) {
        console.log(`Non-compliant: ${eaCr6_test3.nonCompliant.join(', ')}`);
      }
      
      results.testCases.push({
        credit: 'EACr6',
        testCase: 'High-impact refrigerant',
        expected: 'FAIL',
        actual: eaCr6_test3.awarded ? 'PASS' : 'FAIL',
        points: eaCr6_test3.points,
        option: eaCr6_test3.option,
        issues: eaCr6_test3.nonCompliant
      });
      
    } catch (error) {
      console.error('EACr6 Test 3 Error:', error.message);
      results.assessments.EACr6_Fail = { error: error.message };
    }

    // Test IEQCr5 - Thermal Comfort
    console.log('\n--- Testing IEQCr5: Thermal Comfort ---');
    
    // Test Case 4: Pass Case (Compliant thermal comfort)
    console.log('\nTest Case 4: Compliant thermal comfort');
    try {
      const ieqCr5_test1 = ruleEngine.assessCredit('IEQCr5', testData.ieqCr5_pass, 'IP');
      results.assessments.IEQCr5_Pass = ieqCr5_test1;
      results.summary.totalCreditsAssessed++;
      results.summary.totalPointsEarned += ieqCr5_test1.points;
      results.summary.totalPossiblePoints += ieqCr5_test1.maxPoints;
      
      console.log(`Result: ${ieqCr5_test1.awarded ? 'PASSED' : 'FAILED'}`);
      console.log(`Points: ${ieqCr5_test1.points}/${ieqCr5_test1.maxPoints}`);
      
      if (ieqCr5_test1.parts.part2.calculations) {
        console.log(`Space Control: ${ieqCr5_test1.parts.part2.calculations.spacePercentage.toFixed(1)}%`);
      }
      
      results.testCases.push({
        credit: 'IEQCr5',
        testCase: 'Compliant thermal comfort',
        expected: 'PASS',
        actual: ieqCr5_test1.awarded ? 'PASS' : 'FAIL',
        points: ieqCr5_test1.points,
        spaceControl: ieqCr5_test1.parts.part2.calculations?.spacePercentage
      });
      
    } catch (error) {
      console.error('IEQCr5 Test 1 Error:', error.message);
      results.assessments.IEQCr5_Pass = { error: error.message };
    }

    // Test Case 5: Fail Case (PMV out of range)
    console.log('\nTest Case 5: PMV out of acceptable range');
    try {
      const ieqCr5_test2 = ruleEngine.assessCredit('IEQCr5', testData.ieqCr5_fail_pmv, 'IP');
      results.assessments.IEQCr5_Fail_PMV = ieqCr5_test2;
      results.summary.totalCreditsAssessed++;
      results.summary.totalPointsEarned += ieqCr5_test2.points;
      results.summary.totalPossiblePoints += ieqCr5_test2.maxPoints;
      
      console.log(`Result: ${ieqCr5_test2.awarded ? 'PASSED' : 'FAILED'}`);
      console.log(`Points: ${ieqCr5_test2.points}/${ieqCr5_test2.maxPoints}`);
      
      if (ieqCr5_test2.nonCompliant.length > 0) {
        console.log(`Non-compliant: ${ieqCr5_test2.nonCompliant.join(', ')}`);
      }
      
      results.testCases.push({
        credit: 'IEQCr5',
        testCase: 'PMV out of range',
        expected: 'FAIL',
        actual: ieqCr5_test2.awarded ? 'PASS' : 'FAIL',
        points: ieqCr5_test2.points,
        issues: ieqCr5_test2.nonCompliant
      });
      
    } catch (error) {
      console.error('IEQCr5 Test 2 Error:', error.message);
      results.assessments.IEQCr5_Fail_PMV = { error: error.message };
    }

    // Test Case 6: Fail Case (Insufficient space control)
    console.log('\nTest Case 6: Insufficient space control percentage');
    try {
      const ieqCr5_test3 = ruleEngine.assessCredit('IEQCr5', testData.ieqCr5_fail_spaces, 'IP');
      results.assessments.IEQCr5_Fail_Spaces = ieqCr5_test3;
      results.summary.totalCreditsAssessed++;
      results.summary.totalPointsEarned += ieqCr5_test3.points;
      results.summary.totalPossiblePoints += ieqCr5_test3.maxPoints;
      
      console.log(`Result: ${ieqCr5_test3.awarded ? 'PASSED' : 'FAILED'}`);
      console.log(`Points: ${ieqCr5_test3.points}/${ieqCr5_test3.maxPoints}`);
      
      if (ieqCr5_test3.parts.part2.calculations) {
        console.log(`Space Control: ${ieqCr5_test3.parts.part2.calculations.spacePercentage.toFixed(1)}%`);
      }
      
      results.testCases.push({
        credit: 'IEQCr5',
        testCase: 'Insufficient space control',
        expected: 'FAIL',
        actual: ieqCr5_test3.awarded ? 'PASS' : 'FAIL',
        points: ieqCr5_test3.points,
        spaceControl: ieqCr5_test3.parts.part2.calculations?.spacePercentage
      });
      
    } catch (error) {
      console.error('IEQCr5 Test 3 Error:', error.message);
      results.assessments.IEQCr5_Fail_Spaces = { error: error.message };
    }

    // Calculate summary statistics
    results.summary.successRate = (results.summary.totalPointsEarned / results.summary.totalPossiblePoints * 100).toFixed(1);
    
    if (results.summary.totalPointsEarned === results.summary.totalPossiblePoints) {
      results.summary.overallStatus = 'ALL_PASSED';
    } else if (results.summary.totalPointsEarned > 0) {
      results.summary.overallStatus = 'PARTIAL_SUCCESS';
    } else {
      results.summary.overallStatus = 'ALL_FAILED';
    }

    console.log('\n=== Final Assessment Summary ===');
    console.log(`Total Points Earned: ${results.summary.totalPointsEarned}/${results.summary.totalPossiblePoints}`);
    console.log(`Success Rate: ${results.summary.successRate}%`);
    console.log(`Overall Status: ${results.summary.overallStatus}`);
    console.log(`Test Cases Processed: ${results.summary.totalCreditsAssessed}`);

    // Return results
    if (res) {
      return res.status(200).json({
        success: true,
        message: 'LEED credit assessment completed successfully',
        data: results
      });
    }
    
    return results;
    
  } catch (error) {
    console.error('LEED Assessment Controller Error:', error);
    
    if (res) {
      return res.status(500).json({
        success: false,
        error: error.message,
        message: 'LEED credit assessment failed',
        data: null
      });
    }
    
    throw error;
  }
};

// Export all classes and utilities for external use
module.exports = {
  LEEDRuleEngine,
  EACr6RuleSet,
  IEQCr5RuleSet,
  CalculationModule,
  LEEDUtils,
  LeedScoreController: exports.LeedScoreController,
  getStaticTestData
};