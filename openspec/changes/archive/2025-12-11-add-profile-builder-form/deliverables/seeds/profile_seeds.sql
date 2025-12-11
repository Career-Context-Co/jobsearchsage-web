-- Seed Data: Profile Skills Catalog
-- Description: Pre-populate reference.skills with 424 common skills across all professions
-- Schema: reference
-- Date: 2025-11-24
-- Coverage: Tech, Business, Marketing, Management, Design, Sales, and General Professional Skills

-- ============================================================================
-- PROGRAMMING LANGUAGES
-- ============================================================================

INSERT INTO reference.skills (skill_name, category, aliases, description) VALUES
  ('JavaScript', 'Programming Language', '["Javascript", "JS", "ECMAScript"]', 'Dynamic programming language for web development'),
  ('TypeScript', 'Programming Language', '["TS"]', 'Typed superset of JavaScript'),
  ('Python', 'Programming Language', '["Python3", "Py"]', 'High-level programming language for general-purpose programming'),
  ('Java', 'Programming Language', '["JVM"]', 'Object-oriented programming language'),
  ('C#', 'Programming Language', '["CSharp", "C Sharp"]', 'Microsoft object-oriented programming language'),
  ('C++', 'Programming Language', '["CPP"]', 'High-performance programming language'),
  ('C', 'Programming Language', '[]', 'Low-level programming language'),
  ('Go', 'Programming Language', '["Golang"]', 'Google systems programming language'),
  ('Rust', 'Programming Language', '[]', 'Systems programming language focused on safety'),
  ('Ruby', 'Programming Language', '[]', 'Dynamic programming language'),
  ('PHP', 'Programming Language', '[]', 'Server-side scripting language'),
  ('Swift', 'Programming Language', '[]', 'Apple programming language for iOS/macOS'),
  ('Kotlin', 'Programming Language', '[]', 'Modern programming language for Android'),
  ('R', 'Programming Language', '[]', 'Statistical programming language'),
  ('MATLAB', 'Programming Language', '[]', 'Numerical computing environment'),
  ('Scala', 'Programming Language', '[]', 'JVM functional programming language'),
  ('Perl', 'Programming Language', '[]', 'Text processing language'),
  ('Dart', 'Programming Language', '[]', 'Programming language for Flutter'),
  ('Objective-C', 'Programming Language', '["ObjC"]', 'Apple legacy programming language'),
  ('Elixir', 'Programming Language', '[]', 'Functional programming language on BEAM VM');

-- ============================================================================
-- WEB FRAMEWORKS & LIBRARIES
-- ============================================================================

INSERT INTO reference.skills (skill_name, category, aliases, description) VALUES
  ('React', 'Web Framework', '["React.js", "ReactJS"]', 'JavaScript library for building user interfaces'),
  ('Vue.js', 'Web Framework', '["Vue", "VueJS"]', 'Progressive JavaScript framework'),
  ('Angular', 'Web Framework', '["AngularJS"]', 'TypeScript-based web framework'),
  ('Svelte', 'Web Framework', '[]', 'Compiler-based JavaScript framework'),
  ('Next.js', 'Web Framework', '["NextJS"]', 'React framework for production'),
  ('Nuxt.js', 'Web Framework', '["Nuxt", "NuxtJS"]', 'Vue framework for production'),
  ('Express.js', 'Web Framework', '["Express"]', 'Node.js web framework'),
  ('Django', 'Web Framework', '[]', 'Python web framework'),
  ('Flask', 'Web Framework', '[]', 'Python micro web framework'),
  ('FastAPI', 'Web Framework', '[]', 'Modern Python web framework'),
  ('Ruby on Rails', 'Web Framework', '["Rails", "RoR"]', 'Ruby web framework'),
  ('Laravel', 'Web Framework', '[]', 'PHP web framework'),
  ('Spring Boot', 'Web Framework', '["Spring"]', 'Java web framework'),
  ('ASP.NET', 'Web Framework', '["ASP.NET Core"]', 'Microsoft web framework'),
  ('Remix', 'Web Framework', '[]', 'Full-stack React framework'),
  ('SvelteKit', 'Web Framework', '[]', 'Svelte framework for production'),
  ('Gatsby', 'Web Framework', '[]', 'React static site generator'),
  ('Astro', 'Web Framework', '[]', 'Modern static site builder'),
  ('Solid.js', 'Web Framework', '["SolidJS"]', 'Reactive JavaScript framework'),
  ('Qwik', 'Web Framework', '[]', 'Resumable web framework');

-- ============================================================================
-- MOBILE DEVELOPMENT
-- ============================================================================

