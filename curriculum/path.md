# Learning Path

This path is intentionally dependency-driven. The tutor should probe first and skip material already demonstrated, but should not skip prerequisites that remain weak.

## Track A — Python fluency

### A0. Baseline
- Syntax, variables, expressions
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

### A3. Python design
- Classes and objects
- Dataclasses
- Iterators/generators
- Context managers
- Decorators
- Type hints
- Testing with pytest

### A4. Problem solving
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

## Track B — Computer science

### B0. Computing model
- Binary and representation
- CPU, memory and storage
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

## Track C — Mathematics for ML

### C0. Algebra foundations
- Functions
- Exponents/logarithms
- Rearranging equations
- Summation notation

### C1. Probability and statistics
- Random variables
- Distributions
- Expectation/variance
- Conditional probability
- Bayes rule
- Sampling
- Confidence and uncertainty
- Correlation vs causation

### C2. Linear algebra
- Vectors
- Matrices
- Dot products
- Matrix multiplication
- Linear transformations
- Basis and dimension
- Eigenvalues/eigenvectors intuition

### C3. Calculus and optimisation
- Derivatives
- Partial derivatives
- Chain rule
- Gradients
- Loss surfaces
- Gradient descent

## Track D — Machine learning

### D0. ML problem framing
- Supervised vs unsupervised learning
- Features, targets and labels
- Train/validation/test
- Leakage
- Baselines
- Metrics

### D1. Classical ML
- Linear/logistic regression
- Trees
- Random forests
- Gradient boosting
- k-NN
- Clustering
- Feature engineering
- Bias/variance
- Cross-validation

### D2. Neural networks
- Perceptrons
- Activations
- Loss functions
- Forward pass
- Backpropagation
- Optimisers
- Regularisation
- PyTorch fundamentals

### D3. Deep learning and transformers
- Embeddings
- Attention
- Self-attention
- Transformer blocks
- Tokenisation
- Pretraining
- Fine-tuning
- Inference

## Track E — Software engineering

### E0. Engineering workflow
- Git fundamentals
- Branching and PRs
- Shell/Linux
- Debugging
- Reading documentation

### E1. Maintainable software
- Tests
- Interfaces
- Separation of concerns
- Error handling
- Configuration
- Observability
- Refactoring

### E2. Application architecture
- HTTP APIs
- Authentication/authorisation
- Databases
- Queues
- Caching
- Background jobs
- Containers
- Deployment

## Track F — Applied AI engineering

Only accelerate here once the foundations required by a topic are sufficiently strong.

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

## Formal apprenticeship overlay

Apprenticeship deadlines override the default sequence. When a module requires knowledge from a later track, temporarily pull forward the minimum prerequisite chain, complete the assessed work, then return to the core path.

## Default session selection

When Pablo says `learn` with no topic:

1. Check `learner/state.md`.
2. Check current apprenticeship commitments.
3. Select the highest-priority non-mastered node whose prerequisites are satisfied.
4. Prefer review-due nodes before brand-new material.
5. Run the normal probe → plan → teach process.
6. Finish with evidence and update the learner state.