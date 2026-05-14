-- WARNING:
-- This removes generated Pan-India demo provider rows only.
-- Demo providers are identified by deterministic slugs beginning with demo-.
-- Do not use this to remove real providers, Sai Test Elder Care, or older sample rows.

delete from public.providers
where slug like 'demo-%'
  and provider_name like 'Demo % Sample'
  and description = 'This is a demo listing created for testing CareConnect India city aware search. It is not a real verified provider.';