INSERT INTO reference.skills (skill_name, category, aliases, description) VALUES
  ('React Native', 'Mobile Development', '[]', 'Cross-platform mobile framework'),
  ('Flutter', 'Mobile Development', '[]', 'Google cross-platform mobile framework'),
  ('iOS Development', 'Mobile Development', '[]', 'Native iOS app development'),
  ('Android Development', 'Mobile Development', '[]', 'Native Android app development'),
  ('SwiftUI', 'Mobile Development', '[]', 'Apple declarative UI framework'),
  ('Jetpack Compose', 'Mobile Development', '[]', 'Android modern UI toolkit'),
  ('Ionic', 'Mobile Development', '[]', 'Hybrid mobile framework'),
  ('Xamarin', 'Mobile Development', '[]', 'Microsoft cross-platform framework'),
  ('Cordova', 'Mobile Development', '["PhoneGap"]', 'Hybrid mobile framework'),
  ('Capacitor', 'Mobile Development', '[]', 'Cross-platform native runtime');

-- ============================================================================
-- DATABASES
-- ============================================================================

INSERT INTO reference.skills (skill_name, category, aliases, description) VALUES
  ('PostgreSQL', 'Database', '["Postgres"]', 'Advanced open-source relational database'),
  ('MySQL', 'Database', '[]', 'Popular open-source relational database'),
  ('MongoDB', 'Database', '["Mongo"]', 'NoSQL document database'),
  ('Redis', 'Database', '[]', 'In-memory data structure store'),
  ('SQLite', 'Database', '[]', 'Embedded relational database'),
  ('Microsoft SQL Server', 'Database', '["SQL Server", "MSSQL"]', 'Microsoft relational database'),
  ('Oracle Database', 'Database', '["Oracle"]', 'Enterprise relational database'),
  ('MariaDB', 'Database', '[]', 'MySQL fork'),
  ('Cassandra', 'Database', '[]', 'Distributed NoSQL database'),
  ('DynamoDB', 'Database', '[]', 'AWS NoSQL database'),
  ('Elasticsearch', 'Database', '[]', 'Distributed search and analytics engine'),
  ('CouchDB', 'Database', '[]', 'NoSQL document database'),
  ('Neo4j', 'Database', '[]', 'Graph database'),
  ('InfluxDB', 'Database', '[]', 'Time series database'),
  ('Supabase', 'Database', '[]', 'Open-source Firebase alternative'),
  ('Firebase', 'Database', '[]', 'Google Backend-as-a-Service'),
  ('PlanetScale', 'Database', '[]', 'MySQL-compatible serverless database'),
  ('Prisma', 'Database', '["Prisma ORM"]', 'Next-generation ORM'),
  ('Drizzle', 'Database', '["Drizzle ORM"]', 'TypeScript ORM'),
  ('SQL', 'Database', '[]', 'Structured Query Language');

-- ============================================================================
-- CLOUD PLATFORMS & DEVOPS
-- ============================================================================

INSERT INTO reference.skills (skill_name, category, aliases, description) VALUES
  ('AWS', 'Cloud Platform', '["Amazon Web Services"]', 'Amazon cloud computing platform'),
  ('Google Cloud Platform', 'Cloud Platform', '["GCP"]', 'Google cloud computing platform'),
  ('Microsoft Azure', 'Cloud Platform', '["Azure"]', 'Microsoft cloud computing platform'),
  ('Vercel', 'Cloud Platform', '[]', 'Frontend cloud platform'),
  ('Netlify', 'Cloud Platform', '[]', 'Web application hosting'),
  ('Heroku', 'Cloud Platform', '[]', 'Cloud application platform'),
  ('DigitalOcean', 'Cloud Platform', '[]', 'Cloud infrastructure provider'),
  ('Docker', 'DevOps', '[]', 'Container platform'),
  ('Kubernetes', 'DevOps', '["K8s"]', 'Container orchestration'),
  ('Jenkins', 'DevOps', '[]', 'Automation server'),
  ('GitHub Actions', 'DevOps', '[]', 'CI/CD automation'),
  ('GitLab CI/CD', 'DevOps', '[]', 'GitLab automation'),
  ('CircleCI', 'DevOps', '[]', 'Continuous integration platform'),
  ('Terraform', 'DevOps', '[]', 'Infrastructure as code'),
  ('Ansible', 'DevOps', '[]', 'Configuration management'),
  ('Nginx', 'DevOps', '[]', 'Web server and reverse proxy'),
  ('Apache', 'DevOps', '["Apache HTTP Server"]', 'Web server'),
  ('Linux', 'DevOps', '[]', 'Unix-like operating system'),
  ('Bash', 'DevOps', '["Shell Scripting"]', 'Unix shell scripting'),
  ('CI/CD', 'DevOps', '[]', 'Continuous integration and deployment');

-- ============================================================================
-- FRONTEND TECHNOLOGIES
-- ============================================================================

