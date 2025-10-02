# D'Busana Dashboard Guidelines

## Dashboard Design Principles

### Clean Dashboard Policy
* **NO STATUS MONITORING COMPONENTS** in the main dashboard
* Do not add database connection status, backend health monitors, or similar diagnostic components to the main dashboard views
* Keep the dashboard focused on business KPIs and analytics, not technical status
* Status monitoring should only be available in dedicated technical/debug pages if absolutely necessary

### KPI Display Standards
* Focus on business metrics: orders, revenue, profit, inventory
* Use clean, minimal design without technical clutter
* Show data refresh capabilities with simple refresh buttons, not status indicators
* Handle errors gracefully through fallback data, not prominent error displays

### User Experience
* Prioritize business value over technical status
* Keep interfaces clean and focused on actionable business insights
* Avoid overwhelming users with connection status, health checks, or diagnostic information

### Database Integration Standards
* **Real-time Integration**: KPI components must integrate with PostgreSQL database for live data
* **Marketplace Analytics**: MarketplaceKPICards terintegrasi dengan useMarketplaceAnalyticsShared hook
* **Clean Error Handling**: Handle database errors gracefully dengan fallback data tanpa technical messaging
* **Component Integration Order**: KPICards → MarketplaceKPICards → NetProfitSummaryCard untuk optimal data flow

### Loading States Standards
* **Clean Loading Design**: All pages must have consistent, professional loading states
* **Page-Level Loading**: Use PageWrapper components for route-level loading (DashboardPageWrapper, ManagementPageWrapper, AnalyticsPageWrapper)
* **Internal Loading**: Use InternalLoadingSpinner for component-level loading with appropriate variants (spinner, skeleton, dots, pulse)
* **Business-Focused Messaging**: Loading text should focus on business operations ("Loading customer data...") rather than technical processes
* **Minimum Duration**: Implement minimum loading times (300-500ms) to prevent flash of loading states
* **Layout Preservation**: Maintain page layout during loading with proper skeleton structures
* **Progressive Enhancement**: Use skeleton loaders that match actual content structure
<!--

System Guidelines

Use this file to provide the AI with rules and guidelines you want it to follow.
This template outlines a few examples of things you can add. You can add your own sections and format it to suit your needs

TIP: More context isn't always better. It can confuse the LLM. Try and add the most important rules you need

# General guidelines

Any general rules you want the AI to follow.
For example:

* Only use absolute positioning when necessary. Opt for responsive and well structured layouts that use flexbox and grid by default
* Refactor code as you go to keep code clean
* Keep file sizes small and put helper functions and components in their own files.

--------------

# Design system guidelines
Rules for how the AI should make generations look like your company's design system

Additionally, if you select a design system to use in the prompt box, you can reference
your design system's components, tokens, variables and components.
For example:

* Use a base font-size of 14px
* Date formats should always be in the format “Jun 10”
* The bottom toolbar should only ever have a maximum of 4 items
* Never use the floating action button with the bottom toolbar
* Chips should always come in sets of 3 or more
* Don't use a dropdown if there are 2 or fewer options

You can also create sub sections and add more specific details
For example:


## Button
The Button component is a fundamental interactive element in our design system, designed to trigger actions or navigate
users through the application. It provides visual feedback and clear affordances to enhance user experience.

### Usage
Buttons should be used for important actions that users need to take, such as form submissions, confirming choices,
or initiating processes. They communicate interactivity and should have clear, action-oriented labels.

### Variants
* Primary Button
  * Purpose : Used for the main action in a section or page
  * Visual Style : Bold, filled with the primary brand color
  * Usage : One primary button per section to guide users toward the most important action
* Secondary Button
  * Purpose : Used for alternative or supporting actions
  * Visual Style : Outlined with the primary color, transparent background
  * Usage : Can appear alongside a primary button for less important actions
* Tertiary Button
  * Purpose : Used for the least important actions
  * Visual Style : Text-only with no border, using primary color
  * Usage : For actions that should be available but not emphasized
-->
