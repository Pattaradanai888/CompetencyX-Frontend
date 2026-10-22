export default {
  app: {
    skipToContent: 'Skip to main content',
  },
  header: {
    signIn: 'Sign in',
    register: 'Create account',
    signOut: 'Sign out',
    account: 'Account',
    signedInAs: 'Signed in as',
  },
  account: {
    emailInvalid: 'Enter a valid email address.',
    passwordTooShort: 'Use at least 8 characters for your password.',
    signInTitle: 'Sign in',
    signInIntro:
      'Sign in to keep what you say about yourself: topics you mark as already held follow your account, not this browser.',
    registerTitle: 'Create an account',
    registerIntro:
      'An account is only needed to mark topics as already held and to list your own sessions. Role Discovery and the Skill Assessment work without one.',
    email: 'Email',
    password: 'Password',
    passwordHint: 'At least 8 characters; avoid something easy to guess.',
    emailRequired: 'Enter your email address to continue.',
    passwordRequired: 'Enter your password to continue.',
    signInAction: 'Sign in',
    registerAction: 'Create account',
    working: 'Please wait…',
    noAccountYet: 'No account yet?',
    haveAccount: 'Already have an account?',
    switchToRegister: 'Create one',
    switchToSignIn: 'Sign in instead',
    signInError: 'Could not sign in',
    registerError: 'Could not create the account',
    alreadySignedIn: 'You are signed in as',
    backHome: 'Back to home',
  },
  index: {
    heroEyebrow: 'Discover your software path',
    heroTitle: 'Find the software role that ',
    heroTitleAccent: 'fits how you think',
    heroSub:
      'Competency guides students through role discovery and technical skill calibration, then turns the result into a clear learning roadmap.',
    startBtn: 'Start discovery',

    heroFooter:
      'Designed for students navigating 11+ software engineering paths.',
    howItWorks: 'How it works',
    twoAssessments: 'Two assessments, one usable direction.',
    howItWorksSub:
      'Role discovery helps students find the role shape that fits their preferences. Skill assessment checks the capabilities needed for that role and produces a practical learning plan.',
    whyStudents: 'Why students use it',
    lessGuessing: 'Less guessing. More evidence.',
    roleFamiliesTitle: 'Software roles overview',
    roleFamiliesSub:
      'Each role path focuses on different problem types, workflows, and technical depth. Pick the one that aligns with how you prefer to think and build.',
    openOnboarding: 'Open onboarding',
    faqTitle: 'FAQ',
    faqSub: 'Clear before you begin.',
    faqIntro: 'Common questions before starting the assessment flow.',
    studentBenefits: [
      'Turns vague interest into a concrete role direction',
      'Separates personality fit from current technical readiness',
      'Gives a practical learning sequence instead of a generic course list',
      'Keeps the assessment low-pressure with one decision at a time',
    ],
    roleFamilies: [
      {
        name: 'Frontend',
        description: 'Interfaces, React, responsive systems',
        details:
          'Best for students who enjoy user experience, visual polish, and turning product ideas into interactive pages.',
      },
      {
        name: 'Backend',
        description: 'APIs, databases, authentication',
        details:
          'Focused on service logic, data reliability, and the server-side foundations that power applications.',
      },
      {
        name: 'Full Stack',
        description: 'End-to-end product engineering',
        details:
          'Balances frontend and backend responsibilities for complete feature delivery across the stack.',
      },
      {
        name: 'Mobile',
        description: 'iOS, Android, cross-platform apps',
        details:
          'Ideal for building app-first experiences with performance, device capabilities, and touch UX in mind.',
      },
      {
        name: 'DevOps',
        description: 'Deployment, automation, reliability',
        details:
          'Centers on CI/CD, infrastructure, observability, and stable software delivery in production.',
      },
      {
        name: 'Data',
        description: 'Pipelines, analytics, machine learning',
        details:
          'For students who like transforming raw data into clear metrics, models, and business decisions.',
      },
      {
        name: 'QA',
        description: 'Quality strategy and test automation',
        details:
          'Emphasizes defect prevention, test design, automation, and confidence before release.',
      },
      {
        name: 'Product',
        description: 'Discovery, prioritization, delivery',
        details:
          'For coordinating user value, scope decisions, and iterative outcomes across cross-functional teams.',
      },
    ],
    timeline: [
      {
        title: 'Start path',
        copy: 'Choose known role or open discovery',
      },
      {
        title: 'Role discovery',
        copy: 'Answer preference and personality prompts',
      },
      {
        title: 'Role match',
        copy: 'Review primary role and alternatives',
      },
      {
        title: 'Skill assessment',
        copy: 'Measure the capabilities behind your chosen role',
      },
      {
        title: 'Roadmap',
        copy: 'Get project-ready action plan and next steps',
      },
    ],
    faqs: [
      {
        question: 'Can I skip the personality assessment?',
        answer:
          'Yes. If you already know your preferred role, select it during onboarding and continue directly into the skill-focused path.',
      },
      {
        question: 'Is this only for beginners?',
        answer:
          'No. The flow works for students who are exploring roles and for students who already have experience but need a clearer roadmap.',
      },
      {
        question: 'What do I get at the end?',
        answer:
          'You get a role-fit read, skill breakdown, gap topics, and a roadmap that turns the result into concrete next steps.',
      },
      {
        question: 'Can I retake the assessment later?',
        answer:
          'Yes. You can restart the flow as your skills evolve and compare your newer roadmap against previous results.',
      },
      {
        question: 'Will this replace my portfolio?',
        answer:
          'No. It complements your portfolio by helping you prioritize what to build next and which skill gaps to close first.',
      },
    ],
  },
  start: {
    eyebrow: 'Onboarding',
    resumeBtn: 'Resume previous session',
    title: 'Choose your preferred role',
    subtitle: 'Search and select a target role to begin the skill assessment.',
    searchPlaceholder: 'Search roles, skills, or interests…',
    clearFilters: 'Clear search',
    emptyCatalog: 'Role catalog is empty.',
    noRolesMatch:
      'No roles match the current search. Reset search or try a broader term.',
    preparingSession: 'Preparing your assessment…',
    startSkillAssessment: 'Select this role and start skill assessment',
    chooseRoleToContinue: 'Choose a role to continue',
    settingUpQuestion: 'Setting up your first question…',
    previewEyebrow: 'Roadmap preview',
    previewDefaultTitle: 'Choose a path to preview its learning arc',
    previewDefaultSub:
      'Select a preferred role to preview the first topics and the overall direction of the assessment.',
    previewSelectedSub:
      'Review the first topics this path emphasizes before you begin.',
    previewLoading: 'Loading roadmap preview…',
    previewNoRoadmap: 'No roadmap preview is available for this role.',
    previewSelectHint: 'Select a role to preview roadmap topics.',
    selectedRole: 'Selected role',
    choosePrompt: 'Select a role from the left panel to inspect details.',
    skills: 'Relevant skills',
    responsibilities: 'Core responsibilities',
    careerInfo: 'Career information',
    roadmapPreview: 'Roadmap topic preview',
    noTopics: 'No roadmap preview is available for this role yet.',
    expandDetails: 'Expand Details',
    collapseDetails: 'Collapse Details',
    workStyle: 'Work style',
    interests: 'Relevant interests',
    careerAreas: 'Career areas',
    environment: 'Work environment',
  },
  preferredRole: {
    resumeBtn: 'Resume previous session',
    eyebrow: 'Onboarding',
    title: 'Do you already have a preferred career role in mind?',
    description:
      'Choose the path that matches where you are now, so Competency can start with the right first step.',
    yesTitle: 'Yes, I already have a preferred role',
    yesCopy:
      'Open role selection, choose your target path, then continue into role-specific skill calibration.',
    noTitle: 'No, I’d like the system to help me discover one',
    noCopy:
      'Start with preference and work-style questions so the system can recommend your best-fit role.',
    yesAction: 'Choose a role',
    noAction: 'Start role discovery',
    preparing: 'Preparing role discovery…',
    footer:
      'You can restart later. This choice only affects the current onboarding session.',
    errorTitle: 'Could not start role discovery',
  },
  results: {
    loadError: 'Could not load results',
    startSkillAssessmentError: 'Could not start skill assessment',
    eyebrow: 'Your role discovery result',
    bestMatch: 'Your best match',
    bestMatchOf: 'Best match of {n} roles',
    strongestPillars: 'What points you here',
    chooseTitle: 'Pick a role for the skill assessment',
    chooseIntro:
      'Your best match is selected. Pick another to measure yourself against it instead.',
    continueWith: 'Continue with {role}',
    preparing: 'Preparing skill assessment…',
    fallbackRole: 'Recommended software role',
    fallbackDescription:
      'Your answers point toward this path as the clearest next direction.',
    families: {
      build: 'Building software',
      data: 'Data and AI',
      infrastructure: 'Infrastructure, security and quality',
      product: 'Product, design and people',
    },
  },
  roadmaps: {
    backToRoleDiscovery: 'Back to your role results',
    title: 'Your {role} roadmap',
    intro:
      'Built from your skill assessment. Start at the top: each topic comes after the ones it builds on.',
    readinessTitle: 'Readiness for this role',
    readinessYou: 'You now',
    readinessTarget: 'Role target',
    readinessGap: '{n}% to go to reach the role target',
    readinessAtTarget: 'You have reached the role target',
    readinessNoTarget:
      'This role has no target yet, so only your level is shown.',
    nextTopicsTitle: 'Start with these topics',
    nextTopicsIntro:
      'Topics you rated low come first. A topic you were not asked about is marked "Not assessed yet" and is not counted as a gap.',
    nextTopicsEmpty:
      'No suggested topics right now. Open the full roadmap to browse every topic.',
    stateAssessedGap: 'Gap to close',
    stateUnassessed: 'Not assessed yet',
    heldTitle: 'Topics you already know',
    heldStatement: 'You said you can already work on this',
    markHeld: 'I already know this',
    undoMark: 'Undo mark',
    markingRequiresAccount:
      'Marking a topic as already held requires an account.',
    signInToMark: 'Sign in',
    markErrorTitle: 'Could not save the mark',
    capabilityTitle: 'Where you stand on each skill set',
    capabilityIntro:
      'Green is your level today. The dashed blue line is what this role expects.',
    capabilityMap: 'Skill set map',
    asIs: 'You',
    toBe: 'Role target',
    viewBoth: 'Both',
    chartUnavailable: 'There is no skill set data to plot yet.',
    strengthsTitle: 'Strongest',
    gapsTitle: 'Fill in next',
    workStyleTitle: 'How you like to work',
    workStyleAligned:
      'Your role discovery answers point the same way as {role}. These were your strongest work-style areas.',
    workStyleNotAligned:
      'Your role discovery answers lean away from {role} in places. These were your strongest work-style areas.',
    viewFullRoadmap: 'View full roadmap',
    hideFullRoadmap: 'Hide full roadmap',
    fullRoadmapTitle: 'Full roadmap',
    fullRoadmapIntro:
      'Every topic for this role, in learning order. Open a topic to see where to learn it.',
    priority: 'Priority',
    buildsOn: 'Builds on:',
    resources: 'Where to learn',
    labelBook: 'Book',
    labelVideo: 'Video',
    labelArticle: 'Article',
    labelCourse: 'Course',
    labelOfficial: 'Official',
    labelWebsite: 'Website',
    labelRoadmap: 'Roadmap',
    labelFeed: 'Feed',
    searchWeb: 'Search the web',
    watchOnYouTube: 'Watch on YouTube',
    confidenceHigh: 'Answering more would not change these suggestions.',
    confidenceLow:
      'The assessment ended at the question limit before the suggestions settled, so treat this order as a starting point.',
    saving: 'Saving your answers…',
    movingNext: 'Next question…',
    questionCount: 'Question {n} · up to {max}',
    rateToday: 'Answer for what you can do today, not what you plan to learn.',
    leaveAssessment: 'Leave the assessment',
    scaleGroupLabel: 'Agreement, from strongly disagree to strongly agree',
    previous: 'Previous',
    refreshPrompt:
      'If this does not change in a few seconds, refresh the page. Your answers are kept.',
    resolvingQuestion: 'Getting the next question',
    assessmentProgress: 'Assessment progress',
    skillCalibration: 'Skill assessment',
    roleTrack: '{role} skills',
    saveErrorTitle: 'Could not save Skill Assessment',
    saveTimeoutMessage: 'Saving took too long. Please try again.',
    nextQuestionErrorTitle: 'Could not fetch the next question',
    nextQuestionErrorHint: 'Check your connection and pick the answer again.',
  },
}