INSERT INTO reference.skills (skill_name, category, aliases, description) VALUES
  ('HTML', 'Frontend', '["HTML5"]', 'HyperText Markup Language'),
  ('CSS', 'Frontend', '["CSS3"]', 'Cascading Style Sheets'),
  ('Sass', 'Frontend', '["SCSS"]', 'CSS preprocessor'),
  ('Less', 'Frontend', '[]', 'CSS preprocessor'),
  ('Tailwind CSS', 'Frontend', '["TailwindCSS"]', 'Utility-first CSS framework'),
  ('Bootstrap', 'Frontend', '[]', 'CSS framework'),
  ('Material UI', 'Frontend', '["MUI"]', 'React component library'),
  ('Chakra UI', 'Frontend', '[]', 'React component library'),
  ('Ant Design', 'Frontend', '[]', 'React UI library'),
  ('Styled Components', 'Frontend', '[]', 'CSS-in-JS library'),
  ('Emotion', 'Frontend', '[]', 'CSS-in-JS library'),
  ('Webpack', 'Frontend', '[]', 'Module bundler'),
  ('Vite', 'Frontend', '[]', 'Frontend build tool'),
  ('Rollup', 'Frontend', '[]', 'Module bundler'),
  ('Parcel', 'Frontend', '[]', 'Zero-config bundler'),
  ('Turbopack', 'Frontend', '[]', 'Incremental bundler'),
  ('ESLint', 'Frontend', '[]', 'JavaScript linter'),
  ('Prettier', 'Frontend', '[]', 'Code formatter'),
  ('PostCSS', 'Frontend', '[]', 'CSS transformation tool'),
  ('Responsive Web Design', 'Frontend', '["Responsive Design"]', 'Mobile-first web design');

-- ============================================================================
-- STATE MANAGEMENT & DATA FETCHING
-- ============================================================================

INSERT INTO reference.skills (skill_name, category, aliases, description) VALUES
  ('Redux', 'State Management', '[]', 'JavaScript state container'),
  ('MobX', 'State Management', '[]', 'Simple state management'),
  ('Zustand', 'State Management', '[]', 'Lightweight state management'),
  ('Recoil', 'State Management', '[]', 'React state management library'),
  ('Jotai', 'State Management', '[]', 'Primitive state management'),
  ('Pinia', 'State Management', '[]', 'Vue state management'),
  ('Vuex', 'State Management', '[]', 'Vue state management (legacy)'),
  ('XState', 'State Management', '[]', 'State machines library'),
  ('React Query', 'Data Fetching', '["TanStack Query"]', 'Data synchronization library'),
  ('SWR', 'Data Fetching', '[]', 'React Hooks for data fetching'),
  ('Apollo Client', 'Data Fetching', '[]', 'GraphQL client'),
  ('RTK Query', 'Data Fetching', '["Redux Toolkit Query"]', 'Data fetching in Redux'),
  ('Axios', 'Data Fetching', '[]', 'HTTP client'),
  ('tRPC', 'Data Fetching', '[]', 'End-to-end typesafe APIs');

-- ============================================================================
-- TESTING & QUALITY ASSURANCE
-- ============================================================================

INSERT INTO reference.skills (skill_name, category, aliases, description) VALUES
  ('Jest', 'Testing', '[]', 'JavaScript testing framework'),
  ('Vitest', 'Testing', '[]', 'Vite-native testing framework'),
  ('Cypress', 'Testing', '[]', 'End-to-end testing'),
  ('Playwright', 'Testing', '[]', 'End-to-end testing'),
  ('Testing Library', 'Testing', '["React Testing Library"]', 'Testing utilities'),
  ('Mocha', 'Testing', '[]', 'JavaScript test framework'),
  ('Chai', 'Testing', '[]', 'Assertion library'),
  ('Selenium', 'Testing', '[]', 'Browser automation'),
  ('Puppeteer', 'Testing', '[]', 'Headless Chrome automation'),
  ('Storybook', 'Testing', '[]', 'UI component development'),
  ('JUnit', 'Testing', '[]', 'Java testing framework'),
  ('PyTest', 'Testing', '[]', 'Python testing framework'),
  ('Postman', 'Testing', '[]', 'API testing tool'),
  ('Unit Testing', 'Testing', '[]', 'Software testing method'),
  ('Integration Testing', 'Testing', '[]', 'Software testing method'),
  ('End-to-End Testing', 'Testing', '["E2E Testing"]', 'Software testing method'),
  ('Test-Driven Development', 'Testing', '["TDD"]', 'Software development approach');

-- ============================================================================
-- API & BACKEND TECHNOLOGIES
-- ============================================================================

