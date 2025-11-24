Questions:

1. What prompt structure and safeguards should we define for the DeepSeek model to ensure relevant vocabulary outputs per category and difficulty? Recommendation: Draft and test standard prompts with sample categories so developers can implement deterministic AI calls with minimal rework.
2. How will we manage and rotate OpenRouter API keys across environments (dev/stage/prod) to maintain security? Recommendation: Document an environment variable strategy and key rotation policy before development starts.
3. Do we require rate limiting per user or per project when calling OpenRouter to prevent quota exhaustion? Recommendation: Implement basic server-side throttling rules that can be tuned once usage data emerges.
4. Should we monitor and log AI response times or failures server-side to help diagnose provider issues without exposing details to users? Recommendation: Add lightweight server logging around AI requests, including timing and error codes, for operational visibility.
5. Are there performance targets for loading large language/category/word lists (e.g., max load time on mobile)? Recommendation: Set baseline performance expectations to inform pagination or lazy-loading strategies if lists grow large.
6. What is the expected visual hierarchy and spacing system when combining Tailwind 4 and Shadcn/ui components? Recommendation: Create a simple design guideline or component inventory to keep the UI cohesive and speed up development.
7. How should we handle Supabase RLS policy migrations to avoid locking out legitimate users during deployment? Recommendation: Plan migration sequencing and staging tests to validate RLS rules before production rollout.
8. For Cypress coverage, which critical flows must be automated (registration, add language, add word, AI generation, slider navigation)? Recommendation: Define a prioritized test plan so the single developer can focus on high-risk journeys first.
9. Will there be any staging environment with seeded data for demo or QA purposes? Recommendation: Establish a lightweight staging setup with sample vocabulary to support testing and stakeholder reviews.
10. What is the post-launch support process for the solo developer if urgent bugs appear (e.g., on-call expectations, response times)? Recommendation: Align on support schedules and escalation paths to manage user expectations after release.

Answers:

1. The prompt should include: “selected language,” “user language,” “category,” and “difficulty level.” The AI should return a “word” in the “selected language,” its “translation” in the “user language,” and several example sentences using that “word” according to the chosen “difficulty level.” The script should then auto-fill the word creation form with this response.
2. A single API key will be used for all environments. The key should be stored in environment variables.
3. No limits are required.
4. No logging is needed.
5. There are no restrictions. All available and selected languages are displayed in full. All categories of the selected language are shown as a complete list. All words within the selected category are displayed in full. Lazy loading is not required.
6. The recommendation is accepted.
7. The recommendation is accepted.
8. Registration, adding a language, adding a category, adding a word manually, and slider navigation should be tested. AI generation does not need testing.
9. There will be no staging environment.
10. Nothing needs to be done.
