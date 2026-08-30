export interface ConcreteQuantityInput {
  columnsCount?: number;
  columnWidthM?: number;
  columnDepthM?: number;
  columnHeightM?: number;
  beamLengthM?: number;
  beamWidthM?: number;
  beamDepthM?: number;
  slabAreaM2?: number;
  slabThicknessM?: number;
  foundationAreaM2?: number;
  foundationThicknessM?: number;
  wastePercentage?: number; // Fire payı (varsayılan %3)
  mixerTruckCapacityM3?: number; // Mikser kapasitesi (varsayılan 9 m3)
}

export interface ConcreteQuantityResult {
  columnsVolumeM3: number;
  beamsVolumeM3: number;
  slabsVolumeM3: number;
  foundationVolumeM3: number;
  totalNetVolumeM3: number;
  wasteVolumeM3: number;
  totalGrossVolumeM3: number;
  mixerTruckCount: number;
  notes: string[];
}

export function calculateConcreteQuantity(input: ConcreteQuantityInput): ConcreteQuantityResult {
  const {
    columnsCount = 0,
    columnWidthM = 0,
    columnDepthM = 0,
    columnHeightM = 0,
    beamLengthM = 0,
    beamWidthM = 0,
    beamDepthM = 0,
    slabAreaM2 = 0,
    slabThicknessM = 0,
    foundationAreaM2 = 0,
    foundationThicknessM = 0,
    wastePercentage = 3.0,
    mixerTruckCapacityM3 = 9.0,
  } = input;

  const columnsVolumeM3 = columnsCount * columnWidthM * columnDepthM * columnHeightM;
  const beamsVolumeM3 = beamLengthM * beamWidthM * beamDepthM;
  const slabsVolumeM3 = slabAreaM2 * slabThicknessM;
  const foundationVolumeM3 = foundationAreaM2 * foundationThicknessM;

  const totalNetVolumeM3 = columnsVolumeM3 + beamsVolumeM3 + slabsVolumeM3 + foundationVolumeM3;
  const wasteRate = Math.max(0, wastePercentage) / 100;
  const wasteVolumeM3 = totalNetVolumeM3 * wasteRate;
  const totalGrossVolumeM3 = totalNetVolumeM3 + wasteVolumeM3;

  const capacity = mixerTruckCapacityM3 > 0 ? mixerTruckCapacityM3 : 9.0;
  const mixerTruckCount = Math.ceil(totalGrossVolumeM3 / capacity);

  const notes = [
    `Net Beton Hacmi: ${totalNetVolumeM3.toFixed(2)} m³ (Kolon: ${columnsVolumeM3.toFixed(1)} m³, Kiriş: ${beamsVolumeM3.toFixed(1)} m³, Döşeme: ${slabsVolumeM3.toFixed(1)} m³, Temel: ${foundationVolumeM3.toFixed(1)} m³).`,
    `Fire ve Döküm Payı (%${wastePercentage}): +${wasteVolumeM3.toFixed(2)} m³.`,
    `Sipariş Edilecek Brüt Hazır Beton: ${totalGrossVolumeM3.toFixed(2)} m³ (~${mixerTruckCount} mikser, ${capacity} m³/mikser).`,
  ];

  return {
    columnsVolumeM3,
    beamsVolumeM3,
    slabsVolumeM3,
    foundationVolumeM3,
    totalNetVolumeM3,
    wasteVolumeM3,
    totalGrossVolumeM3,
    mixerTruckCount,
    notes,
  };
}
