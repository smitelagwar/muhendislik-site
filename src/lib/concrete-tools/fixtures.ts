export const CONCRETE_TOOL_FIXTURES = {
  beam: {
    flexureDefault: {
      input: {
        widthMm: 300,
        totalHeightMm: 600,
        coverMm: 30,
        stirrupDiameterMm: 10,
        designMomentKnM: 250,
        concreteDesignStrengthMpa: 16.7,
        steelDesignStrengthMpa: 365,
      },
      expected: {
        effectiveDepthMm: 550,
        kFactorMpa: 2.75,
        requiredSteelAreaMm2: 1383.32,
        minimumSteelAreaMm2: 262.01,
        designSteelAreaMm2: 1383.32,
      },
    },
    shearDefault: {
      input: {
        designShearKn: 180,
        widthMm: 300,
        effectiveDepthMm: 550,
        concreteStrengthMpa: 25,
        stirrupDiameterMm: 10,
        stirrupLegCount: 2,
        stirrupSpacingMm: 150,
      },
      expected: {
        shearStressMpa: 1.09,
        shearStressLimitMpa: 3.25,
        stirrupCapacityKn: 210.19,
      },
    },
  },
  slab: {
    thicknessDefault: {
      input: {
        shortSpanMeters: 5,
        longSpanMeters: 6,
        slabType: "sur_cift",
        steelStrengthMpa: 500,
      },
      expected: {
        aspectRatio: 1.2,
        minimumThicknessMm: 128.21,
        roundedThicknessMm: 130,
        recommendedThicknessMm: 130,
      },
    },
    rebarDefault: {
      input: {
        thicknessMm: 180,
        barDiameterMm: 10,
      },
      expected: {
        minimumSteelAreaPerMeterMm2: 360,
        selectedBarAreaMm2: 78.54,
        maximumSpacingMm: 250,
        recommendedSpacingMm: 200,
      },
    },
  },
  cover: {
    default: {
      input: {
        elementType: "kiris",
        exposureClass: "XC3",
        rebarDiameterMm: 20,
        stirrupDiameterMm: 10,
        safetyClass: "S2",
        serviceLifeYears: 50,
      },
      expected: {
        bondMinimumMm: 20,
        durabilityMinimumMm: 25,
        minimumCoverMm: 25,
        nominalCoverMm: 35,
        practicalCoverMm: 45,
      },
    },
  },
  column: {
    capacityDefault: {
      input: {
        widthMm: 400,
        heightMm: 400,
        designAxialLoadKn: 1200,
        concreteDesignStrengthMpa: 16.7,
        steelDesignStrengthMpa: 365,
        totalSteelAreaMm2: 2513,
      },
      expected: {
        sectionAreaMm2: 160000,
        reinforcementRatio: 0.0157,
        totalCapacityKn: 3188.44,
        capacityRatio: 2.66,
      },
    },
    steelAreaDefault: {
      input: {
        barDiameterMm: 20,
        quantity: 8,
      },
      expected: {
        oneBarAreaMm2: 314.16,
        totalAreaMm2: 2513.27,
        weightPerMeterKg: 19.73,
      },
    },
    lapLengthDefault: {
      input: {
        barDiameterMm: 20,
        concreteClassValue: 30,
      },
      expected: {
        minimumLapLengthMm: 1739,
        practicalLapLengthMm: 800,
      },
    },
    preliminaryDefault: {
      input: {
        floorCount: 5,
        tributaryAreaM2: 20,
        deadLoadKnM2: 10,
        liveLoadKnM2: 3.5,
        concreteStrengthMpa: 30,
      },
      expected: {
        designAreaLoadKnM2: 19.6,
        designAxialLoadKn: 1960,
        minimumAreaCm2: 1633.33,
        recommendedSection: "30 x 55 cm",
      },
    },
  },
} as const;
