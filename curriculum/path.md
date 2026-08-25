# Learning Path

This curriculum is not seven equal tracks. The NVIDIA Level 6 apprenticeship is the spine. Python is the primary foundation backfill. CS, software engineering, maths and ML reinforcement are pulled in when they remove a blocker to the apprenticeship or to independent Python competence.

The tutor should probe first, skip what is already demonstrated, and never require the learner to complete an entire prerequisite subject before continuing practical ML work.

## Operating model

1. **Apprenticeship first** — deadlines and current modules are the primary external constraint.
2. **Python second** — default foundation track whenever there is no urgent apprenticeship task or review.
3. **CS + SWE through Python** — teach these as connected engineering concepts, not disconnected courses.
4. **Maths just in time** — teach the minimum prerequisite chain needed to understand the current ML concept, then deepen it through later reviews.
5. **ML reinforcement follows the apprenticeship** — do not run a competing ML syllabus unless a gap is exposed.
6. **Applied AI is controlled exploration** — useful, but it must not replace the foundation path.
7. **Interesting distractions go to the parking lot** — record them, do not switch tracks.

## Spine — NVIDIA Level 6 Machine Learning Engineer apprenticeship

The apprenticeship is the main curriculum and assessment driver. Map each current module to the prerequisite knowledge required to understand and execute it.

### Current / near-term module support

For business-process, security, ethics and XAI work, pull in only the technical foundations needed to complete and genuinely understand the assessed work.

### Module 4 — Developing & Testing AI Solutions

Likely prerequisite backfill:

**Python**
- Functions and scope
- Lists, dictionaries, sets and iteration
- Mutability and references
- Modules, packages and environments
- File/data handling
- NumPy / dataframe concepts
- Exceptions and debugging
- Testing

**CS / SWE**
- Problem decomposition
- Git/version control
- Debugging
- Complexity intuition
- Data structures
- Test design
- Code organisation

**Maths**
- Algebra and functions
- Mean, variance and basic descriptive statistics
- Probability intuition
- Vectors
- Derivative / rate-of-change intuition

**ML reinforcement**
- Supervised vs unsupervised learning
- Features, targets and labels
- Train/validation/test
- Leakage
- Regression and classification
- Overfitting
- Metrics
- Feature engineering
- Model selection

### Module 5 — Deep Learning & Transformers

Expand prerequisite backfill only as required:

**Python**
- OOP
- Iterators/generators
- NumPy fluency
- PyTorch fundamentals

**Maths**
- Vectors and matrices
- Dot products
- Functions
- Derivatives and partial derivatives
- Chain rule
- Gradients
- Exponents and logarithms
- Probability basics

**ML reinforcement**
- Loss functions
- Gradient descent
- Neural networks
- Backpropagation
- Embeddings
- Attention
- Transformers
- Fine-tuning

### Module 6 — Deploying & Monitoring AI Systems

Pull in:
- HTTP/API fundamentals
- Processes and networking basics
- Containers
- CI/CD
- Logging and observability
- Databases/queues where relevant
- Model serving
- Monitoring and data drift
- MLOps concepts

## Foundation Track A — Python fluency

This is the default learning track when no apprenticeship deadline or review takes priority.

### A0. Baseline
- Syntax, variables and expressions
- Core types and type conversion
- Conditionals and loops
- Functions and scope
- Exceptions
- Reading tracebacks

### A1. Core data structures
- Lists and tuples
- Dictionaries and sets
- Iteration patterns
- Comprehensions
- Mutability, identity and references
- Copying and aliasing

### A2. Working Python
- Modules and packages
- File I/O
- JSON/CSV
- Virtual environments and dependencies
- Standard library fluency
- CLI programs
- Logging and debugging
- HTTP/API consumption

### A3. Engineering Python
- Classes and objects
- Dataclasses
- Iterators/generators
- Context managers
- Decorators
- Type hints
- Testing with pytest
- Project structure

### A4. Problem solving through Python
- Big-O intuition
- Arrays/strings
- Hash maps/sets
- Stacks/queues
- Recursion
- Linked structures
- Trees/heaps
- Graph basics
- Sorting/searching
- LeetCode Easy independently

### Python Foundation Sprint target

Target outcome: independently solve small programming problems and build straightforward scripts without asking an AI to write the implementation.

Suggested 12-week envelope, adapted by probing rather than rigid timing:

- Weeks 1–2: A0 fundamentals
- Weeks 3–4: A1 core Python
- Weeks 5–6: A2 real programs
- Weeks 7–8: A3 engineering Python
- Weeks 9–10: A4 CS concepts through Python
- Weeks 11–12: independent problems, mini-projects and apprenticeship-related Python

