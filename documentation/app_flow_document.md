# cafe-app-ai App Flow Document

## Onboarding and Sign-In/Sign-Up

When a new user visits the cafe-app-ai application, they first arrive at a simple landing page. This page introduces the service and offers clear links to either sign in or sign up. If the user has never created an account, they click the sign-up link and are taken to a registration form. Here they enter their email address, choose a password, and submit the form. The form sends a request to the authentication API, which uses the external Better Auth service to securely create the user account. Once registration succeeds, the user is automatically signed in and redirected to the dashboard.

If an existing user wants to log in, they click the sign-in link on the landing page. They enter their registered email and password into the sign-in form. When they submit, the form calls the same authentication API route. After the service verifies the credentials, the user is redirected to their protected dashboard. At any point, users may click a “Forgot password” link on the sign-in page. This link leads to a page where they enter their email address. The system then sends a password reset link via email. When the user follows that link, they arrive at a reset-password page where they choose a new password. Upon successful reset, they can sign in with the updated credentials.

The application also provides a sign-out option. From within the dashboard layout, a sign-out button appears in the site header. Clicking it calls the sign-out API, clears the user session, and returns the user to the landing page.

## Main Dashboard or Home Page

After a successful sign-in or sign-up, the user lands on the main dashboard. The dashboard layout presents a persistent sidebar on the left, a site header at the top, and a content area in the center. The sidebar shows navigation links for key areas such as Dashboard, Settings, and any custom pages added by the developer. The site header displays the application title, a theme toggle switch, and the user’s avatar or sign-out button.

In the main content area, the default dashboard page greets the user and shows summary cards, tables, and charts that display relevant data. Each card or chart is interactive, allowing the user to drill down into details. From this view, the user can move to other parts of the app by clicking items in the sidebar or links within the content.

## Detailed Feature Flows and Page Transitions

### Authentication Flow

When the user interacts with any authentication form, the form component captures the input and submits it to the Next.js API route under `/api/auth/[…all]/route.ts`. This API route communicates with Better Auth to handle sign-up, sign-in, sign-out, and password reset. After the service responds, the API route either redirects the user to the dashboard on success or returns error information for display on the same page.

### Dashboard Navigation and Data Viewing

Once on the dashboard page, the user sees a series of UI components built with the shadcn/ui library. If they click on a summary card, they navigate to a dedicated detail page for that data set. The transition is handled by Next.js client-side routing, ensuring a smooth user experience without full page reloads. The sidebar remains visible at all times, so the user can switch to other data modules or the settings area at any moment.

### Theming and UI Customization

In the site header, the user finds a theme toggle switch. When they click it, the application updates a CSS variable in real time to switch between light and dark mode. The current theme preference is stored locally, so when the user returns later, the app automatically applies their last chosen theme. The implementation relies on Tailwind CSS classes combined with custom CSS variable definitions.

## Settings and Account Management

The Settings page is accessible from the sidebar navigation. On this page, the user finds a profile form where they can update their name, email address, and password. When they submit changes, the form calls an API route that updates the user record in the PostgreSQL database via Drizzle ORM. After a successful update, the form shows a confirmation message and the updated information appears immediately.

In the same settings area, the user can manage notification preferences if those are enabled. They can toggle email notifications on or off and save their choices. All updates happen through the API and are persisted in the user’s settings table.

When the user is finished in settings, they can click the sidebar link labeled Dashboard or any other section to return to the main flow.

## Error States and Alternate Paths

If the user enters invalid credentials on the sign-in or sign-up form, the API returns an error message. The form displays this message inline below the relevant input fields, prompting the user to correct the mistake. When network connectivity is lost, the application shows a full-page error banner with a retry button. Clicking retry reattempts the failed request.

If a user tries to access a protected route without being authenticated, the middleware automatically redirects them to the sign-in page. After they sign in successfully, they are sent back to the page they originally requested. In case the password reset link is invalid or expired, the reset-password page displays an error and a link to request a new reset email.

## Conclusion and Overall App Journey

A typical user journey begins at the landing page, where they sign up with an email and password. They are immediately taken to a protected dashboard that features summary cards, tables, and charts. From the dashboard, they navigate into deeper data views, switch between themes, and manage their account details in the settings page. If they ever forget their password, they can request a reset link, update their password, and log back in. Throughout their experience, the app maintains smooth transitions using Next.js routing and delivers clear feedback on both successes and errors. This flow ensures that users can move from first landing to daily usage without confusion or interruption.