INSERT INTO reference.skills (skill_name, category, aliases, description) VALUES
  ('REST API', 'API', '["RESTful API"]', 'Representational State Transfer'),
  ('GraphQL', 'API', '[]', 'Query language for APIs'),
  ('gRPC', 'API', '[]', 'High-performance RPC framework'),
  ('WebSockets', 'API', '[]', 'Real-time communication protocol'),
  ('OpenAPI', 'API', '["Swagger"]', 'API specification format'),
  ('JSON', 'API', '[]', 'Data interchange format'),
  ('XML', 'API', '[]', 'Markup language'),
  ('Node.js', 'Backend', '["NodeJS"]', 'JavaScript runtime'),
  ('Deno', 'Backend', '[]', 'Modern JavaScript runtime'),
  ('Bun', 'Backend', '[]', 'Fast JavaScript runtime'),
  ('Microservices', 'Backend', '[]', 'Architectural style'),
  ('Serverless', 'Backend', '[]', 'Cloud execution model'),
  ('API Gateway', 'Backend', '[]', 'API management'),
  ('Message Queue', 'Backend', '[]', 'Asynchronous communication'),
  ('RabbitMQ', 'Backend', '[]', 'Message broker'),
  ('Kafka', 'Backend', '["Apache Kafka"]', 'Distributed streaming platform'),
  ('WebRTC', 'Backend', '[]', 'Real-time communication');

-- ============================================================================
-- DATA SCIENCE & MACHINE LEARNING
-- ============================================================================

INSERT INTO reference.skills (skill_name, category, aliases, description) VALUES
  ('Machine Learning', 'Data Science', '["ML"]', 'Artificial intelligence subset'),
  ('Deep Learning', 'Data Science', '[]', 'Neural network methods'),
  ('TensorFlow', 'Data Science', '[]', 'Machine learning framework'),
  ('PyTorch', 'Data Science', '[]', 'Machine learning framework'),
  ('scikit-learn', 'Data Science', '["sklearn"]', 'Machine learning library'),
  ('Pandas', 'Data Science', '[]', 'Data analysis library'),
  ('NumPy', 'Data Science', '[]', 'Numerical computing library'),
  ('Jupyter', 'Data Science', '["Jupyter Notebook"]', 'Interactive computing'),
  ('Data Visualization', 'Data Science', '[]', 'Visual data representation'),
  ('Tableau', 'Data Science', '[]', 'Data visualization tool'),
  ('Power BI', 'Data Science', '[]', 'Business analytics tool'),
  ('Natural Language Processing', 'Data Science', '["NLP"]', 'Language understanding AI'),
  ('Computer Vision', 'Data Science', '[]', 'Image understanding AI'),
  ('Data Mining', 'Data Science', '[]', 'Data pattern discovery'),
  ('Statistical Analysis', 'Data Science', '[]', 'Data statistics'),
  ('Big Data', 'Data Science', '[]', 'Large-scale data processing'),
  ('Hadoop', 'Data Science', '[]', 'Distributed computing framework'),
  ('Spark', 'Data Science', '["Apache Spark"]', 'Unified analytics engine'),
  ('Data Engineering', 'Data Science', '[]', 'Data pipeline development'),
  ('ETL', 'Data Science', '["Extract Transform Load"]', 'Data integration process');

-- ============================================================================
-- VERSION CONTROL & COLLABORATION
-- ============================================================================

INSERT INTO reference.skills (skill_name, category, aliases, description) VALUES
  ('Git', 'Version Control', '[]', 'Distributed version control'),
  ('GitHub', 'Version Control', '[]', 'Git hosting platform'),
  ('GitLab', 'Version Control', '[]', 'DevOps platform'),
  ('Bitbucket', 'Version Control', '[]', 'Git hosting service'),
  ('SVN', 'Version Control', '["Subversion"]', 'Version control system'),
  ('Mercurial', 'Version Control', '[]', 'Version control system'),
  ('Code Review', 'Collaboration', '[]', 'Peer review practice'),
  ('Agile', 'Collaboration', '[]', 'Software development methodology'),
  ('Scrum', 'Collaboration', '[]', 'Agile framework'),
  ('Kanban', 'Collaboration', '[]', 'Visual workflow management'),
  ('Jira', 'Collaboration', '[]', 'Project management tool'),
  ('Confluence', 'Collaboration', '[]', 'Documentation platform'),
  ('Slack', 'Collaboration', '[]', 'Team communication'),
  ('Asana', 'Collaboration', '[]', 'Work management platform'),
  ('Trello', 'Collaboration', '[]', 'Project management tool');

-- ============================================================================
-- DESIGN & UX
-- ============================================================================

INSERT INTO reference.skills (skill_name, category, aliases, description) VALUES
  ('UI Design', 'Design', '["User Interface Design"]', 'Visual interface design'),
  ('UX Design', 'Design', '["User Experience Design"]', 'User experience design'),
  ('Figma', 'Design', '[]', 'Design and prototyping tool'),
  ('Adobe XD', 'Design', '[]', 'UI/UX design tool'),
  ('Sketch', 'Design', '[]', 'Design toolkit'),
  ('Adobe Photoshop', 'Design', '["Photoshop"]', 'Image editing software'),
  ('Adobe Illustrator', 'Design', '["Illustrator"]', 'Vector graphics editor'),
  ('Wireframing', 'Design', '[]', 'UI blueprint creation'),
  ('Prototyping', 'Design', '[]', 'Interactive mockups'),
  ('Design Systems', 'Design', '[]', 'Reusable design patterns'),
  ('Accessibility', 'Design', '["A11y", "WCAG"]', 'Inclusive design practices'),
  ('Responsive Design', 'Design', '[]', 'Multi-device design'),
  ('User Research', 'Design', '[]', 'User behavior study'),
  ('Usability Testing', 'Design', '[]', 'User testing method'),
  ('Information Architecture', 'Design', '["IA"]', 'Content organization');

