'use strict';

const QUESTION_BANK = [
  // AI/ML
  { id:'ai1', text:'Explain the difference between RAG and fine-tuning. When would you use each?', tags:['ai','rag','llm','ml'] },
  { id:'ai2', text:'How does vector similarity search work? What distance metrics can you use?', tags:['ai','vector','embedding'] },
  { id:'ai3', text:'What is an embedding? How do you generate one and what are they used for?', tags:['ai','embedding','nlp'] },
  { id:'ai4', text:'Describe a production RAG pipeline you would build. What are the components?', tags:['ai','rag','system'] },
  { id:'ai5', text:'What are the main challenges of hallucination in LLMs and how do you mitigate them?', tags:['ai','llm','hallucination'] },
  { id:'ai6', text:'Explain attention mechanism and self-attention in transformers.', tags:['ai','transformer','attention'] },
  { id:'ai7', text:'What is LangChain and how does it help build LLM applications?', tags:['ai','langchain','llm'] },
  { id:'ai8', text:'How would you evaluate the quality of an LLM-powered application in production?', tags:['ai','evaluation','llm'] },
  { id:'ai9', text:'What is prompt engineering? Describe few-shot, chain-of-thought, and system prompts.', tags:['ai','prompt','llm'] },
  { id:'ai10', text:'Explain the difference between GPT, BERT, and T5 architectures.', tags:['ai','transformer','architecture'] },
  { id:'ai11', text:'What is RLHF and how is it used to align LLMs?', tags:['ai','rlhf','llm','alignment'] },
  { id:'ai12', text:'How would you implement a semantic search system from scratch?', tags:['ai','search','embedding'] },
  { id:'ai13', text:'What is LangGraph and how is it different from LangChain?', tags:['ai','langchain','agent','graph'] },
  { id:'ai14', text:'Describe how you would build an AI agent with tool use and memory.', tags:['ai','agent','llm'] },
  { id:'ai15', text:'What is the difference between zero-shot, one-shot, and few-shot prompting?', tags:['ai','prompt','llm'] },

  // System Design
  { id:'sd1', text:'Design a URL shortener that handles 1 billion URLs. Walk me through your architecture.', tags:['system-design','scalability'] },
  { id:'sd2', text:'How would you design a real-time chat application like WhatsApp at scale?', tags:['system-design','realtime','websocket'] },
  { id:'sd3', text:'Design a distributed rate limiter. What algorithms would you use?', tags:['system-design','distributed','rate-limit'] },
  { id:'sd4', text:'How do you design a system for high availability and fault tolerance?', tags:['system-design','availability','fault'] },
  { id:'sd5', text:'Explain CAP theorem and how it affects distributed system design choices.', tags:['system-design','cap','distributed'] },
  { id:'sd6', text:'Design a notification system that supports push, email, and SMS at scale.', tags:['system-design','notifications','scalability'] },
  { id:'sd7', text:'How would you build a search autocomplete feature like Google suggests?', tags:['system-design','search','trie'] },
  { id:'sd8', text:'Design an event-driven microservices architecture. What are the trade-offs?', tags:['system-design','microservices','events'] },

  // Algorithms & Data Structures
  { id:'ds1', text:'Explain the time and space complexity of your most recent algorithm solution.', tags:['algorithms','complexity'] },
  { id:'ds2', text:'When would you use a hash map vs a binary search tree?', tags:['algorithms','data-structures','hashmap','bst'] },
  { id:'ds3', text:'Explain dynamic programming with an example you have used in production.', tags:['algorithms','dp','optimization'] },
  { id:'ds4', text:'What is the difference between BFS and DFS? When do you use each?', tags:['algorithms','graph','bfs','dfs'] },
  { id:'ds5', text:'Describe a problem you solved using a graph algorithm in a real project.', tags:['algorithms','graph'] },
  { id:'ds6', text:'What sorting algorithm would you choose for nearly sorted data and why?', tags:['algorithms','sorting'] },

  // Backend
  { id:'be1', text:'How do you handle database transactions and ensure ACID properties?', tags:['backend','database','transactions'] },
  { id:'be2', text:'Explain REST vs GraphQL vs gRPC. When do you use each?', tags:['backend','api','rest','graphql'] },
  { id:'be3', text:'How do you implement authentication and authorization in a Node.js API?', tags:['backend','auth','nodejs','jwt'] },
  { id:'be4', text:'What are the key differences between SQL and NoSQL databases?', tags:['backend','database','sql','nosql'] },
  { id:'be5', text:'How do you handle API versioning in a production system?', tags:['backend','api','versioning'] },
  { id:'be6', text:'Explain connection pooling and why it is important for database performance.', tags:['backend','database','performance'] },
  { id:'be7', text:'How do you implement caching in a backend service? What are cache invalidation strategies?', tags:['backend','caching','redis'] },
  { id:'be8', text:'Describe your approach to designing RESTful APIs that are scalable and maintainable.', tags:['backend','api','design'] },
  { id:'be9', text:'How do you implement retry logic and circuit breakers in microservices?', tags:['backend','microservices','resilience'] },
  { id:'be10', text:'What is an API gateway and what problems does it solve?', tags:['backend','api','gateway'] },

  // Frontend
  { id:'fe1', text:'Explain the virtual DOM and how React reconciliation works.', tags:['frontend','react','dom'] },
  { id:'fe2', text:'What are React hooks? Explain useState, useEffect, useCallback, useMemo.', tags:['frontend','react','hooks'] },
  { id:'fe3', text:'How do you optimize the performance of a React application?', tags:['frontend','react','performance'] },
  { id:'fe4', text:'Explain the CSS Box Model and flexbox vs grid.', tags:['frontend','css','layout'] },
  { id:'fe5', text:'What is code splitting and lazy loading in React? How do you implement them?', tags:['frontend','react','performance','bundling'] },
  { id:'fe6', text:'How do you handle state management in a large React application?', tags:['frontend','react','state','redux'] },
  { id:'fe7', text:'Explain the difference between SSR, SSG, and CSR. When do you use each?', tags:['frontend','nextjs','rendering'] },
  { id:'fe8', text:'What are Web Vitals and how do you improve Core Web Vitals scores?', tags:['frontend','performance','web-vitals'] },

  // DevOps / Cloud
  { id:'do1', text:'How would you set up a CI/CD pipeline for a Node.js application?', tags:['devops','cicd','docker'] },
  { id:'do2', text:'Explain Docker and Kubernetes. How do you containerize an application?', tags:['devops','docker','kubernetes'] },
  { id:'do3', text:'What AWS services would you use to deploy a scalable web application?', tags:['devops','aws','cloud'] },
  { id:'do4', text:'How do you implement infrastructure as code? Have you used Terraform or CloudFormation?', tags:['devops','iac','terraform'] },
  { id:'do5', text:'What is blue-green deployment and how does it help with zero-downtime releases?', tags:['devops','deployment','availability'] },
  { id:'do6', text:'How do you monitor a production system? What metrics and alerts do you set up?', tags:['devops','monitoring','observability'] },

  // Databases
  { id:'db1', text:'What is database sharding and when would you use it?', tags:['database','sharding','scalability'] },
  { id:'db2', text:'Explain database indexing. What types of indexes exist and when do you use each?', tags:['database','indexing','performance'] },
  { id:'db3', text:'What is a database migration strategy for zero-downtime deployments?', tags:['database','migration','devops'] },
  { id:'db4', text:'How does MongoDB handle replication and high availability?', tags:['database','mongodb','replication'] },
  { id:'db5', text:'Explain the N+1 query problem and how to solve it in an ORM.', tags:['database','orm','performance'] },

  // Behavioral
  { id:'beh1', text:'Tell me about a time you had to make a critical decision under pressure. What was the outcome?', tags:['behavioral','decision','leadership'] },
  { id:'beh2', text:'Describe a project where you had to learn a new technology quickly. How did you approach it?', tags:['behavioral','learning','adaptability'] },
  { id:'beh3', text:'Tell me about a conflict you had with a teammate. How did you resolve it?', tags:['behavioral','conflict','teamwork'] },
  { id:'beh4', text:'What is your process for debugging a production issue at 2 AM?', tags:['behavioral','debugging','oncall'] },
  { id:'beh5', text:'How do you handle technical debt? Can you share an example?', tags:['behavioral','technical-debt','engineering'] },
  { id:'beh6', text:'Tell me about your most impactful project and what made it successful.', tags:['behavioral','impact','achievement'] },
  { id:'beh7', text:'How do you keep up with rapidly evolving AI and software trends?', tags:['behavioral','learning','ai'] },
  { id:'beh8', text:'Describe a time you had to push back on a product decision as an engineer.', tags:['behavioral','leadership','communication'] },

  // Security
  { id:'sec1', text:'What are the OWASP Top 10 security vulnerabilities and how do you prevent them?', tags:['security','owasp','backend'] },
  { id:'sec2', text:'How do you securely store and handle API keys and secrets?', tags:['security','secrets','devops'] },
  { id:'sec3', text:'Explain SQL injection and how parameterized queries prevent it.', tags:['security','sql','injection'] },
  { id:'sec4', text:'What is CORS and how do you configure it securely?', tags:['security','cors','api'] },

  // Introduction
  { id:'intro1', text:'Walk me through your background and what excites you most about this role.', tags:['intro','background'] },
  { id:'intro2', text:'What is your greatest technical strength and how have you applied it recently?', tags:['intro','strength'] },
  { id:'intro3', text:'Where do you see yourself in 3 years and how does this role fit that vision?', tags:['intro','career'] },
  { id:'intro4', text:'What drew you to AI engineering specifically?', tags:['intro','ai','motivation'] },
  { id:'intro5', text:'Describe your ideal engineering team and work culture.', tags:['intro','culture','teamwork'] },
];

