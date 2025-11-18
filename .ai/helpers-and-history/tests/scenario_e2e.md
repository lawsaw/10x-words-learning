We are preparing for the scenario:

1. Auth with credentials E2E_USERNAME and E2E_PASSWORD found in .env.test
2. Redirect to /app page 
3. Find one of the "Add learning language" buttons. Click on the first one
4. Wait for the dialog to open
5. Choose "Polish (pl)" language from the select box
6. Click on the "Add language" button for saving the form
7. Find "Polish (pl)" section appear on the page

Go through the key components related to this scenario, adding data-test-id attributes with values matched to the significance of the respective element or action.





# For the key elements, create dedicated classes following the POM pattern — @testing-e2e-playwright.mdc 