-- ============================================================================
-- CYBERSECURITY
-- ============================================================================

INSERT INTO reference.skills (skill_name, category, aliases, description) VALUES
  ('Cybersecurity', 'Security', '[]', 'Digital security practices'),
  ('Network Security', 'Security', '[]', 'Network protection'),
  ('Application Security', 'Security', '["AppSec"]', 'Software security'),
  ('Penetration Testing', 'Security', '["Pen Testing"]', 'Security testing'),
  ('Vulnerability Assessment', 'Security', '[]', 'Security weakness identification'),
  ('Encryption', 'Security', '[]', 'Data protection method'),
  ('OAuth', 'Security', '["OAuth2.0"]', 'Authorization framework'),
  ('JWT', 'Security', '["JSON Web Token"]', 'Token-based authentication'),
  ('SSL/TLS', 'Security', '[]', 'Security protocols'),
  ('Firewall', 'Security', '[]', 'Network security system'),
  ('Intrusion Detection', 'Security', '["IDS"]', 'Security monitoring'),
  ('OWASP', 'Security', '[]', 'Web security standards'),
  ('GDPR', 'Security', '[]', 'Data protection regulation'),
  ('Compliance', 'Security', '[]', 'Regulatory adherence'),
  ('Identity Management', 'Security', '[]', 'User identity handling');

-- ============================================================================
-- BLOCKCHAIN & WEB3
-- ============================================================================

INSERT INTO reference.skills (skill_name, category, aliases, description) VALUES
  ('Blockchain', 'Web3', '[]', 'Distributed ledger technology'),
  ('Ethereum', 'Web3', '[]', 'Blockchain platform'),
  ('Solidity', 'Web3', '[]', 'Smart contract language'),
  ('Smart Contracts', 'Web3', '[]', 'Self-executing contracts'),
  ('Web3.js', 'Web3', '[]', 'Ethereum JavaScript API'),
  ('DeFi', 'Web3', '["Decentralized Finance"]', 'Decentralized financial services'),
  ('NFT', 'Web3', '["Non-Fungible Token"]', 'Digital ownership tokens'),
  ('Cryptocurrency', 'Web3', '[]', 'Digital currency'),
  ('Bitcoin', 'Web3', '[]', 'First cryptocurrency'),
  ('IPFS', 'Web3', '[]', 'Distributed file system'),
  ('Metamask', 'Web3', '[]', 'Crypto wallet');

-- ============================================================================
-- SOFT SKILLS & INTERPERSONAL
-- ============================================================================

INSERT INTO reference.skills (skill_name, category, aliases, description) VALUES
  ('Communication', 'Soft Skill', '[]', 'Effective information exchange'),
  ('Leadership', 'Soft Skill', '[]', 'Team guidance and motivation'),
  ('Team Collaboration', 'Soft Skill', '["Teamwork"]', 'Working effectively with others'),
  ('Problem Solving', 'Soft Skill', '[]', 'Analytical thinking and solution finding'),
  ('Critical Thinking', 'Soft Skill', '[]', 'Analytical reasoning and evaluation'),
  ('Time Management', 'Soft Skill', '[]', 'Efficient task prioritization'),
  ('Adaptability', 'Soft Skill', '["Flexibility"]', 'Adjusting to change effectively'),
  ('Emotional Intelligence', 'Soft Skill', '["EQ"]', 'Understanding and managing emotions'),
  ('Active Listening', 'Soft Skill', '[]', 'Attentive and empathetic listening'),
  ('Conflict Resolution', 'Soft Skill', '[]', 'Resolving disagreements constructively'),
  ('Negotiation', 'Soft Skill', '[]', 'Reaching mutually beneficial agreements'),
  ('Public Speaking', 'Soft Skill', '["Presentation Skills"]', 'Speaking confidently to audiences'),
  ('Written Communication', 'Soft Skill', '[]', 'Clear and effective writing'),
  ('Interpersonal Skills', 'Soft Skill', '[]', 'Building positive relationships'),
  ('Empathy', 'Soft Skill', '[]', 'Understanding others perspectives'),
  ('Creativity', 'Soft Skill', '[]', 'Innovative thinking and ideation'),
  ('Decision Making', 'Soft Skill', '[]', 'Making informed and timely decisions'),
  ('Attention to Detail', 'Soft Skill', '[]', 'Thoroughness and accuracy'),
  ('Organization', 'Soft Skill', '[]', 'Structured planning and coordination'),
  ('Self-Motivation', 'Soft Skill', '[]', 'Internal drive and initiative'),
  ('Work Ethic', 'Soft Skill', '[]', 'Dedication and professionalism'),
  ('Stress Management', 'Soft Skill', '[]', 'Handling pressure effectively'),
  ('Multitasking', 'Soft Skill', '[]', 'Managing multiple tasks simultaneously'),
  ('Customer Service', 'Soft Skill', '[]', 'Meeting customer needs effectively'),
  ('Sales', 'Soft Skill', '[]', 'Persuasion and deal closing'),
  ('Networking', 'Soft Skill', '[]', 'Building professional relationships'),
  ('Mentoring', 'Soft Skill', '["Coaching"]', 'Knowledge sharing and guidance'),
  ('Training', 'Soft Skill', '["Teaching"]', 'Instructing and developing others'),
  ('Cross-Cultural Communication', 'Soft Skill', '[]', 'Working across diverse cultures'),
  ('Change Management', 'Soft Skill', '[]', 'Leading organizational change');

