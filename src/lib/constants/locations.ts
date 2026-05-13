export type LocationSuggestionType = "state" | "city" | "locality";

export type LocationSuggestion = {
  label: string;
  value: string;
  type: LocationSuggestionType;
  state?: string;
  city?: string;
  area?: string;
};

export const SUPPORTED_CITIES_BY_STATE = {
  "Andhra Pradesh": [
    "Visakhapatnam",
    "Vijayawada",
    "Guntur",
    "Rajahmundry",
    "Kakinada",
    "Tirupati",
    "Nellore",
    "Kurnool",
  ],
  Telangana: [
    "Hyderabad",
    "Secunderabad",
    "Warangal",
    "Karimnagar",
    "Nizamabad",
    "Khammam",
  ],
  Karnataka: ["Bengaluru", "Mysuru", "Mangalore", "Hubballi", "Belagavi"],
  "Tamil Nadu": [
    "Chennai",
    "Coimbatore",
    "Madurai",
    "Tiruchirappalli",
    "Salem",
  ],
  Kerala: ["Kochi", "Thiruvananthapuram", "Kozhikode", "Thrissur"],
  Maharashtra: ["Mumbai", "Pune", "Nagpur", "Nashik", "Thane", "Navi Mumbai"],
  "Delhi NCR": ["Delhi", "Gurugram", "Noida", "Ghaziabad", "Faridabad"],
  Gujarat: ["Ahmedabad", "Surat", "Vadodara", "Rajkot"],
  Rajasthan: ["Jaipur", "Jodhpur", "Udaipur", "Kota"],
  "Uttar Pradesh": ["Lucknow", "Kanpur", "Varanasi", "Prayagraj", "Agra"],
  "West Bengal": ["Kolkata", "Howrah", "Siliguri", "Durgapur"],
  Odisha: ["Bhubaneswar", "Cuttack", "Rourkela"],
  "Madhya Pradesh": ["Bhopal", "Indore", "Jabalpur", "Gwalior"],
  Punjab: ["Chandigarh", "Ludhiana", "Amritsar", "Jalandhar"],
  Haryana: ["Chandigarh", "Gurugram", "Faridabad", "Panipat"],
  Bihar: ["Patna", "Gaya", "Muzaffarpur"],
  Assam: ["Guwahati", "Dibrugarh", "Silchar"],
  Goa: ["Panaji", "Margao"],
} as const;

export type SupportedState = keyof typeof SUPPORTED_CITIES_BY_STATE;

export const SUPPORTED_STATES = Object.keys(
  SUPPORTED_CITIES_BY_STATE,
) as SupportedState[];

export const SUPPORTED_CITIES = SUPPORTED_STATES.flatMap((state) =>
  SUPPORTED_CITIES_BY_STATE[state].map((city) => ({
    city,
    state,
  })),
);

export const SUPPORTED_AREAS_BY_CITY = {
  Visakhapatnam: [
    "MVP Colony",
    "Dwaraka Nagar",
    "Seethammadhara",
    "Gajuwaka",
    "Madhurawada",
    "Rushikonda",
    "Siripuram",
    "NAD",
    "Pendurthi",
    "Anakapalle",
    "Akkayyapalem",
    "Bheemili",
  ],
  Hyderabad: [
    "Banjara Hills",
    "Jubilee Hills",
    "Madhapur",
    "Gachibowli",
    "Kukatpally",
    "Ameerpet",
    "Uppal",
    "Begumpet",
    "Secunderabad",
  ],
  Bengaluru: [
    "Indiranagar",
    "Whitefield",
    "Jayanagar",
    "Koramangala",
    "Hebbal",
    "Electronic City",
    "Marathahalli",
  ],
  Chennai: [
    "T Nagar",
    "Anna Nagar",
    "Adyar",
    "Velachery",
    "Tambaram",
    "Porur",
    "Mylapore",
  ],
  Mumbai: [
    "Andheri",
    "Bandra",
    "Dadar",
    "Powai",
    "Thane",
    "Borivali",
    "Navi Mumbai",
  ],
  Pune: [
    "Kothrud",
    "Hinjewadi",
    "Wakad",
    "Baner",
    "Hadapsar",
    "Viman Nagar",
  ],
  Delhi: [
    "South Delhi",
    "Dwarka",
    "Rohini",
    "Lajpat Nagar",
    "Karol Bagh",
    "Saket",
  ],
  Kolkata: ["Salt Lake", "New Town", "Park Street", "Ballygunge", "Howrah"],
  Ahmedabad: ["Navrangpura", "Satellite", "Bopal", "Maninagar"],
  Lucknow: ["Gomti Nagar", "Hazratganj", "Indira Nagar", "Aliganj"],
  Bhubaneswar: ["Patia", "Khandagiri", "Saheed Nagar"],
  Kochi: ["Edappally", "Kakkanad", "Fort Kochi", "Vyttila"],
  Jaipur: ["Malviya Nagar", "Vaishali Nagar", "C Scheme", "Mansarovar"],
  Indore: ["Vijay Nagar", "Palasia", "Rau", "Annapurna Road"],
  Guwahati: ["Dispur", "Beltola", "Paltan Bazaar", "Six Mile"],
} as const;

function normalizeLocationValue(value: string) {
  return value.trim().toLowerCase();
}

export function findSupportedState(value: string) {
  const normalizedValue = normalizeLocationValue(value);

  return SUPPORTED_STATES.find(
    (state) => normalizeLocationValue(state) === normalizedValue,
  );
}

export function getSupportedCitiesForState(value: string) {
  const state = findSupportedState(value);

  return state ? [...SUPPORTED_CITIES_BY_STATE[state]] : [];
}

const stateSuggestions: LocationSuggestion[] = SUPPORTED_STATES.map((state) => ({
  label: state,
  value: state,
  type: "state",
  state,
}));

const citySuggestions: LocationSuggestion[] = SUPPORTED_CITIES.map(
  ({ city, state }) => ({
    label: `${city}, ${state}`,
    value: city,
    type: "city",
    state,
    city,
  }),
);

const localitySuggestions: LocationSuggestion[] = Object.entries(
  SUPPORTED_AREAS_BY_CITY,
).flatMap(([city, areas]) => {
  const cityRecord = SUPPORTED_CITIES.find((item) => item.city === city);

  return areas.map((area) => ({
    label: `${area}, ${city}`,
    value: area,
    type: "locality",
    state: cityRecord?.state,
    city,
    area,
  }));
});

export const LOCATION_SUGGESTIONS: LocationSuggestion[] = [
  ...stateSuggestions,
  ...citySuggestions,
  ...localitySuggestions,
];
