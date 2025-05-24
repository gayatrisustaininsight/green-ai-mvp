// src/rules/ruleDefinitions.js
const RULE_DEFINITIONS = {
  "EACr6": {
    "name": "Enhanced Refrigerant Management",
    "maxPoints": 1,
    "parameters": [
      "Refrigerant Used", "ODP", "GWP", "Confirmation Statement",
      "Equipment Type", "Refrigerant charge", "Leakage Rate",
      "Equipment Life", "Equipment Cooling Capacity", "Equipment Quantity",
      "Leakage Test Results", "Greenchill Certification Status"
    ],
    "prompt": "Find the values associated with each of the parameters given above. In case of presence mark the parameter as Yes for numerical values insert it corresponding to it",
    "options": ["Option 1", "Option 2"],
    "rules": {
      "option1": {
        "description": "No Refrigerants or Low-Impact Refrigerants",
        "requirements": [
          { "parameter": "Refrigerant Used", "condition": "present", "action": "proceed" },
          { "parameter": "ODP", "condition": "equals", "value": 0, "action": "proceed" },
          { "parameter": "GWP", "condition": "lessThan", "value": 50, "action": "proceed" },
          { "parameter": "Confirmation Statement", "condition": "present", "action": "proceed" }
        ]
      },
      "option2": {
        "description": "Calculation of Refrigerant Impact",
        "requirements": [
          { "parameters": ["GWP", "Refrigerant Charge", "Leakage Rate", "Equipment Life", "Equipment Cooling Capacity", "Equipment Quantity", "Leakage Test Results", "Greenchill Certification Status"], "condition": "allPresent", "action": "calculate" }
        ],
        "calculation": {
          "type": "refrigerant_impact",
          "threshold": { "IP": 100, "SI": 13 }
        }
      }
    }
  },

  "IEQCr5": {
    "name": "Indoor Environmental Quality",
    "maxPoints": 1,
    "parameters": [
      "Compliance Path", "PMV", "PPD", "Operative Temperature Range",
      "Relative Humidity Range", "Air Speed", "Clothing Insulation",
      "Metabolic Rate", "Weather Data Source", "Total Individual Spaces",
      "Controlled Spaces", "Group Controls", "Thermostat Locations"
    ],
    "prompt": "Find the values associated with each of the parameters given above. In case of presence mark the parameter as Yes for numerical values insert it corresponding to it",
    "rules": {
      "part1": {
        "description": "Thermal Comfort Requirements",
        "requirements": [
          { "parameter": "Compliance Path", "condition": "present", "action": "proceed" },
          { "parameter": "PMV", "condition": "range", "min": -0.5, "max": 0.5, "action": "proceed" },
          { "parameter": "PPD", "condition": "lessThan", "value": 10, "unit": "%", "action": "proceed" },
          { "parameters": ["Operative Temperature Range", "Relative Humidity Range", "Air Speed", "Clothing Insulation", "Metabolic Rate", "Weather Data Source"], "condition": "allPresent", "action": "proceed" }
        ]
      },
      "part2": {
        "description": "Individual Thermal Controls",
        "requirements": [
          { "parameters": ["Total Individual Spaces", "Controlled Spaces"], "condition": "calculate", "calculation": "thermal_control_percentage" },
          { "parameters": ["Group Controls", "Thermostat Locations"], "condition": "markup", "action": "proceed" }
        ]
      }
    }
  },

  // Additional LEED Credits
  "WECr1": {
    "name": "Water Efficiency - Outdoor Water Use Reduction",
    "maxPoints": 2,
    "parameters": [
      "Baseline Water Use", "Design Water Use", "Reduction Percentage",
      "Irrigation System Type", "Plant Selection", "Weather Data"
    ],
    "rules": {
      "calculation": {
        "type": "water_reduction_percentage",
        "thresholds": {
          "1_point": 30,
          "2_points": 50
        }
      }
    }
  },

  "EACr1": {
    "name": "Energy Performance - Optimize Energy Performance",
    "maxPoints": 18,
    "parameters": [
      "Baseline Energy Use", "Design Energy Use", "Energy Model",
      "HVAC Systems", "Lighting Systems", "Building Envelope"
    ],
    "rules": {
      "calculation": {
        "type": "energy_performance_improvement",
        "thresholds": {
          "new_buildings": {
            "6%": 1, "8%": 2, "10%": 3, "12%": 4, "14%": 5,
            "16%": 6, "18%": 7, "20%": 8, "22%": 9, "24%": 10,
            "26%": 11, "28%": 12, "30%": 13, "32%": 14, "34%": 15,
            "36%": 16, "38%": 17, "40%": 18
          },
          "existing_buildings": {
            "3%": 1, "6%": 2, "9%": 3, "12%": 4, "15%": 5,
            "18%": 6, "21%": 7, "24%": 8, "27%": 9, "30%": 10,
            "33%": 11, "36%": 12, "39%": 13, "42%": 14, "45%": 15,
            "48%": 16, "51%": 17, "54%": 18
          }
        }
      }
    }
  },

  "SSCr1": {
    "name": "Sustainable Sites - Site Assessment",
    "maxPoints": 1,
    "parameters": [
      "Site Survey", "Environmental Features", "Previous Use",
      "Surrounding Development", "Transportation Options"
    ],
    "rules": {
      "requirements": [
        { "parameter": "Site Survey", "condition": "present", "action": "proceed" },
        { "parameters": ["Environmental Features", "Previous Use", "Surrounding Development", "Transportation Options"], "condition": "documented", "action": "proceed" }
      ]
    }
  },

  "MRCr1": {
    "name": "Materials and Resources - Building Life-Cycle Impact Reduction",
    "maxPoints": 5,
    "parameters": [
      "Building Reuse Percentage", "Structural Elements", "Enclosure Materials",
      "Life Cycle Assessment", "Material Selection"
    ],
    "rules": {
      "options": {
        "option1": {
          "description": "Historic Building Reuse",
          "requirement": { "parameter": "Building Reuse Percentage", "condition": "greaterThan", "value": 50 },
          "points": 2
        },
        "option2": {
          "description": "Renovation of Existing Building",
          "requirements": [
            { "parameter": "Structural Elements", "condition": "reuse", "percentage": 50, "points": 2 },
            { "parameter": "Enclosure Materials", "condition": "reuse", "percentage": 50, "points": 1 }
          ]
        },
        "option3": {
          "description": "Whole Building Life-Cycle Assessment",
          "requirement": { "parameter": "Life Cycle Assessment", "condition": "improvement", "value": 10 },
          "points": 3
        }
      }
    }
  },

  "IEQCr1": {
    "name": "Indoor Environmental Quality - Enhanced Indoor Air Quality Strategies",
    "maxPoints": 2,
    "parameters": [
      "Outdoor Air Delivery Monitoring", "Increased Ventilation",
      "Air Filtration", "IAQ Management Plan"
    ],
    "rules": {
      "option1": {
        "description": "Enhanced IAQ Strategies",
        "requirements": [
          { "parameter": "Outdoor Air Delivery Monitoring", "condition": "present", "points": 1 },
          { "parameter": "Increased Ventilation", "condition": "30_percent_above_standard", "points": 1 }
        ]
      },
      "option2": {
        "description": "Enhanced Air Filtration",
        "requirement": { "parameter": "Air Filtration", "condition": "MERV_13_or_higher", "points": 1 }
      }
    }
  }
};