Progress is measured by demonstrated output, not videos watched or hours logged.

## Foundation Track B — Computer science through engineering

Do not treat this as a separate prerequisite course. Pull concepts into Python and apprenticeship work when they become useful.

### B0. Computing model
- Binary and representation
- CPU, memory and storage
- Stack/heap intuition
- Processes and threads
- System calls
- Files and filesystems

### B1. Data structures and algorithms
- Complexity
- Core structures
- Search/sort
- Recursion
- Trees and graphs
- Algorithmic problem decomposition

### B2. Systems and networking
- Processes vs threads
- Concurrency basics
- TCP/IP
- DNS
- HTTP
- Sockets
- Client/server model
- Linux fundamentals

### B3. Databases
- Relational model
- SQL
- Indexes
- Transactions
- Isolation
- Query planning
- Normalisation
- Practical Postgres

## Foundation Track C — Software engineering through practice

Interleave with Python rather than waiting until Python is "finished".

### C0. Engineering workflow
- Git fundamentals
- Branching and PRs
- Shell/Linux
- Debugging
- Reading documentation
- Dependency management

### C1. Maintainable software
- Tests
- Interfaces
- Separation of concerns
- Error handling
- Configuration
- Logging / observability
- Refactoring

### C2. Application architecture
- HTTP APIs
- Authentication/authorisation
- Databases
- Queues
- Caching
- Background jobs
- Containers
- Deployment
- CI/CD

## Foundation Track D — Maths for ML, just in time

The goal is ML-engineer maths, not completing a mathematics degree before being allowed to do ML.

Teach mathematical concepts when a practical ML concept creates the need for them.

### D0. Algebra foundations
- Functions
- Rearranging equations
- Exponents/logarithms
- Summation notation

### D1. Statistics and probability
- Mean/median/variance
- Random variables
- Distributions
- Expectation
- Conditional probability
- Bayes rule
- Sampling
- Confidence and uncertainty
- Correlation vs causation

### D2. Linear algebra
- Vectors
- Matrices
- Dot products
- Matrix multiplication
- Linear transformations
- Basis/dimension intuition
- Eigenvalue/eigenvector intuition only when useful

### D3. Calculus and optimisation
- Rate of change
- Derivatives
- Partial derivatives
- Chain rule
- Gradients
- Loss surfaces
- Gradient descent

Examples of just-in-time routing:

- Regression → functions, algebra, mean/variance, error
- Gradient descent → functions, rate of change, derivative intuition, gradients
- Neural networks → vectors, matrices, dot products, derivatives, chain rule
- Softmax/classification → exponents, logs, probability

## Reinforcement Track E — Machine learning

This track reinforces the apprenticeship; it does not compete with it.

### E0. ML problem framing
- Supervised vs unsupervised learning
- Features, targets and labels
- Train/validation/test
- Leakage
- Baselines
- Metrics

### E1. Classical ML
- Linear/logistic regression
- Trees
- Random forests
- Gradient boosting
- k-NN
- Clustering
- Feature engineering
- Bias/variance
- Cross-validation

### E2. Neural networks
- Perceptrons
- Activations
- Loss functions
- Forward pass
- Backpropagation
- Optimisers
- Regularisation
- PyTorch fundamentals

### E3. Deep learning and transformers
- Embeddings
- Attention
- Self-attention
- Transformer blocks
- Tokenisation
- Pretraining
- Fine-tuning
- Inference

## Controlled Track F — Applied AI engineering

Use for work/apprenticeship relevance or deliberate exploration, not as the default learning path.

- Model APIs and structured output
- Embeddings and semantic search
- RAG
- Evaluation
- Agent/tool systems
- Guardrails and reliability
- Local inference
- Quantisation
- Fine-tuning / LoRA
- Dataset construction
- Distillation
- MLOps and monitoring
- GPU/runtime fundamentals

## Default session selection

When Pablo says `learn` with no topic:

1. Check `.pi/learner/state.md` and the review queue.
2. If an apprenticeship deadline/current assessed task is urgent, support it and identify prerequisite gaps as they arise.
3. Otherwise, if a review is due, run the review.
4. Otherwise choose the next Python node whose prerequisites are satisfied.
5. Pull CS/SWE/maths/ML concepts in only when they are dependencies of the chosen work.
6. Run probe → plan → teach → independent application.
7. Record evidence and update learner state.
8. Park unrelated interesting technologies instead of changing tracks.

## Success criterion

The long-term objective is not to become a mathematician, theoretical computer scientist or interview-problem specialist. It is to become an independently capable ML/AI engineer with enough Python, software engineering, computer science and mathematical foundations to understand unfamiliar systems from first principles and build/debug them without dependency on AI-generated implementation.