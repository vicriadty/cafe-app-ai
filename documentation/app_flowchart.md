flowchart TD
  Start[Start] --> CheckAuth{User Authenticated?}
  CheckAuth -->|Yes| DashboardLayout[Dashboard Layout]
  DashboardLayout --> DashboardPage[Dashboard Main Page]
  DashboardPage --> ProtectedContent[Protected Content]
  CheckAuth -->|No| LandingPage[Landing Page]
  LandingPage --> SignInPage[Sign In Page]
  LandingPage --> SignUpPage[Sign Up Page]
  SignInPage --> SubmitSignIn[Submit Sign In Form]
  SubmitSignIn --> SignInAPICall[Call Sign In API Route]
  SignInAPICall --> BetterAuthService[Better Auth Service]
  BetterAuthService --> SignInResponse{Valid Credentials?}
  SignInResponse -->|Yes| SetSession[Set User Session]
  SetSession --> RedirectDashboard[Redirect to Dashboard]
  RedirectDashboard --> DashboardLayout
  SignInResponse -->|No| SignInError[Display Sign In Error]
  SignInError --> SignInPage
  SignUpPage --> SubmitSignUp[Submit Sign Up Form]
  SubmitSignUp --> SignUpAPICall[Call Sign Up API Route]
  SignUpAPICall --> BetterAuthService
  BetterAuthService --> SignUpResponse{Registration Successful?}
  SignUpResponse -->|Yes| RedirectSignIn[Redirect to Sign In Page]
  RedirectSignIn --> SignInPage
  SignUpResponse -->|No| SignUpError[Display Sign Up Error]
  SignUpError --> SignUpPage