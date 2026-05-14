# Place Data Sources

CareConnect India uses public place data only for city/place discovery, city activation planning, and city-specific search UX. This data does not represent verified provider coverage.

## GeoNames India Gazetteer

- Source: https://download.geonames.org/export/dump/IN.zip
- Admin division mapping: https://download.geonames.org/export/dump/admin1CodesASCII.txt
- Readme and data format: https://download.geonames.org/export/dump/readme.txt
- License: Creative Commons Attribution 4.0
- Attribution: GeoNames, https://www.geonames.org
- Generated in this repo on: 2026-05-14

The generated app constants live in `src/lib/constants/india-places.ts`.

The generated database seed lives in `supabase/seed-cities-india.sql`.

## Inclusion Filter

The generated India place directory includes GeoNames records matching:

- Country code `IN`
- Feature class `P` for populated places
- Feature codes `PPLC`, `PPLA`, `PPLA2`, `PPLA3`, `PPLA4`, `PPL`, and `PPLX`
- Population greater than or equal to 1,000

Records are deduplicated by state and ASCII place name. If multiple records match the same state/name pair, the row with the higher population is kept.

## Provider Data Boundary

Do not use GeoNames or any public place dataset as provider evidence. Real provider rows still require the verification and consent workflow in `docs/REAL_PROVIDER_DATA_COLLECTION.md`.
