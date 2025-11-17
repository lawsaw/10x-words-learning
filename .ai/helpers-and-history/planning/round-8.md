Questions:

1) What exact JSON keys and structure should the AI return (e.g., { "word": "", "translation": "", "examples": [] })? Recommendation: Provide a sample payload so the form autofill logic can parse responses consistently.
2) Should we sanitize Markdown input/output to prevent script injection while still allowing formatting? Recommendation: Define an allowlist-based sanitizer (e.g., marked with DOMPurify) to keep Markdown safe across table and slider views.
3) Do we need a live Markdown preview while editing examples, or will users rely solely on the formatted output view? Recommendation: Decide now so the form layout can accommodate a preview pane if required.
4) How should we surface errors when the AI returns invalid JSON—silent fail, toast message, or inline warning? Recommendation: Specify fallback messaging to guide users back to manual entry without confusion.
5) For Supabase RLS, which operations should the service role perform beyond backups (e.g., migrations, maintenance)? Recommendation: Document role permissions so policies and API routes are configured correctly.
6) Without a staging environment, where will Cypress end-to-end tests run with clean data? Recommendation: Set up a local or ephemeral testing database to isolate automated test runs from production data.
7) Should we enforce database-level unique constraints for languages, categories, and words that align with the specified case-sensitive rules? Recommendation: Add explicit Supabase constraints to back up client-side validation and avoid race-condition duplicates.
8) When the “Shuffle Cards” button is clicked, should it reshuffle the entire set once or every time the user reaches the end? Recommendation: Define the shuffle behavior to ensure navigation feels predictable across sessions.
9) During registration, do we require email confirmation or minimum password strength requirements? Recommendation: Establish baseline auth rules to avoid rework if security needs tighten later.
10) Since helper texts remain inline, who will own copy updates and how will we ensure consistency across forms? Recommendation: Assign ownership (e.g., product or developer) and create a lightweight review checklist to keep messaging aligned as forms evolve.

Answers:

1) The "examples" field is a long text formatted in Markdown. For example, the AI receives as input: "target language" as "English", "user language" as "Russian", category "Kitchen", and a certain difficulty level. Then the response should look like this:
{
  "word": "Potato",
  "translation": "Картошка",
  "examples": "**1.** I peeled the **potato** and cut it into small pieces before boiling it.  
_Я очистил **картошку** и порезал её на маленькие кусочки перед тем, как сварить._

---

**2.** She made creamy **potato** soup for dinner.  
_Она приготовила сливочный **картофельный** суп на ужин._

---

**3.** Don’t forget to mash the **potatoes** while they’re still hot!  
_Не забудь размять **картошку**, пока она ещё горячая!_"
}
2) Not needed.
3) Not needed.
4) Do not display anything. If the JSON is invalid, simply remove the loader and allow the user to fill in the form manually.
5) Any operations.
6) Create a local or temporary testing database.
7) Not needed.
8) When clicking “Shuffle Cards,” the cards are shuffled and reset to the beginning.
9) No email confirmation is required. Password: minimum 6 characters.
10) Do nothing.