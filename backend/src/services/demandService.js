export function getDemandZones() {
  const zones = [
    { id: 1, name: 'MG Road', lat: 12.9756, lng: 77.605, demand_level: 'high', estimated_earnings: 980 },
    { id: 2, name: 'Indiranagar', lat: 12.9719, lng: 77.6412, demand_level: 'high', estimated_earnings: 940 },
    { id: 3, name: 'Koramangala', lat: 12.9352, lng: 77.6245, demand_level: 'medium', estimated_earnings: 760 },
    { id: 4, name: 'HSR Layout', lat: 12.9116, lng: 77.6474, demand_level: 'medium', estimated_earnings: 690 },
    { id: 5, name: 'Yelahanka', lat: 13.1, lng: 77.5963, demand_level: 'low', estimated_earnings: 510 },
  ];

  const bestAreaSuggestion = [...zones].sort((a, b) => b.estimated_earnings - a.estimated_earnings)[0];
  return { zones, bestAreaSuggestion };
}