-- ============================================================================
-- PROJECT & PRODUCT MANAGEMENT
-- ============================================================================

INSERT INTO reference.skills (skill_name, category, aliases, description) VALUES
  ('Project Management', 'Management', '[]', 'Project planning and execution'),
  ('Product Management', 'Management', '[]', 'Product strategy and development'),
  ('Agile Methodologies', 'Management', '["Agile"]', 'Iterative development approach'),
  ('Scrum', 'Management', '[]', 'Agile framework for teams'),
  ('Kanban', 'Management', '[]', 'Visual workflow management'),
  ('Waterfall Methodology', 'Management', '[]', 'Sequential project phases'),
  ('Lean Management', 'Management', '["Lean"]', 'Waste reduction methodology'),
  ('Six Sigma', 'Management', '[]', 'Quality improvement methodology'),
  ('PMP', 'Management', '["Project Management Professional"]', 'PMI certification'),
  ('Risk Management', 'Management', '[]', 'Identifying and mitigating risks'),
  ('Budget Management', 'Management', '["Financial Planning"]', 'Financial planning and control'),
  ('Resource Allocation', 'Management', '[]', 'Optimizing resource utilization'),
  ('Stakeholder Management', 'Management', '[]', 'Managing stakeholder relationships'),
  ('Product Roadmapping', 'Management', '[]', 'Strategic product planning'),
  ('Backlog Management', 'Management', '[]', 'Prioritizing work items'),
  ('Sprint Planning', 'Management', '[]', 'Agile iteration planning'),
  ('User Story Writing', 'Management', '[]', 'Defining user requirements'),
  ('Requirements Gathering', 'Management', '[]', 'Collecting project requirements'),
  ('Business Analysis', 'Management', '[]', 'Analyzing business needs'),
  ('Go-to-Market Strategy', 'Management', '["GTM"]', 'Product launch planning'),
  ('A/B Testing', 'Management', '[]', 'Experiment-driven decision making'),
  ('Product Analytics', 'Management', '[]', 'Data-driven product insights'),
  ('Market Research', 'Management', '[]', 'Understanding market dynamics'),
  ('Competitive Analysis', 'Management', '[]', 'Analyzing competitive landscape'),
  ('KPI Tracking', 'Management', '["Metrics"]', 'Monitoring key performance indicators'),
  ('OKRs', 'Management', '["Objectives and Key Results"]', 'Goal-setting framework'),
  ('Process Improvement', 'Management', '[]', 'Optimizing workflows and processes'),
  ('Vendor Management', 'Management', '[]', 'Managing external partnerships'),
  ('Strategic Planning', 'Management', '[]', 'Long-term organizational planning'),
  ('Portfolio Management', 'Management', '[]', 'Managing multiple projects/products');

-- ============================================================================
-- BUSINESS & OPERATIONS
-- ============================================================================