// Simple TF-IDF based vectorization for cosine similarity
function tokenize(text) {
  return text.toLowerCase().replace(/[^a-z0-9\s]/g, ' ').split(/\s+/).filter(t => t.length > 2);
}

function buildTfIdf(docs) {
  const N = docs.length;
  const df = {};
  const tfIdfVecs = [];

  // Compute document frequencies
  docs.forEach(doc => {
    const tokens = new Set(tokenize(doc));
    tokens.forEach(t => { df[t] = (df[t] || 0) + 1; });
  });

  // Compute TF-IDF vectors
  docs.forEach(doc => {
    const tokens = tokenize(doc);
    const tf = {};
    tokens.forEach(t => { tf[t] = (tf[t] || 0) + 1; });
    const vec = {};
    Object.keys(tf).forEach(t => {
      const tfVal = tf[t] / tokens.length;
      const idf = Math.log((N + 1) / (df[t] || 1));
      vec[t] = tfVal * idf;
    });
    tfIdfVecs.push(vec);
  });

  return { tfIdfVecs, df, N };
}

function cosineSimilarity(vecA, vecB) {
  let dot = 0, magA = 0, magB = 0;
  const allKeys = new Set([...Object.keys(vecA), ...Object.keys(vecB)]);
  allKeys.forEach(k => {
    const a = vecA[k] || 0;
    const b = vecB[k] || 0;
    dot += a * b;
    magA += a * a;
    magB += b * b;
  });
  if (magA === 0 || magB === 0) return 0;
  return dot / (Math.sqrt(magA) * Math.sqrt(magB));
}

