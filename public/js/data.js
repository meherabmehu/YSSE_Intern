// Department names are verified. Descriptions below are proposed demo copy.
export const departments = [
  ['admin-hr', 'Admin and HR', 'People & culture', 'Build a supportive team and coordinate recruitment, engagement and development.', ['Recruitment coordination', 'Member support', 'Performance evaluation'], '01'],
  ['business', 'Business Development', 'Partnerships & growth', 'Explore opportunities and partnerships that support meaningful social impact.', ['Market research', 'Partnership development', 'Strategic planning'], '02'],
  ['communication', 'Communication', 'Connections & community', 'Help our community stay informed, connected and involved.', ['Community communication', 'Stakeholder coordination', 'Event communication'], '03'],
  ['content', 'Content Writing', 'Stories & ideas', 'Make complex ideas accessible and tell stories that inspire action.', ['Editorial writing', 'Research', 'Storytelling'], '04'],
  ['design', 'Graphic Design', 'Visuals & expression', 'Turn ideas into clear visual communication for campaigns and initiatives.', ['Campaign visuals', 'Brand consistency', 'Digital design'], '05'],
  ['marketing', 'Marketing and PR', 'Outreach & visibility', 'Connect opportunities with the young people and communities they serve.', ['Campaign planning', 'Public relations', 'Social media'], '06'],
  ['operations', 'Operations Management', 'Planning & delivery', 'Coordinate people, resources and processes to bring initiatives to life.', ['Project coordination', 'Event operations', 'Process improvement'], '07'],
  ['video', 'Video Editing', 'Motion & storytelling', 'Share ideas and stories through engaging video content.', ['Video production', 'Editing', 'Motion storytelling'], '08'],
  ['it', 'IT', 'Technology & systems', 'Build and maintain tools that make collaboration and access easier.', ['Web development', 'Technical support', 'Digital systems'], '09']
].map(([id, name, theme, description, responsibilities, number]) => ({ id, name, theme, description, responsibilities, number }));

export const courses = [
  { id: 'social-entrepreneurship', title: 'Start with social entrepreneurship', category: 'Entrepreneurship', department: 'business', level: 'Beginner', color: 'sage', icon: '↗', description: 'Explore how a purposeful idea can become a solution for your community.', lessons: [
    { title: 'What is social entrepreneurship?', duration: 'Reading · 8 min', text: 'Social entrepreneurship begins with a community need. A social venture uses an enterprise approach to address that need, while measuring its social value alongside financial sustainability. Start by listening to the people affected before designing a solution.' },
    { title: 'Understand the problem', duration: 'Exercise · 15 min', text: 'Choose a challenge in your community. Write down who experiences it, how they currently manage it, and what you still need to learn. Draft five open-ended interview questions. Avoid assuming that your first idea is the best solution.' },
    { title: 'Plan a small experiment', duration: 'Exercise · 15 min', text: 'Define one assumption, one affordable experiment, and one measure of success. For example, interview five potential users before creating a product. Reflect on what you learned and how it changes your idea.' }
  ]},
  { id: 'communication', title: 'Communicate with confidence', category: 'Career skills', department: 'communication', level: 'Beginner', color: 'peach', icon: '◎', description: 'Practise clear communication, constructive feedback and thoughtful teamwork.', lessons: [
    { title: 'Make your message clear', duration: 'Reading · 6 min', text: 'Start with the action or decision your reader needs. Add the context that helps them understand it. Use plain language and finish with a specific next step and deadline when needed.' },
    { title: 'Give useful feedback', duration: 'Exercise · 10 min', text: 'Describe an observable action, explain its impact, and suggest a practical next step. Practise rewriting vague feedback into a clear, respectful message.' }
  ]},
  { id: 'project-planning', title: 'From idea to action', category: 'Leadership', department: 'operations', level: 'Beginner', color: 'lavender', icon: '▦', description: 'Break a community project into achievable steps, responsibilities and milestones.', lessons: [
    { title: 'Define the outcome', duration: 'Reading · 7 min', text: 'Write one clear outcome for your project. Identify the people involved, constraints, and how you will know you succeeded. A small, specific outcome is easier to deliver and evaluate.' },
    { title: 'Build your task board', duration: 'Exercise · 15 min', text: 'List the tasks needed for your outcome. Give each task an owner, deadline and completion criterion. Track them using Backlog, Ready, In progress, Review and Done.' }
  ]}
];

export const updates = [
  { id: 'internship-demo', tag: 'Opportunity', title: 'Your next chapter starts with a purposeful team', summary: 'Explore the virtual internship journey and try a sample application in this demo.', date: 'Demo announcement', href: '#/internship', color: 'sage' },
  { id: 'learning-demo', tag: 'Learning', title: 'Small lessons. Meaningful first steps.', summary: 'Discover sample learning resources in entrepreneurship, communication and leadership.', date: 'Demo resource collection', href: '#/courses', color: 'peach' },
  { id: 'community-demo', tag: 'Community', title: 'Stay connected with YSSE', summary: 'Visit the official social channels for published activities and announcements.', date: 'Official channel', href: 'https://www.facebook.com/YSSEGlobal', color: 'lavender' }
];

export const sources = {
  main: 'https://ysseglobal.org/',
  departments: 'https://internship.ysseglobal.org/departments',
  internship: 'https://internship.ysseglobal.org/home',
  certificates: 'https://verify.ysseglobal.org/',
  facebook: 'https://www.facebook.com/YSSEGlobal',
  linkedin: 'https://www.linkedin.com/company/ysseglobal'
};
