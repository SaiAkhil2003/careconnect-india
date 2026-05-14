# Real Provider Source Strategy

CareConnect India should collect real provider records through verified, consent-based onboarding. This strategy is for lead discovery, verification, approval, and later import. It does not authorize scraping, bulk copying, or publishing unverified provider data.

## Core Rules

- Do not scrape provider websites, government sites, registries, business directories, or social pages.
- Do not violate website terms or use automated extraction against directories.
- Do not copy long copyrighted descriptions from provider websites or listings.
- Do not present online directory data as verified provider data.
- Do not publish providers without verification, consent, and admin approval.
- Keep demo providers clearly separate from real provider onboarding.
- Record source, source URL, verification status, consent status, reviewer, and review date before import.

## Source Categories

### 1. Government and Public Welfare Sources

Examples:

- Senior citizen home directories.
- State social welfare department old age home lists.
- Department of Social Justice and Empowerment sources.
- District-level social welfare office sources.

Use for:

- Old age homes.
- Senior citizen homes.
- NGO-run elderly care homes.
- Day care centres.
- Government-supported homes.

How to use:

- Treat these as trusted lead and cross-check sources, not automatic permission to publish.
- Record the department/source name, source URL, state/district, and date checked.
- Confirm current operation, contact details, service categories, and consent directly with the provider before publishing.

### 2. ABDM Health Facility Registry

Use for:

- Clinics.
- Hospitals.
- Physiotherapy centres.
- Geriatric clinics.
- Healthcare facilities.
- Nursing and care-related facilities.

How to use:

- Use the registry to discover and cross-check healthcare facility identity and location.
- Do not imply CareConnect verification solely because a facility appears in the registry.
- Confirm service types, city coverage, contact details, and consent directly before import.

### 3. NABH Healthcare Organisation Directory

Use for:

- Accredited hospitals.
- Certified healthcare organisations.
- Quality-verified facilities.
- Home healthcare organisations if listed.

How to use:

- Use NABH status as a quality signal only when the provider is currently listed.
- Record the accreditation/certification source URL and date checked.
- Still verify that aged care, geriatric, physiotherapy, home care, or related services are actually offered.

### 4. Association and Industry Directories

Example:

- Association of Senior Living India member directory.

Use for:

- Senior living.
- Assisted living.
- Elder care companies.
- Home healthcare brands.
- Organised care providers.

How to use:

- Use association membership as a lead and credibility signal.
- Confirm active service locations and listing consent directly with the organisation.
- Do not copy association profile text into CareConnect descriptions.

### 5. Public Business Directories

Examples:

- Justdial.
- Google Maps.
- IndiaMART when relevant.
- Sulekha when relevant.
- Local city directories.

Use only for:

- Lead discovery.
- Market mapping.
- Finding possible providers.

Restrictions:

- Do not scrape directory pages.
- Do not bulk copy directory data.
- Do not treat business directory data as verified.
- Do not publish a provider based only on a public directory listing.
- Use public directory leads only as a starting point for manual verification and consent.

### 6. Provider Official Websites and Social Pages

Use for:

- Service confirmation.
- Locations served.
- Contact details.
- Email.
- Website.
- Official short description.
- Service types.

How to use:

- Prefer official provider websites and verified social pages for cross-checking.
- Write original, short CareConnect descriptions instead of copying website marketing text.
- Confirm that the provider wants the listing published and that the listed contact details are acceptable.

### 7. Direct Verification

Use:

- Phone call.
- Email confirmation.
- WhatsApp confirmation.
- Provider consent form.
- Manual approval.

Direct verification is required before public publishing. A provider should not become active on CareConnect India until contact details, service coverage, consent, and admin approval are recorded.

## Recommended Source Type Values

Use consistent `source_type` labels in research trackers and import staging files:

- `government_public_welfare`
- `abdm_health_facility_registry`
- `nabh_directory`
- `association_directory`
- `public_business_directory`
- `official_website`
- `official_social_page`
- `provider_referral`
- `direct_provider_submission`
- `field_research`

## Verification Workflow

### Stage 1: Discovered

Provider found online, through a public source, through a referral, or through field research.

Required action:

- Add the lead to the city-wise research tracker.
- Record city, state, source type, source URL when available, and initial notes.

### Stage 2: Source Checked

Provider website, government source, registry, association directory, or public listing checked manually.

Required action:

- Confirm the source appears relevant to aged care or healthcare services.
- Record what was found: phone, email, website, address, areas served, and service category.

### Stage 3: Contact Verified

Phone, email, or WhatsApp contact confirmed through direct outreach.

Required action:

- Record contact attempt dates and outcomes.
- Confirm the person contacted is authorised to verify listing details.

### Stage 4: Service Verified

Service types and city coverage confirmed.

Required action:

- Map services only to supported CareConnect service types:
  - `home_care`
  - `senior_living`
  - `day_care`
  - `physio`
  - `geriatric_doctor`
  - `companion`
  - `dementia_care`
- Confirm whether care is home-visit, facility-based, or both.
- Confirm city and areas covered.

### Stage 5: Consent Received

Provider agrees to be listed on CareConnect India.

Required action:

- Record consent status, consent notes, date, and contact person where possible.
- Use the provider listing consent wording in `docs/PROVIDER_LISTING_CONSENT_TEXT.md`.

### Stage 6: Approved

Admin reviews the provider record and approves it for public display.

Required action:

- Check for duplicate provider names/slugs.
- Check that service types, city, contact details, source URL, verification status, and consent status are complete.
- Set `is_active` and `is_verified` intentionally, not by default.

### Stage 7: Published

Provider is active on the platform.

Required action:

- Confirm the public profile displays accurate provider details.
- Keep admin notes and verification evidence available for audit.

### Stage 8: Rejected or Inactive

Provider has wrong data, is unreachable, appears closed, is outside scope, or consent was not received.

Required action:

- Do not publish.
- Record the rejection or inactive reason in the tracker.
- Revisit only if new verified information becomes available.

Only providers that are both consent-received and approved should be published publicly.

## Launch City Collection Priority

These are collection targets, not automatic publication targets. Providers still require verification, consent, and approval before publication.

### Phase 1

- Visakhapatnam.
- Bengaluru.

### Phase 2

- Hyderabad.
- Chennai.
- Mumbai.
- Delhi.
- Pune.
- Kochi.

### Phase 3

- Kolkata.
- Ahmedabad.
- Jaipur.
- Lucknow.
- Indore.
- Guwahati.
- Coimbatore.
- Mysuru.
- Vijayawada.
- Guntur.
- Tirupati.

For each launch city, target:

- 10 home care providers.
- 5 senior living or assisted living providers.
- 5 physiotherapy or rehab providers.
- 5 geriatric doctor or clinic providers.
- 5 companion, day care, or dementia care providers.

## Import Readiness

Use `docs/provider-research-tracker-template.csv` during research and verification. Use `supabase/provider-import-template.csv` as the final import staging sheet after approval.

Some audit fields in the CSV templates are staging/review fields and may not exist in the current `public.providers` schema. Until the schema is extended, import only the fields supported by the app and retain the audit metadata in the research tracker or review archive.