// src/rules/ruleEngine.js
class RuleEngine {
  constructor() {
    this.rules = RULE_DEFINITIONS;
  }

  async evaluateCredit(creditId, extractedData, unitSystem = 'IP') {
    const rule = this.rules[creditId];
    if (!rule) {
      throw new Error(`Rule not found for credit: ${creditId}`);
    }

    const result = {
      creditId,
      creditName: rule.name,
      maxPoints: rule.maxPoints,
      awardedPoints: 0,
      status: 'pending',
      gaps: [],
      nonCompliant: [],
      calculations: {},
      details: []
    };

    try {
      switch (creditId) {
        case 'EACr6':
          return await this.evaluateEACr6(extractedData, unitSystem, result);
        case 'IEQCr5':
          return await this.evaluateIEQCr5(extractedData, result);
        case 'WECr1':
          return await this.evaluateWECr1(extractedData, result);
        case 'EACr1':
          return await this.evaluateEACr1(extractedData, result);
        case 'SSCr1':
          return await this.evaluateSSCr1(extractedData, result);
        case 'MRCr1':
          return await this.evaluateMRCr1(extractedData, result);
        case 'IEQCr1':
          return await this.evaluateIEQCr1(extractedData, result);
        default:
          throw new Error(`Evaluation not implemented for credit: ${creditId}`);
      }
    } catch (error) {
      result.status = 'error';
      result.error = error.message;
      return result;
    }
  }

