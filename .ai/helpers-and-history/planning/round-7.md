Questions:

1) Should the difficulty setting map to explicit linguistic guidance (e.g., CEFR level cues, vocabulary complexity) to help the AI differentiate output quality? Recommendation: Define short descriptors for Easy/Medium/Advanced so prompts stay consistent and generated content meets user expectations.
2) How many example sentences should the AI return per word, and do we require any formatting (bullet list vs. paragraph)? Recommendation: Specify a target count and structure to simplify parsing and keep the UI consistent.
3) What exact response format should the AI return (JSON fields, delimiter-based text) so the form autofill is reliable? Recommendation: Provide a schema or sample payload for the prompt to reduce parsing errors.
4) How should we handle casing and whitespace when enforcing uniqueness for languages, categories, and words (e.g., “Kitchen” vs. “kitchen”)? Recommendation: Decide on normalization rules now so validation and Supabase constraints align.
5) Do we need to block submission if users bypass uniqueness checks via rapid multi-tab actions, or will Supabase constraints handle it? Recommendation: Implement both client-side checks and backend constraints to prevent race-condition duplicates.
6) Should the confirmation dialogs use consistent primary/secondary button labeling (e.g., “Delete” vs. “Cancel”) and color semantics across all delete flows? Recommendation: Document a shared pattern for destructive actions so users recognize the risk.
7) Are there plans to support pagination or search later, and if so, should we design the data model/UI to accommodate future scalability? Recommendation: Reserve layout space or component patterns that can evolve without major refactors.
8) Do we need to warn users before navigating away from an unsaved word form (since drafts aren’t stored) to prevent data loss? Recommendation: Add a simple before-unload prompt when fields are dirty to protect user input.
9) For RLS policies, should we create separate roles for authenticated vs. service operations (e.g., admin scripts), or will all access flow through authenticated users only? Recommendation: Clarify role strategy to avoid later migrations if an admin layer is introduced.
10) When describing form fields with helper text, should we centralize copy in a config so future updates to language or tone are easy? Recommendation: Maintain helper copy in a single source (e.g., constants file) to keep messaging coherent and editable without code duplication.

Answers:

1) Not needed.
2) 3–4 examples will be enough. Use Markdown formatting. The field where this text is inserted must also support Markdown so that users can make text bold or split it into paragraphs.
3) Use JSON format.
4) Case and whitespace matter. That is, “Kitchen” and “kitchen” should be treated as different words.
5) Do nothing.
6) Yes, create a unified confirmation dialog template and use consistent button labels “Delete” and “Cancel.” Pass only a unique action message to the template, e.g., for deleting a category: “Deleting this category will remove all words associated with it.”
7) Not needed.
8) Do nothing.
9) Yes, create separate roles for authenticated users and service operations.
10) Not needed. All helper texts are stored where they are used.