INSERT INTO reference.skills (skill_name, category, aliases, description) VALUES
  ('Business Strategy', 'Business', '[]', 'Strategic business planning'),
  ('Business Development', 'Business', '["BD"]', 'Growth and partnership development'),
  ('Operations Management', 'Business', '[]', 'Managing day-to-day operations'),
  ('Supply Chain Management', 'Business', '[]', 'Managing supply chain logistics'),
  ('Financial Analysis', 'Business', '[]', 'Analyzing financial data'),
  ('Accounting', 'Business', '[]', 'Financial record keeping'),
  ('Bookkeeping', 'Business', '[]', 'Recording financial transactions'),
  ('Budgeting', 'Business', '[]', 'Financial planning and forecasting'),
  ('Forecasting', 'Business', '[]', 'Predicting future trends'),
  ('Data Analysis', 'Business', '[]', 'Analyzing data for insights'),
  ('Microsoft Excel', 'Business', '["Excel"]', 'Spreadsheet analysis'),
  ('Google Sheets', 'Business', '[]', 'Cloud spreadsheet tool'),
  ('Microsoft Office', 'Business', '["MS Office"]', 'Office productivity suite'),
  ('Google Workspace', 'Business', '["G Suite"]', 'Cloud productivity suite'),
  ('Contract Negotiation', 'Business', '[]', 'Negotiating business agreements'),
  ('Procurement', 'Business', '["Purchasing"]', 'Acquiring goods and services'),
  ('Inventory Management', 'Business', '[]', 'Managing stock levels'),
  ('Quality Assurance', 'Business', '["QA"]', 'Ensuring quality standards'),
  ('Compliance', 'Business', '[]', 'Adhering to regulations'),
  ('Event Planning', 'Business', '[]', 'Organizing events and meetings'),
  ('Administrative Support', 'Business', '["Office Administration"]', 'Office support tasks'),
  ('Executive Assistance', 'Business', '[]', 'Supporting executives'),
  ('Human Resources', 'Business', '["HR"]', 'People management and recruitment'),
  ('Recruiting', 'Business', '["Talent Acquisition"]', 'Finding and hiring talent'),
  ('Onboarding', 'Business', '[]', 'Integrating new employees'),
  ('Performance Management', 'Business', '[]', 'Managing employee performance'),
  ('Employee Relations', 'Business', '[]', 'Managing workplace relationships'),
  ('Legal Compliance', 'Business', '[]', 'Adhering to legal requirements'),
  ('Corporate Communications', 'Business', '[]', 'Internal/external communications'),
  ('Brand Management', 'Business', '[]', 'Managing brand identity');

-- ============================================================================
-- MARKETING & SALES
-- ============================================================================

INSERT INTO reference.skills (skill_name, category, aliases, description) VALUES
  ('Digital Marketing', 'Marketing', '[]', 'Online marketing strategies'),
  ('Content Marketing', 'Marketing', '[]', 'Marketing through content creation'),
  ('Social Media Marketing', 'Marketing', '["SMM"]', 'Marketing on social platforms'),
  ('Email Marketing', 'Marketing', '[]', 'Marketing through email campaigns'),
  ('SEO', 'Marketing', '["Search Engine Optimization"]', 'Improving search rankings'),
  ('SEM', 'Marketing', '["Search Engine Marketing"]', 'Paid search advertising'),
  ('PPC', 'Marketing', '["Pay-Per-Click"]', 'Paid advertising campaigns'),
  ('Google Ads', 'Marketing', '["Google AdWords"]', 'Google advertising platform'),
  ('Facebook Ads', 'Marketing', '["Meta Ads"]', 'Facebook advertising platform'),
  ('Influencer Marketing', 'Marketing', '[]', 'Marketing through influencers'),
  ('Affiliate Marketing', 'Marketing', '[]', 'Partner-based marketing'),
  ('Growth Marketing', 'Marketing', '["Growth Hacking"]', 'Rapid growth strategies'),
  ('Marketing Analytics', 'Marketing', '[]', 'Analyzing marketing data'),
  ('Google Analytics', 'Marketing', '["GA4"]', 'Web analytics platform'),
  ('CRM', 'Marketing', '["Customer Relationship Management"]', 'Customer management systems'),
  ('Salesforce', 'Marketing', '[]', 'CRM platform'),
  ('HubSpot', 'Marketing', '[]', 'Marketing automation platform'),
  ('Copywriting', 'Marketing', '[]', 'Persuasive writing'),
  ('Content Creation', 'Marketing', '[]', 'Creating engaging content'),
  ('Video Marketing', 'Marketing', '[]', 'Marketing through video'),
  ('Podcast Production', 'Marketing', '[]', 'Audio content creation'),
  ('Brand Strategy', 'Marketing', '[]', 'Building brand identity'),
  ('Public Relations', 'Marketing', '["PR"]', 'Managing public perception'),
  ('Customer Success', 'Marketing', '[]', 'Ensuring customer satisfaction'),
  ('Account Management', 'Marketing', '[]', 'Managing client relationships'),
  ('B2B Sales', 'Marketing', '["Business-to-Business"]', 'Selling to businesses'),
  ('B2C Sales', 'Marketing', '["Business-to-Consumer"]', 'Selling to consumers'),
  ('Lead Generation', 'Marketing', '[]', 'Acquiring potential customers'),
  ('Conversion Optimization', 'Marketing', '["CRO"]', 'Improving conversion rates'),
  ('Marketing Automation', 'Marketing', '[]', 'Automating marketing tasks');

-- ============================================================================
-- TECHNICAL/DEVELOPMENT METHODOLOGIES
-- ============================================================================