  async evaluateEACr6(data, unitSystem, result) {
    // Option 1: No Refrigerants or Low-Impact Refrigerants
    const option1Result = this.checkEACr6Option1(data);
    
    if (option1Result.compliant) {
      result.awardedPoints = 1;
      result.status = 'compliant';
      result.details.push('Option 1: No Refrigerants or Low-Impact Refrigerants');
      return result;
    }

    result.gaps = [...result.gaps, ...option1Result.gaps];

    // Option 2: Calculation of Refrigerant Impact
    const option2Result = await this.checkEACr6Option2(data, unitSystem);
    
    if (option2Result.compliant) {
      result.awardedPoints = 1;
      result.status = 'compliant';
      result.details.push('Option 2: Calculation of Refrigerant Impact');
      result.calculations = option2Result.calculations;
    } else {
      result.status = 'non_compliant';
      result.nonCompliant = [...result.nonCompliant, ...option2Result.nonCompliant];
      result.gaps = [...result.gaps, ...option2Result.gaps];
    }

    return result;
  }

  checkEACr6Option1(data) {
    const gaps = [];
    let compliant = true;

    // Check Refrigerant Used
    if (!data['Refrigerant Used']) {
      gaps.push('Refrigerant Used');
      compliant = false;
    }

    // Check ODP = 0
    if (data['ODP'] !== 0 && data['ODP'] !== '0') {
      compliant = false;
    }

    // Check GWP < 50
    if (!data['GWP'] || parseFloat(data['GWP']) >= 50) {
      compliant = false;
    }

    // Check Confirmation Statement
    if (!data['Confirmation Statement']) {
      gaps.push('Confirmation Statement');
      compliant = false;
    }

    return { compliant, gaps };
  }

  async checkEACr6Option2(data, unitSystem) {
    const requiredParams = [
      'GWP', 'Refrigerant Charge', 'Leakage Rate', 'Equipment Life',
      'Equipment Cooling Capacity', 'Equipment Quantity'
    ];

    const gaps = [];
    const nonCompliant = [];

    // Check for missing parameters
    requiredParams.forEach(param => {
      if (!data[param]) {
        gaps.push(param);
      }
    });

    if (gaps.length > 0) {
      return { compliant: false, gaps, nonCompliant, calculations: {} };
    }

    // Calculate LCODP and LCGWP
    const calculations = this.calculateRefrigerantImpact(data, unitSystem);
    const threshold = unitSystem === 'SI' ? 13 : 100;
    const weightedAverage = calculations.weightedAverage;

    if (weightedAverage <= threshold) {
      return { compliant: true, gaps: [], nonCompliant: [], calculations };
    } else {
      nonCompliant.push(`Weighted average (${weightedAverage.toFixed(2)}) exceeds threshold (${threshold})`);
      return { compliant: false, gaps: [], nonCompliant, calculations };
    }
  }

  async evaluateIEQCr5(data, result) {
    // Part 1: Thermal Comfort Requirements
    const part1Result = this.checkIEQCr5Part1(data);
    
    // Part 2: Individual Thermal Controls
    const part2Result = this.checkIEQCr5Part2(data);

    if (part1Result.compliant && part2Result.compliant) {
      result.awardedPoints = 1;
      result.status = 'compliant';
    } else {
      result.status = 'non_compliant';
      result.gaps = [...part1Result.gaps, ...part2Result.gaps];
      result.nonCompliant = [...part1Result.nonCompliant, ...part2Result.nonCompliant];
    }

    result.calculations = { ...part1Result.calculations, ...part2Result.calculations };
    return result;
  }

