Questions:

1. How should the “Easy/Medium/Advanced” difficulty be applied—per word generation request, per category, or as a global preference? Recommendation: Define the scope and persistence of difficulty selection so UI controls and data models can be aligned from the outset.
2. When a user deletes a language or category, what should happen to the associated words—hard delete, archive, or confirmation dialog? Recommendation: Specify deletion behavior and UX safeguards to prevent accidental data loss.
3. Should users be able to rename languages or categories after creation, or is delete-and-recreate the intended flow? Recommendation: Clarify rename needs now to avoid architectural rework if edit capability becomes essential later.
4. What fallback behavior should we implement if AI generation fails (e.g., retry, error message, suggest manual entry)? Recommendation: Define clear error-handling states to maintain trust and ensure users can proceed without AI.
5. Are there expectations for mobile or tablet responsiveness in the MVP? Recommendation: Decide on minimum responsive breakpoints so Tailwind/Shadcn implementation targets the right form factors.
6. Do we need onboarding guidance or empty-state messaging when a user has no languages, categories, or words yet? Recommendation: Plan simple helper copy and CTAs to guide first-time users through setup.
7. Should AI-generated content be stored with metadata (difficulty level, timestamp) for future filtering or auditing? Recommendation: Capture any critical metadata now—even if unused—to support later enhancements without data migration.
8. How should the system handle simultaneous edits if a user has multiple sessions open (e.g., browser tabs)? Recommendation: Determine whether to ignore, warn, or prevent conflicting updates to keep data consistent.
9. Are there accessibility or keyboard-navigation expectations for the slider controls and toggle buttons despite no formal accessibility requirement? Recommendation: Implement baseline keyboard support to reach a broader audience with minimal extra effort.
10. Do we need localization of the UI itself (beyond vocabulary content) for the supported languages? Recommendation: Decide whether to ship the interface in English only or prepare for localization so copywriting and component design anticipate future translation needs.

Answers:

1. Categories are always created manually by the user. AI can only assist within the form when creating “words” in an existing category. The default difficulty level is always “medium,” so the user can slightly decrease or increase it. When the user clicks the AI button, the AI generates the “word in the selected foreign language,” its “translation into the user’s language,” and “examples,” using the selected category and difficulty level as context. The AI result is a pre-filled form that the user can edit freely as if they filled it themselves. Important: During user registration, add a “user language” field that the user selects from the same static list. The purpose of this field is only to tell the AI which language to use for generating the “translation.”
2. When deleting a language, category, or word, a confirmation popup must appear.
   If the user deletes a category, all words within that category are deleted in cascade. If the user deletes a language, all categories of that language and all words within them are deleted in cascade. Each case should be described in the confirmation popup.
3. The user cannot rename languages. The user selects a language from the list of available static languages and cannot change it to another one. The user can only add a new language and switch between their existing ones. When switching languages, the list of categories updates to show the categories of the selected language.
4. The user can always fill out the form manually. AI only helps pre-fill it. If the AI fails for any reason, the user can complete the form themselves.
5. Yes, the interface must be responsive and work well on desktop, tablet, and mobile screens.
6. Yes, include simple explanatory text above forms and fields describing what they mean.
7. Not needed.
8. Ignored.
9. Navigation through cards should be possible using “Next” and “Previous” buttons next to the current card.
10. No localization required. The entire interface should be in English.