let questionVectors = [];
let indexed = false;

let _df = {}, _N = 0;
module.exports.seedQuestionBank = function() {
  const docs = QUESTION_BANK.map(q => q.text + ' ' + q.tags.join(' '));
  const built = buildTfIdf(docs);
  _df = built.df;
  _N = built.N;
  questionVectors = QUESTION_BANK.map((q, i) => ({ ...q, vector: built.tfIdfVecs[i] }));
  indexed = true;
  console.log(`[VectorStore] Seeded ${QUESTION_BANK.length} questions into in-memory vector store`);
};

function queryVector(text, df, N) {
  const tokens = tokenize(text);
  const tf = {};
  tokens.forEach(t => { tf[t] = (tf[t] || 0) + 1; });
  const vec = {};
  Object.keys(tf).forEach(t => {
    const tfVal = tf[t] / tokens.length;
    const idf = Math.log((N + 1) / (df[t] || 1));
    vec[t] = tfVal * idf;
  });
  return vec;
}

module.exports.retrieveRelevantQuestions = function(queryText, topK = 10) {
  if (!indexed || questionVectors.length === 0) {
    return QUESTION_BANK.slice(0, topK).map(q => q.text);
  }
  const qVec = queryVector(queryText, _df, _N);
  const scored = questionVectors.map(q => ({
    text: q.text,
    tags: q.tags,
    score: cosineSimilarity(qVec, q.vector)
  }));
  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, topK).map(q => q.text);
};

module.exports.getQuestionBank = () => QUESTION_BANK;