  checkIEQCr5Part1(data) {
    const gaps = [];
    const nonCompliant = [];
    let compliant = true;

    // Check Compliance Path
    if (!data['Compliance Path']) {
      gaps.push('Compliance Path');
      compliant = false;
    }

    // Check PMV range (-0.5 to 0.5)
    const pmv = parseFloat(data['PMV']);
    if (!pmv || pmv < -0.5 || pmv > 0.5) {
      nonCompliant.push('PMV must be between -0.5 and 0.5');
      compliant = false;
    }

    // Check PPD < 10%
    const ppd = parseFloat(data['PPD']);
    if (!ppd || ppd >= 10) {
      nonCompliant.push('PPD must be less than 10%');
      compliant = false;
    }

    // Check required documentation
    const requiredDocs = [
      'Operative Temperature Range', 'Relative Humidity Range',
      'Air Speed', 'Clothing Insulation', 'Metabolic Rate', 'Weather Data Source'
    ];

    requiredDocs.forEach(param => {
      if (!data[param]) {
        gaps.push(param);
        compliant = false;
      }
    });

    return { compliant, gaps, nonCompliant, calculations: {} };
  }

  checkIEQCr5Part2(data) {
    const gaps = [];
    const nonCompliant = [];
    let compliant = true;
    const calculations = {};

    // Calculate thermal control percentage
    const totalSpaces = parseInt(data['Total Individual Spaces']);
    const controlledSpaces = parseInt(data['Controlled Spaces']);

    if (!totalSpaces || !controlledSpaces) {
      gaps.push('Total Individual Spaces and Controlled Spaces required');
      compliant = false;
    } else {
      const percentage = (controlledSpaces / totalSpaces) * 100;
      calculations.thermalControlPercentage = percentage;

      if (percentage < 50) {
        nonCompliant.push('Thermal control percentage must be ≥ 50%');
        compliant = false;
      }
    }

    // Check markup requirements
    if (!data['Group Controls']) {
      gaps.push('Group Controls markup');
      compliant = false;
    }

    if (!data['Thermostat Locations']) {
      gaps.push('Thermostat Locations markup');
      compliant = false;
    }

    return { compliant, gaps, nonCompliant, calculations };
  }

  // Additional credit evaluation methods
  async evaluateWECr1(data, result) {
    const baselineWater = parseFloat(data['Baseline Water Use']);
    const designWater = parseFloat(data['Design Water Use']);

    if (!baselineWater || !designWater) {
      result.status = 'gaps';
      result.gaps.push('Baseline Water Use and Design Water Use required');
      return result;
    }

    const reduction = ((baselineWater - designWater) / baselineWater) * 100;
    result.calculations.waterReduction = reduction;

    if (reduction >= 50) {
      result.awardedPoints = 2;
      result.status = 'compliant';
    } else if (reduction >= 30) {
      result.awardedPoints = 1;
      result.status = 'compliant';
    } else {
      result.status = 'non_compliant';
      result.nonCompliant.push(`Water reduction (${reduction.toFixed(1)}%) insufficient`);
    }

    return result;
  }

  async evaluateEACr1(data, result) {
    const baselineEnergy = parseFloat(data['Baseline Energy Use']);
    const designEnergy = parseFloat(data['Design Energy Use']);
    const buildingType = data['Building Type'] || 'new_buildings';

    if (!baselineEnergy || !designEnergy) {
      result.status = 'gaps';
      result.gaps.push('Baseline Energy Use and Design Energy Use required');
      return result;
    }

    const improvement = ((baselineEnergy - designEnergy) / baselineEnergy) * 100;
    result.calculations.energyImprovement = improvement;

    const thresholds = this.rules.EACr1.rules.calculation.thresholds[buildingType];
    let points = 0;

    for (const [threshold, pointValue] of Object.entries(thresholds)) {
      const thresholdNum = parseFloat(threshold.replace('%', ''));
      if (improvement >= thresholdNum) {
        points = pointValue;
      }
    }

    result.awardedPoints = points;
    result.status = points > 0 ? 'compliant' : 'non_compliant';

    return result;
  }

  async evaluateSSCr1(data, result) {
    const requiredDocs = ['Site Survey', 'Environmental Features', 'Previous Use', 'Surrounding Development', 'Transportation Options'];
    const gaps = [];

    requiredDocs.forEach(param => {
      if (!data[param]) {
        gaps.push(param);
      }
    });

    if (gaps.length === 0) {
      result.awardedPoints = 1;
      result.status = 'compliant';
    } else {
      result.status = 'gaps';
      result.gaps = gaps;
    }

    return result;
  }

