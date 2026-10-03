/*
 * Content for the eight /features/* pages that share the original's
 * `feature-page` template.
 *
 * Headings, labels, eyebrows and link-card titles are the original's, since
 * they are the page's information architecture. The descriptive prose is
 * written here rather than copied: the replica should not republish the
 * original's body copy verbatim on a public URL.
 *
 * This lives in the repo rather than Strapi deliberately. §4.2 #2 of the
 * brief scopes the CMS requirement to the blog, its filters and the
 * testimonials, all of which are modelled in Strapi; the marketing pages
 * (home, product, features) keep their copy alongside the template that
 * renders it, which is also where the homepage and product pages keep theirs.
 * Promoting this to a `feature` content type would be a small change: the
 * shape below is already flat enough to map onto one.
 */

export interface FeatureCard {
  /** File in /images/icons, without the extension. */
  icon: string;
  title: string;
  body: string;
  /** Inline links woven into the body's last sentence. */
  links?: { href: string; label: string }[];
  /** The tall-card variant closes each card with a "Learn more" link. */
  trailing?: { href: string; label: string };
}

export interface Feature {
  slug: string;
  /** File in /images/icons/badges, without the extension. */
  badge: string;
  eyebrow: string;
  h1: string;
  standfirst: string;
  /** Collections omits the hero buttons on the original. */
  ctas: boolean;
  /** Hero clip in /images/features, without the extension. */
  media: string;
  mediaHeight: number;
  h2: string;
  sub: string;
  cards: FeatureCard[];
  h2b: string;
  linkCards: { pill: string; title: string; href: string }[];
  howto?: { title: string; steps: string[] };
  /** Only the dashboards page carries these two on the original. */
  readDocs?: string;
  faq?: { q: string; a: string }[];
  cta: { title: string; body: string; link?: { href: string; label: string } };
  seoTitle: string;
  seoDescription: string;
}