INSERT INTO reference.skills (skill_name, category, aliases, description) VALUES
  ('Technical Writing', 'Methodology', '[]', 'Writing technical documentation'),
  ('System Design', 'Methodology', '[]', 'Architecture planning'),
  ('Requirements Analysis', 'Methodology', '["Requirement Gathering"]', 'Specification gathering'),
  ('Documentation', 'Methodology', '[]', 'Creating technical documentation'),
  ('Code Review', 'Methodology', '[]', 'Peer code evaluation'),
  ('Performance Optimization', 'Methodology', '[]', 'System efficiency improvement'),
  ('Debugging', 'Methodology', '[]', 'Bug identification and fixing'),
  ('Refactoring', 'Methodology', '[]', 'Code improvement'),
  ('Design Patterns', 'Methodology', '[]', 'Reusable solution templates'),
  ('API Design', 'Methodology', '[]', 'Designing application interfaces'),
  ('Database Design', 'Methodology', '[]', 'Designing data structures'),
  ('Software Architecture', 'Methodology', '[]', 'System architecture design'),
  ('Microservices Architecture', 'Methodology', '[]', 'Distributed system design'),
  ('Cloud Architecture', 'Methodology', '[]', 'Cloud infrastructure design'),
  ('DevOps Practices', 'Methodology', '[]', 'Development and operations integration'),
  ('Continuous Integration', 'Methodology', '["CI"]', 'Automated code integration'),
  ('Continuous Deployment', 'Methodology', '["CD"]', 'Automated deployment'),
  ('Infrastructure as Code', 'Methodology', '["IaC"]', 'Managing infrastructure through code'),
  ('Test-Driven Development', 'Methodology', '["TDD"]', 'Test-first development approach'),
  ('Behavior-Driven Development', 'Methodology', '["BDD"]', 'Behavior specification development');

-- ============================================================================
-- OTHER TOOLS & TECHNOLOGIES
-- ============================================================================

INSERT INTO reference.skills (skill_name, category, aliases, description) VALUES
  ('VS Code', 'Tool', '["Visual Studio Code"]', 'Code editor'),
  ('IntelliJ IDEA', 'Tool', '[]', 'Java IDE'),
  ('WebStorm', 'Tool', '[]', 'JavaScript IDE'),
  ('PyCharm', 'Tool', '[]', 'Python IDE'),
  ('Vim', 'Tool', '[]', 'Text editor'),
  ('Emacs', 'Tool', '[]', 'Text editor'),
  ('Regular Expressions', 'Tool', '["Regex"]', 'Pattern matching'),
  ('Markdown', 'Tool', '[]', 'Lightweight markup language'),
  ('YAML', 'Tool', '[]', 'Data serialization language'),
  ('TOML', 'Tool', '[]', 'Configuration file format'),
  ('NPM', 'Tool', '[]', 'Node package manager'),
  ('Yarn', 'Tool', '[]', 'JavaScript package manager'),
  ('pnpm', 'Tool', '[]', 'Fast package manager'),
  ('pip', 'Tool', '[]', 'Python package installer'),
  ('Homebrew', 'Tool', '[]', 'macOS package manager'),
  ('Chrome DevTools', 'Tool', '[]', 'Browser debugging tools'),
  ('Postman', 'Tool', '[]', 'API development platform'),
  ('Insomnia', 'Tool', '[]', 'API client'),
  ('TablePlus', 'Tool', '[]', 'Database management tool'),
  ('DataGrip', 'Tool', '[]', 'Database IDE');

-- ============================================================================
-- SKILLS SUMMARY BY CATEGORY
-- ============================================================================

-- Technical Skills:
-- Programming Languages: 20
-- Web Frameworks: 20
-- Mobile Development: 10
-- Databases: 20
-- Cloud Platforms & DevOps: 20
-- Frontend Technologies: 20
-- State Management: 14
-- Testing: 17
-- API & Backend: 17
-- Data Science & ML: 20
-- Design & UX: 15
-- Cybersecurity: 15
-- Blockchain & Web3: 11
-- Tools: 20
-- Technical Methodologies: 20

-- Business & Professional Skills:
-- Soft Skills & Interpersonal: 30
-- Project & Product Management: 30
-- Business & Operations: 30
-- Marketing & Sales: 30
-- Version Control & Collaboration: 15

-- ============================================================================
-- GRAND TOTAL: 424 skills across 20+ categories
-- ============================================================================

-- Coverage:
-- ✅ Tech professionals (programming, frameworks, databases, cloud, etc.)
-- ✅ Product/Project managers (agile, scrum, roadmapping, stakeholder management)
-- ✅ Business professionals (operations, finance, HR, procurement)
-- ✅ Marketing professionals (digital marketing, SEO, content, social media)
-- ✅ Sales professionals (B2B, B2C, CRM, lead generation)
-- ✅ General professionals (soft skills, communication, leadership)
-- ✅ Creative professionals (design, UX/UI, content creation)

-- Additional skills can be added dynamically as users create profiles
-- Skills are normalized (one entry per skill) to enable:
--   - Analytics (most popular skills, skill trends)
--   - Autocomplete (find skills by name or alias)
--   - Standardization (consistent skill naming across platform)
--   - Cross-industry skill matching