  async evaluateMRCr1(data, result) {
    // Check different options
    const buildingReusePercentage = parseFloat(data['Building Reuse Percentage']);
    const structuralReuse = parseFloat(data['Structural Elements Reuse']);
    const enclosureReuse = parseFloat(data['Enclosure Materials Reuse']);
    const lcaImprovement = parseFloat(data['Life Cycle Assessment Improvement']);

    let points = 0;

    // Option 1: Historic Building Reuse
    if (buildingReusePercentage >= 50) {
      points = Math.max(points, 2);
    }

    // Option 2: Renovation
    if (structuralReuse >= 50) {
      points = Math.max(points, 2);
    }
    if (enclosureReuse >= 50) {
      points = Math.max(points, points + 1);
    }

    // Option 3: LCA
    if (lcaImprovement >= 10) {
      points = Math.max(points, 3);
    }

    result.awardedPoints = Math.min(points, 5);
    result.status = points > 0 ? 'compliant' : 'non_compliant';

    return result;
  }

  async evaluateIEQCr1(data, result) {
    let points = 0;

    if (data['Outdoor Air Delivery Monitoring']) {
      points += 1;
    }

    if (data['Increased Ventilation'] === '30_percent_above_standard') {
      points += 1;
    }

    if (data['Air Filtration'] === 'MERV_13_or_higher') {
      points += 1;
    }

    result.awardedPoints = Math.min(points, 2);
    result.status = points > 0 ? 'compliant' : 'non_compliant';

    return result;
  }

  calculateRefrigerantImpact(data, unitSystem) {
    const gwp = parseFloat(data['GWP']);
    const odp = parseFloat(data['ODP']) || 0;
    const charge = parseFloat(data['Refrigerant Charge']);
    const leakageRate = parseFloat(data['Leakage Rate']) / 100; // Convert to decimal
    const life = parseFloat(data['Equipment Life']);
    const coolingCapacity = parseFloat(data['Equipment Cooling Capacity']);
    const quantity = parseFloat(data['Equipment Quantity']);

    const mr = 1; // End-of-life loss factor (typically 1)

    // Calculate LCODP and LCGWP
    const lcodp = (odp * (leakageRate * life + mr) * charge) / life;
    const lcgwp = (gwp * (leakageRate * life + mr) * charge) / life;

    // Calculate weighted average
    const impact = lcgwp + (lcodp * Math.pow(10, 5));
    const totalCoolingCapacity = coolingCapacity * quantity;
    const weightedAverage = (impact * totalCoolingCapacity) / totalCoolingCapacity;

    return {
      lcodp,
      lcgwp,
      impact,
      weightedAverage,
      totalCoolingCapacity,
      unitSystem
    };
  }

  // Utility methods
  checkParameterPresence(data, parameter) {
    return data[parameter] !== undefined && data[parameter] !== null && data[parameter] !== '';
  }

  checkNumericRange(value, min, max) {
    const num = parseFloat(value);
    return !isNaN(num) && num >= min && num <= max;
  }

  calculatePercentage(numerator, denominator) {
    if (!denominator || denominator === 0) return 0;
    return (numerator / denominator) * 100;
  }
}

// src/rules/calculationEngine.js
class CalculationEngine {
  static calculateRefrigerantImpact(data, unitSystem = 'IP') {
    // Implementation already included in RuleEngine
    const engine = new RuleEngine();
    return engine.calculateRefrigerantImpact(data, unitSystem);
  }

  static calculateEnergyPerformance(baseline, design, buildingType = 'new') {
    if (!baseline || !design) return null;
    return ((baseline - design) / baseline) * 100;
  }

  static calculateWaterReduction(baseline, design) {
    if (!baseline || !design) return null;
    return ((baseline - design) / baseline) * 100;
  }

  static calculateThermalControlPercentage(totalSpaces, controlledSpaces) {
    if (!totalSpaces || !controlledSpaces) return null;
    return (controlledSpaces / totalSpaces) * 100;
  }
}

module.exports = {
  RuleEngine,
  CalculationEngine,
  RULE_DEFINITIONS
};