export const features: Feature[] = [
  {
    slug: 'analytics-dashboards',
    badge: 'dashboard',
    eyebrow: 'Dashboards and reporting',
    h1: 'Dashboards that actually get used. Insights, explained. Data your whole team can act on.',
    standfirst:
      'Whether you are tracking core SaaS metrics or sending the monthly update that explains why a number moved, Metabase gives your team somewhere to build reporting and somewhere to read it.',
    ctas: true,
    media: 'dashboard-docs',
    mediaHeight: 401,
    h2: 'Interactive, collaborative, and built for data pros and non-technical people',
    sub: 'Straightforward tools for everyone to create, structure, and use dashboards and reports on their own.',
    cards: [
      { icon: 'Type=Dashboard', title: 'Interactive dashboards',
        body: 'Assemble a dashboard out of saved questions and filters to follow the numbers that move fastest, then let people change the date range or the segment themselves rather than queueing for someone to rebuild it. Charts respond to clicks, so the follow-up question is usually one menu away, and you can hand the whole thing to a team without handing over your afternoon.',
        trailing: { href: '/docs/latest/dashboards/start', label: 'Learn more about dashboards in Metabase.' } },
      { icon: 'model', title: 'Documents',
        body: 'Put the visualizations next to the writing that explains them, so a chart turns up with the reason it matters attached instead of on its own. Documents are the difference between sending a number and sending an argument, which is what most monthly updates are really trying to be. Write once, embed the live charts, and let the text update around them.',
        trailing: { href: '/docs/latest/documents/start', label: 'Learn more about Documents in Metabase.' } },
      { icon: 'share', title: 'Sharing data with your team and customers',
        body: 'Send dashboards to where people already are rather than asking them to come and find one. A direct link, a scheduled email, a Slack message on a Monday morning, or an embed inside your own product for the customers who should only see their own rows. Each route carries the same permissions, so sharing never quietly widens access.',
        trailing: { href: '/learn/metabase-basics/administration/administration-and-operation/guide-to-sharing-data', label: 'Learn more about sharing in Metabase.' } },
    ],
    readDocs: '/docs/latest/dashboards/start',
    faq: [
      { q: 'How do dashboards help teams make data-driven decisions?',
        a: 'A dashboard puts the handful of numbers a team actually steers by in one place, refreshed from the database rather than pasted in. That turns the weekly argument about whose figures are right into a conversation about what to do next.' },
      { q: "What's the best way to share a dashboard with non-technical teammates?",
        a: 'Send a link or set up a subscription that emails or Slacks it on a schedule. Neither asks the recipient to learn the tool, and both keep the permissions you already set, so nobody sees more than they should.' },
      { q: 'Can I create data reports that tell a story, not just show charts?',
        a: 'That is what Documents are for. You write the explanation and embed the live visualizations inside it, so the narrative and the numbers stay together and the numbers stay current.' },
      { q: "What's the difference between a dashboard and a data report?",
        a: 'A dashboard is for monitoring: the same questions, answered again whenever you open it. A report is for explaining a particular thing once, with the writing that makes sense of it.' },
      { q: 'How do I set up self-service analytics for my team?',
        a: 'Curate the tables people see, add the metadata that makes the column names mean something, and give them the query builder. Most questions then get answered without reaching you at all.' },
      { q: 'How can I automate sharing dashboards and reports in Metabase?',
        a: 'Dashboard subscriptions send a dashboard by email or Slack on a schedule, and alerts fire when a result crosses a threshold, so people hear about a change without watching for it.' },
    ],
    h2b: 'Get better at building analytics dashboards',
    linkCards: [
      { pill: 'Webinar', title: 'Building Metabase dashboards like a pro', href: '/events/building-metabase-dashboards-like-a-pro' },
      { pill: 'Video demo', title: 'From zero to dashboard in 6 mins', href: '/demo' },
      { pill: 'Learn', title: 'Dashboard fundamentals', href: '/learn/metabase-basics/querying-and-dashboards/dashboards' },
    ],
    cta: {
      title: 'Try Metabase 14 days free',
      body: 'Give your team the open source reporting tool they will actually enjoy using.',
    },
    seoTitle: 'Analytics dashboards and reporting | Metabase',
    seoDescription:
      'Build interactive dashboards from saved questions and filters, explain them in Documents, and share them by link, email, Slack or embed.',
  },
  {
    slug: 'collections',
    badge: 'collections',
    eyebrow: 'Collections and verified items',
    h1: 'Keep things organized',
    standfirst:
      'Bring some structure to your Metabase by tucking related models, questions and dashboards together into collections, and make the good ones easy to find.',
    ctas: false,
    media: 'collections',
    mediaHeight: 380,
    h2: 'Everything in its right place',
    sub: 'As everyone explores and adds more to your Metabase, things get noisy. These are the tools that keep it in check.',
    cards: [
      { icon: 'collections', title: 'Collections',
        body: 'Give each team its own corner of Metabase and bundle everything they need into it, with sub-collections when one corner is not enough.' },
      { icon: 'eye', title: 'Collection permissions',
        body: 'Grant view access, curate access, or none at all, and set it separately on a sub-collection when the parent is too broad.' },
      { icon: 'medal', title: 'Official collections',
        body: 'Admins can mark a collection official, so people can tell at a glance which numbers have been through review and which are someone’s working draft.' },
      { icon: 'question-blue', title: 'Verified questions',
        body: 'Put a blue check on the questions and models that have been looked over, so people can tell what has been reviewed, and let search rank the verified ones above everything else when someone goes hunting.' },
      { icon: 'pin', title: 'Pin important items',
        body: 'Keep the dashboards people actually open at the top of the collection, instead of three screens down an alphabetical list.' },
      { icon: 'person', title: 'Personal collection',
        body: 'Somewhere to think out loud. Your personal collection is yours alone until you decide to move something out of it.' },
    ],
    h2b: 'More about collections and verified items',
    linkCards: [
      { pill: 'Documentation', title: 'Exploration and organization', href: '/docs/latest/exploration-and-organization/collections' },
      { pill: 'Documentation', title: 'Collection permissions', href: '/docs/latest/permissions/collections' },
      { pill: 'Learn', title: 'Keeping your analytics organized', href: '/learn/metabase-basics/administration/administration-and-operation/same-page' },
    ],
    howto: {
      title: 'How to create a collection, set permissions, and mark it as official',
      steps: [
        'Create one with <b>New &gt; Collection</b>, then move in the questions and dashboards that belong together.',
        'Or start from a question: save it, and either pick a collection or create one from the bottom of the same menu.',
        'If you are an admin, set and adjust permissions per group from the <b>…</b> menu at the top right.',
        'Admins on a Pro or Enterprise plan can mark the collection <b>Official</b> from that same menu.',
      ],
    },
    cta: {
      title: 'Try Metabase for free for 14 days',
      body: 'Collections come with every plan. Marking them official needs Pro or Enterprise.',
    },
    seoTitle: 'Collections and verified items | Metabase',
    seoDescription:
      'Organize models, questions and dashboards into collections, set permissions per group, and mark the reviewed ones official.',
  },
  {
    slug: 'drill-through',
    badge: 'magnifier',
    eyebrow: 'Drill-through',
    h1: 'Pull threads in your data without even asking a question',
    standfirst:
      'Drill-throughs give people an intuitive place to start: click a bar, a slice or a state and Metabase offers the next question rather than waiting to be asked.',
    ctas: true,
    media: 'breakout-filter',
    mediaHeight: 380,
    h2: 'Analysis on (almost) autopilot',
    sub: 'Click a chart, a model or a question to filter it, see the records behind it, break it out by another dimension, or generate a whole dashboard about it.',
    cards: [
      { icon: 'magnifying-glass', title: 'Zoom in',
        body: 'Find out why a number moved around a particular date by clicking and dragging across the part of the chart that looks interesting, and Metabase re-runs the question zoomed in on it.' },
      { icon: 'servers', title: 'View these records',
        body: 'Get to the specifics: click through to a table of the individual rows that make up the point you were looking at.' },
      { icon: 'bifurcate', title: 'Breakout',
        body: 'Split the same measure by another dimension — time, location, category — without going back to the query builder.' },
      { icon: 'filter', title: 'Filters',
        body: 'Slice it a different way by clicking to apply a filter, and see what is actually high or low once the rows nobody asked about are out of the way.' },
      { icon: 'click', title: 'Custom click behavior',
        body: 'Decide where the next click goes: a related dashboard, a saved question, or a URL in another system entirely.' },
      { icon: 'filter-plus', title: 'Cross-filter',
        body: 'Wire a card to the dashboard’s filter widgets, so clicking a state on a map narrows every other card to it.' },
      { icon: 'action-blue', title: 'X-ray',
        body: 'Generate a whole dashboard of questions about a table or a single record automatically, then throw away the cards that were not interesting and keep the handful that turned out to be worth watching.' },
    ],
    h2b: 'More info on drill-throughs and interactivity',
    linkCards: [
      { pill: 'Documentation', title: 'Interactive dashboards', href: '/docs/latest/dashboards/interactive' },
      { pill: 'Learn', title: 'Drill-through on charts', href: '/docs/latest/questions/visualizations/drill-through' },
      { pill: 'Event', title: 'A tour of Metabase', href: '/events/metabase-for-beginners' },
    ],
    howto: {
      title: 'How to use drill-throughs on dashboards and charts',
      steps: [
        'Find a dashboard, chart or model you want to know more about.',
        'Click anywhere on a chart built with the query builder — a state on a map, a bar in a bar chart, a slice of a pie — and pick whichever option from the drill-through menu looks like the next question.',
        'That is more or less it. Go wild.',
      ],
    },
    cta: {
      title: 'Try Metabase 14 days free',
      body: 'Make it easier to get the useful bits out of your data with menus people can just click.',
      link: { href: '/pricing', label: 'Drill-throughs are on every plan' },
    },
    seoTitle: 'Drill-through and interactivity | Metabase',
    seoDescription:
      'Click any chart to filter it, view the underlying records, break it out by another dimension, cross-filter a dashboard, or x-ray a table.',
  },
  {
    slug: 'permissions',
    badge: 'permissions',
    eyebrow: 'Permissions',
    h1: 'Fine-grained control over what people can see and do with data',
    standfirst:
      'Granular governance over what each group can reach, across your internal and your embedded analytics, right down to the row and the column.',
    ctas: true,
    media: 'data-sandbox',
    mediaHeight: 381,
    h2: 'From top secret to unrestricted access',
    sub: 'With several layers in between. Decide what people see per database, schema, table, row or column.',
    cards: [
      { icon: 'person', title: 'Manage permissions by group',
        body: 'People can belong to more than one group. Where groups overlap, the most permissive setting is the one that applies, which keeps the rules predictable.' },
      { icon: 'servers', title: 'Row and column level permissions',
        body: 'Use data segregation to scope a table to one tenant, so the same saved question returns only the rows that belong to whoever ran it.',
        links: [{ href: '/features/data-segregation', label: 'Data segregation' }] },
      { icon: 'column', title: 'Database-managed row-level permissions',
        body: 'Map user attributes onto roles your database already defines, and let the privileges you maintain there carry straight through.' },
      { icon: 'collections', title: 'Collection permissions',
        body: 'Decide which groups can view or edit the questions, dashboards and models inside a collection.' },
      { icon: 'click', title: 'Application permissions',
        body: 'Grant a group some administrative powers without making everyone an admin.',
        links: [{ href: '/pricing', label: 'Pro' }, { href: '/pricing', label: 'Enterprise' }] },
      { icon: 'share', title: 'Download results',
        body: 'Control whether a group can export results from a given data source at all, and in what form.' },
    ],
    h2b: 'More info on managing permissions',
    linkCards: [
      { pill: 'Documentation', title: 'Introduction to permissions', href: '/docs/latest/permissions/introduction' },
      { pill: 'Documentation', title: 'Data segregation', href: '/features/data-segregation' },
      { pill: 'Learn', title: 'Guide to permissions', href: '/learn/metabase-basics/administration/permissions/data-permissions' },
    ],
    cta: {
      title: 'Try Metabase 14 days free',
      body: 'Get full control over how your data is reached and used, on every plan.',
    },
    seoTitle: 'Permissions | Metabase',
    seoDescription:
      'Granular permissions by group, down to the row and column, with data sandboxing, collection permissions and download controls.',
  },
  {
    slug: 'query-builder',
    badge: 'query-builder-icon',
    eyebrow: 'Query builder',
    h1: 'Get answers in a few clicks with the query builder',
    standfirst:
      'The query builder lets anyone — including your less data-savvy teammates — put a question together from clicks and menu choices, with no SQL anywhere in sight.',
    ctas: true,
    media: 'query-builder1',
    mediaHeight: 381,
    h2: 'Analytics for everyone',
    sub: 'A point-and-click tool for people who do not write SQL, and a shortcut for the people who do.',
    cards: [
      { icon: 'filter', title: 'Filters and summarizations',
        body: 'Narrow the data and group it from a dropdown, without having to remember what the column was called.' },
      { icon: 'join', title: 'Joins',
        body: 'Ask questions about data that lives across more than one table or model, and let Metabase work out the keys where it can.' },
      { icon: 'formula', title: 'Custom expressions',
        body: 'Go past the basics with expressions that work the way spreadsheet formulas do, so the syntax is already familiar.' },
      { icon: 'multi-level', title: 'Multi-level aggregation',
        body: 'Summarize a summary. Stack another filter or grouping on top of a result you have already aggregated.' },
      { icon: 'play', title: 'Preview results',
        body: 'Check what a filter is doing as you add it, without running the whole query against the whole table.' },
      { icon: 'question-blue-circle-outline', title: 'Question history',
        body: 'Let anyone edit a question while Metabase keeps the versions, so a change that turns out wrong is one click from being undone.' },
    ],
    h2b: 'More about asking questions in Metabase',
    linkCards: [
      { pill: 'Documentation', title: 'Asking questions', href: '/docs/latest/questions/introduction' },
      { pill: 'Learn', title: 'Using the query builder', href: '/learn/metabase-basics/querying-and-dashboards/questions' },
      { pill: 'SQL editor', title: 'Writing SQL', href: '/features/sql-editor' },
    ],
    howto: {
      title: 'How to ask a question with the query builder',
      steps: [
        'Click <b>New &gt; Question</b> at the top right of your Metabase to open the query builder. You can also get to it from a saved question by clicking the editor icon, which is quicker than starting again when all you want is a small change to something that already exists.',
        'Pick the table or model you want to ask about — say the <b>Orders</b> table from the sample data that ships with Metabase.',
        'Click into <b>Filters</b>, choose <b>Created at</b>, and select <b>Last 12 months</b>.',
        'Click <b>+</b> to add another filter. This time choose <b>Total</b>, then pick <b>Greater than</b> from the dropdown, and enter a number to cut off the small orders.',
        'Click into <b>Summarize</b>, choose <b>Sum of…</b>, and pick <b>Taxes</b> as the column to add up.',
        'Use the <b>by</b> box beside it to group the results. Start with <b>Product &gt; Category</b>.',
        'Click <b>+</b> to group by <b>Created at</b> as well, and choose <b>month</b>.',
        'Hit <b>Visualize</b>. You get a chart showing how tax splits across product categories on orders, month by month, which is the question you just described.',
      ],
    },
    cta: {
      title: 'Try Metabase for free for 14 days',
      body: 'The query builder is on every plan, and you can embed it for customer-facing analytics on Pro or Enterprise.',
    },
    seoTitle: 'Query builder | Metabase',
    seoDescription:
      'Build questions from clicks and menus: filters, summaries, joins, custom expressions and multi-level aggregation, with no SQL required.',
  },
  {
    slug: 'sql-editor',
    badge: 'sql-editor',
    eyebrow: 'SQL editor',
    h1: 'Get more detailed results with SQL queries',
    standfirst:
      'For the analysts, scientists, engineers and everyone else who would rather just write the query. The SQL editor gets out of your way, and adds a few things worth having.',
    ctas: true,
    media: 'sql-editor',
    mediaHeight: 381,
    h2: 'SQL queries with a few extra bells and whistles',
    sub: 'The flexibility and control of writing native queries, made a little more comfortable.',
    cards: [
      { icon: 'data', title: 'SQL parameters',
        body: 'Turn a query into a template by adding variables, so the same SQL answers the question for any date range or customer.' },
      { icon: 'servers', title: 'SQL snippets',
        body: 'Save and share the bits of SQL you keep retyping, and update them in one place when the definition changes.' },
      { icon: 'filter', title: 'Dashboard filter',
        body: 'Wire a SQL question up to a dashboard filter, as long as the query exposes a variable for it to drive.',
        links: [{ href: '/pricing', label: 'Pro' }, { href: '/pricing', label: 'Enterprise' }] },
      { icon: 'xray', title: 'Autocomplete',
        body: 'Write faster with completion for keywords, tables and columns, so you are not switching tabs to check a name.' },
      { icon: 'columns', title: 'Data reference',
        body: 'Check the data reference in the sidebar for a reminder of what a table holds and how it connects to the others.' },
      { icon: 'model', title: 'Start from a model',
        body: 'Use a model as the jumping-off point for something more complicated, instead of restating its logic in every query.' },
    ],
    h2b: 'More about asking questions in Metabase',
    linkCards: [
      { pill: 'Documentation', title: 'Writing SQL', href: '/docs/latest/questions/native-editor/writing-sql' },
      { pill: 'Learn', title: 'SQL best practices', href: '/learn/sql-questions' },
      { pill: 'Features', title: 'Query builder', href: '/features/query-builder' },
    ],
    howto: {
      title: 'How to ask a question with SQL',
      steps: [
        'Click <b>New &gt; SQL Query</b> at the top of Metabase. You will not see this option at all if your group has not been given native query access, which is deliberate — it is the setting that decides who gets to write raw SQL.',
        'Write your query. If you are here, you know what to do — we will stay out of the way.',
        'Click the run button to see the results below.',
        'To turn them into a chart, click <b>Visualization</b> and pick whatever fits the shape of the data, clicking through the options to see each one applied.',
        'Save it, put it in a collection or on a dashboard, share it, and carry on.',
      ],
    },
    cta: {
      title: 'Try Metabase 14 days free',
      body: 'Get more granular access to your data with the SQL editor.',
      link: { href: '/pricing', label: 'included on all plans' },
    },
    seoTitle: 'SQL editor | Metabase',
    seoDescription:
      'Write native SQL with parameters, reusable snippets, autocomplete and an inline data reference, and turn the results into charts.',
  },
  {
    slug: 'usage-analytics',
    badge: 'usage-analytics',
    eyebrow: 'Usage analytics',
    h1: "Total visibility into what's going on in your Metabase",
    standfirst:
      'A collection of dashboards, questions and models for understanding how your data is actually being used, how your instance is performing, and who changed what.',
    ctas: true,
    media: 'usage-analytics',
    mediaHeight: 380,
    h2: 'Know who did what, when',
    sub: 'Durable audit logs, usage statistics and reports you can monitor, investigate and get notified about when you need to.',
    cards: [
      { icon: 'Type=Trend', title: 'Usage reports, configuration changes and audit logs',
        body: 'Comprehensive records of how your Metabase is being used, by whom and when, which is usually what compliance is asking for.' },
      { icon: 'Type=Dashboard', title: 'Interactive pre-defined dashboards',
        body: 'Overall trends without building anything yourself: which dashboards get viewed most, which questions run slowest, who is active this month and who has quietly stopped logging in at all.' },
      { icon: 'model', title: 'Models to create custom reports',
        body: 'Your usage and audit data arrives already modelled, so asking a new question of it does not mean learning a new schema.' },
      { icon: 'Type=Alert', title: 'Set up subscriptions and alerts',
        body: 'Get a regular digest, or an alarm when something changes unexpectedly and you would rather know now than at the end of the month.' },
      { icon: 'Type=Dashboard', title: 'Customize prebuilt dashboards',
        body: 'The audit logs are read-only by default so they stay trustworthy and nobody can quietly edit the record, but you can duplicate any dashboard into your own collection and reshape that copy freely.' },
      { icon: 'eye', title: 'Manage access to usage analytics',
        body: 'Give view or edit access where it is needed, without handing out admin to everyone who wants a number.' },
    ],
    h2b: 'Get the most out of usage analytics',
    linkCards: [
      { pill: 'Documentation', title: 'Usage and performance tools', href: '/docs/latest/usage-and-performance-tools/usage-analytics' },
      { pill: 'Release announcement', title: "Learn what's happening in your Metabase…using Metabase", href: '/releases/metabase-48' },
      { pill: 'Video', title: 'See usage analytics in action', href: '/demo' },
    ],
    howto: {
      title: 'How to use usage analytics',
      steps: [
        'Open the <b>Metabase analytics</b> collection in the left sidebar. Admins see it by default; others need to be given access.',
        'Open <b>Metabase metrics</b>, pick a date range, and filter by the user groups you have. You could narrow it to one team to see which dashboards they actually open, and which ones nobody has touched since they were built.',
        'Set up a dashboard subscription so the answer arrives every week without anyone going to look for it.',
      ],
    },
    cta: {
      title: 'Try Metabase 14 days free',
      body: 'Tune your internal analytics and your embedding around how they are really used.',
      link: { href: '/pricing', label: 'Usage analytics is on Pro and Enterprise plans' },
    },
    seoTitle: 'Usage analytics | Metabase',
    seoDescription:
      'Audit logs, usage statistics and prebuilt dashboards showing who used what and when, plus models for building your own reports.',
  },
  {
    slug: 'white-label-analytics',
    badge: 'white-labeled-analytics',
    eyebrow: 'White-label analytics',
    h1: 'White-label analytics for a seamless, branded reporting experience',
    standfirst:
      'Put fully branded analytics inside your SaaS app. Restyle the dashboards, charts and reports with no code, or go further with the React SDK.',
    ctas: true,
    media: 'white-label-analytics',
    mediaHeight: 380,
    h2: 'Key features of our white-labeled embedded analytics',
    sub: 'Customization that covers what you need now, with developer tooling for when that changes.',
    cards: [
      { icon: 'medal', title: 'Branded in-app reporting',
        body: 'Set the name, the logo, the fonts, and the UI and chart colours, so the reporting area reads as a part of your product rather than a window into someone else\u2019s.' },
      { icon: 'eye', title: 'Hide all traces of Metabase',
        body: 'Point help links at your own documentation, swap the illustrations, and leave nothing that says this came from somewhere else.' },
      { icon: 'click', title: 'No-code customization',
        body: 'Restyle the embedded views through configuration alone, without putting a front-end engineer on it.' },
      { icon: 'action-blue', title: 'Go beyond white-labeling',
        body: 'Use Modular Embedding or the SDK to place individual React components exactly where your own layout wants them, rather than fitting your page around one big embedded frame.',
        links: [{ href: '/product/embedded-analytics-sdk', label: 'Modular Embedding SDK' }] },
      { icon: 'formula', title: 'Dynamic theming',
        body: 'Style each component with CSS variables, so switching theme at runtime is a variable change rather than a rebuild.' },
      { icon: 'person', title: 'Customized UX',
        body: 'Override menu names, button labels and placement to build click-paths that match how your customers already work.' },
    ],
    h2b: 'Get started with white-label analytics',
    linkCards: [
      { pill: 'Documentation', title: 'Appearance and branding', href: '/docs/latest/configuring-metabase/appearance' },
      { pill: 'Features', title: 'Embedded analytics SDK', href: '/product/embedded-analytics-sdk' },
      { pill: 'Learn', title: 'Embedding overview', href: '/learn/metabase-basics/embedding/overview' },
    ],
    howto: {
      title: 'How to set up white-label analytics in your app',
      steps: [
        'Choose your white-labeling method. Use Modular Embedding for a quick implementation, or the Modular Embedding SDK when you want control over how the components are composed inside your own layout.',
        'Add your branding — logo, colours, fonts, and whatever custom UI elements you need.',
        'Define permissions, and set up authentication so each customer only ever sees their own data.',
        'Refine the user experience. With the SDK you can override menu names, button placement and tooltips, so the analytics feel native to your app.',
        'Deploy, test with internal users, and iterate on the styling from there.',
      ],
    },
    cta: {
      title: 'Try Metabase 14 days free',
      body: 'Get to a proof of concept with white-labeled analytics quickly.',
      link: { href: '/pricing', label: 'White-labeling is on Pro and Enterprise plans' },
    },
    seoTitle: 'White-label analytics | Metabase',
    seoDescription:
      'Fully branded embedded analytics: set logo, fonts and colours with no code, or compose React components with the Modular Embedding SDK.',
  },
];

export const featureBySlug = (slug: string) => features.find((f) => f.slug === slug);
